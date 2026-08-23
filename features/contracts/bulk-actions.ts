"use server";

import { cookies } from "next/headers";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete rental contracts
 */
export async function bulkDeleteRentalContractsAction(
  ids: string[]
): Promise<BulkDeleteResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant context required");
    assertStaff(role);

    const cookieStore = await cookies();
    const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
    const isEn = lang === "en";

    if (!ids || ids.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: isEn ? "No items selected" : "ไม่มีรายการที่เลือก",
      };
    }

    let deleteQuery = supabase
      .from("crm_deals_v3")
      .update({ status: "TERMINATED" }, { count: "exact" })
      .in("id", ids);

    if (tenantId && tenantId !== "ALL") {
      deleteQuery = deleteQuery.eq("tenant_id", tenantId);
    }

    const { error, count } = await deleteQuery;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "rental_contract.bulk_delete",
        entity: "crm_deals_v3",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/contracts");

    const delCount = count ?? ids.length;
    return {
      success: true,
      deletedCount: delCount,
      message: isEn ? `Successfully deleted ${delCount} contracts` : `ลบสัญญาเช่าสำเร็จ ${delCount} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeleteRentalContractsAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(error),
    };
  }
}

/**
 * Fetch all contract IDs matching filters (for global selection)
 */
export async function getAllContractIdsAction(args: {
  timeRange?: string;
}) {
  try {
    const { getAllContractIdsQuery } = await import("./queries");
    const ids = await getAllContractIdsQuery(args);
    return { success: true, ids };
  } catch (error) {
    return { success: false, ids: [], message: mapDbError(error) };
  }
}
