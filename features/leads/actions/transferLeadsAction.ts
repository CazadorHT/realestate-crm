"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

/**
 * โอนย้าย Leads ไปให้ Agent คนใหม่
 */
export async function transferLeadsAction(
  leadIds: string[],
  targetAgentId: string,
) {
  try {
    const ctx = await requireAuthContext();

    // 1) ต้องเป็น Admin หรือ Manager เท่านั้นที่โอนย้ายได้
    if (ctx.role !== "ADMIN" && ctx.role !== "MANAGER") {
      return { success: false, message: "ไม่มีสิทธิ์ในการโอนย้ายข้อมูล" };
    }

    if (leadIds.length === 0) {
      return { success: false, message: "กรุณาเลือก Lead อย่างน้อย 1 รายการ" };
    }

    // 1.5) ตรวจสอบว่าผู้รับงานมีตัวตนและมีบทบาทที่ถูกต้อง
    const { data: targetAgent } = await ctx.supabase
      .from("profiles")
      .select("role")
      .eq("id", targetAgentId)
      .single();

    if (
      !targetAgent ||
      !["ADMIN", "MANAGER", "AGENT"].includes(targetAgent.role)
    ) {
      return { success: false, message: "ผู้รับงานปลายทางไม่ถูกต้อง" };
    }

    // 2) อัปเดตข้อมูล
    const { error } = await ctx.supabase
      .from("leads")
      .update({ created_by: targetAgentId })
      .in("id", leadIds);

    if (error) {
      console.error("Transfer leads error:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการโอนย้าย" };
    }

    // 3) บันทึก Audit Log (อาจจะบันทึกแบบรวมหรือแยก ขึ้นอยู่กับความละเอียดที่ต้องการ)
    await logAudit(ctx, {
      action: "lead.update",
      entity: "leads",
      entityId: leadIds[0], // บันทึก ID แรกเป็นตัวแทน หรือวนลูปถ้าต้องการละเอียด
      metadata: {
        bulkTransfer: true,
        count: leadIds.length,
        targetAgentId,
        leadIds,
      },
    });

    revalidatePath("/protected/leads");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Unauthorized" };
  }
}
