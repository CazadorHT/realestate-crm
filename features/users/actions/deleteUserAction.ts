"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export type DeleteUserResult = {
  success: boolean;
  message?: string;
};

/**
 * ลบบัญชีผู้ใช้ (เฉพาะ AGENT เท่านั้น)
 */
export async function deleteUserAction(
  userId: string
): Promise<DeleteUserResult> {
  try {
    const ctx = await requireAuthContext();

    // 1) Check Admin Role
    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // 2) Prevent self-delete
    if (userId === ctx.user.id) {
      return { success: false, message: "ไม่สามารถลบบัญชีของตัวเองได้" };
    }

    // 3) Check target user role (Optional: prevent deleting other admins if business rule requires)
    const { data: targetUser } = await ctx.supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetUser?.role === "ADMIN") {
      return { success: false, message: "ไม่สามารถลบบัญชี ADMIN ได้" };
    }

    // 4) Delete user (profile)
    const { error } = await ctx.supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Delete user error:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการลบผู้ใช้" };
    }

    await logAudit(ctx, {
      action: "user.delete",
      entity: "profiles",
      entityId: userId,
      metadata: {},
    });

    revalidatePath("/protected/settings/users");
    return { success: true };
  } catch (err) {
    return { success: false, message: "Unauthorized" };
  }
}
