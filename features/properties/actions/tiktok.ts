"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { getPropertySocialContent, renderSocialTemplate } from "./social";

/**
 * เตรียมข้อมูลสำหรับโพสต์ไปยัง TikTok (Content Posting API)
 * หมายเหตุ: เนื่องจาก TikTok มีขั้นตอนที่ซับซ้อนกว่า (OAuth -> Upload -> Post)
 * ในเวอร์ชันเบื้องต้นนี้จะเป็นการบันทึกสถานะว่ากำลังเตรียมข้อมูล หรือส่งไปยังคิว
 */
export async function postPropertyToTikTokAction(
  propertyId: string,
  caption?: string,
  lang: "th" | "en" | "cn" = "th",
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. ดึงข้อมูลทรัพย์ พร้อมรูป
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(`
        *,
        property_images (
          image_url
        ),
        property_agents (
          profiles (
            full_name,
            phone,
            line_id
          )
        ),
        property_features (
          features (
            name,
            name_en,
            name_cn,
            icon_key
          )
        )
      `)
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    }

    // 2. จัดเตรียม Caption (Robust Logic)
    let finalCaption = caption;
    if (!finalCaption) {
      // หากไม่มี caption ส่งมา ให้ใช้ Template จาก Settings
      const contentData = await getPropertySocialContent(propertyId, lang);
      finalCaption = contentData.content;
    } else {
      // หากมี caption ส่งมา (เช่น แก้ไขจากหน้า UI) ให้ลอง Render Tags เผื่อไว้
      finalCaption = renderSocialTemplate(finalCaption, property, lang);
    }

    // 3. ตรวจสอบการเชื่อมต่อ TikTok (Placeholder for Token Logic)
    // ในอนาคตจะต้องรัน Step: Exchange Code -> Access Token จาก TikTok

    // 4. จำลองการโพสต์ (หรือส่งเข้า Queue สำหรับ Video Processing)
    // สำหรับสถานะการสาธิต (Demo) เราจะตอบกลับด้วยข้อความที่ TikTok กำหนด
    console.log("TikTok Demo Post with final caption:", finalCaption);

    await supabase
      .from("properties")
      .update({ posted_to_tiktok_at: new Date().toISOString() })
      .eq("id", propertyId);

    revalidatePath("/(protected)/protected/properties", "page");

    return {
      success: true,
      message: "Post successfully sent to TikTok!",
      data: { share_url: "https://www.tiktok.com" } // Demo placeholder
    };
  } catch (err) {
    console.error("postPropertyToTikTokAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการโพสต์ลง TikTok" };
  }
}
