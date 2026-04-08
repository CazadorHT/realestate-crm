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
 * Bulk delete FAQs
 */
export async function bulkMoveToTrashAction(
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
      .from("faqs")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.bulk_trash",
        entity: "faqs",
        entityId: ids.join(","),
        metadata: { trashedCount: count },
      }
    );

    revalidatePath("/protected/faqs");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ย้ายลงถังขยะสำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error: unknown) {
    console.error("bulkMoveToTrashAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(error),
    };
  }
}

export async function emptyFaqTrashAction(): Promise<BulkDeleteResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    // Permanent delete all where deleted_at is not null
    const { error, count } = await supabase
      .from("faqs")
      .delete({ count: "exact" })
      .not("deleted_at", "is", null);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.empty_trash",
        entity: "faqs",
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/faqs");

    return {
      success: true,
      deletedCount: count ?? 0,
      message: `ล้างถังขยะสำเร็จทั้งหมด ${count ?? 0} รายการ`,
    };
  } catch (error: unknown) {
    console.error("emptyFaqTrashAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(error),
    };
  }
}
