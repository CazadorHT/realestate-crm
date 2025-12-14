"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateUserRoleResult = {
  success: boolean;
  message?: string;
};

/**
 * อัปเดตบทบาทของผู้ใช้ (ADMIN <-> AGENT)
 * TODO: ตรวจสอบให้แน่ใจว่าเฉพาะ ADMIN เท่านั้นที่เรียก action นี้ได้
 */
export async function updateUserRoleAction(
  userId: string,
  newRole: "ADMIN" | "AGENT"
): Promise<UpdateUserRoleResult> {
  const supabase = await createClient();

  // ตรวจสอบว่าผู้ใช้ที่เรียกใช้เป็น ADMIN หรือไม่
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, message: "ไม่พบข้อมูลผู้ใช้" };
  }

  // ดึงข้อมูลโปรไฟล์เพื่อเช็ค role
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentUserProfile?.role !== "ADMIN") {
    return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
  }

  // ป้องกันการเปลี่ยน role ของตัวเอง
  if (userId === user.id) {
    return { success: false, message: "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" };
  }

  // อัปเดต role
  // หมายเหตุ RLS: ต้องมี policy อนุญาต ADMIN จัดการ profiles ทั้งหมด
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Update role error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตบทบาท" };
  }

  revalidatePath("/protected/settings/users");
  return { success: true };
}
