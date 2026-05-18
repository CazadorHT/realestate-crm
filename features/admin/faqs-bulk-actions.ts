"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { redis } from "@/lib/redis";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

async function clearFaqCache() {
  if (!redis) return;
  try {
    const keys = await redis.keys("faqs:list:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (e) {
    console.warn("[Redis] Cache clear error:", e);
  }
}

/**
 * Bulk delete FAQs (Move to trash)
 */
export async function bulkMoveToTrashAction(
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

    let query = supabase
      .from("cms_content_v3")
      .update({ 
        status: "trash",
        updated_at: new Date().toISOString()
      })
      .eq("content_type", "FAQ")
      .in("id", ids);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error, count } = await query.select("id");

    if (error) throw error;

    const actualCount = count || ids.length;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.bulk_trash",
        entity: "cms_content_v3",
        entityId: ids.join(","),
        metadata: { trashedCount: actualCount },
      }
    );

    revalidatePath("/protected/faqs");
    revalidatePath("/admin/faqs");
    await clearFaqCache();

    return {
      success: true,
      deletedCount: actualCount,
      message: `ย้ายลงถังขยะสำเร็จ ${actualCount} รายการ`,
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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    let query = supabase
      .from("cms_content_v3")
      .delete()
      .eq("content_type", "FAQ")
      .eq("status", "trash");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error, count } = await query.select("id");

    if (error) throw error;

    const actualCount = count || 0;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.empty_trash",
        entity: "cms_content_v3",
        metadata: { deletedCount: actualCount },
      }
    );

    revalidatePath("/protected/faqs");
    revalidatePath("/admin/faqs");
    await clearFaqCache();

    return {
      success: true,
      deletedCount: actualCount,
      message: `ล้างถังขยะสำเร็จทั้งหมด ${actualCount} รายการ`,
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

/**
 * Permanently delete FAQs trashed more than 30 days ago
 */
export async function purgeOldTrashAction(): Promise<BulkDeleteResult> {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from("cms_content_v3")
      .delete()
      .eq("content_type", "FAQ")
      .eq("status", "trash")
      .lt("updated_at", thirtyDaysAgo.toISOString());

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error, count } = await query.select("id");

    if (error) throw error;

    const actualCount = count || 0;

    revalidatePath("/protected/faqs");
    revalidatePath("/admin/faqs");
    await clearFaqCache();

    return {
      success: true,
      deletedCount: actualCount,
      message: `ล้างข้อมูลเก่าสำเร็จทั้งหมด ${actualCount} รายการ`,
    };
  } catch (error: unknown) {
    console.error("purgeOldTrashAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: mapDbError(error),
    };
  }
}
