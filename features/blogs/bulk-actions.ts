"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete blog posts
 */
export async function bulkDeleteBlogsAction(
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

    // Use admin client for deletion (may have RLS)
    const adminClient = createAdminClient();

    const { error, count } = await adminClient
      .from("blog_posts")
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "blog.bulk_delete",
        entity: "blog_posts",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    revalidatePath("/protected/blogs");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบบทความสำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeleteBlogsAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
