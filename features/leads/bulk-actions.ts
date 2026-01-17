"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete leads - ลบหลายลีดพร้อมกัน
 */
export async function bulkDeleteLeadsAction(
  ids: string[]
): Promise<BulkDeleteResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่มีรายการที่เลือก",
      };
    }

    // Delete leads (cascade will handle related records)
    const { error, count } = await supabase
      .from("leads")
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) throw error;

    // Audit log
    await logAudit(
      { supabase, user, role },
      {
        action: "lead.bulk_delete",
        entity: "leads",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/leads");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบลีดสำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeleteLeadsAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
