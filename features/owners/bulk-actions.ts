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
 * Bulk delete owners - ลบหลายเจ้าของทรัพย์พร้อมกัน
 */
export async function bulkDeleteOwnersAction(
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

    // Delete owners (cascade will handle related records)
    const { error, count } = await supabase
      .from("owners")
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) throw error;

    // Audit log
    await logAudit(
      { supabase, user, role },
      {
        action: "owner.bulk_delete",
        entity: "owners",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/owners");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบเจ้าของทรัพย์สำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeleteOwnersAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
