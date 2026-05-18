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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required but missing");
    // Validate Input
    const validated = createDealSchema.parse(input);

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

    const scoped = getScopedRevenueClient(supabase, tenantId);

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
          duration_months: duration_months_val 
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
        { supabase, tenantId },
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
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    return { success: true, message: "สร้างดีลสำเร็จ", data };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "AUTHZ_ERROR") {
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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    const validated = updateDealSchema.parse(input);

    // Auth Check
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    const scoped = getScopedRevenueClient(supabase, tenantId);

    const { data: currentDeal, error: currentErr } = await scoped
      .deals()
      .select("id, status, property_id, deal_type, tenant_id, transaction_date, metadata")
      .eq("id", validated.id)
      .single();

    if (currentErr || !currentDeal) {
      return { success: false, message: "Deal not found" };
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
          ...(duration_months !== undefined ? { duration_months } : {})
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
        { supabase, tenantId },
        prevStatus === "CLOSED_WIN" ? prevPropertyId : null,
        nextStatus === "CLOSED_WIN" ? nextPropertyId : null,
        currentDeal.deal_type,
        validated.deal_type || currentDeal.deal_type,
      );
    } else if (nextPropertyId) {
      if (isBecameWon) {
        await adjustPropertyStock(
          { supabase, tenantId },
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
          { supabase, tenantId },
          nextPropertyId,
          -1,
          currentDeal.deal_type as "SALE" | "RENT",
        );
      }
    }

    revalidatePath("/protected/deals");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    return { success: true, message: "อัปเดตดีลสำเร็จ" };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "AUTHZ_ERROR") {
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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    const scoped = getScopedRevenueClient(supabase, tenantId);

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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    assertStaff(role);

    const scoped = getScopedRevenueClient(supabase, tenantId);

    const { data: deal, error: dealErr } = await scoped
      .deals()
      .select(`
        id,
        created_by,
        partner_co_broker_id,
        commission_total,
        property_id,
        property:properties_core!property_id (
          id,
          assigned_to
        )
      `)
      .eq("id", dealId)
      .single();

    if (dealErr || !deal) throw new Error("ไม่พบข้อมูลดีล");

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

    const agentIds = [deal.property?.assigned_to, deal.created_by].filter(Boolean) as string[];
    let agentProfiles: ProfileWithTax[] = [];
    
    if (agentIds.length > 0) {
      const { data } = await supabase
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
      const { data } = await supabase
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
      splits = calculateAdvancedSplit(
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
      ).map((s) => {
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
    return { success: true, message: "คำนวณค่าคอมมิชชั่นและออกใบแจ้งหนี้สำเร็จ" };
  } catch (error: unknown) {
    console.error("Calculate Commissions Error:", error);
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : mapDbError(error);
    return { success: false, message };
  }
}
