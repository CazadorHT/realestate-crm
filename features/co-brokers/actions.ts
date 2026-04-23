"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";
import { CoBrokerFormValues, CoBrokerSchema, CoBroker } from "./schema";
import { revalidatePath } from "next/cache";
import { logActivityAction } from "@/features/audit/actions";
import { logger } from "@/lib/logger";

// --- Types ---
export interface CoBrokerDocumentInput {
  co_broker_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

/**
 * 📊 ดึงรายการคู่ค้าทั้งหมด
 */
export async function getCoBrokersAction(query?: string, area?: string): Promise<{ success: boolean; data?: CoBroker[]; error?: string }> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let dbQuery = supabase
      .from("co_brokers")
      .select("*")
      .eq("tenant_id", tenantId!)
      .is("deleted_at", null);

    if (query) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query}%,company_name.ilike.%${query}%,phone.ilike.%${query}%`,
      );
    }

    if (area) {
      dbQuery = dbQuery.contains("specialized_areas", [area]);
    }

    const { data, error } = await dbQuery.order("name", { ascending: true });

    if (error) throw error;
    return { success: true, data: data as unknown as CoBroker[] };
  } catch (error: unknown) {
    logger.error("getCoBrokersAction failed", error, { source: "co-brokers-actions" });
    return {
      success: false,
      error: (error as Error).message || "ล้มเหลวในการดึงข้อมูลคู่ค้า",
    };
  }
}

/**
 * ➕ สร้างคู่ค้าใหม่
 */
export async function createCoBrokerAction(values: CoBrokerFormValues) {
  try {
    const { supabase, tenantId, user } = await requireAuthContext();
    const validated = CoBrokerSchema.parse(values);

    const { data, error } = await supabase
      .from("co_brokers")
      .insert({
        ...validated,
        tenant_id: tenantId!,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logActivityAction("CREATE", "CO_BROKER", data.id, {
      name: data.name,
    });
    revalidatePath("/protected/co-brokers");
    return { success: true, data };
  } catch (error: unknown) {
    logger.error("createCoBrokerAction failed", error, { source: "co-brokers-actions", values });
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถเพิ่มข้อมูลคู่ค้าได้",
    };
  }
}

/**
 * 📝 อัปเดตข้อมูลคู่ค้า
 */
export async function updateCoBrokerAction(
  id: string,
  values: Partial<CoBrokerFormValues>,
) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { data, error } = await supabase
      .from("co_brokers")
      .update(values)
      .eq("id", id)
      .eq("tenant_id", tenantId!)
      .select()
      .single();

    if (error) throw error;

    await logActivityAction("UPDATE", "CO_BROKER", id, {
      updated_fields: Object.keys(values),
    });
    revalidatePath("/protected/co-brokers");
    return { success: true, data };
  } catch (error: unknown) {
    logger.error("updateCoBrokerAction failed", error, { source: "co-brokers-actions", id, values });
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถอัปเดตข้อมูลได้",
    };
  }
}

/**
 * 🗑️ ย้ายลงถังขยะ (Soft Delete)
 */
export async function deleteCoBrokerAction(id: string) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { error } = await supabase
      .from("co_brokers")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", id)
      .eq("tenant_id", tenantId!);

    if (error) throw error;

    await logActivityAction("SOFT_DELETE", "CO_BROKER", id, { broker_id: id });
    revalidatePath("/protected/co-brokers");
    return { success: true };
  } catch (error: unknown) {
    logger.error("deleteCoBrokerAction failed", error, { source: "co-brokers-actions", id });
    return { success: false, error: (error as Error).message || "ไม่สามารถลบข้อมูลได้" };
  }
}

/**
 * ♻️ กู้คืนจากถังขยะ (Restore)
 */
export async function restoreCoBrokerAction(id: string) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { error } = await supabase
      .from("co_brokers")
      .update({ deleted_at: null, is_active: true })
      .eq("id", id)
      .eq("tenant_id", tenantId!);

    if (error) throw error;

    await logActivityAction("RESTORE", "CO_BROKER", id, { broker_id: id });
    revalidatePath("/protected/co-brokers");
    return { success: true };
  } catch (error: unknown) {
    logger.error("restoreCoBrokerAction failed", error, { source: "co-brokers-actions", id });
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถกู้คืนข้อมูลได้",
    };
  }
}

/**
 * 🗑️ ลบถาวร (Admin Only)
 */
export async function permanentlyDeleteCoBrokerAction(id: string) {
  try {
    const { supabase, tenantId, role } = await requireAuthContext();
    if (role !== "ADMIN") throw new Error("คุณไม่มีสิทธิ์ลบข้อมูลถาวร");

    const { error } = await supabase
      .from("co_brokers")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId!);

    if (error) throw error;

    await logActivityAction("PERMANENT_DELETE", "CO_BROKER", id, {
      broker_id: id,
    });
    revalidatePath("/protected/co-brokers");
    return { success: true };
  } catch (error: unknown) {
    logger.error("permanentlyDeleteCoBrokerAction failed", error, { source: "co-brokers-actions", id });
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถลบข้อมูลถาวรได้",
    };
  }
}

/**
 * 📋 ดึงข้อมูล Performance & Stats (SQL-side Optimization)
 */
export async function getCoBrokerPerformanceAction(id: string) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    // 🌐 Performance Optimization: Execute all count queries concurrently
    const [totalRes, activeRes, soldRes, commRes] = await Promise.all([
      // 1. Get total listings count
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("co_broker_id", id)
        .eq("tenant_id", tenantId!),

      // 2. Get active listings count
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("co_broker_id", id)
        .eq("status", "ACTIVE")
        .eq("tenant_id", tenantId!),

      // 3. Get sold/rented listings count
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("co_broker_id", id)
        .or("status.eq.SOLD,status.eq.RENTED")
        .eq("tenant_id", tenantId!),

      // 4. Get earnings summary (Minimal data fetch)
      supabase
        .from("deal_commissions")
        .select("net_amount, status")
        .eq("co_broker_id", id)
        .eq("tenant_id", tenantId!),
    ]);

    if (totalRes.error) throw totalRes.error;
    if (activeRes.error) throw activeRes.error;
    if (soldRes.error) throw soldRes.error;
    if (commRes.error) throw commRes.error;

    const totalListings = totalRes.count || 0;
    const activeListings = activeRes.count || 0;
    const soldListings = soldRes.count || 0;
    const commissions = commRes.data || [];

    const realizedEarnings = (commissions as { status: string; net_amount: number | string | null }[])
      .filter((c) => c.status === "PAID")
      .reduce((sum: number, c) => sum + (Number(c.net_amount) || 0), 0);

    const accruedEarnings = (commissions as { status: string; net_amount: number | string | null }[])
      .filter((c) => c.status !== "PAID" && c.status !== "VOID")
      .reduce((sum: number, c) => sum + (Number(c.net_amount) || 0), 0);

    return {
      success: true,
      stats: {
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        soldListings: soldListings || 0,
        realizedEarnings,
        accruedEarnings,
        conversionRate:
          (totalListings || 0) > 0
            ? ((soldListings || 0) / (totalListings || 0)) * 100
            : 0,
      },
    };
  } catch (error: unknown) {
    logger.error("getCoBrokerPerformanceAction failed", error, { source: "co-brokers-actions", id });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 📂 การจัดการเอกสาร (Documents)
 */
export async function addCoBrokerDocumentAction(input: CoBrokerDocumentInput) {
  try {
    const { supabase, tenantId, user } = await requireAuthContext();

    const { data: doc, error } = await supabase
      .from("co_broker_documents")
      .insert({
        ...input,
        tenant_id: tenantId!,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logActivityAction("UPLOAD_DOC", "CO_BROKER_DOCUMENT", doc.id, {
      broker_id: input.co_broker_id,
      file_name: input.file_name,
    });

    return { success: true, data: doc };
  } catch (error: unknown) {
    logger.error("addCoBrokerDocumentAction failed", error, { source: "co-brokers-actions", input });
    return {
      success: false,
      error: (error as Error).message || "ล้มเหลวในการบันทึกเอกสาร",
    };
  }
}

export async function getCoBrokerDocumentsAction(id: string) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { data, error } = await supabase
      .from("co_broker_documents")
      .select("*")
      .eq("co_broker_id", id)
      .eq("tenant_id", tenantId!)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: unknown) {
    logger.error("getCoBrokerDocumentsAction failed", error, { source: "co-brokers-actions", id });
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCoBrokerDocumentAction(
  docId: string,
  brokerId: string,
  fileName: string,
) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { error } = await supabase
      .from("co_broker_documents")
      .delete()
      .eq("id", docId)
      .eq("tenant_id", tenantId!);

    if (error) throw error;

    await logActivityAction("DELETE_DOC", "CO_BROKER_DOCUMENT", docId, {
      broker_id: brokerId,
      file_name: fileName,
    });

    return { success: true };
  } catch (error: unknown) {
    logger.error("deleteCoBrokerDocumentAction failed", error, { source: "co-brokers-actions", docId });
    return { success: false, error: (error as Error).message || "ไม่สามารถลบเอกสารได้" };
  }
}

/**
 * 📦 BULK ACTIONS (Phase 7.4)
 */

export async function bulkDeleteCoBrokersAction(ids: string[]) {
  try {
    const { supabase, tenantId, role, user } = await requireAuthContext();

    let query = supabase
      .from("co_brokers")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .in("id", ids)
      .eq("tenant_id", tenantId!);

    // 🛡️ RBAC Guard: Agents can only delete their own
    if (role !== "ADMIN" && role !== "MANAGER") {
      query = query.eq("created_by", user.id);
    }

    const { error } = await query;

    if (error) throw error;

    await logActivityAction("BULK_SOFT_DELETE", "CO_BROKER", "BULK_OP", { 
      ids,
      count: ids.length,
      summary: `ลบคู่ค้าแบบกลุ่มจำนวน ${ids.length} รายการ`
    });
    revalidatePath("/protected/co-brokers");
    return { success: true };
  } catch (error: unknown) {
    logger.error("bulkDeleteCoBrokersAction failed", error, { source: "co-brokers-actions", ids });
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถลบข้อมูลแบบกลุ่มได้",
    };
  }
}

export async function bulkRestoreCoBrokersAction(ids: string[]) {
  try {
    const { supabase, tenantId, role, user } = await requireAuthContext();

    let query = supabase
      .from("co_brokers")
      .update({ deleted_at: null, is_active: true })
      .in("id", ids)
      .eq("tenant_id", tenantId!);

    // 🛡️ RBAC Guard: Agents can only restore their own
    if (role !== "ADMIN" && role !== "MANAGER") {
      query = query.eq("created_by", user.id);
    }

    const { error } = await query;

    if (error) throw error;

    await logActivityAction("BULK_RESTORE", "CO_BROKER", "BULK_OP", { 
      ids,
      count: ids.length,
      summary: `กู้คืนคู่ค้าแบบกลุ่มจำนวน ${ids.length} รายการ`
    });
    revalidatePath("/protected/co-brokers");
    return { success: true };
  } catch (error: unknown) {
    logger.error("bulkRestoreCoBrokersAction failed", error, { source: "co-brokers-actions", ids });
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถกู้คืนข้อมูลแบบกลุ่มได้",
    };
  }
}

export async function bulkUpdateCoBrokerGroupAction(
  ids: string[],
  groupName: string,
) {
  try {
    const { supabase, tenantId, role, user } = await requireAuthContext();

    let query = supabase
      .from("co_brokers")
      .update({ broker_group: groupName })
      .in("id", ids)
      .eq("tenant_id", tenantId!);

    // 🛡️ RBAC Guard: Agents can only update their own
    if (role !== "ADMIN" && role !== "MANAGER") {
      query = query.eq("created_by", user.id);
    }

    const { error } = await query;

    if (error) throw error;

    await logActivityAction("BULK_CHANGE_GROUP", "CO_BROKER", "BULK_OP", { 
      ids,
      groupName,
      count: ids.length,
      summary: `เปลี่ยนกลุ่มคู่ค้าแบบกลุ่มเป็น "${groupName}" จำนวน ${ids.length} รายการ`
    });
    revalidatePath("/protected/co-brokers");
    return { success: true };
  } catch (error: unknown) {
    logger.error("bulkUpdateCoBrokerGroupAction failed", error, { source: "co-brokers-actions", ids, groupName });
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถเปลี่ยนกลุ่มข้อมูลแบบกลุ่มได้",
    };
  }
}

/**
 * 🗑️ ดึงข้อมูลจากถังขยะ (Recycle Bin)
 */
export async function getTrashCoBrokersAction(): Promise<{ success: boolean; data?: CoBroker[]; error?: string }> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { data, error } = await supabase
      .from("co_brokers")
      .select("*")
      .eq("tenant_id", tenantId!)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data as unknown as CoBroker[] };
  } catch (error: unknown) {
    logger.error("getTrashCoBrokersAction failed", error, { source: "co-brokers-actions" });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 📋 ดึงประวัติการขาย (Deals)
 */
export async function getCoBrokerDealsAction(id: string) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { data, error } = await supabase
      .from("deals")
      .select(
        `
        id,
        status,
        commission_amount,
        transaction_date,
        property:properties!deals_property_id_fkey (title, property_type)
      `,
      )
      .eq("partner_co_broker_id", id)
      .eq("tenant_id", tenantId!)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: unknown) {
    logger.error("getCoBrokerDealsAction failed", error, { source: "co-brokers-actions", id });
    return { success: false, error: (error as Error).message };
  }
}
