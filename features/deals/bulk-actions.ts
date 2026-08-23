"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { getScopedRevenueClient } from "./logic/scoped-client";
import { cookies } from "next/headers";

import { DealStatus, DealType } from "./types";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete deals - ลบหลายดีลพร้อมกัน
 */
export async function bulkDeleteDealsAction(
  ids: string[],
): Promise<BulkDeleteResult> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant context required");
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: isEn ? "No items selected" : "ไม่มีรายการที่เลือก",
      };
    }

    const scoped = getScopedRevenueClient(supabase, tenantId);

    // Atomic Bulk Delete with Stock Rollback via RPC
    const { data: count, error } = await scoped.rpc("bulk_delete_deals_atomic", {
      p_deal_ids: ids,
      p_tenant_id: tenantId,
    });

    if (error) throw error;

    // Audit log
    await logAudit(
      { supabase, user, role },
      {
        action: "deal.bulk_delete",
        entity: "deals",
        entityId: ids.join(","),
        summary: `ดำเนินการลบดีลแบบกลุ่มสำเร็จ จำนวน ${count ?? ids.length} รายการ พร้อมคืนสต็อกและสถานะอสังหาฯ อัตโนมัติ (Atomic Transaction)`,
        metadata: { deletedCount: count },
      },
    );

    revalidatePath("/protected/deals");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: isEn
        ? `Successfully deleted ${count ?? ids.length} deals and restored property status`
        : `ลบดีลสำเร็จ ${count ?? ids.length} รายการ และปรับปรุงสต็อก/สถานะคืนสำเร็จแบบ Atomic`,
    };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && (('name' in err && err.name === "AuthzError") || ('code' in err && err.code === "AUTHZ_ERROR"))) {
      return { success: false, deletedCount: 0, message: isEn ? "Unauthorized" : "ไม่ได้รับอนุญาต" };
    }
    console.error("bulkDeleteDealsAction error:", err);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(err),
    };
  }
}

/**
 * Fetch all deal IDs matching filters (for global selection)
 */
export async function getAllDealIdsAction(args: {
  timeRange?: string;
  q?: string;
  status?: DealStatus;
  property_id?: string;
  lead_id?: string;
  deal_type?: DealType;
  property_type?: string;
  listing_type?: string;
}) {
  try {
    const { getAllDealIdsQuery } = await import("./queries.getDeals");
    const ids = await getAllDealIdsQuery(args);
    return { success: true, ids };
  } catch (error) {
    return { success: false, ids: [], message: mapDbError(error) };
  }
}

