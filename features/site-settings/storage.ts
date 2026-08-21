"use server";

import { createClient } from "@/lib/supabase/server";

export type StorageResponse = {
  success: boolean;
  message: string;
  data?: { publicUrl: string };
};

/**
 * Uploads a site asset (logo, favicon) to storage.
 */
export async function uploadSiteAsset(
  file: File | Buffer,
  fileName: string,
  fileType: string = "image/png",
  folder: string = "branding",
): Promise<StorageResponse> {
  const supabase = await createClient();

  // Basic validation
  if (file instanceof File) {
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "ไฟล์ใหญ่เกินไป (สูงสุด 5MB)" };
    }
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".ico") && !file.name.endsWith(".svg")) {
      return {
        success: false,
        message: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, SVG, ICO)",
      };
    }
  }

  const date = new Date();
  const timestamp = date.getTime();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "");
  let path = `site-assets/${folder}/${timestamp}-${safeName}`;

  let uploadPayload: Buffer | File = file;
  let finalContentType = fileType;

  // Convert raster images (PNG/JPEG/WebP) to crystal-clear lossless/high-quality WebP
  if (
    file instanceof File &&
    (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")
  ) {
    try {
      const sharp = (await import("sharp")).default;
      const arrayBuffer = await file.arrayBuffer();
      uploadPayload = await sharp(Buffer.from(arrayBuffer))
        .resize({ width: 1200, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 90, lossless: file.type === "image/png" })
        .toBuffer();
      finalContentType = "image/webp";
      path = path.replace(/\.[^.]+$/, "") + ".webp";
    } catch (e) {
      console.warn("[SiteAsset] Sharp WebP conversion fallback:", e);
    }
  }

  const { error: uploadError } = await supabase.storage
    .from("property-images") // Reusing property-images bucket or you can create "site-assets"
    .upload(path, uploadPayload, {
      contentType: finalContentType,
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload site asset error:", uploadError);
    return { success: false, message: "อัปโหลดรูปภาพไม่สำเร็จ" };
  }

  const { data: publicUrlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(path);

  return {
    success: true,
    message: "อัปโหลดเรียบร้อยแล้ว",
    data: { publicUrl: publicUrlData.publicUrl },
  };
}
