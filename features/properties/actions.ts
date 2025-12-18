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
import { requireAuthContext, assertOwnerOrAdmin, authzFail } from "@/lib/authz";

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
// ตรวจสอบความถูกต้องของ path ที่ส่งมา
function validatePropertyImagePaths(paths: string[]) {
  const invalid = paths.filter(
    (p) =>
      typeof p !== "string" ||
      !p.startsWith("properties/") || // บังคับต้องอยู่ใต้โฟลเดอร์นี้
      p.includes("..") ||             // กัน path traversal
      p.startsWith("/")               // กัน absolute-ish
  );

  if (invalid.length > 0) {
    return {
      ok: false as const,
      message: `Invalid image path(s): ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "..." : ""}`,
    };
  }

  return { ok: true as const };
}
// ตรวจสอบว่าไฟล์ใน storage มีอยู่จริง
async function ensureStorageObjectsExist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  paths: string[]
) {
  const missing: string[] = [];

  // ตรวจทีละไฟล์ (ปลอดภัยกว่า Promise.all สำหรับไฟล์จำนวนมาก)
  for (const p of paths) {
    const { error } = await supabase.storage.from(bucket).download(p);
    if (error) missing.push(p);
  }

  return missing;
}
export async function uploadPropertyImageAction(formData: FormData) {
  try {
    // ✅ Step 1.2: require auth context
    const { supabase, user } = await requireAuthContext();
  
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file provided");
  
    const extRaw = file.name.split(".").pop() || "jpg";
    const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  
    const fileName = `${randomUUID()}.${ext}`;
  
    // ✅ ผูก path กับ user เพื่อกันคนอื่นเดา/ยัด path
    const path = `properties/${user.id}/${fileName}`;
  
    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
  
    if (uploadError) {
      console.error("uploadPropertyImageAction → uploadError:", uploadError);
      throw uploadError;
    }
  
    const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path);
  
    return {
      path,
      publicUrl: data.publicUrl,
    };
    
  } catch (error) {
    console.error("uploadPropertyImageAction → error:", error);
    throw error;
  }
}

/**
 * Create property with images
 */
export async function createPropertyAction(
  values: PropertyFormValues
): Promise<CreatePropertyResult> {
 
  try {
    // ✅ Step 1.2: require auth context (แทน getUser แบบเดิม)
    const { supabase, user } = await requireAuthContext();
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

    const { images, ...propertyData } = safeValues;

    // ✅ Step 1.2: image paths ต้องเป็นของ user เท่านั้น (กันยัด path ปลอม)
    if (images?.length) {
      const mustStartWith = `properties/${user.id}/`;
      const invalid = images.find((p) => !p.startsWith(mustStartWith));
      if (invalid) {
        return { success: false, message: "Invalid image path (ownership mismatch)" };
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
          message: `Some images are missing in storage: ${missing.slice(0, 3).join(", ")}${
            missing.length > 3 ? "..." : ""
          }`,
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
  values: PropertyFormValues
): Promise<CreatePropertyResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();

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
    const { images, ...propertyData } = safeValues;

    // 2) โหลดเจ้าของก่อน แล้วเช็คสิทธิ
    const { data: existing, error: findErr } = await supabase
      .from("properties")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (findErr || !existing) {
      return { success: false, message: "Property not found" };
    }

    assertOwnerOrAdmin({ ownerId: existing.created_by, userId: user.id, role });

    // 3) กันยัด path รูปปลอม (ownership)
    if (images?.length) {
      const mustStartWith = `properties/${user.id}/`;
      const invalid = images.find((p) => !p.startsWith(mustStartWith));
      if (invalid) {
        return { success: false, message: "Invalid image path (ownership mismatch)" };
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
          message: `Some images are missing in storage: ${missing.slice(0, 3).join(", ")}${
            missing.length > 3 ? "..." : ""
          }`,
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
    const {supabase,user,role} = await requireAuthContext();
  
    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (propErr) throw propErr;

    // ✅ กันอ่านของคนอื่น
    assertOwnerOrAdmin({
      ownerId: (property as any).created_by,
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
   const { supabase, user, role } = await requireAuthContext();

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

  // ✅ เพิ่ม authorization check
  assertOwnerOrAdmin({ ownerId: (data as any).created_by, userId: user.id, role });

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
    assertOwnerOrAdmin({ ownerId: property.created_by, userId: user.id, role });
  
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

  const mustStartWith = `properties/${user.id}/`;

  // ✅ owner ลบได้เฉพาะไฟล์ตัวเอง, admin ลบได้ทั้งหมดใน properties/
  const ok =
    storagePath?.startsWith(mustStartWith) ||
    (role === "ADMIN" && storagePath?.startsWith("properties/"));

  if (!ok) throw new Error("Invalid storage path (ownership mismatch)");

  const { error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("deletePropertyImageFromStorage → error:", error);
    throw error;
  }

  return { success: true };
}
