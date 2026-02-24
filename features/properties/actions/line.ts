"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { sendLineNotification } from "@/lib/line";
import { revalidatePath } from "next/cache";

/**
 * แชร์ข้อมูลทรัพย์ไปยัง Line (Broadcast/Push)
 */
export async function postPropertyToLineAction(propertyId: string) {
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

    // 2. สร้างสารข้อความแชร์ (Simple version for now, could use Flex in future)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const publicUrl = `${baseUrl}/properties/${property.slug || property.id}`;

    const message = `🏠 ${property.title}\n💰 ราคา: ${property.price?.toLocaleString() || "-"}\n\nดูข้อมูลเพิ่มเติม: ${publicUrl}`;

    // 3. ส่ง Notification (Push to Admin/Staff as a broadcast test)
    // หมายเหตุ: ในระบบจริงอาจเป็นการ Broadcast ให้ลูกค้าทุกคน หรือส่งเข้ากลุ่ม
    await sendLineNotification(message);

    // 4. บันทึก Timestamp
    await supabase
      .from("properties")
      .update({ posted_to_line_at: new Date().toISOString() })
      .eq("id", propertyId);

    revalidatePath("/(protected)/protected/properties", "page");

    return { success: true, message: "แชร์ลง Line เรียบร้อย" };
  } catch (err) {
    console.error("postPropertyToLineAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการแชร์ลง Line" };
  }
}
