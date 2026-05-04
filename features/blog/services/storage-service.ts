"use server";

import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

export type StorageResponse = {
  success: boolean;
  message: string;
  data?: { publicUrl: string };
};

/**
 * Uploads an image to the blog storage bucket with optimization.
 */
export async function uploadBlogImage(
  file: File | Buffer,
  fileName: string,
  fileType: string = "image/png",
): Promise<StorageResponse> {
  const supabase = await createClient();

  try {
    let buffer: Buffer;
    
    // 🏗️ OPTIMIZATION: Convert input to Buffer
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // ⚡ INTELLIGENCE: Process image with Sharp
    // Convert to WebP, resize to max 1440px width, and compress
    const optimizedBuffer = await sharp(buffer)
      .resize({ width: 1440, withoutEnlargement: true }) // Don't up-scale small images
      .webp({ quality: 82 }) // Convert to WebP with balanced quality
      .toBuffer();

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const randomId = Math.random().toString(36).substring(2, 10);
    
    // Change extension to .webp since we converted it
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "").split('.')[0] + ".webp";
    const path = `blog/${year}/${month}/${randomId}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(path, optimizedBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000", // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload blog image error:", uploadError);
      return { success: false, message: "Failed to upload image" };
    }

    const { data: publicUrlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(path);

    return {
      success: true,
      message: "Image optimized and uploaded successfully",
      data: { publicUrl: publicUrlData.publicUrl },
    };
  } catch (error: any) {
    console.error("Image processing error:", error);
    return { success: false, message: "Error processing image" };
  }
}
