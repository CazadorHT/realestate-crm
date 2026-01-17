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
 * Bulk delete FAQs
 */
export async function bulkDeleteFaqsAction(
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
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.bulk_delete",
        entity: "faqs",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/faqs");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบคำถามที่พบบ่อยสำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeleteFaqsAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
