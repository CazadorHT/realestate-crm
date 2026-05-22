"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { getSystemConfig } from "@/lib/actions/system-config";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่มีรายการที่เลือก",
      };
    }

    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;
    const isAdminUser = role === "ADMIN";

    // Non-admins must have a valid tenantId in multi-tenant mode
    if (!isAdminUser && isMultiTenant && !tenantId) {
      throw new Error("Tenant context required");
    }

    // Find existing owners matching the IDs (restricted to current tenant if non-admin)
    let findQuery = supabase
      .from("identities_v3")
      .select("id, tenant_id")
      .eq("category", 2)
      .in("id", ids);

    if (isMultiTenant && !isAdminUser && tenantId) {
      findQuery = findQuery.eq("tenant_id", tenantId);
    }

    const { data: existingOwners, error: findError } = await findQuery;
    if (findError) throw findError;

    if (!existingOwners || existingOwners.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่พบข้อมูลเจ้าของทรัพย์ที่ต้องการลบ",
      };
    }

    const targetIds = existingOwners.map((o) => o.id);

    // Guard: Check if any of these owners have associated properties
    const { data: propertiesWithOwners, error: propsError } = await supabase
      .from("properties_core")
      .select("owner_id")
      .in("owner_id", targetIds);

    if (propsError) throw propsError;

    const ownersWithProps = new Set(
      propertiesWithOwners?.map((p) => p.owner_id).filter(Boolean) as string[]
    );

    const safeIds = targetIds.filter((id) => !ownersWithProps.has(id));
    const skippedCount = targetIds.length - safeIds.length;

    if (safeIds.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่สามารถลบเจ้าของที่เลือกได้ เนื่องจากทุกท่านยังมีทรัพย์สินผูกพันอยู่ กรุณาลบหรือย้ายเจ้าของทรัพย์สินก่อนดำเนินการ",
      };
    }

    const adminClient = createAdminClient();

    // 1. Delete tenant memberships first to avoid foreign key violation
    const { error: memberDeleteError } = await adminClient
      .from("tenant_members_v3")
      .delete()
      .in("identity_id", safeIds);

    if (memberDeleteError) throw memberDeleteError;

    // 2. Delete owners
    let deleteQuery = adminClient
      .from("identities_v3")
      .delete({ count: "exact" })
      .eq("category", 2)
      .in("id", safeIds);

    if (isMultiTenant && !isAdminUser && tenantId) {
      deleteQuery = deleteQuery.eq("tenant_id", tenantId);
    }

    const { error, count } = await deleteQuery;
    if (error) throw error;

    // Audit log
    await logAudit(
      { supabase, user, role },
      {
        action: "owner.bulk_delete",
        entity: "identities_v3",
        entityId: safeIds.join(","),
        metadata: { deletedCount: count, skippedCount },
      }
    );

    revalidatePath("/protected/owners");

    const deletedCount = count ?? safeIds.length;
    const msg = skippedCount > 0
      ? `ลบเจ้าของทรัพย์สำเร็จ ${deletedCount} รายการ (ข้าม ${skippedCount} รายการที่มีทรัพย์ผูกพันอยู่)`
      : `ลบเจ้าของทรัพย์สำเร็จ ${deletedCount} รายการ`;

    return {
      success: true,
      deletedCount,
      message: msg,
    };
  } catch (error) {
    console.error("bulkDeleteOwnersAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(error),
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
      .from("identities_v3")
      .update({
        tenant_id: ctx.tenantId,
        updated_at: new Date().toISOString(),
      })
      .eq("category", 2)
      .in("id", ids)
      .is("tenant_id", null)
      .select("id");

    if (error) throw error;

    const count = updated?.length || 0;

    // Audit log
    await logAudit(ctx, {
      action: "owner.bulk_move",
      entity: "identities_v3",
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
      message: mapDbError(error),
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
      message: mapDbError(error),
    };
  }
}
