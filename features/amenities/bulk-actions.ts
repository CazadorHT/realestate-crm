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
 * Bulk delete features/amenities from V3 system_settings_v3
 */
export async function bulkDeleteFeaturesAction(
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

    let deleteQuery = supabase
      .from("system_settings_v3")
      .delete({ count: "exact" })
      .eq("category", "features_list")
      .in("id", ids);

    if (tenantId) {
      deleteQuery = deleteQuery.eq("tenant_id", tenantId);
    }

    const { error, count } = await deleteQuery;

    if (error) throw error;

    await logAudit(
      { supabase, user, role, tenantId },
      {
        action: "feature.bulk_delete",
        entity: "system_settings_v3",
        entityId: ids.join(","),
        metadata: { deletedCount: count, category: "features_list" },
      }
    );

    revalidatePath("/protected/features");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบสิ่งอำนวยความสะดวกสำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeleteFeaturesAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
