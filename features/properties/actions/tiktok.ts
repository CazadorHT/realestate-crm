"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { getPropertySocialContent, renderPropertySocialTemplate } from "./social";
import { refreshTikTokTokenIfNeeded, publishTikTokPhotoPost } from "@/lib/tiktok";

/**
 * โพสต์รูปภาพไปยัง TikTok (Content Posting API v2)
 */
export async function postPropertyToTikTokAction(
  propertyId: string,
  caption?: string,
  lang: "th" | "en" | "cn" = "th",
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
          image_url
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
      finalCaption = await renderPropertySocialTemplate(finalCaption, property, lang);
    }

    // TikTok Limits: 4000 characters for caption
    if (finalCaption.length > 4000) {
      finalCaption = finalCaption.substring(0, 3997) + "...";
    }

    // 4. เตรียมรูปภาพ (Hardened Absolute URLs for TikTok PULL_FROM_URL)
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (supabaseUrl && !supabaseUrl.startsWith("http")) {
      supabaseUrl = `https://${supabaseUrl}`;
    }
    
    const rawImagesCount = property.property_images?.length || 0;
    
    const rawImages = (property.property_images || [])
      .map((img: any) => {
        const url = img.image_url;
        if (!url) return null;
        if (url.startsWith("http")) return url;
        // Construct full absolute URL for Supabase storage
        return `${supabaseUrl}/storage/v1/object/public/property_images/${url}`;
      })
      .filter(Boolean) as string[];
    
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const imagesToPost = rawImages
      .filter(url => {
        const cleanUrl = url.split("?")[0].toLowerCase();
        return supportedExtensions.some(ext => cleanUrl.endsWith(ext));
      })
      .slice(0, 35);

    console.log(`[TikTok Post] Sending ${imagesToPost.length} images to TikTok:`, imagesToPost);

    if (imagesToPost.length === 0) {
      return { 
        success: false, 
        message: rawImagesCount > 0 
          ? "ไม่พบรูปภาพที่ TikTok รองรับ (.jpg, .jpeg, .png, .webp) กรุณาตรวจสอบไฟล์รูปภาพของคุณ" 
          : "ไม่พบรูปภาพในทรัพย์สินนี้ กรุณาเพิ่มรูปภาพก่อนโพสต์"
      };
    }

    // 5. ยิง API จริงของ TikTok (บังคับใช้ MEDIA_UPLOAD เท่านั้นเพื่อความเสถียร)
    const tiktokTitle = (property.title || "Real Estate Property").substring(0, 80);
    
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
      message: "ส่งแบบร่างสำเร็จ! กรุณาเปิดแอป TikTok > Inbox > System Notifications เพื่อกดยืนยันการโพสต์",
      publish_id: publishResult.publish_id
    };
  } catch (err) {
    console.error("postPropertyToTikTokAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok" };
  }
}
