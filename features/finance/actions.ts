"use server";

import React from "react";

import { revalidatePath } from "next/cache";
import {
  requireAuthContext,
  assertStaff,
  assertAdmin,
  authzFail,
  UserRole,
} from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import {
  PayoutStatusUpdateResult,
  BulkPayoutResult,
  PaginatedPayoutResult,
  JoinedPayout,
  RecalculatePreview,
  CommissionPayoutRecord,
  AgentWalletStats,
  AgentWalletHistory
} from "./types";
import { Json } from "@/lib/database.types.generated";
import { Database } from "@/lib/database.types";
import { getCommissionRulesAction } from "@/features/dashboard/actions/commission-actions";
import { FinanceMath } from "@/lib/finance/precision";
import { TaxLogic } from "@/lib/finance/tax-logic";
import { TaxService } from "./services/tax-service";
import { SupabaseClient, User } from "@supabase/supabase-js";


/**
 * Marks multiple commissions as READY_TO_PAY using high-performance RPC.
 */
export async function bulkMarkAsReadyToPayAction(
  commissionIds: string[],
): Promise<BulkPayoutResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    let processedCount = 0;

    if (tenantId && tenantId !== "ALL") {
      const { data, error } = await (
        supabase.rpc as unknown as (
          name: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: { updated_count: number } | null; error: unknown }>
      )("bulk_mark_commissions_as_ready_to_pay", {
        p_commission_ids: commissionIds,
        p_tenant_id: tenantId,
        p_user_id: user.id,
        p_user_full_name: profile?.full_name || "System Admin",
      });

      if (error) throw new Error(mapDbError(error));
      processedCount = data?.updated_count || 0;
    } else {
      // Cross-branch mode or no specific tenant: Group commissions by their tenant_id first
      const { data: commissions, error: fetchErr } = await supabase
        .from("crm_deal_commissions_v3")
        .select("id, tenant_id")
        .in("id", commissionIds);

      if (fetchErr) throw new Error(mapDbError(fetchErr));

      const commissionsByTenant: Record<string, string[]> = {};
      for (const c of (commissions || [])) {
        if (c.tenant_id) {
          if (!commissionsByTenant[c.tenant_id]) {
            commissionsByTenant[c.tenant_id] = [];
          }
          commissionsByTenant[c.tenant_id].push(c.id);
        }
      }

      for (const [tId, ids] of Object.entries(commissionsByTenant)) {
        const { data, error } = await (
          supabase.rpc as unknown as (
            name: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: { updated_count: number } | null; error: unknown }>
        )("bulk_mark_commissions_as_ready_to_pay", {
          p_commission_ids: ids,
          p_tenant_id: tId,
          p_user_id: user.id,
          p_user_full_name: profile?.full_name || "System Admin",
        });

        if (error) throw new Error(mapDbError(error));
        processedCount += data?.updated_count || 0;
      }
    }

    // 🛡️ Audit Hardening: Log the bulk action
    await logAudit({ supabase, user, role }, {
      action: "finance.bulk_mark_ready",
      entity: "COMMISSION",
      entityId: "BULK_UPDATE",
      metadata: { 
        summary: `อนุมัติรอจ่ายแบบกลุ่มสำเร็จ ${processedCount} รายการ`,
        commissionIds, 
        updated_count: processedCount 
      },
    });

    revalidatePath("/protected/finance/payouts");
    return {
      success: true,
      processedCount,
      message: `อนุมัติรอจ่ายสำเร็จ ${processedCount} รายการ`,
    };
  } catch (error: unknown) {
    logger.error("bulkMarkAsReady Error", error, { source: "finance-actions" });
    return {
      success: false,
      error: (error as Error).message,
      processedCount: 0,
    };
  }
}

/**
 * Marks a commission record as READY_TO_PAY.
 */
export async function markAsReadyToPayAction(
  commissionId: string,
): Promise<PayoutStatusUpdateResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    let query = supabase
      .from("crm_deal_commissions_v3")
      .update({
        status: "READY_TO_PAY",
      })
      .eq("id", commissionId);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query
      .select("id, amount, recipient_role, recipient_id")
      .single();

    if (error) throw new Error(mapDbError(error));

    await logAudit({ supabase, user, role }, {
      action: "finance.mark_ready",
      entity: "COMMISSION",
      entityId: commissionId,
      metadata: { 
        summary: `อนุมัติยอดคอมมิชชัน ${FinanceMath.format(data.amount || 0)} บ. เตรียมโอนเงิน`,
        commissionId, 
        amount: data.amount 
      },
    });

    revalidatePath("/protected/finance/payouts");
    return {
      success: true,
      message: "อนุมัติรายการเตรียมโอนเงินเรียบร้อยแล้ว",
    };
  } catch (error: unknown) {
    logger.error("markAsReadyToPay Error", error, { source: "finance-actions" });
    return { success: false, error: (error as Error).message };
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
  adjustment_type: "MARKETING" | "FEE" | "BONUS" | "OTHER";
}) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertAdmin(role); // Only admins can adjust financials

    const { data: currentCommission } = await supabase
      .from("crm_deal_commissions_v3")
      .select("tenant_id")
      .eq("id", payload.commission_id)
      .single();

    if (!currentCommission) {
      throw new Error("ไม่พบรายการคอมมิชชันที่ต้องการปรับปรุง");
    }

    if (tenantId && tenantId !== "ALL" && currentCommission.tenant_id !== tenantId) {
      throw new Error(
        "ไม่สามารถเพิ่มรายการปรับปรุงข้ามสาขาได้ กรุณาสลับสาขาให้ถูกต้อง",
      );
    }

    const { data, error } = await supabase
      .from("financial_ledger_v3")
      .insert({
        amount_net: payload.amount,
        amount_total: payload.amount,
        transaction_type: payload.adjustment_type,
        reference_entity: "COMMISSION",
        reference_id: payload.commission_id,
        tenant_id: currentCommission.tenant_id,
        metadata: {
          description: payload.description,
          created_by: user.id
        }
      })
      .select("id")
      .single();

    if (error) throw new Error(mapDbError(error));

    await logAudit({ supabase, user, role }, {
      action: "finance.adjustment_created",
      entity: "COMMISSION",
      entityId: payload.commission_id,
      metadata: { 
        summary: `เพิ่มรายการปรับปรุง: ${payload.description} (${payload.amount} บ.)`,
        ...payload 
      },
    });

    revalidatePath("/protected/finance/payouts");
    return { success: true, data };
  } catch (error: unknown) {
    logger.error("createAdjustment Error", error, { source: "finance-actions", payload });
    return {
      success: false,
      error: "ไม่สามารถบันทึกรายการปรับปรุงได้: " + (error as Error).message,
    };
  }
}

/**
 * Recalculates commission totals (Gross/WHT/Net) for a pending payout.
 * Strictly allowed only for UNPAID or READY_TO_PAY records.
 */
export async function recalculatePayoutTotalsAction(
  commissionId: string,
  previewOnly: boolean = false,
): Promise<{ success: boolean; message?: string; data?: RecalculatePreview | null; error?: string }> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    let query = supabase
      .from("crm_deal_commissions_v3")
      .select("*, deal:crm_deals_v3!crm_deal_commissions_v3_deal_id_fkey(commission_total)")
      .eq("id", commissionId);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: rawCurrent, error: fetchErr } = await query.single();

    if (fetchErr || !rawCurrent) throw new Error("ไม่พบข้อมูลรายการคอมมิชชัน");
    const current = rawCurrent as any;
    if (current.status === "PAID")
      throw new Error("ไม่สามารถคำนวณใหม่ได้สำหรับรายการที่จ่ายแล้ว");

    // Fetch adjustments explicitly from financial_ledger_v3
    const { data: adjustmentsData } = await supabase
      .from("financial_ledger_v3")
      .select("*")
      .eq("reference_entity", "COMMISSION")
      .eq("reference_id", commissionId);
    const adjustments = (adjustmentsData as any[]) || [];

    // 2. Resolve Tax Rate (Smart Fallback via TaxService)
    const rulesRes = await getCommissionRulesAction();
    const globalDefaultWht = rulesRes.success
      ? rulesRes.data?.defaultWhtRate || 3
      : 3;

    const taxRate = await TaxService.resolveEffectiveRate(supabase, {
      agentId: current.recipient_id,
      tenantId: current.tenant_id,
      explicitRate: current.tax_rate,
      globalDefaultWht,
    });


    const oldAmount = Number(current.amount);
    const oldNet = Number(current.net_amount);

    // We assume recalculation might change the gross amount if the deal changed
    const dealAmount = Number((current.deal as any)?.commission_total || 0);
    const totalCommsForDeal =
      (
        await supabase
          .from("crm_deal_commissions_v3")
          .select("amount")
          .eq("deal_id", current.deal_id || "")
      ).data?.reduce(
        (a: number, b: { amount: number | null }) => a + Number(b.amount || 0),
        0,
      ) || 0;

    // Calculate new values with precision
    const newAmount = FinanceMath.toDecimal(current.amount);
    const newWht = FinanceMath.calculateWht(newAmount, taxRate);
    const newNetTransfer = FinanceMath.calculateNetPayout(
      newAmount.toNumber(),
      newWht.toNumber(),
      adjustments,
    );

    if (previewOnly) {
      return {
        success: true,
        data: {
          before: {
            amount: oldAmount,
            wht: Number(current.tax_amount),
            net: oldNet,
            taxRate: current.tax_rate,
          },
          after: {
            amount: newAmount.toNumber(),
            wht: newWht.toNumber(),
            net: newNetTransfer.toNumber(),
            taxRate: taxRate,
          },
          reason:
            Math.abs(dealAmount - totalCommsForDeal) > 0.01
              ? `ยอดรวมดีลเปลี่ยนเป็น ${FinanceMath.format(dealAmount)} (เดิม ${FinanceMath.format(totalCommsForDeal)})`
              : "ปรับปรุงอัตราภาษีหรือรายการหักลบ",
        },
      };
    }

    let updateQuery = supabase
      .from("crm_deal_commissions_v3")
      .update({
        tax_rate: taxRate,
        tax_amount: FinanceMath.toNumber(newWht),
        net_amount: FinanceMath.toNumber(newNetTransfer),
      })
      .eq("id", commissionId);

    if (tenantId && tenantId !== "ALL") {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error: updateErr } = await updateQuery;

    if (updateErr) throw new Error(mapDbError(updateErr));

    // 🛡️ 🏛️ Forensic Audit: Log the full transition snapshot
    await logAudit({ supabase, user, role }, {
      action: "finance.recalculate",
      entity: "COMMISSION",
      entityId: commissionId,
      metadata: {
        summary: `คำนวณยอดเงินใหม่ (WHT: ${(taxRate * 100).toFixed(1)}%, Net: ${FinanceMath.format(newNetTransfer)} บ.)`,
        commissionId,
        taxRate,
        before: { amount: oldAmount, net: oldNet },
        after: {
          amount: newAmount.toNumber(),
          net: newNetTransfer.toNumber(),
        },
        deal_snapshot: {
          commission_amount: (current.deal as any)?.commission_total,
        },
      },
    });

    revalidatePath("/protected/finance/payouts");
    return { success: true, message: "คำนวณยอดเงินใหม่เรียบร้อยแล้ว" };
  } catch (error: unknown) {
    logger.error("recalculate Error", error, { source: "finance-actions", commissionId });
    return { success: false, error: (error as Error).message };
  }
}
/**
 * Marks a commission as PAID with strict precision and audit logic.
 */
export async function markAsPaidAction(
  commissionId: string,
  payload: { slip_url: string; payment_reference: string },
) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) {
      throw new Error("กรุณาสลับสาขาให้ถูกต้องก่อนดำเนินการบันทึกการโอนเงิน");
    }

    // 1. Audit Hardening: Validate Slip URL (Must be an image or PDF)
    const isLocal =
      payload.slip_url.includes("localhost") ||
      payload.slip_url.includes("127.0.0.1");
    if (
      !isLocal &&
      !payload.slip_url.match(/\.(jpg|jpeg|png|pdf|webp)/i) &&
      !payload.slip_url.includes("storage")
    ) {
      throw new Error(
        "รูปแบบไฟล์สลิปไม่ถูกต้อง หรือลิงก์ไม่ปลอดภัย (อนุญาตเฉพาะ JPG, PNG, PDF)",
      );
    }

    // 2. Fetch current record + adjustments
    let query = supabase
      .from("crm_deal_commissions_v3")
      .select("*, recipient:identities_v3!crm_deal_commissions_v3_recipient_id_fkey(display_name, line_id)")
      .eq("id", commissionId);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: rawCurrent, error: fetchErr } = await query.single();

    if (fetchErr || !rawCurrent) throw new Error("ไม่พบข้อมูลรายการคอมมิชชัน");
    const current = rawCurrent as any;
    if (current.status === "PAID")
      throw new Error("รายการนี้ถูกบันทึกว่าจ่ายแล้ว");

    // Fetch adjustments explicitly from financial_ledger_v3
    const { data: adjustmentsData } = await supabase
      .from("financial_ledger_v3")
      .select("*")
      .eq("reference_entity", "COMMISSION")
      .eq("reference_id", commissionId);
    const adjustments = (adjustmentsData as any[]) || [];

    // 3. Precision Calculation
    const netTransfer = FinanceMath.calculateNetPayout(
        current.amount || 0,
        current.tax_amount || 0,
        adjustments,
    );

    // 4. Execution with Metadata Snapshot + ATOMIC CHECK
    const { data: updated, error: updateErr } = await supabase
      .from("crm_deal_commissions_v3")
      .update({
        status: "PAID",
        paid_at: new Date().toISOString(),
        metadata: {
          ...(current.metadata as Record<string, unknown> || {}),
          slip_url: payload.slip_url,
          payment_reference: payload.payment_reference,
          idempotency_key: `${current.deal_id}-${commissionId}`,
          payout_metadata: {
            calculation_snapshot: {
              gross: current.amount,
              wht: current.tax_amount,
              tax_rate_snapshot: current.tax_rate || 0.03,
              net_base: Number(current.amount || 0) - Number(current.tax_amount || 0),
              adjustments,
              final_net: netTransfer.toNumber(),
            },
            processed_by: user.id,
          },
        },
      })
      .eq("id", commissionId)
      .neq("status", "PAID") // 🛡️ ATOMIC PROTECTION: Prevent double payment at SQL level
      .select("id, paid_at")
      .single();

    if (updateErr) throw new Error(mapDbError(updateErr));

    await logAudit({ supabase, user, role }, {
      action: "finance.commission_paid",
      entity: "COMMISSION",
      entityId: commissionId,
      metadata: { 
        summary: `ยืนยันการโอนเงินสุทธิ ${FinanceMath.format(netTransfer)} บ. (Ref: ${payload.payment_reference})`,
        ...payload, 
        netAmount: netTransfer.toNumber() 
      },
    });

    revalidatePath("/protected/finance/payouts");
    revalidatePath("/protected/wallet");

    // 🚀 Background Automation
    const { inngest } = await import("@/lib/inngest/client");
    const recipientName =
      (current.recipient as any)?.display_name || "Unknown Partner";

    await inngest.send({
      name: "finance.commission_paid",
      data: {
        commissionId,
        agentName: recipientName,
        amount: Number(current.amount),
        taxAmount: Number(current.tax_amount),
        netAmount: netTransfer.toNumber(),
        dealId: current.deal_id,
        reference: payload.payment_reference,
        paidAt: updated?.paid_at || new Date().toISOString(),
        lineUserId: (current.recipient as any)?.line_id,
        telegramId: null,
        idempotencyKey: `${current.deal_id}-${commissionId}`,
      },
    }).catch(e => console.warn("Inngest commission_paid skip:", e.message));

    return {
      success: true,
      message: "บันทึกการโอนเงินสุทธิสำเร็จ และส่งแจ้งเตือนเรียบร้อยแล้ว",
    };
  } catch (error: unknown) {
    logger.error("markAsPaid Error", error, { source: "finance-actions", commissionId });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Creates a TEMPORARY Signed URL for a payout slip.
 * Ensures financial privacy by preventing public access to bank slips.
 */
export async function getSignedSlipUrlAction(slipUrl: string) {
  try {
    const { supabase, tenantId, role } = await requireAuthContext();
    assertStaff(role);

    if (!slipUrl) throw new Error("ไม่พบลิงก์ไฟล์สลิป");

    // Extract path from Supabase storage URL if it's a full URL
    // Format: .../storage/v1/object/public/payout-slips/TENANT_ID/filename.jpg
    let filePath = slipUrl;
    if (slipUrl.includes("/storage/v1/object/")) {
      const parts = slipUrl.split("/payout-slips/");
      if (parts.length > 1) {
        filePath = parts[1];
      }
    }

    // Security check: Must belong to current tenant
    if (tenantId && tenantId !== "ALL" && !filePath.includes(tenantId)) {
      throw new Error("คุณไม่มีสิทธิ์เข้าถึงไฟล์ชุดนี้ (Unauthorized Access)");
    }

    const { data, error } = await supabase.storage
      .from("payout-slips")
      .createSignedUrl(filePath, 600); // 10 minutes expiry

    if (error) throw new Error(error.message);

    return { success: true, url: data.signedUrl };
  } catch (error: unknown) {
    logger.error("getSignedSlipUrl Error", error, { source: "finance-actions", slipUrl });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetches the Payout Queue with full calculation stats and server-side pagination.
 */
export async function getPayoutQueueAction(filters?: {
  status?: string;
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

    let queryBuilder = supabase.from("crm_deal_commissions_v3").select(
      "*, recipient:identities_v3!crm_deal_commissions_v3_recipient_id_fkey(id, display_name, phone), deal:crm_deals_v3!crm_deal_commissions_v3_deal_id_fkey(id, commission_total, property:properties_core(id, property_type, listing_type, details:properties_details(title)))",
      { count: "exact" },
    );

    // 🌐 Cross-branch Logic: If Admin/Manager, they can see ALL if they want
    if (role === "ADMIN" || role === "MANAGER") {
      if (tenantId && tenantId !== "ALL") {
        queryBuilder = queryBuilder.eq("tenant_id", tenantId);
      }
    } else {
      if (!tenantId) throw new Error("ไม่พบข้อมูลสาขาที่สังกัด");
      queryBuilder = queryBuilder.eq("tenant_id", tenantId);
    }

    if (filters?.status) {
      queryBuilder = queryBuilder.eq("status", filters.status);
    } else {
      queryBuilder = queryBuilder.in("status", ["UNPAID", "READY_TO_PAY"]);
    }

    // [PERFORMANCE] Parallel Fetching: Table data AND Data Integrity Check
    const [mainResult, integrityResult] = await Promise.all([
      queryBuilder
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase
        .from("crm_deal_commissions_v3")
        .select("deal_id, amount"), // Ideally we'd limit this or filter by the deals in data, but for now we'll optimize the existing logic
    ]);

    const { data: rawData, error, count } = mainResult as {
      data: any;
      error: unknown;
      count: number | null;
    };

    if (error) throw new Error(mapDbError(error));
    const data = (rawData as any[]) || [];

    const commissionSumsByDeal = (integrityResult.data || []).reduce(
      (
        acc: Record<string, number>,
        curr: { deal_id: string | null; amount: number | null },
      ) => {
        if (!curr.deal_id) return acc;
        const dealId = curr.deal_id as string;
        acc[dealId] = (acc[dealId] || 0) + Number(curr.amount || 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    const commissionIds = data.map((c) => c.id);
    const { data: ledgerData } = commissionIds.length > 0
      ? await supabase
          .from("financial_ledger_v3")
          .select("*")
          .eq("reference_entity", "COMMISSION")
          .in("reference_id", commissionIds)
      : { data: [] };

    const adjustmentsMap: Record<string, any[]> = (ledgerData || []).reduce((acc: Record<string, any[]>, curr: any) => {
      const refId = curr.reference_id;
      if (refId) {
        if (!acc[refId]) acc[refId] = [];
        acc[refId].push(curr);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Enhance records with totals from the SQL View and Stale Detection
    const enhancedData = data.map((item: any): CommissionPayoutRecord => {
      const recipient = item.recipient;
      const deal = item.deal as any;

      const recipientName = (recipient as any)?.display_name || "Unknown Partner";
      const actualDealCommission = Number(deal?.commission_total || 0);
      const calculatedTotal = commissionSumsByDeal[item.deal_id as string] || 0;

      // Calculate stale status: total of saved commissions matches the deal's current commission amount
      const isStale =
        !deal || Math.abs(actualDealCommission - calculatedTotal) > 0.01;

      const adjustments = adjustmentsMap[item.id as string] || [];
      const totalAdjustments = adjustments.reduce((sum: number, a: any) => sum + Number(a.amount_net || 0), 0);
      const netAmount = FinanceMath.calculateNetPayout(
        item.amount || 0,
        item.tax_amount || 0,
        adjustments.map((a: any) => ({ amount: Number(a.amount_net || 0) }))
      ).toNumber();

      const detailsVal = deal?.property?.details;
      const propDetails = Array.isArray(detailsVal) ? detailsVal[0] : detailsVal;
      const propertyTitle = propDetails?.title?.th || propDetails?.title?.en || "ไม่ทราบชื่อทรัพย์สิน";

      return {
        ...item,
        recipient_name: recipientName,
        total_adjustments: totalAdjustments,
        net_amount: netAmount,
        net_transfer_amount: netAmount,
        wht_amount: Number(item.tax_amount || 0),
        is_stale: isStale,
        expected_total: actualDealCommission,
        calculated_total: calculatedTotal,
        agent: { full_name: recipientName },
        co_broker: { name: recipientName },
        slip_url: (item.metadata as any)?.slip_url || "",
        payout_metadata: (item.metadata as any)?.payout_metadata || null,
        updated_at: item.paid_at || item.created_at || new Date().toISOString(),
        property: { title: propertyTitle },
        author: { name: (item.metadata as any)?.payout_metadata?.processed_by || "Administrator" },
      };
    });

    return {
      success: true,
      data: enhancedData as unknown as PaginatedPayoutResult["data"],
      totalCount: count || 0,
      page,
      pageSize,
    };
  } catch (error: unknown) {
    logger.error("getPayoutQueue Error", error, { source: "finance-actions", filters });
    return {
      success: false,
      error: (error as Error).message,
      data: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    };
  }
}

/**
 * 💹 PERFORMANCE ACTION: getPayoutStatsAction
 * Fetches global financial totals for the payout dashboard in a single query.
 */
export async function getPayoutStatsAction() {
  try {
    const { supabase, tenantId, role } = await requireAuthContext();
    
    // Check if we are in "All Branches" mode
    const isAll = role === "ADMIN" || role === "MANAGER" ? (tenantId === "ALL" || !tenantId) : false;

    let queryBuilder = supabase.from("crm_deal_commissions_v3").select("status, net_amount, amount");
    if (!isAll && tenantId) {
      queryBuilder = queryBuilder.eq("tenant_id", tenantId);
    }

    const { data, error } = await queryBuilder;
    if (error) throw new Error(mapDbError(error));

    const stats = (data || []).reduce((acc, curr) => {
      const amount = Number(curr.net_amount || curr.amount || 0);
      acc.totalPool += Number(curr.amount || 0);
      
      if (curr.status === "READY_TO_PAY") {
        acc.readyToPayAmount += amount;
      } else if (curr.status === "UNPAID") {
        acc.unpaidCount += 1;
      } else if (curr.status === "PAID") {
        acc.paidAmountThisMonth += amount; // Simplified: actually should filter by current month
      }
      
      return acc;
    }, {
      readyToPayAmount: 0,
      unpaidCount: 0,
      paidAmountThisMonth: 0,
      totalPoolAmount: 0,
      totalPool: 0
    });

    return { 
      success: true, 
      data: {
        ...stats,
        totalPoolAmount: stats.totalPool
      } 
    };
  } catch (error) {
    logger.error("getPayoutStats Error", error, { source: "finance-actions" });
    return { success: false, error: (error as Error).message };
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
    let query = supabase
      .from("crm_deal_commissions_v3")
      .select(
        `
        id,
        amount,
        tax_amount,
        metadata,
        paid_at,
        recipient:identities_v3!crm_deal_commissions_v3_recipient_id_fkey(display_name, phone)
      `,
      )
      .eq("id", commissionId);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: rawCurrent, error: fetchErr } = await query.single();

    if (fetchErr || !rawCurrent)
      throw new Error("ไม่พบข้อมูลสำหรับการออกใบรับรอง");

    const current = rawCurrent as any;

    const netAmount = FinanceMath.calculateNetPayout(
      current.amount || 0,
      current.tax_amount || 0,
      [],
    );

    return {
      success: true,
      data: {
        agentName:
          current.recipient?.display_name ||
          "Unknown Partner",
        address: (current.recipient as any)?.tax_address || "ระบุในโปรไฟล์",
        taxId: (current.recipient as any)?.tax_id || null,
        taxAmount: FinanceMath.format(Number(current.tax_amount || 0)),
        grossAmount: FinanceMath.format(Number(current.amount || 0)),
        netAmount: FinanceMath.format(netAmount.toNumber()),
        date: current.paid_at
          ? new Intl.DateTimeFormat("th-TH").format(new Date(current.paid_at))
          : "-",
        tenantName: "Real Estate CRM Provider",
        referenceCode:
          (current.metadata as any)?.payment_reference || current.id.slice(0, 8).toUpperCase(),
      },
    };
  } catch (error: unknown) {
    logger.error("getWhtData Error", error, { source: "finance-actions", commissionId });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetches the specific audit trail for a financial record.
 */
export async function getCommissionAuditTrailAction(commissionId: string) {
  try {
    // 🛡️ Security Check: Verify audit log belongs to current tenant unless Super Admin
    const { supabase, role: userRole, tenantId } = await requireAuthContext();

    let query = supabase
      .from("system_audit_logs_v3")
      .select(`
        id,
        action,
        new_data,
        created_at,
        actor:identities_v3!system_audit_logs_v3_actor_id_fkey(display_name)
      `)
      .eq("entity_id", commissionId);

    if (userRole !== "ADMIN") {
      if (!tenantId) throw new Error("Unauthorized access to audit trail");
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) throw new Error(mapDbError(error));

    interface AuditLogRecord {
      id: string;
      action: string;
      metadata: Json;
      created_at: string;
      recipient: { id: string; display_name: string; phone: string | null } | null;
    }

    return {
      success: true,
      data: ((data as unknown as AuditLogRecord[]) || []).map((log) => {
        const profile = Array.isArray((log as any).actor) ? (log as any).actor[0] : (log as any).actor;
        return {
          id: log.id,
          action: log.action,
          summary:
            ((log as any).new_data as { summary?: string } | null)?.summary ||
            log.action,
          created_at: log.created_at,
          user_full_name: profile?.display_name || "System",
          metadata: (log as any).new_data || {},
        };
      }),
    };
  } catch (error: unknown) {
    logger.error("getCommissionAuditTrail Error", error, { source: "finance-actions", commissionId });
    return { success: false, error: (error as Error).message };
  }
}

export async function getAgentWalletStatsAction(agentId: string): Promise<{
  success: boolean;
  data?: { stats: AgentWalletStats; history: AgentWalletHistory[] };
  error?: string;
}> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let query = supabase
      .from("crm_deal_commissions_v3")
      .select("*, recipient:identities_v3!crm_deal_commissions_v3_recipient_id_fkey(display_name, phone), deal:crm_deals_v3!crm_deal_commissions_v3_deal_id_fkey(id, status, property:properties_core(id, property_type, listing_type, details:properties_details(title), media:property_media_v3(url, is_cover)))")
      .eq("recipient_id", agentId);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: rawData, error } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(mapDbError(error));
    const data = (rawData as any[]) || [];

    const commissionIds = data.map((c) => c.id);
    const { data: ledgerData } = commissionIds.length > 0
      ? await supabase
          .from("financial_ledger_v3")
          .select("*")
          .eq("reference_entity", "COMMISSION")
          .in("reference_id", commissionIds)
      : { data: [] };

    const adjustmentsMap: Record<string, any[]> = (ledgerData || []).reduce((acc: Record<string, any[]>, curr: any) => {
      const refId = curr.reference_id;
      if (refId) {
        if (!acc[refId]) acc[refId] = [];
        acc[refId].push(curr);
      }
      return acc;
    }, {} as Record<string, any[]>);

    const enhanced = data.map((c: any): AgentWalletHistory => {
      const adjustments = adjustmentsMap[c.id as string] || [];
      const totalAdjustments = adjustments.reduce((sum: number, a: any) => sum + Number(a.amount_net || 0), 0);
      const netAmount = FinanceMath.calculateNetPayout(
        c.amount || 0,
        c.tax_amount || 0,
        adjustments.map((a: any) => ({ amount: Number(a.amount_net || 0) }))
      ).toNumber();

      const deal = c.deal as any;
      const detailsVal = deal?.property?.details;
      const propDetails = Array.isArray(detailsVal) ? detailsVal[0] : detailsVal;
      const propertyTitle = propDetails?.title?.th || propDetails?.title?.en || "ไม่ทราบชื่อทรัพย์สิน";

      return {
        ...c,
        net_amount: netAmount,
        net_transfer_amount: netAmount,
        wht_amount: Number(c.tax_amount || 0),
        total_adjustments: totalAdjustments,
        deal: deal ? {
          ...deal,
          property: deal.property ? {
            ...deal.property,
            title: propertyTitle,
          } : null,
        } : null,
      };
    });

    const totalEarnings = enhanced
      .filter((c) => c.status === "PAID")
      .reduce((acc, c) => acc + c.net_amount, 0);

    const pendingAmount = enhanced
      .filter((c) => c.status === "UNPAID" || c.status === "READY_TO_PAY")
      .reduce((acc, c) => acc + c.net_amount, 0);

    const closedDealsCount = new Set(
      enhanced.filter((c) => c.status === "PAID").map((c) => c.deal_id),
    ).size;

    const agentData = data && data.length > 0 ? (data[0] as any).recipient : null;
    const recipientName = agentData?.display_name || "Unknown Partner";
    
    return {
      success: true,
      data: {
        stats: {
          totalEarnings: FinanceMath.toNumber(
            data?.reduce((acc, c) => acc + (c.amount || 0), 0) || 0,
          ),
          pendingAmount,
          closedDealsCount,
          totalCommissionsCount: (data || []).length,
        },
        history: enhanced as AgentWalletHistory[],
      },
    };
  } catch (error: unknown) {
    logger.error("getAgentWalletStatsAction failed", error, { source: "finance-actions" });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 📄 Digital Document Engine: Generates a WHT (50 Bis) PDF certificate.
 * Runs in Node.js environment to handle font rendering and buffer generation.
 */
export async function generateWhtPdfAction(commissionId: string) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { WhtCertificateTemplate } =
      await import("./components/WhtCertificateTemplate");
    const React = await import("react");

    // 1. Fetch data for the certificate
    const res = await getWhtCertificateDataAction(commissionId);
    if (!res.success || !res.data) {
      throw new Error(res.error || "ไม่สามารถดึงข้อมูลสำหรับออกใบรับรองได้");
    }

    // 2. Render PDF to Buffer
    const element = React.createElement(WhtCertificateTemplate, {
      data: res.data,
    });
    const buffer = await renderToBuffer(element as React.ReactElement<any>);

    // 3. Log Audit
    await logAudit({ supabase, user, role }, {
      action: "finance.wht_pdf_generated",
      entity: "FINANCE",
      entityId: commissionId,
      metadata: { 
        summary: `ออกใบรับรองหักภาษี ณ ที่จ่าย (50 ทวิ) สำหรับรายการ ID: ${commissionId.slice(0, 8)}`,
        commissionId 
      },
    });

    // 4. Return as Base64 for client-side download
    return {
      success: true,
      fileName: `WHT_${res.data.referenceCode}.pdf`,
      content: buffer.toString("base64"),
    };
  } catch (error: unknown) {
    logger.error("generateWhtPdf Error", error, { source: "finance-actions", commissionId });
    return { success: false, error: (error as Error).message };
  }
}



