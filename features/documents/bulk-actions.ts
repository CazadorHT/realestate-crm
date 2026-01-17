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
 * Bulk delete documents
 */
export async function bulkDeleteDocumentsAction(
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

    // Get storage paths to delete files
    const { data: docs } = await supabase
      .from("documents")
      .select("storage_path")
      .in("id", ids);

    // Delete from storage
    if (docs && docs.length > 0) {
      const pathsToRemove = docs
        .map((d) => d.storage_path)
        .filter((path): path is string => !!path);

      if (pathsToRemove.length > 0) {
        await supabase.storage.from("documents").remove(pathsToRemove);
      }
    }

    const { error, count } = await supabase
      .from("documents")
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) throw error;

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
  } catch (error) {
    console.error("bulkDeleteDocumentsAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
