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

/**
 * Bulk move owners to current tenant - ดึงเจ้าของทรัพย์มายังสาขาตัวเอง
 */
export async function bulkMoveOwnersToTenantAction(
  ids: string[],
): Promise<{ success: boolean; message: string }> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    if (!ctx.tenantId) {
      return { success: false, message: "ไม่พบข้อมูลสาขาของคุณ" };
    }

    if (!ids || ids.length === 0) {
      return { success: false, message: "ไม่มีรายการที่เลือก" };
    }

    // Only move owners that don't have a tenant_id yet
    const { data: updated, error } = await ctx.supabase
      .from("owners")
      .update({
        tenant_id: ctx.tenantId,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .is("tenant_id", null)
      .select();

    if (error) throw error;

    const count = updated?.length || 0;

    // Audit log
    await logAudit(ctx, {
      action: "owner.bulk_move",
      entity: "owners",
      entityId: ids.join(","),
      metadata: { movedCount: count, targetTenantId: ctx.tenantId },
    });

    revalidatePath("/protected/owners");

    return {
      success: true,
      message: `ดึงข้อมูลสำเร็จ ${count} รายการ`,
    };
  } catch (error) {
    console.error("bulkMoveOwnersToTenantAction error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * Fetch all owner IDs matching filters (for global selection)
 */
export async function getAllOwnerIdsAction(args: {
  q?: string;
  allBranches?: boolean;
}) {
  try {
    const { getAllOwnerIdsQuery } = await import("./queries");
    const ids = await getAllOwnerIdsQuery(args);
    return { success: true, ids };
  } catch (error) {
    return {
      success: false,
      ids: [],
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
