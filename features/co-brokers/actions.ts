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

// --- Helper ---
function mapIdentityToCoBroker(identity: any): CoBroker {
  const socialLinks = (identity.social_links as Record<string, any>) || {};
  return {
    id: identity.id,
    name: identity.display_name || "",
    company_name: socialLinks.company_name || null,
    phone: identity.phone || null,
    email: identity.email || null,
    line_id: identity.line_id || null,
    whatsapp: socialLinks.whatsapp || null,
    internal_notes: socialLinks.internal_notes || null,
    rating: socialLinks.rating ?? 3,
    specialized_areas: socialLinks.specialized_areas || [],
    property_types: socialLinks.property_types || [],
    tax_id: socialLinks.tax_id || null,
    tax_address: socialLinks.tax_address || null,
    bank_code: socialLinks.bank_code || null,
    bank_account_no: socialLinks.bank_account_no || null,
    bank_account_name: socialLinks.bank_account_name || null,
    standard_commission_rate: socialLinks.standard_commission_rate || null,
    is_active: identity.is_active ?? true,
    broker_group: socialLinks.broker_group || "GENERAL",
    created_at: identity.created_at || null,
    created_by: socialLinks.created_by || null,
    tenant_id: identity.tenant_id || "",
    deleted_at: identity.deleted_at || null,
  };
}

/**
 * 📊 ดึงรายการคู่ค้าทั้งหมด
 */
export async function getCoBrokersAction(query?: string, area?: string): Promise<{ success: boolean; data?: CoBroker[]; error?: string }> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let dbQuery = supabase
      .from("identities_v3")
      .select("id, display_name, phone, email, line_id, is_active, created_at, updated_at, tenant_id, social_links, deleted_at")
      .eq("category", 2)
      .eq("role", "CO_BROKER")
      .is("deleted_at", null);

    if (tenantId && tenantId !== "ALL") {
      dbQuery = dbQuery.eq("tenant_id", tenantId);
    }

    if (query) {
      dbQuery = dbQuery.or(
        `display_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`,
      );
    }

    const { data, error } = await dbQuery.order("display_name", { ascending: true });

    if (error) throw error;

    let mapped = (data || []).map(mapIdentityToCoBroker);

    if (query) {
      const q = query.toLowerCase();
      // Additional JS filter to match company_name inside JSONB
      mapped = mapped.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.company_name && item.company_name.toLowerCase().includes(q)) ||
        (item.phone && item.phone.includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q))
      );
    }

    if (area) {
      mapped = mapped.filter(item => item.specialized_areas && item.specialized_areas.includes(area));
    }

    return { success: true, data: mapped };
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

    let targetTenantId = tenantId;
    if (!targetTenantId || targetTenantId === "ALL") {
      const { data: firstMember } = await supabase
        .from("tenant_members_v3")
        .select("tenant_id")
        .eq("identity_id", user.id)
        .limit(1)
        .maybeSingle();

      if (firstMember?.tenant_id) {
        targetTenantId = firstMember.tenant_id;
      } else {
        const { getSystemConfig } = await import("@/lib/actions/system-config");
        const { default_tenant_id } = await getSystemConfig();
        if (default_tenant_id) {
          targetTenantId = default_tenant_id;
        } else {
          const { data: firstTenant } = await supabase
            .from("tenants_v3")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (firstTenant?.id) {
            targetTenantId = firstTenant.id;
          }
        }
      }
    }

    if (!targetTenantId) {
      throw new Error("ไม่พบ Tenant ID สำหรับสร้างคู่ค้า");
    }

    const { data, error } = await supabase
      .from("identities_v3")
      .insert({
        tenant_id: targetTenantId,
        category: 2,
        role: "CO_BROKER",
        display_name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        line_id: validated.line_id || null,
        is_active: validated.is_active ?? true,
        social_links: {
          company_name: validated.company_name || null,
          whatsapp: validated.whatsapp || null,
          internal_notes: validated.internal_notes || null,
          rating: validated.rating ?? 3,
          specialized_areas: validated.specialized_areas || [],
          property_types: validated.property_types || [],
          tax_id: validated.tax_id || null,
          tax_address: validated.tax_address || null,
          bank_code: validated.bank_code || null,
          bank_account_no: validated.bank_account_no || null,
          bank_account_name: validated.bank_account_name || null,
          standard_commission_rate: validated.standard_commission_rate || null,
          broker_group: validated.broker_group || "GENERAL",
          created_by: user.id,
        },
      })
      .select("id, display_name, phone, email, line_id, is_active, created_at, updated_at, tenant_id, social_links, deleted_at")
      .single();

    if (error) throw error;

    const mapped = mapIdentityToCoBroker(data);

    await logActivityAction("CREATE", "CO_BROKER", data.id, {
      name: mapped.name,
    });
    revalidatePath("/protected/co-brokers");
    return { success: true, data: mapped };
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

    // Fetch existing identity to merge social_links
    let fetchQuery = supabase
      .from("identities_v3")
      .select("social_links")
      .eq("id", id);

    if (tenantId && tenantId !== "ALL") {
      fetchQuery = fetchQuery.eq("tenant_id", tenantId);
    }

    const { data: existing, error: fetchErr } = await fetchQuery.single();

    if (fetchErr || !existing) throw new Error("ไม่พบข้อมูลคู่ค้าที่ต้องการแก้ไข");

    const currentSocial = (existing.social_links as Record<string, any>) || {};
    const mergedSocial = {
      ...currentSocial,
      ...(values.company_name !== undefined ? { company_name: values.company_name || null } : {}),
      ...(values.whatsapp !== undefined ? { whatsapp: values.whatsapp || null } : {}),
      ...(values.internal_notes !== undefined ? { internal_notes: values.internal_notes || null } : {}),
      ...(values.rating !== undefined ? { rating: values.rating } : {}),
      ...(values.specialized_areas !== undefined ? { specialized_areas: values.specialized_areas } : {}),
      ...(values.property_types !== undefined ? { property_types: values.property_types } : {}),
      ...(values.tax_id !== undefined ? { tax_id: values.tax_id || null } : {}),
      ...(values.tax_address !== undefined ? { tax_address: values.tax_address || null } : {}),
      ...(values.bank_code !== undefined ? { bank_code: values.bank_code || null } : {}),
      ...(values.bank_account_no !== undefined ? { bank_account_no: values.bank_account_no || null } : {}),
      ...(values.bank_account_name !== undefined ? { bank_account_name: values.bank_account_name || null } : {}),
      ...(values.standard_commission_rate !== undefined ? { standard_commission_rate: values.standard_commission_rate || null } : {}),
      ...(values.broker_group !== undefined ? { broker_group: values.broker_group } : {}),
    };

    const updatePayload: any = {
      social_links: mergedSocial,
      updated_at: new Date().toISOString(),
    };

    if (values.name !== undefined) updatePayload.display_name = values.name;
    if (values.phone !== undefined) updatePayload.phone = values.phone;
    if (values.email !== undefined) updatePayload.email = values.email || null;
    if (values.line_id !== undefined) updatePayload.line_id = values.line_id || null;
    if (values.is_active !== undefined) updatePayload.is_active = values.is_active;

    let updateQuery = supabase
      .from("identities_v3")
      .update(updatePayload)
      .eq("id", id);

    if (tenantId && tenantId !== "ALL") {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { data, error } = await updateQuery
      .select("id, display_name, phone, email, line_id, is_active, created_at, updated_at, tenant_id, social_links, deleted_at")
      .single();

    if (error) throw error;

    const mapped = mapIdentityToCoBroker(data);

    await logActivityAction("UPDATE", "CO_BROKER", id, {
      updated_fields: Object.keys(values),
    });
    revalidatePath("/protected/co-brokers");
    return { success: true, data: mapped };
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

    let query = supabase
      .from("identities_v3")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", id);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

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

    let query = supabase
      .from("identities_v3")
      .update({ deleted_at: null, is_active: true })
      .eq("id", id);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

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

    let query = supabase
      .from("identities_v3")
      .delete()
      .eq("id", id);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

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

    // 🌐 Query deals instead of properties for partner performance metrics
    let dealsQ = supabase
      .from("crm_deals_v3")
      .select("id, status");

    if (tenantId && tenantId !== "ALL") {
      dealsQ = dealsQ.eq("tenant_id", tenantId);
    }
    
    // Filter deals where this co-broker is a partner
    dealsQ = dealsQ.eq("partner_co_broker_id", id);

    const { data: brokerDeals, error: dealsErr } = await dealsQ;
    if (dealsErr) throw dealsErr;

    const dealIds = (brokerDeals || []).map((d) => d.id);
    const totalListings = brokerDeals?.length || 0;
    const activeListings = (brokerDeals || []).filter(d => d.status === "NEGOTIATING" || d.status === "SIGNED").length;
    const soldListings = (brokerDeals || []).filter(d => d.status === "CLOSED_WIN").length;

    // Fetch commissions for realized & accrued earnings
    let commQ = supabase
      .from("crm_deal_commissions_v3")
      .select("net_amount, status, recipient_id, recipient_role, deal_id");

    if (tenantId && tenantId !== "ALL") {
      commQ = commQ.eq("tenant_id", tenantId);
    }

    // Build conditional logic: either recipient is direct co-broker, or role is CO_AGENT under broker's deals
    if (dealIds.length > 0) {
      commQ = commQ.or(`recipient_id.eq.${id},and(recipient_role.eq.CO_AGENT,deal_id.in.(${dealIds.join(",")}))`);
    } else {
      commQ = commQ.eq("recipient_id", id);
    }

    const { data: commissions, error: commErr } = await commQ;
    if (commErr) throw commErr;

    const realizedEarnings = (commissions as { status: string | null; net_amount: number | null }[])
      .filter((c) => c.status === "PAID")
      .reduce((sum: number, c) => sum + (Number(c.net_amount) || 0), 0);

    const accruedEarnings = (commissions as { status: string | null; net_amount: number | null }[])
      .filter((c) => c.status !== "PAID" && c.status !== "VOID")
      .reduce((sum: number, c) => sum + (Number(c.net_amount) || 0), 0);

    return {
      success: true,
      stats: {
        totalListings,
        activeListings,
        soldListings,
        realizedEarnings,
        accruedEarnings,
        conversionRate:
          totalListings > 0
            ? (soldListings / totalListings) * 100
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
    const { supabase, tenantId } = await requireAuthContext();

    let targetTenantId = tenantId && tenantId !== "ALL" ? tenantId : undefined;
    if (!targetTenantId) {
      const { data: broker } = await supabase
        .from("identities_v3")
        .select("tenant_id")
        .eq("id", input.co_broker_id)
        .single();
      if (broker?.tenant_id) {
        targetTenantId = broker.tenant_id;
      }
    }

    if (!targetTenantId) {
      throw new Error("ไม่พบ Tenant ID สำหรับเอกสาร");
    }

    const { data: doc, error } = await supabase
      .from("documents_v3")
      .insert({
        tenant_id: targetTenantId,
        owner_entity: "CO_BROKER",
        owner_id: input.co_broker_id,
        file_name: input.file_name,
        storage_path: input.file_url,
        document_type: input.file_type || "DOCUMENT",
        created_at: new Date().toISOString(),
      })
      .select("id, owner_id, file_name, storage_path, document_type, created_at")
      .single();

    if (error) throw error;

    const mappedDoc = {
      id: doc.id,
      co_broker_id: doc.owner_id,
      file_name: doc.file_name,
      file_url: doc.storage_path,
      file_type: doc.document_type,
      file_size: input.file_size,
      created_at: doc.created_at,
    };

    await logActivityAction("UPLOAD_DOC", "CO_BROKER_DOCUMENT", doc.id, {
      broker_id: input.co_broker_id,
      file_name: input.file_name,
    });

    return { success: true, data: mappedDoc };
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

    let query = supabase
      .from("documents_v3")
      .select("id, owner_id, file_name, storage_path, document_type, created_at")
      .eq("owner_entity", "CO_BROKER")
      .eq("owner_id", id);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map(doc => ({
      id: doc.id,
      co_broker_id: doc.owner_id,
      file_name: doc.file_name,
      file_url: doc.storage_path,
      file_type: doc.document_type,
      file_size: 0,
      created_at: doc.created_at,
    }));

    return { success: true, data: mapped };
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

    let query = supabase
      .from("documents_v3")
      .delete()
      .eq("id", docId);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

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

    let targetIds = ids;
    if (role !== "ADMIN" && role !== "MANAGER") {
      let selectQ = supabase
        .from("identities_v3")
        .select("id, social_links")
        .in("id", ids);

      if (tenantId && tenantId !== "ALL") {
        selectQ = selectQ.eq("tenant_id", tenantId);
      }

      const { data } = await selectQ;
      
      targetIds = (data || [])
        .filter(d => ((d.social_links as Record<string, any>) || {})?.created_by === user.id)
        .map(d => d.id);
    }

    if (targetIds.length === 0) return { success: true };

    let updateQ = supabase
      .from("identities_v3")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .in("id", targetIds);

    if (tenantId && tenantId !== "ALL") {
      updateQ = updateQ.eq("tenant_id", tenantId);
    }

    const { error } = await updateQ;

    if (error) throw error;

    await logActivityAction("BULK_SOFT_DELETE", "CO_BROKER", "BULK_OP", { 
      ids: targetIds,
      count: targetIds.length,
      summary: `ลบคู่ค้าแบบกลุ่มจำนวน ${targetIds.length} รายการ`
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

    let targetIds = ids;
    if (role !== "ADMIN" && role !== "MANAGER") {
      let selectQ = supabase
        .from("identities_v3")
        .select("id, social_links")
        .in("id", ids);

      if (tenantId && tenantId !== "ALL") {
        selectQ = selectQ.eq("tenant_id", tenantId);
      }

      const { data } = await selectQ;
      
      targetIds = (data || [])
        .filter(d => ((d.social_links as Record<string, any>) || {})?.created_by === user.id)
        .map(d => d.id);
    }

    if (targetIds.length === 0) return { success: true };

    let updateQ = supabase
      .from("identities_v3")
      .update({ deleted_at: null, is_active: true })
      .in("id", targetIds);

    if (tenantId && tenantId !== "ALL") {
      updateQ = updateQ.eq("tenant_id", tenantId);
    }

    const { error } = await updateQ;

    if (error) throw error;

    await logActivityAction("BULK_RESTORE", "CO_BROKER", "BULK_OP", { 
      ids: targetIds,
      count: targetIds.length,
      summary: `กู้คืนคู่ค้าแบบกลุ่มจำนวน ${targetIds.length} รายการ`
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

    let selectQ = supabase
      .from("identities_v3")
      .select("id, social_links")
      .in("id", ids);

    if (tenantId && tenantId !== "ALL") {
      selectQ = selectQ.eq("tenant_id", tenantId);
    }

    const { data: records, error: fetchErr } = await selectQ;

    if (fetchErr || !records) throw fetchErr;

    const targetRecords = role !== "ADMIN" && role !== "MANAGER"
      ? records.filter(d => ((d.social_links as Record<string, any>) || {})?.created_by === user.id)
      : records;

    if (targetRecords.length === 0) return { success: true };

    await Promise.all(targetRecords.map(rec => {
      const currentSocial = (rec.social_links as Record<string, any>) || {};
      const mergedSocial = { ...currentSocial, broker_group: groupName };

      let updateQ = supabase
        .from("identities_v3")
        .update({ social_links: mergedSocial, updated_at: new Date().toISOString() })
        .eq("id", rec.id);

      if (tenantId && tenantId !== "ALL") {
        updateQ = updateQ.eq("tenant_id", tenantId);
      }

      return updateQ;
    }));

    await logActivityAction("BULK_CHANGE_GROUP", "CO_BROKER", "BULK_OP", { 
      ids: targetRecords.map(r => r.id),
      groupName,
      count: targetRecords.length,
      summary: `เปลี่ยนกลุ่มคู่ค้าแบบกลุ่มเป็น "${groupName}" จำนวน ${targetRecords.length} รายการ`
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

    let query = supabase
      .from("identities_v3")
      .select("id, display_name, phone, email, line_id, is_active, created_at, updated_at, tenant_id, social_links, deleted_at")
      .eq("category", 2)
      .eq("role", "CO_BROKER")
      .not("deleted_at", "is", null);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query.order("deleted_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: (data || []).map(mapIdentityToCoBroker) };
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

    let query = supabase
      .from("crm_deals_v3")
      .select(
        `
        id,
        status,
        commission_total,
        transaction_date,
        property:properties!crm_deals_v3_property_id_fkey (title, property_type)
      `,
      )
      .eq("partner_co_broker_id", id);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query.order("transaction_date", { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((item: any) => ({
      ...item,
      commission_amount: item.commission_total
    }));
    return { success: true, data: mapped };
  } catch (error: unknown) {
    logger.error("getCoBrokerDealsAction failed", error, { source: "co-brokers-actions", id });
    return { success: false, error: (error as Error).message };
  }
}
