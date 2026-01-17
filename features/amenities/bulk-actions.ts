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
 * Bulk delete features/amenities
 */
export async function bulkDeleteFeaturesAction(
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

    const { error, count } = await supabase
      .from("features")
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "feature.bulk_delete",
        entity: "features",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
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
