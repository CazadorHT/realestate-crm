"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";

export type StorageResponse = {
  success: boolean;
  message: string;
  data?: { publicUrl: string };
};

/**
 * Uploads an image to the blog storage bucket.
 */
export async function uploadBlogImage(
  file: File | Buffer,
  fileName: string,
  fileType: string = "image/png",
): Promise<StorageResponse> {
  const supabase = await createClient();

  // Basic validation for File objects
  if (file instanceof File) {
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "File too large (max 5MB)" };
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return { success: false, message: "Invalid file type" };
    }
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const randomId = Math.random().toString(36).substring(2, 10);
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "");
  const path = `blog/${year}/${month}/${randomId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("property-images")
    .upload(path, file, {
      contentType: fileType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload blog image error:", uploadError);
    return { success: false, message: "Failed to upload image" };
  }

  const { data: publicUrlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(path);

  return {
    success: true,
    message: "Image uploaded successfully",
    data: { publicUrl: publicUrlData.publicUrl },
  };
}
