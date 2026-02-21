"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

/**
 * อัปเดตทีมของผู้ใช้
 */
export async function updateUserTeamAction(
  userId: string,
  teamId: string | null,
) {
  try {
    const ctx = await requireAuthContext();

    // 1) ต้องเป็น Admin เท่านั้นที่เปลี่ยนทีมได้
    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // 1.5) ตรวจสอบว่าทีมมีอยู่จริง (ถ้ามีการระบุ)
    if (teamId) {
      const { data: team } = await ctx.supabase
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .maybeSingle();

      if (!team) return { success: false, message: "ไม่พบทีมที่ระบุ" };
    }

    // 2) อัปเดตข้อมูล
    const { error } = await ctx.supabase
      .from("profiles")
      .update({ team_id: teamId })
      .eq("id", userId);

    if (error) {
      console.error("Update team error:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตทีม" };
    }

    await logAudit(ctx, {
      action: "profile.update", // ใช้ profile.update แทนเพื่อความเรียบง่าย หรือจะเพิ่ม action ใหม่ก็ได้
      entity: "profiles",
      entityId: userId,
      metadata: { teamId },
    });

    revalidatePath("/protected/settings");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Unauthorized" };
  }
}
