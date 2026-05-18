"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { getPropertySocialContent, renderPropertySocialTemplate } from "./social";
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

    // 2. ดึงข้อมูลทรัพย์ พร้อมรูป
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(`
        *,
        property_images (
          image_url,
          storage_path
        )
      `)
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    }

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
    
    const rawImages = ((property.property_images as unknown as any[]) || [])
      .map((img: any) => {
        // Prefer storage_path (absolute path in bucket) over raw image_url
        const path = img.storage_path || img.image_url;
        if (!path) return null;
        if (path.startsWith("http")) return path;
        
        return getPublicImageUrl(path);
      })
      .filter(Boolean) as string[];
    
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    
    // Get the current app URL for the image proxy
    // We prefer NEXT_PUBLIC_SUPABASE_URL domain for verification, 
    // but the proxy is on the App domain.
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (appUrl && !appUrl.startsWith("http")) {
      appUrl = `https://${appUrl}`;
    }
    appUrl = appUrl.replace(/\/$/, "");

    const imagesToPost = rawImages
      .map(url => {
        const cleanUrl = url.split("?")[0].toLowerCase();
        const isCompatible = [".jpg", ".jpeg", ".png"].some(ext => cleanUrl.endsWith(ext));
        const isWebp = cleanUrl.endsWith(".webp");
        
        if (isCompatible) return url;
        
        // If it's WebP, route it through our magic proxy converter
        if (isWebp && appUrl) {
          return `${appUrl}/api/proxy/image?url=${encodeURIComponent(url)}`;
        }
        
        return null;
      })
      .filter(Boolean) as string[];

    console.log(`[TikTok Post] Sending ${imagesToPost.length} images to TikTok (with Proxy if WebP):`, imagesToPost);

    // 5. Self-Test: Verify image accessibility before sending to TikTok
    if (imagesToPost.length > 0) {
      try {
        const testRes = await fetch(imagesToPost[0], { method: 'HEAD' });
        console.log(`[TikTok Self-Test] First image check: ${testRes.status} ${testRes.statusText}`);
        // Note: Proxy might return 200 even if TikTok has issues, but it's a good start.
      } catch (e) {
        console.error("[TikTok Self-Test] Error checking image:", e);
      }
    }

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
      .from("properties")
      .update({ posted_to_tiktok_at: new Date().toISOString() })
      .eq("id", propertyId);

    revalidatePath("/(protected)/protected/properties", "page");

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
