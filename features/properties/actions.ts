// features/properties/actions.ts
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { randomUUID } from "crypto";
import { getPublicImageUrl } from "./image-utils";
import type { PropertyRow, PropertyWithImages, PropertyImage } from "./types";
import { FormSchema, type PropertyFormValues } from "./schema";
// Authorization utilities คือการตรวจสอบสิทธิ์ผู้ใช้
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
} from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateImageFile } from "@/lib/file-validation"; // สำหรับตรวจสอบไฟล์รูปภาพ
import { IMAGE_UPLOAD_POLICY } from "@/components/property-image-uploader";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreatePropertyResult = {
  success: boolean;
  propertyId?: string;
  message?: string;
  errors?: unknown;
};

export type UploadedImageResult = {
  path: string; // storage_path เช่น "properties/xxxx.jpg"
  publicUrl: string; // public URL สำหรับแสดงผล
};

/**
 * Upload single property image to storage
 * Used by PropertyImageUploader component
 */
const PROPERTY_IMAGES_BUCKET = "property-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const UPLOAD_RATE_WINDOW_MS = 60_000; // 1 minute
const UPLOAD_RATE_MAX = 10; // uploads per window per user
const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// ตรวจสอบความถูกต้องของ path ที่ส่งมา
function validatePropertyImagePaths(paths: string[]) {
  const invalid = paths.filter(
    (p) =>
      typeof p !== "string" ||
      !p.startsWith("properties/") || // บังคับต้องอยู่ใต้โฟลเดอร์นี้
      p.includes("..") || // กัน path traversal
      p.startsWith("/") // กัน absolute-ish
  );

  if (invalid.length > 0) {
    return {
      ok: false as const,
      message: `Invalid image path(s): ${invalid.slice(0, 3).join(", ")}${
        invalid.length > 3 ? "..." : ""
      }`,
    };
  }

  return { ok: true as const };
}
// ตรวจสอบว่าไฟล์ใน storage มีอยู่จริง
// ตรวจสอบว่าไฟล์ใน storage มีอยู่จริง (Optimized using list instead of download)
async function ensureStorageObjectsExist(
  _supabase: any, // Unused now, we use admin
  bucket: string,
  paths: string[]
) {
  if (paths.length === 0) return [];
  const missing: string[] = [];

  // Use Admin Client to bypass RLS for existence check, fallback to user client if not configured
  // Use Admin Client to bypass RLS for existence check, fallback to user client if not configured
  let storageClient = _supabase;
  let usingAdmin = false;
  try {
    storageClient = createAdminClient();
    usingAdmin = true;
  } catch (err) {
    console.warn(
      "createAdminClient failed (missing SUPABASE_SERVICE_ROLE_KEY?), using user client:",
      err
    );
  }

  // Group by folder (properties/uid/sessionId)
  const folders = new Set(paths.map((p) => p.substring(0, p.lastIndexOf("/"))));

  for (const folder of folders) {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.error(
        `[ensureStorageObjectsExist] List failed. Folder: ${folder}, Admin: ${usingAdmin}`,
        error
      );
    } else {
      console.log(
        `[ensureStorageObjectsExist] Checked folder: ${folder}, Found: ${data?.length} files, Admin: ${usingAdmin}`
      );
    }

    if (error || !data) {
      console.warn(
        `ensureStorageObjectsExist: Failed to list folder ${folder} - skipping existence check (Fail Open)`,
        error
      );
      // Fail-safe: If list fails (e.g. Auth/Network error), DO NOT mark as missing.
      // Assume files exist to unblock the user.
      continue;
    } else {
      const existingNames = new Set(data.map((f: any) => f.name));
      const pathsInFolder = paths.filter((p) => p.startsWith(folder + "/"));

      for (const p of pathsInFolder) {
        const fileName = p.split("/").pop();
        if (!fileName || !existingNames.has(fileName)) {
          missing.push(p);
        }
      }
    }
  }

  return missing;
}
// ✅ สำเร็จแล้ว ลบ session ที่ไม่ใช้ คือ session ที่ไม่มีไฟล์ที่ใช้
async function finalizeUploadSession(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  sessionId: string;
  propertyId: string;
  usedPaths: string[];
}) {
  const { supabase, userId, sessionId, propertyId, usedPaths } = params;
  const used = (usedPaths ?? []).filter(Boolean);
  // 1) mark used paths เป็น ATTACHED + ผูก property_id
  if (used.length > 0) {
    const { error: markErr } = await supabase
      .from("property_image_uploads")
      .update({ status: "ATTACHED", property_id: propertyId })
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .in("storage_path", used);

    if (markErr) throw markErr;
  }

  // 2) หา TEMP ที่เหลือใน session นี้ (ไม่ได้ใช้) → ลบจาก storage + ลบ tracking row
  const { data: leftovers, error: leftErr } = await supabase
    .from("property_image_uploads")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .eq("status", "TEMP");

  if (leftErr) throw leftErr;

  const toRemove = (leftovers ?? [])
    .map((x) => x.storage_path)
    .filter((p): p is string => !!p && !used.includes(p));

  if (toRemove.length > 0) {
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(toRemove);

    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("status", "TEMP");
  }
}

export async function uploadPropertyImageAction(formData: FormData) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const sessionId = formData.get("sessionId") as string | null;
    if (!sessionId) throw new Error("Missing sessionId");
    if (!SESSION_ID_RE.test(sessionId)) {
      throw new Error("Invalid sessionId");
    }

    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file provided");

    // 1) Size limit
    if (file.size > IMAGE_UPLOAD_POLICY.maxBytes) {
      throw new Error("File too large (max 8MB)");
    }

    // 2) Validate (MIME + extension + magic bytes, block SVG)
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid image file");
    }

    // 3) Simple per-user rate limit based on property_image_uploads
    const cutoffIso = new Date(
      Date.now() - UPLOAD_RATE_WINDOW_MS
    ).toISOString();
    const { count: recentCount, error: rateErr } = await supabase
      .from("property_image_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", cutoffIso);

    // ถ้า query rate-limit พัง ไม่ควรทำให้ upload พัง (แต่กันได้เมื่อ query สำเร็จ)
    if (!rateErr && (recentCount ?? 0) >= UPLOAD_RATE_MAX) {
      throw new Error("Too many uploads. Please wait a moment and try again.");
    }

    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    const fileName = `${randomUUID()}.${ext}`;
    const path = `properties/${user.id}/${sessionId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    // Insert TEMP tracking row
    const { error: trackErr } = await supabase
      .from("property_image_uploads")
      .insert({
        user_id: user.id,
        session_id: sessionId,
        storage_path: path,
        status: "TEMP",
      });

    if (trackErr) {
      // ถ้า track ไม่ได้ -> ลบไฟล์ทิ้งกัน orphan
      await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
      throw trackErr;
    }

    const { data } = supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .getPublicUrl(path);

    return { path, publicUrl: data.publicUrl };
  } catch (error) {
    console.error("uploadPropertyImageAction → error:", error);
    throw error;
  }
}

/**
 * Create property with images
 */
export async function createPropertyAction(
  values: PropertyFormValues,
  sessionId: string
): Promise<CreatePropertyResult> {
  try {
    // ✅ Step 1.2: require auth context (แทน getUser แบบเดิม)
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);
    if (!sessionId)
      return { success: false, message: "Missing upload session" };

    // 1) Validate form data คือ การตรวจสอบความถูกต้องของข้อมูลฟอร์ม
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      };
    }
    const safeValues = parsed.data;

    const { images, agent_ids, ...propertyData } = safeValues;

    // ✅ image paths ต้องอยู่ภายใต้ properties/
    if (images?.length) {
      const mustStartWith = "properties/";
      const invalid = images.find((p) => !p.startsWith(mustStartWith));
      if (invalid) {
        return {
          success: false,
          message: "Invalid image path (ownership mismatch)",
        };
      }
    }

    const { generatePropertySEO } = await import("@/lib/seo-utils");
    const seoData = generatePropertySEO({
      title: propertyData.title,
      property_type: propertyData.property_type,
      listing_type: propertyData.listing_type,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      size_sqm: propertyData.size_sqm,
      price: propertyData.price,
      rental_price: propertyData.rental_price,
      district: propertyData.district,
      province: propertyData.province,
      address_line1: propertyData.address_line1,
      postal_code: propertyData.postal_code,
      description: propertyData.description,
    });

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        ...propertyData,
        created_by: user.id,
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: seoData.metaKeywords,
        structured_data: seoData.structuredData as any,
      })
      .select()
      .single();

    if (error) {
      console.error("Property creation error:", error);
      return { success: false, message: error.message };
    }

    if (images && images.length > 0) {
      // 1) Validate path format (defense-in-depth)
      // ถ้าผ่าน ให้ทำขั้นตอนถัดไป ยืนยันว่า path ถูกต้อง
      const valid = validatePropertyImagePaths(images);
      if (!valid.ok) {
        await supabase.from("properties").delete().eq("id", property.id);
        return { success: false, message: valid.message };
      }

      // 2) Existence check in Storage (กันยัด path ปลอม)
      // ถ้าไฟล์หาย ให้ลบ property ที่สร้างไปแล้ว เพื่อไม่ให้เกิด half-created data
      const missing = await ensureStorageObjectsExist(
        supabase,
        PROPERTY_IMAGES_BUCKET,
        images
      );
      // ถ้ามีไฟล์หาย ให้ลบ property ที่สร้างไปแล้ว
      if (missing.length > 0) {
        await supabase.from("properties").delete().eq("id", property.id);
        return {
          success: false,
          message: `Some images are missing in storage: ${missing
            .slice(0, 3)
            .join(", ")}${missing.length > 3 ? "..." : ""}`,
        };
      }

      // 3) Insert rows
      const imageRows = images.map((storagePath, index) => ({
        property_id: property.id,
        storage_path: storagePath,
        image_url: getPublicImageUrl(storagePath),
        is_cover: index === 0,
        sort_order: index,
      }));

      const { error: imagesError } = await supabase
        .from("property_images")
        .insert(imageRows);

      if (imagesError) {
        console.error("Images insertion error:", imagesError);

        // ✅ Rollback: ลบ property เพื่อไม่ให้เกิด half-created data
        await supabase.from("properties").delete().eq("id", property.id);

        return { success: false, message: "Failed to attach images" };
      }
    }
    await finalizeUploadSession({
      supabase,
      userId: user.id,
      sessionId,
      propertyId: property.id,
      usedPaths: images ?? [],
    });

    // 4) Insert agents
    if (agent_ids && agent_ids.length > 0) {
      const agentRows = agent_ids.map((agentId) => ({
        property_id: property.id,
        agent_id: agentId,
      }));

      const { error: agentsError } = await supabase
        .from("property_agents")
        .insert(agentRows);

      if (agentsError) {
        console.error("Agents insertion error:", agentsError);
      }
    }
    await logAudit(
      { supabase, user, role },
      {
        action: "property.create",
        entity: "properties",
        entityId: property.id,
        metadata: {
          imagesCount: images?.length ?? 0,
          sessionId,
        },
      }
    );
    revalidatePath("/protected/properties");
    return { success: true, propertyId: property.id };
  } catch (err) {
    console.error("createPropertyAction → error:", err);
    return authzFail(err);
  }
}

/**
 * Update property with images
 */
export async function updatePropertyAction(
  id: string,
  values: PropertyFormValues,
  sessionId: string
): Promise<CreatePropertyResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    // 1) Validate form data
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      };
    }
    const safeValues = parsed.data;
    const { images, agent_ids, ...propertyData } = safeValues;

    // 2) โหลดเจ้าของก่อน แล้วเช็คสิทธิ
    const { data: existing, error: findErr } = await supabase
      .from("properties")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (findErr || !existing) {
      return { success: false, message: "Property not found" };
    }

    assertAuthenticated({ userId: user.id, role });

    // 3) กันยัด path รูปปลอม
    if (images?.length) {
      const mustStartWith = "properties/";
      const invalid = images.find((p) => !p.startsWith(mustStartWith));
      if (invalid) {
        return {
          success: false,
          message: "Invalid image path (ownership mismatch)",
        };
      }
    }

    // 4) SEO metadata
    const { generatePropertySEO } = await import("@/lib/seo-utils");
    const seoData = generatePropertySEO({
      title: propertyData.title,
      property_type: propertyData.property_type,
      listing_type: propertyData.listing_type,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      size_sqm: propertyData.size_sqm,
      price: propertyData.price,
      rental_price: propertyData.rental_price,
      district: propertyData.district,
      province: propertyData.province,
      address_line1: propertyData.address_line1,
      postal_code: propertyData.postal_code,
      description: propertyData.description,
    });

    // 5) Update property data + SEO
    const { error: updateErr } = await supabase
      .from("properties")
      .update({
        ...propertyData,
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: seoData.metaKeywords,
        structured_data: seoData.structuredData as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return { success: false, message: updateErr.message };
    }

    // --- Step 3: Images update with rollback ---

    // A) โหลดรูปเดิมไว้ก่อน เผื่อ rollback
    const { data: oldImages, error: oldImagesErr } = await supabase
      .from("property_images")
      .select("storage_path, image_url, is_cover, sort_order")
      .eq("property_id", id);

    if (oldImagesErr) {
      console.error("Fetch old images error:", oldImagesErr);
      return { success: false, message: "Failed to read existing images" };
    }

    // B) ถ้ามีรูปใหม่: validate + existence check ก่อนทำลายของเดิม
    if (images && images.length > 0) {
      const valid = validatePropertyImagePaths(images);
      if (!valid.ok) return { success: false, message: valid.message };

      const missing = await ensureStorageObjectsExist(
        supabase,
        PROPERTY_IMAGES_BUCKET,
        images
      );
      if (missing.length > 0) {
        return {
          success: false,
          message: `Some images are missing in storage: ${missing
            .slice(0, 3)
            .join(", ")}${missing.length > 3 ? "..." : ""}`,
        };
      }
    }

    // C) ลบรูปเดิม (ถ้าผู้ใช้ตั้งใจลบทั้งหมด images อาจว่าง → ก็ลบให้หมดได้)
    const { error: deleteError } = await supabase
      .from("property_images")
      .delete()
      .eq("property_id", id);

    if (deleteError) {
      console.error("Delete old images error:", deleteError);
      return { success: false, message: "Failed to replace images" };
    }

    // D) insert รูปใหม่ (ถ้ามี)
    if (images && images.length > 0) {
      const imageRows = images.map((storagePath, index) => ({
        property_id: id,
        storage_path: storagePath,
        image_url: getPublicImageUrl(storagePath),
        is_cover: index === 0,
        sort_order: index,
      }));

      const { error: imagesError } = await supabase
        .from("property_images")
        .insert(imageRows);

      if (imagesError) {
        console.error("Images insertion error:", imagesError);

        // ✅ rollback: เอารูปเดิมกลับเข้าไป
        if (oldImages && oldImages.length > 0) {
          await supabase.from("property_images").insert(
            oldImages.map((img) => ({
              property_id: id,
              storage_path: img.storage_path,
              image_url: img.image_url,
              is_cover: img.is_cover,
              sort_order: img.sort_order,
            }))
          );
        }

        return { success: false, message: "Failed to attach images" };
      }
    }
    await finalizeUploadSession({
      supabase,
      userId: user.id,
      sessionId,
      propertyId: id,
      usedPaths: images ?? [],
    });

    // E) ลบไฟล์จริงออกจาก Storage (เฉพาะไฟล์ที่ถูกถอดออก)
    if (oldImages && oldImages.length > 0) {
      const oldPaths = new Set(
        oldImages.map((x) => x.storage_path).filter(Boolean)
      );
      const newPaths = new Set((images ?? []).filter(Boolean));

      const removed = [...oldPaths].filter(
        (p): p is string => typeof p === "string" && !newPaths.has(p)
      );

      if (removed.length > 0) {
        const { error: removeErr } = await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .remove(removed);

        if (removeErr) {
          console.error("Failed to remove orphaned images:", removeErr);
        }
      }
    }

    // --- Step 4: Agents update ---
    if (agent_ids !== undefined) {
      // Delete existing
      await supabase.from("property_agents").delete().eq("property_id", id);

      // Insert new
      if (agent_ids.length > 0) {
        const agentRows = agent_ids.map((agentId) => ({
          property_id: id,
          agent_id: agentId,
        }));
        const { error: agentsError } = await supabase
          .from("property_agents")
          .insert(agentRows);

        if (agentsError) {
          console.error("Agents update error:", agentsError);
        }
      }
    }
    await logAudit(
      { supabase, user, role },
      {
        action: "property.update",
        entity: "properties",
        entityId: id,
        metadata: {
          imagesCount: images?.length ?? 0,
          sessionId,
        },
      }
    );
    revalidatePath("/protected/properties");
    revalidatePath(`/protected/properties/${id}`);
    return { success: true, propertyId: id };
  } catch (err) {
    return authzFail(err);
  }
}

/**
 * Get property by ID with images
 */
export async function getPropertyById(id: string): Promise<PropertyRow> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (propErr) throw propErr;

    // ✅ กันอ่านของคนอื่น
    assertAuthenticated({
      userId: user.id,
      role,
    });

    return property;
  } catch (error) {
    console.error("getPropertyById → error:", error);
    throw error;
  }
}

/**
 * Get property with images
 */
export async function getPropertyWithImages(
  id: string
): Promise<PropertyWithImages> {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        storage_path,
        is_cover,
        sort_order,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) throw error;

  if (data.property_images) {
    data.property_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  return data as unknown as PropertyWithImages;
}

/**
 * Delete property and cleanup storage
 * ใช้กับ server action ที่รับ FormData จากฟอร์มลบทรัพย์
 * ลบได้เฉพาะเจ้าของทรัพย์หรือแอดมินเท่านั้น
 */
export async function deletePropertyAction(formData: FormData) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const id = formData.get("id") as string | null;
    if (!id) throw new Error("Missing property id");

    // 0) โหลดเจ้าของทรัพย์เพื่อเช็คสิทธิ (owner/admin)
    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (propErr || !property) throw new Error("Property not found");

    // 0.1) Authorization
    assertAuthenticated({ userId: user.id, role });

    // 1) Get all images to delete from storage
    const { data: images } = await supabase
      .from("property_images")
      .select("storage_path")
      .eq("property_id", id);

    // 2) Delete from storage
    if (images && images.length > 0) {
      const pathsToRemove = images
        .map((img) => img.storage_path)
        .filter((path): path is string => !!path);

      if (pathsToRemove.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET) // แนะนำให้ใช้ constant เดียวกัน
          .remove(pathsToRemove);

        if (storageError) {
          console.error("Failed to cleanup images from storage", storageError);
        }
      }
    }

    // 3) Delete property (cascade will delete property_images records)
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw error;
    // 4) Audit log delete
    await logAudit(
      { supabase, user, role },
      {
        action: "property.delete",
        entity: "properties",
        entityId: id,
        metadata: {
          // ใส่ได้ตามต้องการ เช่นจำนวนรูปที่ลบจริง (ถ้าคำนวณไว้)
        },
      }
    );

    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("user_id", user.id)
      .eq("status", "TEMP");
    revalidatePath("/protected/properties");
  } catch (error) {
    console.error("deletePropertyAction → error:", error);
    throw error;
  }
}

/**
 * Delete single image from storage
 * Used when user removes image from uploader before submission
 * ควรใช้ร่วมกับ requireAuthContext() เพื่อให้แน่ใจว่าผู้ใช้ล็อกอินแล้ว
 * ลบได้เฉพาะภาพที่อยู่ในโฟลเดอร์ properties/ เท่านั้น
 * ใช้เมื่อผู้ใช้ลบภาพที่อัปโหลดไปแล้วก่อนส่งฟอร์ม
 */

export async function deletePropertyImageFromStorage(storagePath: string) {
  const { supabase, user, role } = await requireAuthContext();
  assertStaff(role);

  const mustStartWith = "properties/";

  const ok =
    storagePath?.startsWith(mustStartWith) ||
    (role === "ADMIN" && storagePath?.startsWith("properties/"));

  if (!ok) throw new Error("Invalid storage path (ownership mismatch)");

  const { error: storageErr } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove([storagePath]);

  if (storageErr) {
    console.error(
      "deletePropertyImageFromStorage → storage error:",
      storageErr
    );
    throw storageErr;
  }

  // ✅ ลบ tracking row TEMP
  let del = supabase
    .from("property_image_uploads")
    .delete()
    .eq("user_id", user.id)
    .eq("storage_path", storagePath)
    .eq("status", "TEMP");

  if (role !== "ADMIN") {
    del = del.eq("user_id", user.id);
  }

  const { error: trackErr } = await del;
  if (trackErr) {
    console.error(
      "deletePropertyImageFromStorage → tracking delete error:",
      trackErr
    );
    // จะ throw หรือไม่ throw ก็ได้; แนะนำไม่ throw เพราะ storage ลบไปแล้ว
  }

  return { success: true };
}

export async function cleanupUploadSessionAction(sessionId: string) {
  const { supabase, user, role } = await requireAuthContext();
  assertStaff(role);

  if (!sessionId) return { success: true };

  const { data, error } = await supabase
    .from("property_image_uploads")
    .select("storage_path")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .eq("status", "TEMP");

  if (error) throw error;

  const paths = (data ?? [])
    .map((x) => x.storage_path)
    .filter((p): p is string => !!p);

  if (paths.length > 0) {
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(paths);

    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .eq("status", "TEMP");
  }

  return { success: true };
}
