"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
  AuthContext,
} from "@/lib/authz";
import { type PostgrestSingleResponse } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { mapDbError } from "@/lib/db-error";
import {
  createDealSchema,
  updateDealSchema,
  CreateDealInput,
  UpdateDealInput,
} from "./schema";
import { z } from "zod";
import { Deal, DealStatus, DealType, DealCommission, SplitWithTax } from "./types";
import { logAudit } from "@/lib/audit";
import { getCommissionRulesAction } from "../dashboard/actions/commission-actions";
import {
  calculateAdvancedSplit,
  CommissionRole,
  CommissionSplitResult,
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
  const { error } = await scoped.rpc("sync_property_inventory_atomic", {
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
  const { error } = await ctx.supabase.rpc("swap_property_stock_atomic", {
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
// ... (rest of the code unchanged until updateDealAction)

    // Validate Input
    const validated = createDealSchema.parse(input);

    // Auth Check: Agent & Admin can create deals
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    // Calculate end date for RENT deals if duration is provided
    const dealData = { ...validated };
    if (
      dealData.deal_type === "RENT" &&
      dealData.transaction_date &&
      dealData.duration_months
    ) {
      dealData.transaction_end_date = addMonths(
        new Date(dealData.transaction_date),
        dealData.duration_months,
      ).toISOString();
    }

    // duration_months is a virtual field for the form, remove it before DB insert
    // Use destructuring to cleanly separate duration_months from the rest
    const { duration_months, ...insertData } = dealData;

    // Clean empty/nullable fields (do not store empty strings).
    const _cleanKeys = [
      "transaction_date",
      "transaction_end_date",
      "co_agent_name",
      "co_agent_contact",
      "co_agent_online",
      "source",
      "partner_co_broker_id",
    ] as const;
    _cleanKeys.forEach((k) => {
      const key = k as keyof typeof insertData;
      if (insertData[key] === "" || insertData[key] === null) {
        delete insertData[key];
      }
    });

    // Remove any keys that are explicitly `undefined` (helpful for partial updates to preserve DB values)
    Object.keys(insertData).forEach((k) => {
      const key = k as keyof typeof insertData;
      if (insertData[key] === undefined) {
        delete insertData[key];
      }
    });

    const scoped = getScopedRevenueClient(supabase, tenantId);

    const { data, error } = await scoped
      .deals()
      .insert({
        ...insertData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

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
    }

    revalidatePath(`/protected/leads/${validated.lead_id}`);
    revalidatePath("/protected/deals");
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
      .select("id, status, property_id, deal_type, tenant_id")
      .eq("id", validated.id)
      .single();

    if (currentErr || !currentDeal) {
      return { success: false, message: "Deal not found" };
    }

    const prevStatus = currentDeal.status;
    const prevPropertyId = currentDeal.property_id;

    const nextStatus = validated.status ?? prevStatus;
    const nextPropertyId = validated.property_id ?? prevPropertyId;

    // Calculate end date for RENT deals if duration is updated
    const dealData = { ...validated };
    if (
      dealData.deal_type === "RENT" &&
      dealData.transaction_date &&
      dealData.duration_months
    ) {
      dealData.transaction_end_date = addMonths(
        new Date(dealData.transaction_date),
        dealData.duration_months,
      ).toISOString();
    }
    // Cleanup virtual field
    const { duration_months: _unused, ...updateData } = dealData;

    // Clean empty-string fields before update (keep `null` to explicitly clear DB columns)
    const _updateCleanKeys = [
      "transaction_date",
      "transaction_end_date",
      "co_agent_name",
      "co_agent_contact",
      "co_agent_contact",
      "source",
      "partner_co_broker_id",
    ] as const;
    _updateCleanKeys.forEach((k) => {
      const key = k as keyof typeof updateData;
      if (updateData[key] === "") {
        delete updateData[key];
      }
    });

    // Remove explicit undefined keys
    Object.keys(updateData).forEach((k) => {
      const key = k as keyof typeof updateData;
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { error } = await scoped
      .deals()
      .update(updateData)
      .eq("id", validated.id)
      .single();

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
      // Logic: If we are swapping, we only care if either the OLD was won or the NEW is won
      // We call the Atomic Swap RPC which handles the transition safely.
      await swapPropertyStock(
        { supabase, tenantId },
        prevStatus === "CLOSED_WIN" ? prevPropertyId : null,
        nextStatus === "CLOSED_WIN" ? nextPropertyId : null,
        currentDeal.deal_type,
        validated.deal_type || currentDeal.deal_type,
      );
    } else if (nextPropertyId) {
      // Same Property, just Status Change
      if (isBecameWon) {
        await adjustPropertyStock(
          { supabase, tenantId },
          nextPropertyId,
          1,
          validated.deal_type || currentDeal.deal_type,
        );
      } else if (isNoLongerWon) {
        await adjustPropertyStock(
          { supabase, tenantId },
          nextPropertyId,
          -1,
          currentDeal.deal_type,
        );
      }
    }

    revalidatePath("/protected/deals");
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

    // 💎 10/10 HARDENING: Use the Atomic RPC even for single deletes to guarantee integrity
    const { data: count, error: deleteErr } = await scoped.rpc(
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

    // 1. Get Deal with Property Details
    const { data: deal, error: dealErr } = await scoped
      .deals()
      .select(`
        *,
        property:properties (
          id,
          assigned_to
        )
      `)
      .eq("id", dealId)
      .single();

    if (dealErr || !deal) throw new Error("ไม่พบข้อมูลดีล");

    // 2. Get Global Rules & Tax Default
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

    // 3. Fetch Agent/Co-broker Specific Tax Rates (Fallback Logic)
    const agentIds = [deal.property?.assigned_to, deal.created_by].filter(Boolean) as string[];
    // Use Record<string, any> to bypass missing column in types while it's being reconciled in DB
    let agentProfiles: any[] = [];
    
    if (agentIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, default_tax_rate" as any)
        .in("id", agentIds);
      if (data) agentProfiles = data;
    }

    let coBrokerProfile: any = null;
    if (deal.partner_co_broker_id) {
      const { data } = await supabase
        .from("co_brokers")
        .select("id, default_tax_rate" as any)
        .eq("id", deal.partner_co_broker_id)
        .single();
      if (data) coBrokerProfile = data;
    }

    const getTaxRateForAgent = (id?: string) => {
      const p = agentProfiles.find((ap: any) => ap.id === id);
      return (p?.default_tax_rate as number | undefined) ?? globalDefaultWht;
    };

    const coBrokerTaxRate = (coBrokerProfile?.default_tax_rate as number | undefined) ?? globalDefaultWht;

    // 4. Simple or Advanced Split
    let splits: SplitWithTax[] = [];

    if (rules.enableAdvancedSplit) {
      splits = calculateAdvancedSplit(
        deal.commission_amount || 0,
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
        globalDefaultWht // Provide global default for starters
      );

      // 🛡️ Post-process splits to apply individual tax rates
      splits = (splits as CommissionSplitResult[]).map((s) => {
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
          taxRate: actualTaxRate // Attach it for the insert data
        } as SplitWithTax;
      });
    } else {
      // Simple Split: 100% to AGENCY
      splits = [
        {
          role: "AGENCY" as CommissionRole,
          percentage: 100,
          amount: deal.commission_amount || 0,
          whtAmount: 0,
          netAmount: deal.commission_amount || 0,
        },
      ];
    }

    // 5. Save to deal_commissions
    // First clear existing
    await scoped
      .commissions()
      .delete()
      .eq("deal_id", dealId);

    const insertData = splits.map((s) => ({
      deal_id: dealId,
      agent_id: s.agentId ?? null,
      co_broker_id: s.role === "CO_AGENT" ? deal.partner_co_broker_id : null,
      role: s.role as Database["public"]["Enums"]["commission_role"],
      percentage: s.percentage,
      amount: s.amount,
      wht_amount: s.whtAmount,
      net_amount: s.netAmount,
      tax_rate: (s.taxRate || globalDefaultWht) / 100,
      tenant_id: tenantId,
      status: "UNPAID" as Database["public"]["Enums"]["commission_status"],
    }));

    const { error: insertErr } = await scoped
      .commissions()
      .insert(insertData);

    if (insertErr) throw new Error(mapDbError(insertErr));

    revalidatePath("/protected/deals/[id]"); // Update specifically if in detail view
    return { success: true, message: "คำนวณและบันทึกค่าคอมมิชชั่นสำเร็จ" };
  } catch (error: unknown) {
    console.error("Calculate Commissions Error:", error);
    const message = error instanceof z.ZodError 
      ? error.issues[0].message 
      : mapDbError(error);
    return { success: false, message };
  }
}
