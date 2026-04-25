"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { inngest } from "@/lib/inngest/client";
import { mapDbError } from "@/lib/db-error";

export type DeleteUserResult = {
  success: boolean;
  message?: string;
};

/**
 * ลบบัญชีผู้ใช้ (Zero-Admin Pattern: Background Deletion)
 */
export async function deleteUserAction(
  userId: string,
): Promise<DeleteUserResult> {
  try {
    const ctx = await requireAuthContext();

    // 1) Check Admin Role (Authorize the request)
    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // 2) Prevent self-delete
    if (userId === ctx.user.id) {
      return { success: false, message: "ไม่สามารถลบบัญชีของตัวเองได้" };
    }

    // 1. Double check the user exists before deletion
    const targetUser = await ctx.supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", userId)
      .single()
      .then(res => res.data);

    if (!targetUser) {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้" };
    }

    if (targetUser.role === "ADMIN") {
      return { success: false, message: "ไม่สามารถลบบัญชี ADMIN ได้" };
    }

    // 4) 🛡️ [ZERO-ADMIN] Dispatch background deletion event
    // Instead of using adminClient here, we send a request to Inngest.
    try {
      await inngest.send({
        name: "user.delete.requested",
        data: {
          userId,
          adminId: ctx.user.id,
          reason: "Admin manual deletion via Dashboard"
        }
      });
    } catch (inngestErr) {
      console.error("Failed to send deletion event:", inngestErr);
      return { success: false, message: "ระบบแจ้งลบล้มเหลว กรุณาลองใหม่ภายหลัง" };
    }

    // 5) Audit Log
    await logAudit(ctx, {
      action: "user.delete.requested",
      entity: "profiles",
      entityId: userId,
      metadata: {
        email: targetUser.email,
        name: targetUser.full_name
      },
    });

    revalidatePath("/protected/settings/users");
    return { 
        success: true, 
        message: "ระบบกำลังดำเนินการลบผู้ใช้ในเบื้องหลัง ข้อมูลจะหายไปในครู่เดียว" 
    };
  } catch (err: any) {
    console.error("[deleteUserAction] Error:", err);
    return { success: false, message: err.message || "Unauthorized" };
  }
}
