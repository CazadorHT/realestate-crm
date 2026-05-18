"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete partners
 */
export async function bulkDeletePartnersAction(
  ids: string[]
): Promise<BulkDeleteResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่มีรายการที่เลือก",
      };
    }

    let query = supabase
      .from("cms_content_v3")
      .delete({ count: "exact" })
      .in("id", ids)
      .eq("content_type", "PARTNER");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error, count } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "partner.bulk_delete",
        entity: "cms_content_v3",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/partners");
    revalidatePath("/admin/partners");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบพาร์ทเนอร์สำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeletePartnersAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
