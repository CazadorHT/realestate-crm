"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { addMonths } from "date-fns";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
  AuthContext,
} from "@/lib/authz";
import { Database } from "@/lib/database.types.generated";
import { mapDbError } from "@/lib/db-error";
import {
  createDealSchema,
  updateDealSchema,
  CreateDealInput,
  UpdateDealInput,
} from "./schema";
import { z } from "zod";
import { Deal, DealType, SplitWithTax, ProfileWithTax, CoBrokerWithTax } from "./types";
import { logAudit } from "@/lib/audit";
import { getCommissionRulesAction } from "../dashboard/actions/commission-actions";
import {
  calculateAdvancedSplit,
  CommissionRole,
} from "@/lib/finance/commissions";
import { getScopedRevenueClient } from "./logic/scoped-client";
import { getDealDiff } from "./logic/diff";
import { FinanceMath } from "@/lib/finance/precision";
import { createAdminClient } from "@/lib/supabase/admin";

// Helper: Sync a CLOSED_WIN deal to financial_ledger_v3 (idempotent via upsert-like logic)
// - เมื่อดีลเป็น CLOSED_WIN: บันทึกยอดคอมมิชชันหักส่วน Co-Agent/Co-Broker ออก
// - เมื่อดีลไม่ใช่ CLOSED_WIN แล้ว: ลบรายการที่เกี่ยวข้องออก
async function syncDealToLedger(
  supabase: ReturnType<typeof createAdminClient>,
  dealId: string,
  tenantId: string,
) {
  try {
    // 1. ดึงข้อมูลดีลและ commissions ล่าสุด
    const { data: deal } = await supabase
      .from("crm_deals_v3")
      .select("id, status, commission_total, branch_id")
      .eq("id", dealId)
      .single();

    // 2. ลบรายการเก่าของดีลนี้ออกก่อนเสมอ (idempotent)
    await supabase
      .from("financial_ledger_v3")
      .delete()
      .eq("reference_entity", "DEAL")
      .eq("reference_id", dealId)
      .eq("transaction_type", "deal_closed");

    // ถ้าดีลไม่ใช่ CLOSED_WIN ให้หยุดแค่นี้ (ลบแล้วก็จบ)
    if (!deal || deal.status !== "CLOSED_WIN") return;

    const grossCommission = Number(deal.commission_total) || 0;
    if (grossCommission <= 0) return;

    // 3. คำนวณส่วนหัก Co-Agent/Co-Broker ภายนอก (recipient_role = 'CO_AGENT')
    const { data: commissions } = await supabase
      .from("crm_deal_commissions_v3")
      .select("recipient_role, amount, net_amount, tax_amount")
      .eq("deal_id", dealId)
      .eq("tenant_id", tenantId);

    let coAgentGross = 0;
    if (commissions && commissions.length > 0) {
      coAgentGross = commissions
        .filter((c: { recipient_role: string }) => c.recipient_role === "CO_AGENT")
        .reduce((sum: number, c: { amount: number | null }) => sum + (Number(c.amount) || 0), 0);
    }

    // ยอดสุทธิขั้นต้นก่อนหัก Agent Cut (ค่าคอมฯ รวม - ส่วน Co-Agent ภายนอก)
    const netCompanyAmount = Math.max(0, grossCommission - coAgentGross);
    if (netCompanyAmount <= 0) return;

    let agencyNet = 0;
    if (commissions && commissions.length > 0) {
      const agencyComm = commissions.find((c: { recipient_role: string }) => c.recipient_role === "AGENCY");
      if (agencyComm) {
        agencyNet = Number(agencyComm.net_amount ?? agencyComm.amount) || 0;
      } else {
        // If no AGENCY role record, calculate total minus non-AGENCY (agent splits)
        const agentSplits = commissions
          .filter((c: { recipient_role: string }) => c.recipient_role !== "AGENCY")
          .reduce((sum: number, c: { amount: number | null }) => sum + (Number(c.amount) || 0), 0);
        agencyNet = Math.max(0, grossCommission - agentSplits);
      }
    } else {
      agencyNet = netCompanyAmount;
    }

    // 4. บันทึกลง financial_ledger_v3
    await supabase.from("financial_ledger_v3").insert({
      tenant_id: tenantId,
      branch_id: deal.branch_id || null,
      transaction_type: "deal_closed",
      reference_entity: "DEAL",
      reference_id: dealId,
      amount_net: agencyNet,
      amount_total: netCompanyAmount,
      tax_amount: 0,
      wht_amount: 0,
      status: "cleared",
      metadata: {
        gross_commission: grossCommission,
        co_agent_deduction: coAgentGross,
        agency_net: agencyNet,
        synced_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    // ไม่ให้ error ของ ledger sync มา block การทำงานหลัก เพียงแต่ log เตือน
    console.error("[syncDealToLedger] Failed to sync deal to ledger:", err);
  }
}


// Helper: Adjust property stock and auto-update status using Atomic RPC
async function adjustPropertyStock(
  ctx: { supabase: AuthContext["supabase"]; tenantId: string },
  propertyId: string,
  adjustment: number, // +1 or -1
  dealType: "SALE" | "RENT",
) {
  if (!propertyId) return;

  const scoped = getScopedRevenueClient(ctx.supabase, ctx.tenantId);
  const { error } = await (scoped.rpc as Function)("sync_property_inventory_atomic", {
    p_property_id: propertyId,
    p_adjustment: adjustment,
    p_deal_type: dealType,
    p_tenant_id: ctx.tenantId,
  });

  if (error) {
    console.error("Atomic Stock Update Error:", error);
    throw new Error("Failed to update property stock atomically");
  }
}

// Helper: Swap property stocks atomically
async function swapPropertyStock(
  ctx: { supabase: AuthContext["supabase"]; tenantId: string },
  oldPropertyId: string | null,
  newPropertyId: string | null,
  oldDealType: string,
  newDealType: string,
) {
  const { error } = await (ctx.supabase.rpc as Function)("swap_property_stock_atomic", {
    p_old_property_id: (oldPropertyId as string) || "",
    p_new_property_id: (newPropertyId as string) || "",
    p_old_deal_type: oldDealType,
    p_new_deal_type: newDealType,
    p_tenant_id: ctx.tenantId,
  });

  if (error) {
    console.error("Atomic Property Swap Error:", error);
    throw new Error("Failed to swap property stocks atomically");
  }
}

export async function createDealAction(input: CreateDealInput) {
  try {
    const { supabase, user, role, tenantId: userTenantId } = await requireAuthContext();
    // Validate Input
    const validated = createDealSchema.parse(input);

    const adminSupabase = createAdminClient();

    // Fallback: If user is in "ALL" view, resolve tenantId from the selected property
    let tenantId = userTenantId;
    if (!tenantId && validated.property_id) {
      const { data: propData } = await adminSupabase
        .from("properties_core")
        .select("tenant_id")
        .eq("id", validated.property_id)
        .single();
      if (propData?.tenant_id) {
        tenantId = propData.tenant_id;
      }
    }

    if (!tenantId) throw new Error("Tenant ID is required but missing");

    // Auth Check: Agent & Admin can create deals
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    // 1. Calculate end date for RENT deals
    const deal_type = validated.deal_type;
    const transaction_date = validated.transaction_date;
    const duration_months_val = validated.duration_months;
    
    let transaction_end_date = undefined;
    if (deal_type === "RENT" && transaction_date && duration_months_val) {
      transaction_end_date = addMonths(new Date(transaction_date), duration_months_val).toISOString();
    }

    const { 
      commission_amount, 
      commission_percent, 
      duration_months, 
      internal_co_agent_id_temp,
      partner_co_broker_ids,
      ...insertData 
    } = {
      ...validated,
      transaction_end_date
    };

    // 2. Clean empty strings to avoid DB constraint errors
    Object.keys(insertData).forEach((k) => {
      const key = k as keyof typeof insertData;
      if (insertData[key] === "") {
        delete insertData[key];
      }
    });

    const scoped = getScopedRevenueClient(adminSupabase, tenantId);

    const { data, error } = await scoped
      .deals()
      .insert({
        ...insertData,
        title: `Deal for Property ${validated.property_id}`,
        tenant_id: tenantId,
        created_by: user.id,
        commission_total: commission_amount,
        metadata: { 
          commission_percent,
          duration_months: duration_months_val,
          co_agent_id: internal_co_agent_id_temp || undefined,
        },
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create deal: No data returned");

    await logAudit(
      { supabase, user, role },
      {
        action: "deal.create",
        entity: "deals",
        entityId: data.id,
        summary: `สร้างดีลใหม่ประเภท "${validated.deal_type === "SALE" ? "ขาย" : "เช่า"}" สำหรับทรัพย์สิน ID: ${validated.property_id}`,
        metadata: validated,
      },
    );

    // Auto-update stock if deal is WON
    if (validated.status === "CLOSED_WIN" && validated.property_id) {
      await adjustPropertyStock(
        { supabase: adminSupabase, tenantId },
        validated.property_id,
        1,
        validated.deal_type,
      );

      // 🔔 Notify Admins about the closed deal
      try {
        const { notifyAdminsAction } = await import("@/lib/actions/notifications");
        await notifyAdminsAction({
          type: "INFO",
          title: "ปิดการขายสำเร็จ! 🏆",
          message: `มีการปิดการขาย "${validated.deal_type === "SALE" ? "ขาย" : "เช่า"}" สำหรับทรัพย์สิน ID: ${validated.property_id}`,
          link: `/protected/deals`,
        });
      } catch (notifyErr) {
        console.error("Failed to notify admins of closed deal:", notifyErr);
      }
    }

    revalidatePath(`/protected/leads/${validated.lead_id}`);
    revalidatePath("/protected/deals");
    // 💰 Sync to financial ledger for dashboard stats
    await syncDealToLedger(adminSupabase, data.id, tenantId);
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    return { success: true, message: "สร้างดีลสำเร็จ", data };
  } catch (error: unknown) {
    if (error && typeof error === "object" && (("name" in error && (error as { name: string }).name === "AuthzError") || ("code" in error && (error as { code: string }).code === "AUTHZ_ERROR"))) {
      return authzFail(error);
    }
    console.error("Create Deal Error:", error);
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : mapDbError(error);
    return { success: false, message };
  }
}

export async function updateDealAction(input: UpdateDealInput) {
  try {
    const { supabase, user, role, tenantId: userTenantId } = await requireAuthContext();
    const validated = updateDealSchema.parse(input);

    const adminSupabase = createAdminClient();

    // Fallback: If user is in "ALL" view, resolve tenantId from the existing deal
    let tenantId = userTenantId;
    if (!tenantId && validated.id) {
      const { data: dealData } = await adminSupabase
        .from("crm_deals_v3")
        .select("tenant_id")
        .eq("id", validated.id)
        .single();
      if (dealData?.tenant_id) {
        tenantId = dealData.tenant_id;
      }
    }

    if (!tenantId) throw new Error("Tenant ID is required but missing");

    // Auth Check
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    const scoped = getScopedRevenueClient(adminSupabase, tenantId);

    const { data: currentDeal, error: currentErr } = await scoped
      .deals()
      .select("id, status, property_id, deal_type, tenant_id, transaction_date, metadata, created_by, agent_id")
      .eq("id", validated.id)
      .single();

    if (currentErr || !currentDeal) {
      return { success: false, message: "Deal not found" };
    }

    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    const isOwner = currentDeal.created_by === user.id || currentDeal.agent_id === user.id;

    if (!isOwner && !canBypassOwnership) {
      return { success: false, message: "คุณไม่มีสิทธิ์แก้ไขดีลของผู้อื่น" };
    }

    const prevStatus = currentDeal.status;
    const prevPropertyId = currentDeal.property_id;

    const nextStatus = validated.status ?? prevStatus;
    const nextPropertyId = validated.property_id ?? prevPropertyId;

    // 1. Calculate end date with merge logic for partial updates
    const effectiveDealType = validated.deal_type || currentDeal.deal_type;
    const effectiveDate = validated.transaction_date || currentDeal.transaction_date;
    // Get duration from input OR from saved metadata if it exists
    const prevDuration = (currentDeal.metadata as Record<string, unknown>)?.duration_months as number | undefined;
    const effectiveDuration = validated.duration_months || prevDuration;

    let transaction_end_date = undefined;
    if (effectiveDealType === "RENT" && effectiveDate && effectiveDuration) {
      transaction_end_date = addMonths(new Date(effectiveDate), effectiveDuration).toISOString();
    }

    const { 
      commission_amount, 
      commission_percent, 
      duration_months, 
      internal_co_agent_id_temp,
      partner_co_broker_ids,
      ...updateData 
    } = {
      ...validated,
      ...(transaction_end_date ? { transaction_end_date } : {})
    };

    // 2. Clean empty strings
    Object.keys(updateData).forEach((k) => {
      const key = k as keyof typeof updateData;
      if (updateData[key] === "") {
        delete updateData[key];
      }
    });

    const { error } = await scoped
      .deals()
      .update({
        ...updateData,
        commission_total: commission_amount,
        metadata: { 
          ...(currentDeal.metadata as Record<string, unknown>),
          ...(commission_percent !== undefined ? { commission_percent } : {}),
          ...(duration_months !== undefined ? { duration_months } : {}),
          ...(internal_co_agent_id_temp !== undefined ? { co_agent_id: internal_co_agent_id_temp } : {})
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id);

    if (error) throw new Error(mapDbError(error));

    const diff = getDealDiff(currentDeal as Deal, validated);
    const summary = diff.length > 0 ? `แก้ไขดีล: ${diff.join(", ")}` : "อัปเดตข้อมูลดีลทั่วไป";

    await logAudit(
      { supabase, user, role },
      {
        action: "deal.update",
        entity: "deals",
        entityId: validated.id,
        summary,
        metadata: { ...validated, diff },
      },
    );

    // --- 💎 10/10 Atomic Stock Management Logic ---
    const isPropertySwapped = prevPropertyId !== nextPropertyId;
    const isBecameWon = prevStatus !== "CLOSED_WIN" && nextStatus === "CLOSED_WIN";
    const isNoLongerWon = prevStatus === "CLOSED_WIN" && nextStatus !== "CLOSED_WIN";

    if (isPropertySwapped) {
      await swapPropertyStock(
        { supabase: adminSupabase, tenantId },
        prevStatus === "CLOSED_WIN" ? prevPropertyId : null,
        nextStatus === "CLOSED_WIN" ? nextPropertyId : null,
        currentDeal.deal_type,
        validated.deal_type || currentDeal.deal_type,
      );
    } else if (nextPropertyId) {
      if (isBecameWon) {
        await adjustPropertyStock(
          { supabase: adminSupabase, tenantId },
          nextPropertyId,
          1,
          (validated.deal_type || currentDeal.deal_type) as "SALE" | "RENT",
        );

        try {
          const { notifyAdminsAction } = await import("@/lib/actions/notifications");
          await notifyAdminsAction({
            type: "INFO",
            title: "ปิดการขายสำเร็จ! 🏆",
            message: `มีการปิดการขาย "${currentDeal.deal_type === "SALE" ? "ขาย" : "เช่า"}" สำหรับทรัพย์สิน ID: ${nextPropertyId}`,
            link: `/protected/deals`,
          });
        } catch (notifyErr) {
          console.error("Failed to notify admins of closed deal:", notifyErr);
        }
      } else if (isNoLongerWon) {
        await adjustPropertyStock(
          { supabase: adminSupabase, tenantId },
          nextPropertyId,
          -1,
          currentDeal.deal_type as "SALE" | "RENT",
        );
      }
    }

    revalidatePath("/protected/deals");
    // 💰 Sync to financial ledger for dashboard stats (re-syncs after any deal update)
    await syncDealToLedger(adminSupabase, validated.id, tenantId);
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    return { success: true, message: "อัปเดตดีลสำเร็จ" };
  } catch (error: unknown) {
    if (error && typeof error === "object" && (("name" in error && (error as { name: string }).name === "AuthzError") || ("code" in error && (error as { code: string }).code === "AUTHZ_ERROR"))) {
      return authzFail(error);
    }
    console.error("Update Deal Error:", error);
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : mapDbError(error);
    return { success: false, message };
  }
}

export async function deleteDealAction(dealId: string, leadId: string) {
  try {
    const { supabase, user, role, tenantId: userTenantId } = await requireAuthContext();

    const adminSupabase = createAdminClient();

    // Fetch deal information to verify ownership and resolve tenantId
    const { data: dealData, error: findErr } = await adminSupabase
      .from("crm_deals_v3")
      .select("tenant_id, created_by, agent_id")
      .eq("id", dealId)
      .single();

    if (findErr || !dealData) {
      return { success: false, message: "ไม่พบข้อมูลดีล" };
    }

    const tenantId = userTenantId || dealData.tenant_id;
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    const isOwner = dealData.created_by === user.id || dealData.agent_id === user.id;

    if (!isOwner && !canBypassOwnership) {
      return { success: false, message: "คุณไม่มีสิทธิ์ลบดีลของผู้อื่น" };
    }

    const scoped = getScopedRevenueClient(adminSupabase, tenantId);

    const { data: count, error: deleteErr } = await (scoped.rpc as Function)(
      "bulk_delete_deals_atomic",
      {
        p_deal_ids: [dealId],
        p_tenant_id: tenantId,
      },
    );

    if (deleteErr) throw new Error(mapDbError(deleteErr));

    await logAudit(
      { supabase, user, role },
      {
        action: "deal.delete",
        entity: "deals",
        entityId: dealId,
        summary: `ลบดีลสำเร็จ (พร้อมประมวลผลสต็อกและสถานะอสังหาฯ คืนอัตโนมัติแบบ Atomic)`,
        metadata: { leadId, deletedCount: count },
      },
    );

    revalidatePath(`/protected/leads/${leadId}`);
    revalidatePath("/protected/deals");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");

    return { success: true, message: "ลบดีลสำเร็จและปรับปรุงสต็อกคืนเรียบร้อย" };
  } catch (error: unknown) {
    console.error("Delete Deal Error:", error);
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : mapDbError(error);
    return { success: false, message };
  }
}

export async function calculateAndSaveCommissionsAction(dealId: string) {
  try {
    const { supabase, user, role, tenantId: userTenantId } = await requireAuthContext();
    assertStaff(role);

    const adminSupabase = createAdminClient();

    // Fallback: If user is in "ALL" view, resolve tenantId from the existing deal
    let tenantId = userTenantId;
    if (!tenantId) {
      const { data: dealData } = await adminSupabase
        .from("crm_deals_v3")
        .select("tenant_id")
        .eq("id", dealId)
        .single();
      if (dealData?.tenant_id) {
        tenantId = dealData.tenant_id;
      }
    }

    if (!tenantId) throw new Error("Tenant ID is required but missing");

    const scoped = getScopedRevenueClient(adminSupabase, tenantId);

    const { data: deal, error: dealErr } = await scoped
      .deals()
      .select(`
        id,
        created_by,
        agent_id,
        partner_co_broker_id,
        co_agent_name,
        co_agent_contact,
        co_agent_online,
        commission_total,
        property_id,
        metadata,
        property:properties_core!property_id (
          id,
          assigned_to
        )
      `)
      .eq("id", dealId)
      .single();

    if (dealErr || !deal) throw new Error("ไม่พบข้อมูลดีล");

    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    const isOwner = deal.created_by === user.id || deal.agent_id === user.id;

    if (!isOwner && !canBypassOwnership) {
      throw new Error("คุณไม่มีสิทธิ์คำนวณคอมมิชชั่นของดีลผู้อื่น");
    }

    const rulesRes = await getCommissionRulesAction();
    const globalDefaultWht = rulesRes.success ? (rulesRes.data?.defaultWhtRate || 3) : 3;
    const rules = rulesRes.success && rulesRes.data ? rulesRes.data : {
      type: "TIERED" as const,
      tiers: [],
      enableAdvancedSplit: true,
      defaultListingPercent: 30,
      defaultClosingPercent: 50,
      defaultAgencyPercent: 20,
      defaultTeamPoolPercent: 2,
      enableTeamPoolByDefault: false,
    };

    const internalCoAgentId = (deal.metadata as any)?.co_agent_id as string | undefined;

    const agentIds = [deal.property?.assigned_to, deal.created_by, internalCoAgentId].filter(Boolean) as string[];
    let agentProfiles: ProfileWithTax[] = [];
    
    if (agentIds.length > 0) {
      const { data } = await adminSupabase
        .from("identities_v3")
        .select("id, social_links")
        .in("id", agentIds);
      if (data) {
        agentProfiles = data.map(d => ({
          ...d,
          default_tax_rate: (d.social_links as Record<string, unknown>)?.default_tax_rate ?? null
        })) as unknown as ProfileWithTax[];
      }
    }

    let coBrokerProfile: CoBrokerWithTax | null = null;
    if (deal.partner_co_broker_id) {
      const { data } = await adminSupabase
        .from("identities_v3")
        .select("id, social_links")
        .eq("id", deal.partner_co_broker_id)
        .single();
      if (data) {
        coBrokerProfile = {
          ...data,
          default_tax_rate: (data.social_links as Record<string, unknown>)?.default_tax_rate ?? null
        } as unknown as CoBrokerWithTax;
      }
    }

    const getTaxRateForAgent = (id?: string) => {
      const p = agentProfiles.find((ap) => ap.id === id);
      return (p?.default_tax_rate ?? globalDefaultWht);
    };

    const coBrokerTaxRate = (coBrokerProfile?.default_tax_rate ?? globalDefaultWht);

    let splits: SplitWithTax[] = [];

    if (rules.enableAdvancedSplit) {
      // 1. Calculate standard splits (Listing 30%, Closing 50%, Agency 20%)
      const standardSplits = calculateAdvancedSplit(
        deal.commission_total || 0,
        {
          listingPercent: rules.defaultListingPercent ?? 30,
          closingPercent: rules.defaultClosingPercent ?? 50,
          agencyPercent: rules.defaultAgencyPercent ?? 20,
          teamPoolPercent: rules.defaultTeamPoolPercent ?? 2,
          enableTeamPool: rules.enableTeamPoolByDefault ?? false,
        },
        {
          listingAgentId: deal.property?.assigned_to || undefined,
          closingAgentId: deal.created_by || undefined,
        },
        globalDefaultWht
      );

      // 2. Adjust splits if internal co-agent is present (split closing 50/50)
      standardSplits.forEach((s) => {
        if (s.role === "CLOSING" && internalCoAgentId) {
          const originalClosingPercent = s.percentage;
          const originalClosingAmount = s.amount;
          
          // Split Closing Agent's share 50/50
          const splitPercent = originalClosingPercent / 2;
          const splitAmount = originalClosingAmount / 2;

          // Closing Agent (Closing Partner 1)
          splits.push({
            ...s,
            percentage: splitPercent,
            amount: splitAmount,
            agentId: s.agentId,
          });

          // Internal Co-Agent (Closing Partner 2)
          splits.push({
            role: "CLOSING" as CommissionRole,
            percentage: splitPercent,
            amount: splitAmount,
            whtAmount: 0, // Calculated below
            netAmount: splitAmount,
            agentId: internalCoAgentId,
          });
        } else {
          splits.push(s);
        }
      });

      // 3. Map tax rate & calculate net values
      splits = splits.map((s) => {
        let actualTaxRate = globalDefaultWht;
        if (s.role === "LISTING" || s.role === "CLOSING") {
          actualTaxRate = getTaxRateForAgent(s.agentId);
        } else if (s.role === "CO_AGENT") {
          actualTaxRate = coBrokerTaxRate;
        }

        const whtAmount = s.role !== "AGENCY" && s.role !== "TEAM_POOL" 
          ? FinanceMath.calculateWht(s.amount, actualTaxRate / 100) 
          : FinanceMath.toDecimal(0);

        return {
          ...s,
          whtAmount: whtAmount.toNumber(),
          netAmount: FinanceMath.toDecimal(s.amount).minus(whtAmount).toNumber(),
          taxRate: actualTaxRate
        } as SplitWithTax;
      });
    } else {
      splits = [
        {
          role: "AGENCY" as CommissionRole,
          percentage: 100,
          amount: deal.commission_total || 0,
          whtAmount: 0,
          netAmount: deal.commission_total || 0,
        },
      ];
    }

    await scoped
      .commissions()
      .delete()
      .eq("deal_id", dealId);

    const totalBaseAmount = deal.commission_total || 0;
    const vatAmount = 0;
    const totalInvoiceAmount = totalBaseAmount + vatAmount;

    const { error: insertErr } = await scoped
      .commissions()
      .insert(splits.map((s) => ({
        tenant_id: tenantId,
        deal_id: dealId,
        recipient_id: s.agentId ?? (s.role === "CO_AGENT" ? deal.partner_co_broker_id : null),
        recipient_role: s.role,
        percentage: s.percentage,
        amount: s.amount,
        tax_amount: s.whtAmount,
        net_amount: s.netAmount,
        tax_rate: (s.taxRate || globalDefaultWht),
        status: "UNPAID",
        metadata: { generated_at: new Date().toISOString() },
      })));

    if (insertErr) throw new Error(mapDbError(insertErr));

    await scoped.deals().update({
      commission_total: totalBaseAmount,
      vat_amount: vatAmount,
      net_received: totalInvoiceAmount,
      metadata: { last_calculated_at: new Date().toISOString() }
    }).eq("id", dealId);

    await logAudit(
      { supabase, user, role },
      {
        action: "finance.calculate",
        entity: "deals",
        entityId: dealId,
        summary: `คำนวณส่วนแบ่งคอมมิชชั่นเรียบร้อย (Pure V3)`,
        metadata: { totalAmount: totalBaseAmount }
      }
    );

    revalidatePath("/protected/deals/[id]");
    // 💰 Re-sync ledger now that commissions (and co-agent splits) are updated
    await syncDealToLedger(adminSupabase, dealId, tenantId);
    revalidateTag("dashboard-stats", "seconds");
    return { success: true, message: "คำนวณค่าคอมมิชชั่นและออกใบแจ้งหนี้สำเร็จ" };
  } catch (error: unknown) {
    console.error("Calculate Commissions Error:", error);
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : mapDbError(error);
    return { success: false, message };
  }
}

export async function updateDealCommissionsAction(
  dealId: string,
  commissionsList: {
    id?: string;
    recipient_id?: string | null;
    recipient_role: string;
    percentage: number;
    amount: number;
    tax_rate?: number;
    tax_amount: number;
    net_amount: number;
  }[]
) {
  try {
    const { supabase, user, role, tenantId: userTenantId } = await requireAuthContext();
    assertStaff(role);

    const adminSupabase = createAdminClient();
    let tenantId = userTenantId;
    if (!tenantId) {
      const { data: dealData } = await adminSupabase
        .from("crm_deals_v3")
        .select("tenant_id")
        .eq("id", dealId)
        .single();
      if (dealData?.tenant_id) {
        tenantId = dealData.tenant_id;
      }
    }

    if (!tenantId) throw new Error("Tenant ID is required but missing");
    const scoped = getScopedRevenueClient(adminSupabase, tenantId);

    // 1. Find all existing commission IDs for this deal
    const { data: existingComms, error: fetchErr } = await scoped
      .commissions()
      .select("id")
      .eq("deal_id", dealId);
    if (fetchErr) throw new Error(mapDbError(fetchErr));

    const existingIds = (existingComms || []).map((c) => c.id);
    const incomingIds = commissionsList.map((c) => c.id).filter(Boolean) as string[];

    // 2. Delete any commissions that are NOT in the incoming list
    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
    if (idsToDelete.length > 0) {
      const { error: deleteErr } = await scoped
        .commissions()
        .delete()
        .in("id", idsToDelete);
      if (deleteErr) throw new Error(mapDbError(deleteErr));
    }

    // 3. Insert new and update existing commissions
    for (const comm of commissionsList) {
      if (comm.id) {
        // Update
        const { error: updateErr } = await scoped
          .commissions()
          .update({
            recipient_id: comm.recipient_id || null,
            recipient_role: comm.recipient_role,
            percentage: comm.percentage,
            amount: comm.amount,
            tax_rate: comm.tax_rate ?? 0,
            tax_amount: comm.tax_amount,
            net_amount: comm.net_amount,
          })
          .eq("id", comm.id);
        if (updateErr) throw new Error(mapDbError(updateErr));
      } else {
        // Insert new
        const { error: insertErr } = await scoped
          .commissions()
          .insert({
            deal_id: dealId,
            tenant_id: tenantId,
            recipient_id: comm.recipient_id || null,
            recipient_role: comm.recipient_role,
            percentage: comm.percentage,
            amount: comm.amount,
            tax_rate: comm.tax_rate ?? 0,
            tax_amount: comm.tax_amount,
            net_amount: comm.net_amount,
            status: "UNPAID",
          });
        if (insertErr) throw new Error(mapDbError(insertErr));
      }
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "finance.commission_update",
        entity: "deals",
        entityId: dealId,
        summary: `แก้ไขการจัดสรรค่าคอมมิชชั่นของดีลด้วยตนเอง`,
        metadata: { commissionsCount: commissionsList.length }
      }
    );

    revalidatePath(`/protected/deals/${dealId}`);
    // 💰 Re-sync ledger after manual commission adjustment (co-agent deduction may have changed)
    await syncDealToLedger(adminSupabase, dealId, tenantId);
    revalidateTag("dashboard-stats", "seconds");
    return { success: true, message: "บันทึกการปรับปรุงค่าคอมมิชชั่นสำเร็จ" };
  } catch (error: unknown) {
    console.error("Update Commissions Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}
