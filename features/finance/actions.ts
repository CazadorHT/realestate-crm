"use server";

import { revalidatePath } from "next/cache";
import { 
  requireAuthContext, 
  assertStaff, 
  assertAdmin, 
  authzFail 
} from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";
import { logAudit } from "@/lib/audit";
import { 
  PayoutStatusUpdateResult, 
  BulkPayoutResult,
  PaginatedPayoutResult
} from "./types";
import { Database } from "@/lib/database.types";

type CommissionStatus = Database["public"]["Enums"]["commission_status"];

/**
 * Marks a commission record as READY_TO_PAY.
 * Usually performed by a manager after verifying deal documents.
 */
import { FinanceMath } from "@/lib/finance/precision";

/**
 * Marks multiple commissions as READY_TO_PAY using high-performance RPC.
 */
export async function bulkMarkAsReadyToPayAction(commissionIds: string[]): Promise<BulkPayoutResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase.rpc("bulk_mark_commissions_as_ready_to_pay" as any, {
      p_commission_ids: commissionIds,
      p_tenant_id: tenantId!,
      p_user_id: user.id,
      p_user_full_name: profile?.full_name || "System Admin"
    });

    if (error) throw new Error(mapDbError(error));

    revalidatePath("/protected/finance/payouts");
    return { 
      success: true, 
      processedCount: (data as any)?.updated_count || 0,
      message: `อนุมัติรอจ่ายสำเร็จ ${(data as any)?.updated_count || 0} รายการ` 
    };
  } catch (error: any) {
    console.error("bulkMarkAsReady Error:", error);
    return { success: false, error: error.message, processedCount: 0 };
  }
}

/**
 * Marks a commission record as READY_TO_PAY.
 */
export async function markAsReadyToPayAction(commissionId: string): Promise<PayoutStatusUpdateResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const { data, error } = await supabase
      .from("deal_commissions")
      .update({ 
        status: "READY_TO_PAY" as any,
        updated_at: new Date().toISOString() 
      })
      .eq("id", commissionId)
      .eq("tenant_id", tenantId!)
      .select("id, amount, role, agent_id")
      .single();

    if (error) throw new Error(mapDbError(error));

    await logAudit(
      { supabase, user, role },
      {
        action: "finance.commission_ready",
        entity: "deal_commissions",
        entityId: commissionId,
        summary: `อนุมัติยอดคอมมิชชัน ${FinanceMath.format(data.amount)} บ. เตรียมโอนเงิน`,
        metadata: { commissionId, amount: data.amount }
      }
    );

    revalidatePath("/protected/finance/payouts");
    return { success: true, message: "อนุมัติรายการเตรียมโอนเงินเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("markAsReadyToPay Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a financial adjustment for a commission record.
 * Used for deducting fees or adding bonuses.
 */
export async function createCommissionAdjustmentAction(payload: {
  commission_id: string;
  description: string;
  amount: number;
  adjustment_type: 'MARKETING' | 'FEE' | 'BONUS' | 'OTHER';
}) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertAdmin(role); // Only admins can adjust financials

    const { data, error } = await supabase
      .from("commission_adjustments" as any)
      .insert({
        ...payload,
        created_by: user.id,
        tenant_id: tenantId
      } as any)
      .select()
      .single();

    if (error) throw new Error(mapDbError(error));

    await logAudit(
      { supabase, user, role },
      {
        action: "finance.adjustment_create",
        entity: "deal_commissions",
        entityId: payload.commission_id,
        summary: `เพิ่มรายการปรับปรุง: ${payload.description} (${payload.amount} บ.)`,
        metadata: payload
      }
    );

    revalidatePath("/protected/finance/payouts");
    return { success: true, data };
  } catch (error: any) {
    console.error("createAdjustment Error:", error);
    return { success: false, error: "ไม่สามารถบันทึกรายการปรับปรุงได้: " + error.message };
  }
}

/**
 * Recalculates commission totals (Gross/WHT/Net) for a pending payout.
 * Strictly allowed only for UNPAID or READY_TO_PAY records.
 */
export async function recalculatePayoutTotalsAction(commissionId: string) {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    // 1. Fetch latest setup
    const { data: current, error: fetchErr } = await supabase
      .from("deal_commissions")
      .select(`
        *,
        deal:deals(commission_percentage, final_price),
        adjustments:commission_adjustments(*)
      `)
      .eq("id", commissionId)
      .single();

    if (fetchErr || !current) throw new Error("ไม่พบข้อมูลรายการคอมมิชชัน");
    if (current.status === "PAID") throw new Error("ไม่สามารถคำนวณใหม่ได้สำหรับรายการที่จ่ายแล้ว");

    // 2. Mock Logic for "New Rules" (Can be expanded as business rules grow)
    // For now: Ensure WHT is still 3% and re-calculate based on deal's current state
    const newAmount = current.amount; // In real usage, this might pull from deal.final_price * deal.commission_percentage
    const newWht = FinanceMath.calculateWht(newAmount);
    const newNetTransfer = FinanceMath.calculateNetPayout(newAmount, newWht, current.adjustments || []);

    const { error: updateErr } = await supabase
      .from("deal_commissions")
      .update({
        wht_amount: FinanceMath.toNumber(newWht),
        net_transfer_amount: FinanceMath.toNumber(newNetTransfer),
        updated_at: new Date().toISOString()
      })
      .eq("id", commissionId);

    if (updateErr) throw new Error(mapDbError(updateErr));

    revalidatePath("/protected/finance/payouts");
    return { success: true, message: "คำนวณยอดเงินใหม่เรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("recalculate Error:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Marks a commission as PAID with strict precision and audit logic.
 */
export async function markAsPaidAction(
  commissionId: string, 
  payload: { slip_url: string; payment_reference: string }
) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    // 1. Fetch current record + adjustments
    const { data: current, error: fetchErr } = await supabase
      .from("deal_commissions")
      .select(`
        *,
        agent:profiles!deal_commissions_agent_id_fkey(full_name, line_user_id),
        adjustments:commission_adjustments(*)
      `)
      .eq("id", commissionId)
      .single();

    if (fetchErr || !current) throw new Error("ไม่พบข้อมูลรายการคอมมิชชัน");
    if (current.status === "PAID") throw new Error("รายการนี้ถูกบันทึกว่าจ่ายแล้ว");

    // 2. Precision Calculation
    const netTransfer = FinanceMath.calculateNetPayout(
      current.amount,
      current.wht_amount,
      current.adjustments || []
    );

    // 3. Execution with Metadata Snapshot (Idempotency ready)
    const { data: updated, error: updateErr } = await supabase
      .from("deal_commissions")
      .update({
        status: "PAID" as any,
        slip_url: payload.slip_url,
        payment_reference: payload.payment_reference,
        paid_at: new Date().toISOString(),
        idempotency_key: `${current.deal_id}-${commissionId}`,
        payout_metadata: {
          calculation_snapshot: {
            gross: current.amount,
            wht: current.wht_amount,
            tax_rate_snapshot: 0.03, // Hardened tax rate log
            net_base: Number(current.amount) - Number(current.wht_amount),
            adjustments: current.adjustments,
            final_net: netTransfer.toNumber()
          },
          processed_by: user.id
        }
      } as any)
      .eq("id", commissionId)
      .select()
      .single();

    if (updateErr) throw new Error(mapDbError(updateErr));

    await logAudit(
      { supabase, user, role },
      {
        action: "finance.commission_paid",
        entity: "deal_commissions",
        entityId: commissionId,
        summary: `ยืนยันการโอนเงินสุทธิ ${FinanceMath.format(netTransfer)} บ. (Ref: ${payload.payment_reference})`,
        metadata: { ...payload, netAmount: netTransfer.toNumber() }
      }
    );

    revalidatePath("/protected/finance/payouts");
    revalidatePath("/protected/wallet");
    
    // 🚀 Background Automation
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({
      name: "finance.commission_paid",
      data: {
        commissionId,
        agentName: current.agent?.full_name || "Unknown Agent",
        amount: Number(current.amount),
        taxAmount: Number(current.wht_amount),
        netAmount: netTransfer.toNumber(),
        dealId: current.deal_id,
        reference: payload.payment_reference,
        paidAt: updated.paid_at,
        lineUserId: current.agent?.line_user_id,
        idempotencyKey: `${current.deal_id}-${commissionId}`
      }
    });
    
    return { success: true, message: "บันทึกการโอนเงินสุทธิสำเร็จ และส่งแจ้งเตือนเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("markAsPaid Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches the Payout Queue with full calculation stats and server-side pagination.
 */
export async function getPayoutQueueAction(filters?: { 
  status?: any; 
  agentId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedPayoutResult> {
  try {
    const { supabase, tenantId, role } = await requireAuthContext();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from("deal_commissions")
      .select(`
        *,
        agent:profiles!deal_commissions_agent_id_fkey (id, full_name, phone),
        adjustments:commission_adjustments(*),
        summary_view:view_commission_payout_summaries!inner (
          total_adjustments,
          net_payout_amount
        ),
        deal:deals!deal_commissions_deal_id_fkey (
          id,
          property:properties!deals_property_id_fkey (title, property_type, listing_type)
        )
      `, { count: "exact" });

    // 🌐 Cross-branch Logic: If Admin/Manager, they can see ALL if they want
    // But by default, we still scope to their current tenant for safety
    if (role === "ADMIN" || role === "MANAGER") {
      // Logic for "ALL" branches can be added here (e.g., if filters.allBranches is true)
      // For now, we still filter by tenantId unless we explicitly want "ALL"
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
    } else {
      query = query.eq("tenant_id", tenantId!);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    } else {
      query = query.in("status", ["UNPAID", "READY_TO_PAY"]);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(mapDbError(error));

    // Enhance records with totals from the SQL View
    const enhancedData = data.map((item: any) => {
      const summary = item.summary_view;
      
      return {
        ...item,
        total_adjustments: Number(summary?.total_adjustments || 0),
        net_transfer_amount: Number(summary?.net_payout_amount || item.net_amount)
      };
    });

    return { 
      success: true, 
      data: enhancedData as any,
      totalCount: count || 0,
      page,
      pageSize
    };
  } catch (error: any) {
    console.error("getPayoutQueue Error:", error);
    return { success: false, error: error.message, data: [], totalCount: 0, page: 1, pageSize: 20 };
  }
}

/**
 * Fetches specific data for WHT 50 Tawi certificate generation.
 */
export async function getWhtCertificateDataAction(commissionId: string) {
  try {
    const { supabase, tenantId } = await requireAuthContext();
    assertStaff(await (await requireAuthContext()).role);

    // 1. Fetch record with everything needed for the certificate
    const { data: current, error: fetchErr } = await supabase
      .from("deal_commissions")
      .select(`
        id,
        amount,
        wht_amount,
        payment_reference,
        paid_at,
        agent:profiles!deal_commissions_agent_id_fkey(full_name, phone),
        tenant:tenants(name)
      `)
      .eq("id", commissionId)
      .eq("tenant_id", tenantId!)
      .single();

    if (fetchErr || !current) throw new Error("ไม่พบข้อมูลสำหรับการออกใบรับรอง");

    const netAmount = Number(current.amount) - Number(current.wht_amount);

    return {
      success: true,
      data: {
        agentName: current.agent?.full_name || "Unknown Agent",
        address: "ระบุในโปรไฟล์เอเยนต์", // TODO: Add address field to profile if needed
        taxAmount: FinanceMath.format(current.wht_amount),
        grossAmount: FinanceMath.format(current.amount),
        netAmount: FinanceMath.format(netAmount),
        date: current.paid_at ? new Intl.DateTimeFormat('th-TH').format(new Date(current.paid_at)) : "-",
        tenantName: (current.tenant as any)?.name || "Real Estate CRM Provider",
        referenceCode: current.payment_reference || current.id.slice(0, 8).toUpperCase()
      }
    };
  } catch (error: any) {
    console.error("getWhtData Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches the specific audit trail for a financial record.
 */
export async function getCommissionAuditTrailAction(commissionId: string) {
  try {
    const { supabase } = await requireAuthContext();

    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        id,
        action,
        metadata,
        created_at,
        profiles:user_id (full_name)
      `)
      .eq("entity_id", commissionId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(mapDbError(error));

    return {
      success: true,
      data: data.map((log: any) => ({
        id: log.id,
        action: log.action,
        summary: log.metadata?.summary || log.action,
        created_at: log.created_at,
        user_full_name: log.profiles?.full_name || "System",
        metadata: log.metadata
      }))
    };
  } catch (error: any) {
    console.error("getCommissionAuditTrail Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAgentWalletStatsAction() {
  try {
    const { supabase, user, tenantId } = await requireAuthContext();

    const { data: commissions, error: commErr } = await supabase
      .from("deal_commissions")
      .select(`
        *,
        adjustments:commission_adjustments(*),
        deal:deals!deal_commissions_deal_id_fkey (
          id, status,
          property:properties!deals_property_id_fkey (title, image_url, listing_type, property_type)
        )
      `)
      .eq("agent_id", user.id)
      .eq("tenant_id", tenantId!)
      .order("created_at", { ascending: false });

    if (commErr) throw new Error(mapDbError(commErr));

    const enhanced = commissions.map((c: any) => ({
      ...c,
      net_transfer_amount: FinanceMath.calculateNetPayout(c.amount, c.wht_amount, c.adjustments || []).toNumber()
    }));

    const totalEarnings = enhanced
      .filter(c => c.status === "PAID")
      .reduce((acc, c) => acc + c.net_transfer_amount, 0);
    
    const pendingAmount = enhanced
      .filter(c => c.status === "UNPAID" || c.status === "READY_TO_PAY")
      .reduce((acc, c) => acc + c.net_transfer_amount, 0);

    const closedDealsCount = new Set(
      enhanced.filter(c => c.status === "PAID").map(c => c.deal_id)
    ).size;

    return {
      success: true,
      data: {
        stats: { totalEarnings, pendingAmount, closedDealsCount, totalCommissionsCount: commissions.length },
        history: enhanced
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
