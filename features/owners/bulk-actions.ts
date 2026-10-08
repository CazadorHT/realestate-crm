"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { getSystemConfig } from "@/lib/actions/system-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { chunkArray } from "@/lib/utils";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete owners - ลบหลายเจ้าของทรัพย์พร้อมกัน (Enterprise Chunked & Safe Execution)
 */
export async function bulkDeleteOwnersAction(
  ids: string[]
): Promise<BulkDeleteResult> {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("language")?.value || "th";
    const isEn = lang === "en";

    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: isEn ? "No items selected" : "ไม่มีรายการที่เลือก",
      };
    }

    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;
    const isAdminUser = role === "ADMIN";

    // Non-admins must have a valid tenantId in multi-tenant mode
    if (!isAdminUser && isMultiTenant && !tenantId) {
      throw new Error("Tenant context required");
    }

    const CHUNK_SIZE = 100;
    const CONCURRENCY = 4;
    const idChunks = chunkArray(ids, CHUNK_SIZE);

    // 1. Find existing owners matching the IDs (chunked)
    let existingOwnerIds: string[] = [];
    for (let i = 0; i < idChunks.length; i += CONCURRENCY) {
      const activeBatches = idChunks.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        activeBatches.map(async (batch) => {
          let findQuery = supabase
            .from("identities_v3")
            .select("id")
            .eq("category", 2)
            .in("id", batch);

          if (isMultiTenant && !isAdminUser && tenantId) {
            findQuery = findQuery.eq("tenant_id", tenantId);
          }
          const { data, error } = await findQuery;
          if (error) throw error;
          return (data || []).map((o) => o.id);
        })
      );
      existingOwnerIds.push(...batchResults.flat());
    }

    if (existingOwnerIds.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: isEn ? "No matching owner records found" : "ไม่พบข้อมูลเจ้าของทรัพย์ที่ต้องการลบ",
      };
    }

    // 2. Guard: Check if any of these owners have associated properties (chunked)
    const targetChunks = chunkArray(existingOwnerIds, CHUNK_SIZE);
    const ownersWithProps = new Set<string>();

    for (let i = 0; i < targetChunks.length; i += CONCURRENCY) {
      const activeBatches = targetChunks.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        activeBatches.map(async (batch) => {
          const { data, error } = await supabase
            .from("properties_core")
            .select("owner_id")
            .in("owner_id", batch);
          if (error) throw error;
          return (data || []).map((p) => p.owner_id).filter(Boolean) as string[];
        })
      );
      batchResults.flat().forEach((ownerId) => ownersWithProps.add(ownerId));
    }

    const safeIds = existingOwnerIds.filter((id) => !ownersWithProps.has(id));
    const skippedCount = existingOwnerIds.length - safeIds.length;

    if (safeIds.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: isEn
          ? "Cannot delete selected owners because all have active property listings attached. Please reassign or delete the listings first."
          : "ไม่สามารถลบเจ้าของที่เลือกได้ เนื่องจากทุกท่านยังมีทรัพย์สินผูกพันอยู่ กรุณาลบหรือย้ายเจ้าของทรัพย์สินก่อนดำเนินการ",
      };
    }

    const adminClient = createAdminClient();
    const safeChunks = chunkArray(safeIds, CHUNK_SIZE);
    let totalDeleted = 0;

    // 3. Delete tenant memberships and delete owners (chunked with concurrency)
    for (let i = 0; i < safeChunks.length; i += CONCURRENCY) {
      const activeBatches = safeChunks.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        activeBatches.map(async (batch) => {
          // 3.1 Delete tenant memberships first
          const { error: memberDeleteError } = await adminClient
            .from("tenant_members_v3")
            .delete()
            .in("identity_id", batch);

          if (memberDeleteError) throw memberDeleteError;

          // 3.2 Delete owners
          let deleteQuery = adminClient
            .from("identities_v3")
            .delete({ count: "exact" })
            .eq("category", 2)
            .in("id", batch);

          if (isMultiTenant && !isAdminUser && tenantId) {
            deleteQuery = deleteQuery.eq("tenant_id", tenantId);
          }

          const { error, count } = await deleteQuery;
          if (error) throw error;
          return count ?? batch.length;
        })
      );
      totalDeleted += batchResults.reduce((acc, c) => acc + c, 0);
    }

    // Audit log
    await logAudit(
      { supabase, user, role },
      {
        action: "owner.bulk_delete",
        entity: "identities_v3",
        entityId: safeIds.slice(0, 50).join(",") + (safeIds.length > 50 ? `...(+${safeIds.length - 50} more)` : ""),
        metadata: { deletedCount: totalDeleted, skippedCount, totalBatches: safeChunks.length },
      }
    );

    revalidatePath("/protected/owners");

    const msg = isEn
      ? skippedCount > 0
        ? `Successfully deleted ${totalDeleted} owners (skipped ${skippedCount} with active listings)`
        : `Successfully deleted ${totalDeleted} owners`
      : skippedCount > 0
        ? `ลบเจ้าของทรัพย์สำเร็จ ${totalDeleted} รายการ (ข้าม ${skippedCount} รายการที่มีทรัพย์ผูกพันอยู่)`
        : `ลบเจ้าของทรัพย์สำเร็จ ${totalDeleted} รายการ`;

    return {
      success: true,
      deletedCount: totalDeleted,
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
 * Bulk move owners to current tenant - ดึงเจ้าของทรัพย์มายังสาขาตัวเอง (Chunked)
 */
export async function bulkMoveOwnersToTenantAction(
  ids: string[],
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("language")?.value || "th";
    const isEn = lang === "en";

    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    if (!ctx.tenantId) {
      return { success: false, message: isEn ? "Branch information not found" : "ไม่พบข้อมูลสาขาของคุณ" };
    }

    if (!ids || ids.length === 0) {
      return { success: false, message: isEn ? "No items selected" : "ไม่มีรายการที่เลือก" };
    }

    const CHUNK_SIZE = 100;
    const CONCURRENCY = 4;
    const chunks = chunkArray(ids, CHUNK_SIZE);
    let totalMoved = 0;

    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const activeBatches = chunks.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        activeBatches.map(async (batch) => {
          const { data: updated, error } = await ctx.supabase
            .from("identities_v3")
            .update({
              tenant_id: ctx.tenantId,
              updated_at: new Date().toISOString(),
            })
            .eq("category", 2)
            .in("id", batch)
            .is("tenant_id", null)
            .select("id");

          if (error) throw error;
          return updated?.length || 0;
        })
      );
      totalMoved += results.reduce((acc, c) => acc + c, 0);
    }

    // Audit log
    await logAudit(ctx, {
      action: "owner.bulk_move",
      entity: "identities_v3",
      entityId: ids.slice(0, 50).join(",") + (ids.length > 50 ? `...(+${ids.length - 50} more)` : ""),
      metadata: { movedCount: totalMoved, targetTenantId: ctx.tenantId, totalBatches: chunks.length },
    });

    revalidatePath("/protected/owners");

    return {
      success: true,
      message: isEn ? `Successfully pulled ${totalMoved} owners to your branch` : `ดึงข้อมูลสำเร็จ ${totalMoved} รายการ`,
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
