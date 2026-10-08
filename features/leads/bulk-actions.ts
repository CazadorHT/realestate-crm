"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount?: number;
  message?: string;
};

/**
 * Helper to split an array into chunks of specified size
 */
export function chunkArray<T>(items: T[], size: number): T[][] {
  if (!items || items.length === 0 || size <= 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Bulk delete leads - ลบหลายลีดพร้อมกัน (Enterprise Chunked & Safe Execution)
 */
export async function bulkDeleteLeadsAction(
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

    // 🛡️ Enterprise Chunking: หั่นเป็น batch ละ 100 รายการ ป้องกัน PostgREST 414 URI Too Long
    const CHUNK_SIZE = 100;
    const CONCURRENCY = 4; // รัน 4 batches ขนานกัน ป้องกัน Serverless Timeout
    const chunks = chunkArray(ids, CHUNK_SIZE);

    let totalDeleted = 0;

    // ประมวลผลทีละระลอก (Wave of batches) เพื่อคุม Database connection pool
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const activeBatches = chunks.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        activeBatches.map(async (batch) => {
          const { error, count } = await supabase
            .from("crm_leads_v3")
            .delete({ count: "exact" })
            .in("id", batch);

          if (error) throw new Error(mapDbError(error));
          return count ?? batch.length;
        })
      );
      totalDeleted += results.reduce((acc, c) => acc + c, 0);
    }

    // Audit log
    await logAudit(
      { supabase, user, role },
      {
        action: "lead.bulk_delete",
        entity: "leads",
        entityId: ids.slice(0, 50).join(",") + (ids.length > 50 ? `...(+${ids.length - 50} more)` : ""),
        metadata: { deletedCount: totalDeleted, totalRequested: ids.length, totalBatches: chunks.length },
      }
    );

    revalidatePath("/protected/leads");
 
    // 🔔 Notify Admins about bulk lead deletion
    if (totalDeleted && totalDeleted > 5) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, display_name, role")
          .eq("id", user.id)
          .maybeSingle();

        const userName = profile?.full_name || profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "ไม่ระบุชื่อ";
        const userRole = profile?.role || role || "STAFF";

        const { notifyAdminsAction } = await import("@/lib/actions/notifications");
        await notifyAdminsAction({
          type: "WARNING",
          title: "มีการลบรายชื่อลูกค้าจำนวนมาก ⚠️",
          message: `ผู้ใช้ ${userName} (${userRole}) ได้ลบรายชื่อลูกค้า (Leads) ออกจากระบบจำนวน ${totalDeleted} รายการ`,
          link: "/protected/leads",
        });
      } catch (notifyErr) {
        console.error("Failed to notify admins of bulk lead delete:", notifyErr);
      }
    }

    return {
      success: true,
      deletedCount: totalDeleted,
      message: `ลบลีดสำเร็จ ${totalDeleted} รายการ`,
    };
  } catch (error) {
    return authzFail(error);
  }
}

/**
 * Fetch all lead IDs matching filters (for global selection)
 */
export async function getAllLeadIdsAction(args: {
  q?: string;
  stage?: string;
  source?: string;
}) {
  try {
    const { getAllLeadIdsQuery } = await import("./queries");
    const ids = await getAllLeadIdsQuery(args);
    return { success: true, ids };
  } catch (error) {
    return { success: false, ids: [], message: mapDbError(error) };
  }
}
