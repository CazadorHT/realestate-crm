"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    // กรองทรัพย์ที่ติดดีลสำคัญ (Signed/Closed) หรือสถานะห้ามลบ
    const { data: propertiesStatus } = await supabase
      .from("properties")
      .select("id, status")
      .in("id", ids);

    // ตรวจสอบดีลที่ค้างอยู่ (ถ้ามี)
    const { data: activeDeals } = await supabase
      .from("deals")
      .select("property_id")
      .in("property_id", ids)
      .in("status", ["SIGNED", "CLOSED_WIN"]);

    const blockedIds = new Set<string>();
    propertiesStatus?.forEach((p) => {
      if (p.status === "SOLD" || p.status === "RENTED") blockedIds.add(p.id);
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

    // Soft Delete: อัปเดต deleted_at
    const { error, count } = await supabase
      .from("properties")
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in("id", safeIds);

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

    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");

    const skipped = blockedIds.size;
    const msg = skipped > 0 
      ? `ย้ายลงถังขยะสำเร็จ ${count} รายการ (ข้าม ${skipped} รายการที่ติดสถานะห้ามลบ)`
      : `ย้ายทรัพย์ลงถังขยะสำเร็จ ${count} รายการ`;

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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    const { error, count } = await supabase
      .from("properties")
      .update({ 
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .in("id", ids);

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

    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");

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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    // หมายเหตุ: หากฐานข้อมูลมี ON DELETE CASCADE จะลบข้อมูลเกี่ยวเนื่องโดยอัตโนมัติ
    // หากไม่มี เราควรไล่ลบแมนนวลเพื่อความสะอาดของข้อมูล (รูปภาพ/ฟีเจอร์)
    
    // ลบรูปภาพที่ผูกไว้ (ถ้ามี)
    await supabase.from("property_images").delete().in("property_id", ids);
    // ลบฟีเจอร์ที่ผูกไว้
    await supabase.from("property_features").delete().in("property_id", ids);
    // ลบผู้ดูแล
    await supabase.from("property_agents").delete().in("property_id", ids);

    // ลบตัวหลัก
    const { error, count } = await supabase
      .from("properties")
      .delete()
      .in("id", ids);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_hard_delete",
        entity: "properties",
        entityId: ids.join(","),
        metadata: { count },
      }
    );

    revalidatePath("/protected/properties/trash");

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

    revalidatePath("/protected/properties");

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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return { success: false, count: 0, message: "ไม่มีรายการที่เลือก" };
    }

    const { error, count } = await supabase
      .from("properties")
      .update({ 
        requires_ai_review: false,
        ai_reviewed_at: new Date().toISOString(),
        ai_reviewed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .in("id", ids);

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

    revalidatePath("/protected/properties");

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
