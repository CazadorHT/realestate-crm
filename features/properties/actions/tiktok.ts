"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getPropertySocialContent, renderPropertySocialTemplate, populateAgentProfiles } from "./social";
import { refreshTikTokTokenIfNeeded, publishTikTokPhotoPost, getTikTokPublishStatus } from "@/lib/tiktok";
import { getPublicImageUrl } from "../image-utils";

/**
 * โพสต์รูปภาพไปยัง TikTok (Content Posting API v2)
 */
export async function postPropertyToTikTokAction(
  propertyId: string,
  caption?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
  postMode: "DIRECT_POST" | "MEDIA_UPLOAD" = "DIRECT_POST",
  customCoverUrl?: string,
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. ตรวจสอบ Token และ Refresh หากจำเป็น
    const accessToken = await refreshTikTokTokenIfNeeded();
    if (!accessToken) {
      return { 
        success: false, 
        message: "ไม่พบการเชื่อมต่อ TikTok หรือ Token หมดอายุ กรุณาเชื่อมต่อบัญชีใหม่ในหน้าตั้งค่า" 
      };
    }

    // 2. ดึงข้อมูลทรัพย์ พร้อมรูป, เอเจนต์, และฟีเจอร์ต่างๆ
    const { data: propData, error: propError } = await supabase
      .from("properties")
      .select(`
        *,
        property_images ( image_url, storage_path, is_cover, sort_order ),
        property_agents ( agent_id, profiles:identities_v3 ( full_name:display_name, phone, line_id ) ),
        property_features ( features ( name, name_en, name_cn, name_ru, icon_key ) )
      `)
      .eq("id", propertyId)
      .single();

    if (propError || !propData) {
      return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    }

    const property = propData as any;

    // Fetch project separately to bypass view join restrictions
    if (property.project_id) {
      try {
        const { data: projData } = await supabase
          .from("projects")
          .select("name")
          .eq("id", property.project_id)
          .single();
        property.project = projData;
      } catch (err) {
        console.warn("[TikTok] Failed to fetch project relation:", err);
      }
    }

    // Fetch popular area translations separately from master table
    if (property.popular_area) {
      try {
        const { data: areaData } = await supabase
          .from("popular_areas")
          .select("name, name_en, name_cn, name_ru")
          .eq("name", property.popular_area)
          .limit(1);
        if (areaData && areaData[0]) {
          const area = areaData[0];
          property.popular_area_en = area.name_en || property.popular_area_en;
          property.popular_area_cn = area.name_cn || property.popular_area_cn;
          property.popular_area_ru = area.name_ru || property.popular_area_ru;
        }
      } catch (err) {
        console.warn("[TikTok] Failed to fetch popular area translation:", err);
      }
    }

    await populateAgentProfiles(supabase, property);

    // 3. จัดเตรียม Caption (Robust Logic)
    let finalCaption = caption || "";
    if (!finalCaption) {
      const contentData = await getPropertySocialContent(propertyId, lang, "TIKTOK");
      finalCaption = contentData.content;
    } else {
      finalCaption = await renderPropertySocialTemplate(finalCaption, property as any, lang);
    }

    // TikTok Limits: 4000 characters for caption
    if (finalCaption.length > 4000) {
      finalCaption = finalCaption.substring(0, 3997) + "...";
    }

    // 4. เตรียมรูปภาพ (Standardized Logic using storage_path)
    const rawImagesCount = (property.property_images as unknown as any[])?.length || 0;
    
    let rawImages = (((property.property_images as unknown as any[]) || [])
      .slice()
      .sort((a: any, b: any) => {
        if (a.is_cover && !b.is_cover) return -1;
        if (!a.is_cover && b.is_cover) return 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      }))
      .map((img: any) => {
        // Prefer storage_path (absolute path in bucket) over raw image_url
        const path = img.storage_path || img.image_url;
        if (!path) return null;
        
        let url = path.startsWith("http") ? path : getPublicImageUrl(path);
        return url;
      })
      .filter(Boolean) as string[];

    const sharp = (await import("sharp")).default;
    const adminSupabase = createAdminClient();

    // 4.1 Process Custom Cover URL if provided (Base64 or HTTP URL)
    if (customCoverUrl && customCoverUrl.trim()) {
      const cleanCoverUrl = customCoverUrl.trim();
      if (cleanCoverUrl.startsWith("data:image/")) {
        try {
          const base64Data = cleanCoverUrl.split(",")[1];
          if (base64Data) {
            const buffer = Buffer.from(base64Data, "base64");
            const tempCoverPath = `tiktok-cache/${propertyId}/cover_${Date.now()}.jpg`;

            const jpegBuf = await sharp(buffer)
              .resize(1080, 1350, {
                fit: "contain",
                background: { r: 255, g: 255, b: 255, alpha: 1 },
              })
              .flatten({ background: { r: 255, g: 255, b: 255 } })
              .jpeg({ quality: 90 })
              .toBuffer();

            const { error: coverUploadErr } = await adminSupabase.storage
              .from("property-images")
              .upload(tempCoverPath, jpegBuf, {
                contentType: "image/jpeg",
                upsert: true,
              });

            if (!coverUploadErr) {
              const cdnCoverUrl = `https://cdn.vccasset.com/storage/v1/object/public/property-images/${tempCoverPath}`;
              rawImages = [cdnCoverUrl, ...rawImages.filter((u) => u !== cdnCoverUrl)];
            } else {
              console.error("[TikTok Custom Cover Upload Error]:", coverUploadErr);
            }
          }
        } catch (coverErr) {
          console.error("[TikTok Custom Cover Convert Error]:", coverErr);
        }
      } else if (cleanCoverUrl.startsWith("http://") || cleanCoverUrl.startsWith("https://")) {
        rawImages = [cleanCoverUrl, ...rawImages.filter((u) => u !== cleanCoverUrl)];
      }
    }

    // TikTok Photo Mode API strictly requires direct JPEG (.jpg / .jpeg) or PNG images hosted on verified domain.
    // Convert WebP images to optimized JPEG and upload directly to Supabase Storage CDN (cdn.vccasset.com)
    // Process all images in parallel for maximum speed and efficiency
    const uploadTasks = rawImages.map(async (srcUrl, idx) => {
      try {
        if (!/\.webp(\?|$)/i.test(srcUrl)) {
          return srcUrl; // Already JPEG/PNG, no conversion needed
        }

        const tempPath = `tiktok-cache/${propertyId}/img_${idx + 1}.jpg`;

        // 1. Fetch original WebP
        const fetchRes = await fetch(srcUrl);
        if (!fetchRes.ok) return null;
        const webpBuf = await fetchRes.arrayBuffer();

        // 2. Convert to standard JPEG (1080x1350 vertical safe fit, Quality 85)
        const jpegBuf = await sharp(Buffer.from(webpBuf))
          .resize(1080, 1350, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .jpeg({ quality: 85 })
          .toBuffer();

        // 3. Upload to property-images bucket (upsert: true)
        const { error: uploadError } = await adminSupabase.storage
          .from("property-images")
          .upload(tempPath, jpegBuf, {
            contentType: "image/jpeg",
            upsert: true
          });

        if (!uploadError) {
          return `https://cdn.vccasset.com/storage/v1/object/public/property-images/${tempPath}`;
        } else {
          console.error("[TikTok Image Upload Error]:", uploadError);
          return null;
        }
      } catch (convErr) {
        console.error(`[TikTok Image Convert Error for ${srcUrl}]:`, convErr);
        return null;
      }
    });

    const convertedResults = await Promise.all(uploadTasks);
    const imagesToPost = convertedResults.filter(Boolean) as string[];

    console.log(`[TikTok Post] Sending ${imagesToPost.length} direct CDN JPEG images to TikTok:`, imagesToPost);

    // 5. Verify image accessibility
    if (imagesToPost.length === 0) {
      return { 
        success: false, 
        message: rawImagesCount > 0 
          ? "ไม่พบรูปภาพที่รองรับ (TikTok รองรับเฉพาะ .jpg, .jpeg, .png)" 
          : "ไม่พบรูปภาพในทรัพย์สินนี้ กรุณาเพิ่มรูปภาพก่อนโพสต์"
      };
    }

    // 5. ยิง API จริงของ TikTok (บังคับใช้ MEDIA_UPLOAD เท่านั้นเพื่อความเสถียร)
    const tiktokTitle = ((property as any).title || "Real Estate Property").substring(0, 80);
    
    const publishResult = await publishTikTokPhotoPost(accessToken, {
      title: tiktokTitle,
      description: finalCaption,
      images: imagesToPost,
      postMode: "MEDIA_UPLOAD",
    });

    if (!publishResult.success) {
      // Handle specific TikTok error codes & messages
      let errorMsg = publishResult.error;
      
      if (publishResult.error_code === 401) {
        errorMsg = "Session หมดอายุ กรุณาตัดการเชื่อมต่อและเชื่อมต่อ TikTok ใหม่อีกครั้ง";
      }

      return { 
        success: false, 
        message: `เกิดข้อผิดพลาดจาก TikTok: ${errorMsg}` 
      };
    }

    // 6. บันทึกสถานะ
    await supabase
      .from("properties_core")
      .update({ posted_to_tiktok_at: new Date().toISOString() })
      .eq("id", propertyId);

    revalidatePath("/protected/properties");

    return {
      success: true,
      message: "ดำเนินการสำเร็จ!\nส่งแบบร่างสำเร็จ!  กรุณาเปิดแอป TikTok > Inbox > System Notifications เพื่อกดยืนยันการโพสต์",
      publish_id: publishResult.publish_id
    };
  } catch (err: any) {
    console.error("TikTok Post Exception:", err);
    return { success: false, message: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
  }
}

/**
 * Check the status of a TikTok post
 */
export async function getTikTokPostStatusAction(publishId: string) {
  try {
    const accessToken = await refreshTikTokTokenIfNeeded();
    if (!accessToken) return { success: false, status: "FAILED", error: "Unauthorized" };
    return await getTikTokPublishStatus(accessToken, publishId);
  } catch (error) {
    return { success: false, status: "FAILED", error: "Failed to fetch status" };
  }
}
