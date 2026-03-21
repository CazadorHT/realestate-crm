"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount?: number;
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

    if (error) throw new Error(mapDbError(error));

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
    return authzFail(error);
  }
}

/**
 * Fetch all lead IDs matching filters (for global selection)
 */
export async function getAllLeadIdsAction(args: {
  q?: string;
  stage?: string;
}) {
  try {
    const { getAllLeadIdsQuery } = await import("./queries");
    const ids = await getAllLeadIdsQuery(args);
    return { success: true, ids };
  } catch (error) {
    return { success: false, ids: [], message: mapDbError(error) };
  }
}
