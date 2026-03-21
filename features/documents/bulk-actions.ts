"use server";

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
 * Bulk delete documents
 */
export async function bulkDeleteDocumentsAction(
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

    // Get storage paths and verify branch
    let query = supabase
      .from("documents")
      .select("storage_path, tenant_id")
      .in("id", ids);
    
    // Safety check for branch
    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: docs, error: fetchErr } = await query;
    if (fetchErr) throw new Error(mapDbError(fetchErr));

    if (!docs || docs.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่พบไฟล์ที่เลือก หรือไฟล์ไม่ได้อยู่ในสาขาของคุณ",
      };
    }

    // Delete from storage
    const pathsToRemove = docs
      .map((d) => d.storage_path)
      .filter((path): path is string => !!path);

    if (pathsToRemove.length > 0) {
      const { error: storageErr } = await supabase.storage.from("documents").remove(pathsToRemove);
      if (storageErr) console.error("Bulk Storage Delete Error:", storageErr);
    }

    // Delete from DB (filter by tenantId for safety)
    let deleteQuery = supabase.from("documents").delete({ count: "exact" }).in("id", ids);
    if (tenantId && tenantId !== "ALL") {
      deleteQuery = deleteQuery.eq("tenant_id", tenantId);
    }

    const { error, count } = await deleteQuery;

    if (error) throw new Error(mapDbError(error));

    await logAudit(
      { supabase, user, role },
      {
        action: "document.bulk_delete",
        entity: "documents",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/documents");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบเอกสารสำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error: any) {
    console.error("bulkDeleteDocumentsAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบ",
    };
  }
}
