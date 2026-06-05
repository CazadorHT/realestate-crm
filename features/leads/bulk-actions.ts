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
      .from("crm_leads_v3")
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
 
    // 🔔 Notify Admins about bulk lead deletion
    if (count && count > 5) {
      try {
        const { notifyAdminsAction } = await import("@/lib/actions/notifications");
        await notifyAdminsAction({
          type: "WARNING",
          title: "มีการลบรายชื่อลูกค้าจำนวนมาก ⚠️",
          message: `ผู้ใช้ ${user.id} ได้ลบรายชื่อลูกค้า (Leads) ออกจากระบบจำนวน ${count} รายการ`,
          link: "/protected/leads",
        });
      } catch (notifyErr) {
        console.error("Failed to notify admins of bulk lead delete:", notifyErr);
      }
    }

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
  source?: string;
}) {
  try {
    const { getAllLeadIdsQuery } = await import("./queries");
    const ids = await getAllLeadIdsQuery(args);
    return { success: true, ids };
  } catch (error) {
    return { success: false, ids: [], message: mapDbError(error) };
  }
}
