// features/properties/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { randomUUID } from "crypto";
import { getPublicImageUrl } from "./image-utils";
import type { PropertyRow, PropertyWithImages, PropertyImage } from "./types";
import type { PropertyFormValues } from "./schema";

export type CreatePropertyResult = {
  success: boolean;
  propertyId?: string;
  message?: string;
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
export async function uploadPropertyImageAction(formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("No file provided");
  }

  const supabase = await createClient();

  // หา extension จากชื่อไฟล์ (เช่น .jpg, .png)
  const ext = file.name.split(".").pop() || "jpg";

  // ตั้งชื่อไฟล์ใหม่ให้เป็น uuid เพื่อกันชนกัน
  const fileName = `${randomUUID()}.${ext}`;

  // path ภายใน bucket (โฟลเดอร์ properties/ ที่ Hunter มีอยู่แล้ว)
  const path = `properties/${fileName}`;

  // 1) อัปโหลดเข้า bucket property-images
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

  // 2) สร้าง public URL กลับไปให้ฝั่ง client ใช้ preview
  const {
    data: { publicUrl },
  } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path);

  console.log("uploadPropertyImageAction → PUBLIC URL:", publicUrl);

  return {
    path, // เก็บลง property_images.storage_path
    publicUrl, // ใช้เป็น preview_url / image_url
  };
}

/**
 * Create property with images
 */
export async function createPropertyAction(
  values: PropertyFormValues
): Promise<CreatePropertyResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Unauthorized" };
  }

  // Extract images from values
  const { images, ...propertyData } = values;

  // 🔥 Auto-generate SEO metadata
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

  console.log("✅ Auto-generated SEO:", {
    slug: seoData.slug,
    metaTitle: seoData.metaTitle,
  });

  // Insert property (without images field) + SEO fields
  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      ...propertyData,
      created_by: user.id,
      // 🔥 Add SEO fields
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

  // Insert images into property_images table
  if (images && images.length > 0) {
    const imageRows = images.map((storagePath, index) => ({
      property_id: property.id,
      storage_path: storagePath,
      image_url: getPublicImageUrl(storagePath),
      is_cover: index === 0, // First image is cover
      sort_order: index,
    }));

    const { error: imagesError } = await supabase
      .from("property_images")
      .insert(imageRows);

    if (imagesError) {
      console.error("Images insertion error:", imagesError);
      // Property is already created, just log the error
    }
  }

  revalidatePath("/protected/properties");
  return { success: true, propertyId: property.id };
}

/**
 * Update property with images
 */
export async function updatePropertyAction(
  id: string,
  values: PropertyFormValues
): Promise<CreatePropertyResult> {
  const supabase = await createClient();

  // Extract images from values
  const { images, ...propertyData } = values;

  // 🔥 Auto-generate SEO metadata
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

  console.log("✅ Auto-updated SEO:", {
    slug: seoData.slug,
    metaTitle: seoData.metaTitle,
  });

  // Update property data + SEO
  const { error } = await supabase
    .from("properties")
    .update({
      ...propertyData,
      // 🔥 Update SEO fields
      slug: seoData.slug,
      meta_title: seoData.metaTitle,
      meta_description: seoData.metaDescription,
      meta_keywords: seoData.metaKeywords,
      structured_data: seoData.structuredData as any,
    })
    .eq("id", id);

  if (error) {
    console.error("Property update error:", error);
    return { success: false, message: error.message };
  }

  // Delete old images from property_images table
  const { error: deleteError } = await supabase
    .from("property_images")
    .delete()
    .eq("property_id", id);

  if (deleteError) {
    console.error("Delete old images error:", deleteError);
  }

  // Insert new images
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
    }
  }

  revalidatePath("/protected/properties");
  revalidatePath(`/protected/properties/${id}`);
  return { success: true, propertyId: id };
}

/**
 * Get property by ID with images
 */
export async function getPropertyById(id: string): Promise<PropertyRow> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get property with images
 */
export async function getPropertyWithImages(
  id: string
): Promise<PropertyWithImages> {
  const supabase = await createClient();

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

  if (error) throw error;

  // Sort images by sort_order
  if (data.property_images) {
    data.property_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  return data as unknown as PropertyWithImages;
}

/**
 * Delete property and cleanup storage
 */
export async function deletePropertyAction(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string | null;
  if (!id) throw new Error("Missing property id");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Get all images to delete from storage
  const { data: images } = await supabase
    .from("property_images")
    .select("storage_path")
    .eq("property_id", id);

  // 2. Delete from storage
  if (images && images.length > 0) {
    const pathsToRemove = images
      .map((img) => img.storage_path)
      .filter((path): path is string => !!path);

    if (pathsToRemove.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("property-images")
        .remove(pathsToRemove);

      if (storageError) {
        console.error("Failed to cleanup images from storage", storageError);
      }
    }
  }

  // 3. Delete property (cascade will delete property_images records)
  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/protected/properties");
}

/**
 * Delete single image from storage
 * Used when user removes image from uploader before submission
 */
export async function deletePropertyImageFromStorage(storagePath: string) {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove([storagePath]); // storagePath = "properties/xxx.jpg"

  if (error) {
    console.error("deletePropertyImageFromStorage → error:", error);
    throw error;
  }

  return { success: true };
}
