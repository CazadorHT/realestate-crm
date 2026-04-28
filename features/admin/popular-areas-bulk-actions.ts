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
 * Bulk delete popular areas
 */
export async function bulkDeletePopularAreasAction(
  ids?: string[],
  selectAll?: boolean,
  search?: string,
): Promise<BulkDeleteResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!selectAll && (!ids || ids.length === 0)) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่มีรายการที่เลือก",
      };
    }

    let query = supabase
      .from("popular_areas")
      .delete({ count: "exact" });

    if (selectAll) {
      // If selectAll is true, we apply the same filters as the list view
      if (search) {
        query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,name_cn.ilike.%${search}%,name_ru.ilike.%${search}%`);
      }
      // Note: We don't limit because we want to delete ALL matching items
    } else if (ids && ids.length > 0) {
      query = query.in("id", ids);
    }

    const { error, count } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "popular_area.bulk_delete",
        entity: "popular_areas",
        entityId: selectAll ? "all" : (ids?.join(",") || ""),
        metadata: { deletedCount: count, selectAll, search },
      },
    );

    revalidatePath("/protected/admin/popular-areas");

    const finalCount = count ?? 0;
    return {
      success: true,
      deletedCount: finalCount,
      message: `ลบทำเลยอดนิยมสำเร็จ ${finalCount} รายการ`,
    };
  } catch (error: unknown) {
    console.error("bulkDeletePopularAreasAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(error),
    };
  }
}
