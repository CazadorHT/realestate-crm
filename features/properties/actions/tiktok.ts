"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";

/**
 * เตรียมข้อมูลสำหรับโพสต์ไปยัง TikTok (Content Posting API)
 * หมายเหตุ: เนื่องจาก TikTok มีขั้นตอนที่ซับซ้อนกว่า (OAuth -> Upload -> Post)
 * ในเวอร์ชันเบื้องต้นนี้จะเป็นการบันทึกสถานะว่ากำลังเตรียมข้อมูล หรือส่งไปยังคิว
 */
export async function postPropertyToTikTokAction(propertyId: string) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. ดึงข้อมูลทรัพย์
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    }

    // 2. ตรวจสอบการเชื่อมต่อ TikTok (Placeholder for Token Logic)
    // ในอนาคตจะต้องรัน Step: Exchange Code -> Access Token จาก TikTok

    // 3. จำลองการโพสต์ (หรือส่งเข้า Queue สำหรับ Video Processing)
    // สำหรับตอนนี้เราจะบันทึกสถานะว่า โพสต์แล้ว (Mocking success)

    await supabase
      .from("properties")
      .update({ posted_to_tiktok_at: new Date().toISOString() })
      .eq("id", propertyId);

    revalidatePath("/(protected)/protected/properties", "page");

    return {
      success: true,
      message: "เตรียมโพสต์ลง TikTok เรียบร้อย (Video กำลังประมวลผล)",
    };
  } catch (err) {
    console.error("postPropertyToTikTokAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการโพสต์ลง TikTok" };
  }
}
