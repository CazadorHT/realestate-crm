"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DeleteUserResult = {
  success: boolean;
  message?: string;
};

/**
 * ลบบัญชีผู้ใช้ (เฉพาะ AGENT เท่านั้น)
 * TODO: ตรวจสอบให้แน่ใจว่าเฉพาะ ADMIN เท่านั้นที่เรียก action นี้ได้
 */
export async function deleteUserAction(userId: string): Promise<DeleteUserResult> {
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

  // ป้องกันการลบตัวเอง
  if (userId === user.id) {
    return { success: false, message: "ไม่สามารถลบบัญชีของตัวเองได้" };
  }

  // ตรวจสอบว่าผู้ใช้ที่จะลบเป็น AGENT หรือไม่
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetUser?.role === "ADMIN") {
    return { success: false, message: "ไม่สามารถลบบัญชี ADMIN ได้" };
  }

  // ลบผู้ใช้
  // หมายเหตุ RLS: ต้องมี policy อนุญาต ADMIN ลบ profiles ของ AGENT
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    console.error("Delete user error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบผู้ใช้" };
  }

  revalidatePath("/protected/settings/users");
  return { success: true };
}
