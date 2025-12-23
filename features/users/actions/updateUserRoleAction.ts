"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { type UserRole } from "@/lib/auth-shared";
import { logAudit } from "@/lib/audit";

export type UpdateUserRoleResult = {
  success: boolean;
  message?: string;
};

/**
 * อัปเดตบทบาทของผู้ใช้ (ADMIN <-> AGENT)
 */
export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole
): Promise<UpdateUserRoleResult> {
  try {
    const ctx = await requireAuthContext();

    // 1) Check Admin Role
    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // 2) Prevent self-role change
    if (userId === ctx.user.id) {
      return { success: false, message: "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" };
    }

    // 3) Update role
    const { error } = await ctx.supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Update role error:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตบทบาท" };
    }

    await logAudit(ctx, {
      action: "user.role.update",
      entity: "profiles",
      entityId: userId,
      metadata: { newRole },
    });

    revalidatePath("/protected/settings/users");
    return { success: true };
  } catch (err) {
    return { success: false, message: "Unauthorized" };
  }
}
