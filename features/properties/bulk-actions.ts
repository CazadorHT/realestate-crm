"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff, isAdmin } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath, revalidateTag } from "next/cache";
import { PROPERTY_IMAGES_BUCKET } from "./logic/images";
import { mapDbError } from "@/lib/db-error";

/**
 * Result type for bulk operations
 */
export type BulkActionResult = {
  success: boolean;
  count: number;
  message?: string;
};

/**
 * 1. Bulk Delete (Soft Delete) - ย้ายลงถังขยะ
 * หมายเหตุ: เราเปลี่ยนจากการลบทิ้งทันที มาเป็น Soft Delete เพื่อความปลอดภัย
 * และเพื่อให้สอดคล้องกับหน้า /protected/properties/trash
 */
export async function bulkDeletePropertiesAction(
  ids: string[]
): Promise<BulkActionResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    // กรองทรัพย์ที่ติดดีลสำคัญ (Signed/Closed) หรือสถานะห้ามลบ
    let statusQuery = supabase
      .from("properties")
      .select("id, status")
      .in("id", ids);
      
    if (role !== "ADMIN" && tenantId) {
      statusQuery = statusQuery.eq("tenant_id", tenantId);
    }
    const { data: propertiesStatus } = await statusQuery;

    // ตรวจสอบดีลที่ค้างอยู่
    let dealsQuery = supabase
      .from("deals")
      .select("property_id")
      .in("property_id", ids)
      .in("status", ["SIGNED", "CLOSED_WIN"]);
      
    if (role !== "ADMIN" && tenantId) {
      dealsQuery = dealsQuery.eq("tenant_id", tenantId);
    }
    const { data: activeDeals } = await dealsQuery;

    const blockedIds = new Set<string>();
    propertiesStatus?.forEach((p) => {
      if ((p.status === "SOLD" || p.status === "RENTED") && p.id) blockedIds.add(p.id);
    });
    activeDeals?.forEach((d) => {
      if (d.property_id) blockedIds.add(d.property_id);
    });

    const safeIds = ids.filter((id) => !blockedIds.has(id));

    if (safeIds.length === 0) {
      return {
        success: false,
        count: 0,
        message: "รายการที่เลือกทั้งหมดมีสถานะ ขายแล้ว/เช่าแล้ว หรือมีดีลที่ปิดแล้ว ไม่สามารถลบได้",
      };
    }

    // 🛡️ [PHASE 1] Use Security Definer RPC for atomic bulk trash
    const { error, count } = await supabase.rpc("bulk_trash_properties", {
      p_ids: safeIds
    });

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_trash",
        entity: "properties",
        entityId: safeIds.join(","),
        metadata: { count, skipped: blockedIds.size },
      }
    );

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");

    const skipped = blockedIds.size;
    const msg = skipped > 0 
      ? `ย้ายลงถังขยะสำเร็จ ${count} รายการ (ข้าม ${skipped} รายการที่ติดสถานะห้ามลบ)`
      : `ย้ายทรัพย์ลงถังขยะสำเร็จ ${count} รายการ`;

    // 🔔 Notify Admins about bulk trash (if more than 5 items)
    if (count && count > 5) {
      try {
        const { notifyAdminsAction } = await import("@/lib/actions/notifications");
        await notifyAdminsAction({
          type: "WARNING",
          title: "มีการลบทรัพย์สินจำนวนมาก ⚠️",
          message: `ผู้ใช้ ${user.id} ได้ย้ายทรัพย์สินลงถังขยะจำนวน ${count} รายการ`,
          link: "/protected/properties/trash",
        });
      } catch (notifyErr) {
        console.error("Failed to notify admins of bulk trash:", notifyErr);
      }
    }

    return { success: true, count: count ?? safeIds.length, message: msg };
  } catch (error) {
    console.error("bulkDelete error:", error);
    return { success: false, count: 0, message: mapDbError(error) };
  }
}

/**
 * 2. Bulk Restore - กู้คืนทรัพย์จากถังขยะ
 */
export async function bulkRestorePropertiesAction(
  ids: string[]
): Promise<BulkActionResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    let query = supabase
      .from("properties")
      .update({ 
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .in("id", ids);
      
    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error, count } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_restore",
        entity: "properties",
        entityId: ids.join(","),
        metadata: { count },
      }
    );

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");

    return { success: true, count: count ?? ids.length, message: `กู้คืนทรัพย์สำเร็จ ${count} รายการ` };
  } catch (error) {
    console.error("bulkRestore error:", error);
    return { success: false, count: 0, message: mapDbError(error) };
  }
}

/**
 * 3. Bulk Permanent Delete - ลบถาวร (ลบจริงจาก DB)
 */
export async function bulkPermanentDeletePropertiesAction(
  ids: string[]
): Promise<BulkActionResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    // 🛡️ Security: Filter only properties belonging to this tenant before cascading
    let verifyQuery = supabase
      .from("properties")
      .select("id")
      .in("id", ids);
      
    if (role !== "ADMIN" && tenantId) {
      verifyQuery = verifyQuery.eq("tenant_id", tenantId);
    }
    const { data: verifiedProps } = await verifyQuery;
    
    if (!verifiedProps || verifiedProps.length === 0) {
      return { success: true, count: 0, message: "ไม่มีรายการที่สามารถลบได้" };
    }

    const targetIds = verifiedProps.map(p => p.id).filter((id): id is string => !!id);

    // 🛡️ Guard: Check for blocking dependencies (Deals or Restricted Status)
    const { data: statusCheck } = await supabase
      .from("properties")
      .select("id, status")
      .in("id", targetIds);

    const { data: dealsCheck } = await supabase
      .from("deals")
      .select("property_id")
      .in("property_id", targetIds)
      .in("status", ["SIGNED", "CLOSED_WIN"]);

    const blockedIds = new Set<string>();
    statusCheck?.forEach(p => {
      if ((p.status === "SOLD" || p.status === "RENTED") && p.id) blockedIds.add(p.id);
    });
    dealsCheck?.forEach(d => {
      if (d.property_id) blockedIds.add(d.property_id);
    });

    const safeIds = targetIds.filter(id => !blockedIds.has(id));

    if (safeIds.length === 0) {
      return { success: false, count: 0, message: "รายการที่เลือกทั้งหมดไม่สามารถลบถาวรได้เนื่องจากมีดีลสำคัญหรือสถานะห้ามลบ" };
    }

    // 📦 3.1 Fetch storage paths before deleting IDs
    const { data: imageRows } = await supabase
      .from("property_images")
      .select("storage_path")
      .in("property_id", safeIds);

    const storagePaths = (imageRows || [])
      .map(img => img.storage_path)
      .filter((p): p is string => !!p);

    // 🛡️ [PHASE 1] Use Security Definer RPC for atomic bulk hard delete
    // This handles deleting junctions (images, features, etc.) and main records in one transaction.
    const { error, count } = await supabase.rpc("bulk_hard_delete_properties", {
      p_ids: safeIds
    });

    if (error) throw error;

    // 3.4 🛡️ [ZERO-ADMIN] Cleanup Storage in background
    if (storagePaths.length > 0) {
      const { inngest } = await import("@/lib/inngest/client");
      await inngest.send({
        name: "storage.cleanup.requested",
        data: {
          bucket: PROPERTY_IMAGES_BUCKET,
          paths: storagePaths
        }
      }).catch(e => console.warn("Inngest storage cleanup skip:", e.message));
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_hard_delete",
        entity: "properties",
        entityId: safeIds.join(","),
        metadata: { count, skipped: blockedIds.size },
      }
    );

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");

    // 🔔 Notify Admins about bulk permanent delete
    try {
      const { notifyAdminsAction } = await import("@/lib/actions/notifications");
      await notifyAdminsAction({
        type: "WARNING",
        title: "มีการลบทรัพย์สินถาวร! 🚨",
        message: `มีการลบข้อมูลทรัพย์สินออกจากฐานข้อมูลถาวรจำนวน ${count} รายการ โดยผู้ใช้ ${user.id}`,
        link: "/protected/properties",
      });
    } catch (notifyErr) {
      console.error("Failed to notify admins of permanent delete:", notifyErr);
    }

    return { success: true, count: count ?? ids.length, message: `ลบข้อมูลถาวรสำเร็จ ${count} รายการ` };
  } catch (error) {
    console.error("bulkPermanentDelete error:", error);
    return { success: false, count: 0, message: mapDbError(error) };
  }
}

/**
 * 4. Bulk Move - ดึงทรัพย์มาสาขาตัวเอง
 */
export async function bulkMovePropertiesToTenantAction(
  ids: string[]
): Promise<BulkActionResult> {
  try {
    const { supabase, role, tenantId, user } = await requireAuthContext();
    assertStaff(role);

    if (!tenantId || tenantId === "ALL") {
      return { success: false, count: 0, message: "ไม่พบข้อมูลสาขาที่ถูกต้อง" };
    }

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    const { error, count } = await supabase
      .from("properties")
      .update({
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .is("tenant_id", null); // ป้องกันการดึงทรัพย์ที่มีเจ้าของสาขาอยู่แล้ว

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_move",
        entity: "properties",
        entityId: ids.join(","),
        metadata: { count, targetTenantId: tenantId },
      },
    );

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");

    return { success: true, count: count ?? 0, message: `ดึงข้อมูลมายังสาขาของคุณสำเร็จ ${count} รายการ` };
  } catch (error) {
    console.error("bulkMove error:", error);
    return { success: false, count: 0, message: mapDbError(error) };
  }
}

/**
 * 5. Fetch all property IDs (for global selection)
 */
export async function getAllPropertyIdsAction(args: {
  q?: string;
  status?: string;
  type?: string;
  listing?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  province?: string;
  district?: string;
  popular_area?: string;
  nearTransit?: string;
  petFriendly?: string;
  fullyFurnished?: string;
  allBranches?: string;
}) {
  try {
    const { getAllPropertyIdsQuery } = await import("./queries");
    const ids = await getAllPropertyIdsQuery(args);
    return { success: true, ids };
  } catch (error) {
    return { success: false, ids: [], message: "ไม่สามารถดึงข้อมูลรายการทั้งหมดได้" };
  }
}
/**
 * 6. Bulk Approve AI Review - ยืนยันข้อมูล AI ทั้งหมด
 */
export async function bulkApproveAiReviewAction(
  ids: string[]
): Promise<BulkActionResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    let query = supabase
      .from("properties")
      .update({ 
        requires_ai_review: false,
        ai_reviewed_at: new Date().toISOString(),
        ai_reviewed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .in("id", ids);
      
    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error, count } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_ai_approve",
        entity: "properties",
        entityId: ids.join(","),
        metadata: { count },
      }
    );

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");

    return { 
      success: true, 
      count: count ?? ids.length, 
      message: `ยืนยันข้อมูล AI สำเร็จ ${count} รายการ` 
    };
  } catch (error) {
    console.error("bulkApproveAiReview error:", error);
    return { success: false, count: 0, message: mapDbError(error) };
  }
}

/**
 * 7. Bulk Update Status - เปลี่ยนสถานะทรัพย์พร้อมกันหลายรายการ
 */
export async function bulkUpdateStatusAction(
  ids: string[],
  status: string
): Promise<BulkActionResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    // กรองทรัพย์ที่เจ้าของสาขามีสิทธิ์จัดการ
    let query = supabase
      .from("properties")
      .update({ 
        status: status as any,
        updated_at: new Date().toISOString()
      })
      .in("id", ids);
      
    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error, count } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_update_status",
        entity: "properties",
        entityId: ids.join(","),
        metadata: { count, newStatus: status },
      }
    );

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");

    return { 
      success: true, 
      count: count ?? ids.length, 
      message: `อัปเดตสถานะเป็น ${status} สำเร็จ ${count} รายการ` 
    };
  } catch (error) {
    console.error("bulkUpdateStatus error:", error);
    return { success: false, count: 0, message: mapDbError(error) };
  }
}
