"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
} from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";
import {
  createDealSchema,
  updateDealSchema,
  CreateDealInput,
  UpdateDealInput,
} from "./schema";
import { z } from "zod";
import { DealCommission } from "./types";
import { Database } from "@/lib/database.types";
import { logAudit } from "@/lib/audit";
import { getCommissionRulesAction } from "../dashboard/actions/commission-actions";
import {
  calculateAdvancedSplit,
  CommissionRole,
  CommissionSplitResult,
} from "@/lib/finance/commissions";
import { getScopedRevenueClient } from "./logic/scoped-client";
import { getDealDiff } from "./logic/diff";

// Helper: Adjust property stock and auto-update status using Atomic RPC
async function adjustPropertyStock(
  ctx: { supabase: any; tenantId: string },
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
  });

  if (error) {
    console.error("Atomic Stock Update Error:", error);
    throw new Error("Failed to update property stock atomically");
  }
}

// Helper: Swap property stocks atomically
async function swapPropertyStock(
  ctx: { supabase: any; tenantId: string },
  oldPropertyId: string | null,
  newPropertyId: string | null,
  oldDealType: string,
  newDealType: string,
) {
  const scoped = getScopedRevenueClient(ctx.supabase, ctx.tenantId);
  const { error } = await scoped.rpc("swap_property_stock_atomic", {
    p_old_property_id: oldPropertyId,
    p_new_property_id: newPropertyId,
    p_old_deal_type: oldDealType,
    p_new_deal_type: newDealType,
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
      .from("deals")
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
    if (error && typeof error === "object" && "code" in error && error.code === "AUTHZ_ERROR") {
      return authzFail(error as any);
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
      .from("deals")
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
      .from("deals")
      .update(updateData)
      .eq("id", validated.id)
      .single();

    if (error) throw new Error(error.message);

    const diff = getDealDiff(currentDeal as any, validated as any);
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
    if (error && typeof error === "object" && "code" in error && error.code === "AUTHZ_ERROR") {
      return authzFail(error as any);
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

    if (deleteErr) throw new Error(deleteErr.message);

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

    // 1. Fetch Deal and Property
    const { data: deal, error: dealErr } = await scoped
      .from("deals")
      .select(
        `
        *,
        property:properties (
          id,
          assigned_to
        )
      `,
      )
      .eq("id", dealId)
      .single();

    if (dealErr || !deal) throw new Error("ไม่พบข้อมูลดีล");

    // 2. Get Global Rules
    const rulesRes = await getCommissionRulesAction();
    if (!rulesRes.success || !rulesRes.data) {
      throw new Error(
        rulesRes.message || "ไม่สามารถโหลดการตั้งค่าคอมมิชชั่นได้",
      );
    }
    const rules = rulesRes.data;

    // 3. Simple or Advanced Split
    let splits: CommissionSplitResult[] = [];

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
      );
    } else {
      // Simple Split: 100% to AGENCY if advanced split is disabled
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

    // 4. Save to deal_commissions
    // First clear existing
    await scoped
      .from("deal_commissions")
      .delete()
      .eq("deal_id", dealId);

    const insertData = splits.map((s) => ({
      deal_id: dealId,
      agent_id: s.agentId ?? null,
      role: s.role as Database["public"]["Enums"]["commission_role"],
      percentage: s.percentage,
      amount: s.amount,
      wht_amount: s.whtAmount,
      net_amount: s.netAmount,
      tenant_id: tenantId,
      status: "PENDING" as Database["public"]["Enums"]["commission_status"],
    }));

    const { error: insertErr } = await scoped
      .from("deal_commissions")
      .insert(insertData);

    if (insertErr) throw new Error(insertErr.message);

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
