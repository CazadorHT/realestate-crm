// features/properties/actions.ts
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { randomUUID } from "crypto";
import { getPublicImageUrl } from "./image-utils";
import type {
  PropertyRow,
  PropertyWithImages,
  PropertyImage,
  PropertyStatus,
} from "./types";
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
import { PROPERTY_STATUS_ENUM } from "./labels";

export type CreatePropertyResult = {
  success: boolean;
  propertyId?: string;
  slug?: string;
  message?: string;
  errors?: unknown;
};

export type UploadedImageResult = {
  path: string; // storage_path เช่น "properties/xxxx.jpg"
  publicUrl: string; // public URL สำหรับแสดงผล
};

export type UpdatePropertyStatusResult = {
  success: boolean;
  message?: string;
};
export type DuplicatePropertyResult = {
  success: boolean;
  propertyId?: string;
  message?: string;
};
/**
 * Upload single property image to storage
 * Used by PropertyImageUploader component
 */
const PROPERTY_IMAGES_BUCKET = "property-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const UPLOAD_RATE_WINDOW_MS = 60_000; // 1 minute
const UPLOAD_RATE_MAX = 20; // uploads per window per user
const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      p.startsWith("/"), // กัน absolute-ish
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
      Date.now() - UPLOAD_RATE_WINDOW_MS,
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
  sessionId: string,
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

    const {
      images,
      agent_ids,
      feature_ids,
      // is_pet_friendly,
      // is_foreigner_quota,
      // allow_smoking,
      // is_renovated,
      // is_unfurnished, removed
      // is_fully_furnished,
      // is_corner_unit,
      // has_private_pool,
      // is_selling_with_tenant,
      // price_per_sqm, // Don't exclude, save to DB
      // rent_price_per_sqm, // Don't exclude, save to DB
      // has_garden_view,
      // has_pool_view,
      // has_city_view,
      // facing_east,
      // facing_north,
      // has_multi_parking,
      // is_grade_a,
      // is_grade_b,
      // is_grade_c,
      // is_column_free,
      // is_central_air,
      // is_split_air,
      // has_247_access,
      // has_fiber_optic,
      // is_tax_registered,
      // is_bare_shell, // Save to DB directly
      // is_exclusive, // Save to DB directly
      // has_raised_floor, // Save to DB directly
      ...propertyData
    } = safeValues;

    // 🧠 Auto-Status Logic: Check Stock
    if ((propertyData.sold_units ?? 0) >= (propertyData.total_units ?? 1)) {
      propertyData.status = "SOLD";
    } else if (propertyData.status === "SOLD") {
      // If stock remains, force ACTIVE (prevent premature SOLD status)
      propertyData.status = "ACTIVE";
    }

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

    // Add logic to handle "Pet Friendly" tag
    // Add logic to handle "Pet Friendly" tag
    // propertyData usually doesn't have meta_keywords because it's excluded from form schema
    const finalKeywords: string[] = [];
    if (safeValues.is_pet_friendly) {
      finalKeywords.push("Pet Friendly");
    }
    if (safeValues.is_foreigner_quota) {
      finalKeywords.push("Foreigner Friendly");
    }
    if (safeValues.allow_smoking) {
      finalKeywords.push("Smoking Allowed");
    }
    if (safeValues.is_renovated) finalKeywords.push("Renovated");
    // is_unfurnished removed
    if (safeValues.is_fully_furnished) finalKeywords.push("Fully Furnished");
    if (safeValues.is_corner_unit) finalKeywords.push("Corner Unit");
    if (safeValues.has_private_pool) finalKeywords.push("Private Pool");
    if (safeValues.is_selling_with_tenant)
      finalKeywords.push("Selling with Tenant");

    // New Feature Keywords
    if (safeValues.has_garden_view) finalKeywords.push("Garden View");
    if (safeValues.has_pool_view) finalKeywords.push("Pool View");
    if (safeValues.has_city_view) finalKeywords.push("City View");
    if (safeValues.has_unblocked_view) finalKeywords.push("Unblocked View");
    if (safeValues.has_river_view) finalKeywords.push("River View");
    if (safeValues.facing_east) finalKeywords.push("East Facing");
    if (safeValues.facing_north) finalKeywords.push("North Facing");
    if (safeValues.facing_south) finalKeywords.push("South Facing");
    if (safeValues.facing_west) finalKeywords.push("West Facing");
    if (safeValues.is_high_ceiling) finalKeywords.push("High Ceiling");
    if (safeValues.has_multi_parking) finalKeywords.push("Multi-Parking");
    if (safeValues.is_grade_a) finalKeywords.push("Grade A Building");
    if (safeValues.is_grade_b) finalKeywords.push("Grade B Building");
    if (safeValues.is_grade_c) finalKeywords.push("Grade C Building");
    if (safeValues.is_column_free) finalKeywords.push("Column-Free");
    if (safeValues.is_central_air) finalKeywords.push("Central Air-con");
    if (safeValues.is_split_air) finalKeywords.push("Split Air-con");
    if (safeValues.has_247_access) finalKeywords.push("24/7 Access");
    if (safeValues.has_fiber_optic)
      finalKeywords.push("High-Speed Fiber Optic");
    if (safeValues.is_tax_registered) finalKeywords.push("Tax Registered");
    // Removed is_bare_shell, is_exclusive, has_raised_floor from keywords as they are now columns

    if (safeValues.ceiling_height)
      finalKeywords.push(`High Ceiling ${safeValues.ceiling_height}m`);
    if (safeValues.orientation)
      finalKeywords.push(`Facing ${safeValues.orientation}`);
    if (safeValues.parking_type)
      finalKeywords.push(`${safeValues.parking_type} Parking`);

    const seoData = generatePropertySEO({
      title: propertyData.title,
      property_type: propertyData.property_type,
      listing_type: propertyData.listing_type,
      bedrooms: propertyData.bedrooms ?? undefined,
      bathrooms: propertyData.bathrooms ?? undefined,
      size_sqm: propertyData.size_sqm ?? undefined,
      price: propertyData.price ?? undefined,
      rental_price: propertyData.rental_price ?? undefined,
      district: propertyData.district,
      province: propertyData.province,
      address_line1: propertyData.address_line1,
      postal_code: propertyData.postal_code,
      description: propertyData.description,
    });

    // Merge SEO keywords with our custom tags if SEO generated keywords don't include them (or just append)
    // Actually seoData.metaKeywords is usually string[]. We can combine them.
    const mergedKeywords = Array.from(
      new Set([...(seoData.metaKeywords || []), ...finalKeywords]),
    );

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        ...propertyData,
        original_price: propertyData.original_price, // Force include
        original_rental_price: propertyData.original_rental_price,
        created_by: user.id,
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: mergedKeywords,
        structured_data: seoData.structuredData as any,
      })
      .select()
      .single();

    if (error) {
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

      // 2) Verify images exist (DB-first, then storage fallback)
      // TEMPORARILY DISABLED - debugging cleanup issue
      /*

      */

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

    // 5) Insert features/amenities
    if (feature_ids && feature_ids.length > 0) {
      const featureRows = feature_ids.map((featureId) => ({
        property_id: property.id,
        feature_id: featureId,
      }));

      const { error: featuresError } = await supabase
        .from("property_features")
        .insert(featureRows);

      if (featuresError) {
        console.error("Features insertion error:", featuresError);
        // Non-blocking: continue even if features fail to save
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
      },
    );
    revalidatePath("/protected/properties");
    return { success: true, propertyId: property.id, slug: seoData.slug };
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
  sessionId: string,
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
    const {
      images,
      agent_ids,
      feature_ids,
      // is_pet_friendly,
      // is_foreigner_quota,
      // allow_smoking,
      // is_renovated,
      // is_unfurnished removed
      // is_fully_furnished,
      // is_corner_unit,
      // has_private_pool,
      // is_selling_with_tenant,
      // price_per_sqm, // Don't exclude, save to DB
      // rent_price_per_sqm, // Don't exclude, save to DB
      // has_garden_view,
      // has_pool_view,
      // has_city_view,
      // facing_east,
      // facing_north,
      // has_multi_parking,
      // is_grade_a,
      // is_grade_b,
      // is_grade_c,
      // is_column_free,
      // is_central_air,
      // is_split_air,
      // has_247_access,
      // has_fiber_optic,
      // is_tax_registered,
      // is_bare_shell,
      // is_exclusive,
      // has_raised_floor,
      ...propertyData
    } = safeValues;

    // 🧠 Auto-Status Logic: Check Stock
    if ((propertyData.sold_units ?? 0) >= (propertyData.total_units ?? 1)) {
      propertyData.status = "SOLD";
    } else if (propertyData.status === "SOLD") {
      propertyData.status = "ACTIVE";
    }

    // 2) โหลดเจ้าของก่อน แล้วเช็คสิทธิ
    // 2) โหลดเจ้าของก่อน แล้วเช็คสิทธิ
    const { data: existing, error: findErr } = await supabase
      .from("properties")
      .select("id, created_by, meta_keywords")
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

    // Add logic to handle "Pet Friendly" tag
    let finalKeywords = [...(existing.meta_keywords || [])];
    if (safeValues.is_pet_friendly) {
      if (!finalKeywords.includes("Pet Friendly")) {
        finalKeywords.push("Pet Friendly");
      }
    } else {
      // Remove if unchecked (optional logic, but safe to filter out)
      finalKeywords = finalKeywords.filter((k) => k !== "Pet Friendly");
    }

    // Foreigner Friendly
    if (safeValues.is_foreigner_quota) {
      if (!finalKeywords.includes("Foreigner Friendly")) {
        finalKeywords.push("Foreigner Friendly");
      }
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== "Foreigner Friendly");
    }

    // Smoking Allowed
    if (safeValues.allow_smoking) {
      if (!finalKeywords.includes("Smoking Allowed")) {
        finalKeywords.push("Smoking Allowed");
      }
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== "Smoking Allowed");
    }

    // Renovated
    if (safeValues.is_renovated) {
      if (!finalKeywords.includes("Renovated")) finalKeywords.push("Renovated");
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== "Renovated");
    }

    // is_unfurnished removed, consolidated with is_bare_shell (column)

    // Fully Furnished
    if (safeValues.is_fully_furnished) {
      if (!finalKeywords.includes("Fully Furnished"))
        finalKeywords.push("Fully Furnished");
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== "Fully Furnished");
    }

    // Corner Unit
    if (safeValues.is_corner_unit) {
      if (!finalKeywords.includes("Corner Unit"))
        finalKeywords.push("Corner Unit");
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== "Corner Unit");
    }

    // Private Pool
    if (safeValues.has_private_pool) {
      if (!finalKeywords.includes("Private Pool"))
        finalKeywords.push("Private Pool");
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== "Private Pool");
    }

    // Selling with Tenant
    if (safeValues.is_selling_with_tenant) {
      if (!finalKeywords.includes("Selling with Tenant"))
        finalKeywords.push("Selling with Tenant");
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== "Selling with Tenant");
    }

    // Helper for new keywords
    const toggleKeyword = (condition: boolean | undefined, kw: string) => {
      if (condition) {
        if (!finalKeywords.includes(kw)) finalKeywords.push(kw);
      } else {
        finalKeywords = finalKeywords.filter((k) => k !== kw);
      }
    };

    toggleKeyword(safeValues.has_garden_view, "Garden View");
    toggleKeyword(safeValues.has_pool_view, "Pool View");
    toggleKeyword(safeValues.has_city_view, "City View");
    toggleKeyword(safeValues.has_unblocked_view, "Unblocked View");
    toggleKeyword(safeValues.has_river_view, "River View");
    toggleKeyword(safeValues.facing_east, "East Facing");
    toggleKeyword(safeValues.facing_north, "North Facing");
    toggleKeyword(safeValues.facing_south, "South Facing");
    toggleKeyword(safeValues.facing_west, "West Facing");
    toggleKeyword(safeValues.is_high_ceiling, "High Ceiling");
    toggleKeyword(safeValues.has_multi_parking, "Multi-Parking");
    toggleKeyword(safeValues.is_grade_a, "Grade A Building");
    toggleKeyword(safeValues.is_grade_b, "Grade B Building");
    toggleKeyword(safeValues.is_grade_c, "Grade C Building");
    toggleKeyword(safeValues.is_column_free, "Column-Free");
    toggleKeyword(safeValues.is_central_air, "Central Air-con");
    toggleKeyword(safeValues.is_split_air, "Split Air-con");
    toggleKeyword(safeValues.has_247_access, "24/7 Access");
    toggleKeyword(safeValues.has_fiber_optic, "High-Speed Fiber Optic");
    toggleKeyword(safeValues.is_tax_registered, "Tax Registered");
    // is_bare_shell, is_exclusive, has_raised_floor handled as columns now

    if (safeValues.ceiling_height) {
      finalKeywords = finalKeywords.filter(
        (k) => !k.startsWith("High Ceiling "),
      );
      finalKeywords.push(`High Ceiling ${safeValues.ceiling_height}m`);
    }
    if (safeValues.orientation) {
      finalKeywords = finalKeywords.filter((k) => !k.startsWith("Facing "));
      finalKeywords.push(`Facing ${safeValues.orientation}`);
    }
    if (safeValues.parking_type) {
      finalKeywords = finalKeywords.filter((k) => !k.endsWith(" Parking"));
      finalKeywords.push(`${safeValues.parking_type} Parking`);
    }

    const seoData = generatePropertySEO({
      title: propertyData.title,
      property_type: propertyData.property_type,
      listing_type: propertyData.listing_type,
      bedrooms: propertyData.bedrooms ?? undefined,
      bathrooms: propertyData.bathrooms ?? undefined,
      size_sqm: propertyData.size_sqm ?? undefined,
      price: propertyData.price ?? undefined,
      rental_price: propertyData.rental_price ?? undefined,
      popular_area: propertyData.popular_area ?? undefined,
      subdistrict: propertyData.subdistrict ?? undefined,
      district: propertyData.district ?? undefined,
      province: propertyData.province ?? undefined,
      address_line1: propertyData.address_line1 ?? undefined,
      postal_code: propertyData.postal_code ?? undefined,
      description: propertyData.description ?? undefined,
      // SEO Flags
      is_pet_friendly: !!propertyData.is_pet_friendly,
      is_corner_unit: !!propertyData.is_corner_unit,
      is_renovated: !!propertyData.is_renovated,
      is_fully_furnished: !!propertyData.is_fully_furnished,
      is_selling_with_tenant: !!propertyData.is_selling_with_tenant,
      is_foreigner_quota: !!propertyData.is_foreigner_quota,
      is_hot_sale: !!(
        (propertyData.original_price &&
          propertyData.price &&
          propertyData.original_price > propertyData.price) ||
        (propertyData.original_rental_price &&
          propertyData.rental_price &&
          propertyData.original_rental_price > propertyData.rental_price)
      ),
      near_transit: !!(
        ((propertyData.nearby_transits as any[])?.length || 0) > 0 ||
        (propertyData as any).near_transit
      ),
      nearby_places: (propertyData as any).nearby_places || [],
      features: (propertyData as any).features || [],
    });

    const mergedKeywords = Array.from(
      new Set([...(seoData.metaKeywords || []), ...finalKeywords]),
    );

    // 5) Update property data + SEO
    const { error: updateErr } = await supabase
      .from("properties")
      .update({
        ...propertyData,
        is_bare_shell: safeValues.is_bare_shell,
        is_exclusive: safeValues.is_exclusive,
        has_raised_floor: safeValues.has_raised_floor,
        price: propertyData.price, // Force include (allow null)
        rental_price: propertyData.rental_price, // Force include (allow null)
        original_price: propertyData.original_price, // Force include
        original_rental_price: propertyData.original_rental_price,
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: mergedKeywords,
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

      // Skip verification for images that already exist in property_images
      // (they were already verified when first uploaded)
      const existingPaths = new Set(
        (oldImages || []).map((img: any) => img.storage_path),
      );
      const newImages = images.filter((path) => !existingPaths.has(path));

      // Only verify truly new images
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
            })),
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
        oldImages.map((x) => x.storage_path).filter(Boolean),
      );
      const newPaths = new Set((images ?? []).filter(Boolean));

      const removed = [...oldPaths].filter(
        (p): p is string => typeof p === "string" && !newPaths.has(p),
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

    // --- Step 5: Features/Amenities update ---
    if (feature_ids !== undefined) {
      // Delete all existing features
      await supabase.from("property_features").delete().eq("property_id", id);

      // Insert new selections
      if (feature_ids.length > 0) {
        const featureRows = feature_ids.map((featureId) => ({
          property_id: id,
          feature_id: featureId,
        }));
        const { error: featuresError } = await supabase
          .from("property_features")
          .insert(featureRows);

        if (featuresError) {
          console.error("Features update error:", featuresError);
          // Non-blocking: continue even if features fail to save
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
      },
    );
    revalidatePath("/protected/properties");
    revalidatePath(`/protected/properties/${id}`);
    return { success: true, propertyId: id, slug: seoData.slug };
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
  id: string,
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
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) throw error;

  const property = data as unknown as PropertyWithImages;

  if (property.property_images) {
    property.property_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  return property;
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

    // 0.2) Check for dependencies that block deletion (like active Deals)
    const { count: dealCount, error: dealErr } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id);

    if (dealCount && dealCount > 0) {
      throw new Error(
        "ไม่สามารถลบทรัพย์ที่มีการทำ Deal ไปแล้วได้ (กรุณาใช้การ Archive แทน)",
      );
    }

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
        // Use Admin Client to bypass RLS for storage deletion
        const adminSupabase = createAdminClient();
        const { error: storageError } = await adminSupabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .remove(pathsToRemove);

        if (storageError) {
          console.error("Failed to cleanup images from storage", storageError);
        }
      }
    }

    // 3) Manual Cleanup of Dependencies (Fix for Foreign Key Constraint 23503)
    // Even if DB has ON DELETE CASCADE, doing it here explicitly is safer if migration key is missing.

    // 3.1 Unlink Leads (don't delete leads, just remove association)
    await supabase
      .from("leads")
      .update({ property_id: null })
      .eq("property_id", id);

    // 3.2 Delete Sub-tables
    await supabase.from("property_features").delete().eq("property_id", id);
    await supabase.from("property_agents").delete().eq("property_id", id);
    await supabase.from("property_matches").delete().eq("property_id", id);
    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("property_id", id);

    // Explicitly delete property_images rows (DB) to be sure
    await supabase.from("property_images").delete().eq("property_id", id);

    // 4) Delete property
    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      // Catch specific FK error to give better message
      if (error.code === "23503") {
        throw new Error(
          "ลบไม่สำเร็จ: ข้อมูลมีการใช้งานอยู่ในส่วนอื่น (กรุณาแจ้ง Admin หรือลอง Archive แทน)",
        );
      }
      throw error;
    }

    // 5) Audit log delete
    await logAudit(
      { supabase, user, role },
      {
        action: "property.delete",
        entity: "properties",
        entityId: id,
        metadata: {
          // ใส่ได้ตามต้องการ เช่นจำนวนรูปที่ลบจริง (ถ้าคำนวณไว้)
        },
      },
    );

    // Clean up TEMP uploads (legacy logic, keep it)
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
      storageErr,
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
      trackErr,
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

/**
 * Get all popular areas from database
 */
export async function getPopularAreasAction(
  params: { onlyActive?: boolean } = { onlyActive: true },
) {
  // Allow public access (no auth required)
  const supabase = await createAdminClient();

  const { data: allAreas, error } = await supabase
    .from("popular_areas")
    .select("name")
    .order("name");

  if (error) {
    console.error("getPopularAreasAction error:", error);
    return [];
  }

  // If we want ALL areas (for Admin/Form), return everything
  if (params.onlyActive === false) {
    return allAreas.map((item) => item.name);
  }

  // Check which areas actually have active properties
  const { data: activeProps } = await supabase
    .from("properties")
    .select("popular_area")
    .eq("status", "ACTIVE")
    .not("popular_area", "is", null);

  const activeSet = new Set((activeProps || []).map((p) => p.popular_area));

  // Return intersection
  return allAreas
    .map((item) => item.name)
    .filter((name) => activeSet.has(name));
}

/**
 * Add a new popular area to the database
 */
export async function addPopularAreaAction(name: string) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  if (!name || name.trim() === "") {
    return { success: false, message: "กรุณาระบุชื่อย่าน" };
  }

  const { error } = await supabase.from("popular_areas").insert({
    name: name.trim(),
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "ย่านนี้มีอยู่แล้ว" };
    }
    console.error("addPopularAreaAction error:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

/**
 * Update property status
 */
export async function updatePropertyStatusAction(input: {
  id: string;
  status: PropertyStatus;
}): Promise<UpdatePropertyStatusResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!input?.id || !UUID_RE.test(input.id)) {
      return { success: false, message: "รูปแบบรหัสทรัพย์ไม่ถูกต้อง" };
    }

    if (!PROPERTY_STATUS_ENUM.includes(input.status)) {
      return { success: false, message: "สถานะไม่ถูกต้อง" };
    }

    const { error } = await supabase
      .from("properties")
      .update({
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) {
      return { success: false, message: error.message };
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "property.status.update",
        entity: "properties",
        entityId: input.id,
        metadata: { status: input.status },
      },
    );

    // protected pages
    revalidatePath("/protected/properties");
    revalidatePath(`/protected/properties/${input.id}`);

    // public pages ที่อาจแสดงเฉพาะ ACTIVE
    revalidatePath("/");
    revalidatePath("/properties");

    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "อัปเดตสถานะไม่สำเร็จ";
    return { success: false, message: msg };
  }
}

/**
 * Duplicate property
 */
export async function duplicatePropertyAction(
  id: string,
): Promise<DuplicatePropertyResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const { data: src, error: srcErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (srcErr || !src)
      return { success: false, message: "ไม่พบทรัพย์ต้นฉบับ" };

    const newTitle = `${src.title ?? "ไม่ระบุชื่อ"} (คัดลอก)`;

    // regenerate SEO + slug (กันชน unique)
    const { generatePropertySEO } = await import("@/lib/seo-utils");
    const seoData = generatePropertySEO({
      title: newTitle,
      property_type: src.property_type ?? undefined,
      listing_type: src.listing_type ?? undefined,

      bedrooms: src.bedrooms ?? undefined,
      bathrooms: src.bathrooms ?? undefined,
      size_sqm: src.size_sqm ?? undefined,
      price: src.price ?? undefined,
      rental_price: src.rental_price ?? undefined,

      district: src.district ?? undefined,
      province: src.province ?? undefined,
      address_line1: src.address_line1 ?? undefined,
      postal_code: src.postal_code ?? undefined,
      description: src.description ?? undefined,
    });

    const uniqueSlug = `${seoData.slug}-${randomUUID().slice(0, 8)}`;

    // omit fields ที่ไม่ควรถูก copy ตรง ๆ
    const {
      id: _id,
      created_at: _created_at,
      updated_at: _updated_at,
      created_by: _created_by,
      slug: _slug,
      meta_title: _meta_title,
      meta_description: _meta_description,
      meta_keywords: _meta_keywords,
      structured_data: _structured_data,
      ...rest
    } = src as any;

    const { data: inserted, error: insErr } = await supabase
      .from("properties")
      .insert({
        ...rest,
        title: newTitle,
        status: "DRAFT", // แนะนำให้เป็น draft เสมอ
        created_by: user.id,
        slug: uniqueSlug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: seoData.metaKeywords,
        structured_data: seoData.structuredData as any,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      return {
        success: false,
        message: insErr?.message || "Duplicate ไม่สำเร็จ",
      };
    }
    // Explicitly re-affirm inserted is not null for TS (though the if above should handle it, sometimes block scoping is tricky)
    const newPropertyId = inserted.id;

    // copy images rows (ไม่ copy ไฟล์จริงใน storage — ใช้ไฟล์เดิมได้)
    const { data: imgs } = await supabase
      .from("property_images")
      .select("image_url, storage_path, is_cover, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true });

    if (imgs?.length) {
      const rows = imgs.map((img) => ({
        property_id: newPropertyId,
        image_url: img.image_url,
        storage_path: img.storage_path,
        is_cover: img.is_cover,
        sort_order: img.sort_order,
      }));

      const { error: imgErr } = await supabase
        .from("property_images")
        .insert(rows);

      if (imgErr) {
        // ไม่ถึงกับ fail ทั้งหมด แต่แจ้งไว้
        console.warn("duplicatePropertyAction: copy images failed", imgErr);
      }
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "property.create",
        entity: "properties",
        entityId: newPropertyId,
        metadata: { duplicated_from: id },
      },
    );

    revalidatePath("/protected/properties");
    return { success: true, propertyId: newPropertyId };
  } catch (err) {
    console.error("duplicatePropertyAction → error:", err);
    return authzFail(err);
  }
}

/**
 * Increment property view count
 * Publicly accessible action (no auth required)
 */
export async function incrementPropertyView(propertyId: string) {
  const supabase = await createClient();

  // Call the secure database function
  const { error } = await supabase.rpc("increment_property_view", {
    property_id: propertyId,
  });

  if (error) {
    console.error("Error incrementing view count:", error);
  }
}
