"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import { requireAuthContext, assertAuthenticated } from "@/lib/authz";
import {
  createDealSchema,
  updateDealSchema,
  CreateDealInput,
  UpdateDealInput,
} from "./schema";
import { logAudit } from "@/lib/audit";

export async function createDealAction(input: CreateDealInput) {
  try {
    const { supabase, user, role } = await requireAuthContext();

    // Validate Input
    const validated = createDealSchema.parse(input);

    // Auth Check: Agent & Admin can create deals
    assertAuthenticated({ userId: user.id, role });

    // Calculate end date for RENT deals if duration is provided
    const dealData = { ...validated };
    if (
      dealData.deal_type === "RENT" &&
      dealData.transaction_date &&
      dealData.duration_months
    ) {
      dealData.transaction_end_date = addMonths(
        new Date(dealData.transaction_date),
        dealData.duration_months
      ).toISOString();
    }
    // duration_months is a virtual field for the form, remove it before DB insert
    delete (dealData as any).duration_months;

    const { data, error } = await supabase
      .from("deals")
      .insert({
        ...dealData,
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
        metadata: validated,
      }
    );

    // Auto-update property status if deal is closed
    if (validated.status === "CLOSED_WIN" && validated.property_id) {
      const newStatus = validated.deal_type === "SALE" ? "SOLD" : "RENTED";
      await supabase
        .from("properties")
        .update({ status: newStatus })
        .eq("id", validated.property_id);
    }

    revalidatePath(`/protected/leads/${validated.lead_id}`);
    return { success: true, data };
  } catch (error: any) {
    console.error("Create Deal Error:", error);
    return { success: false, message: error.message };
  }
}

export async function updateDealAction(input: UpdateDealInput) {
  try {
    const { supabase, user, role } = await requireAuthContext();

    const validated = updateDealSchema.parse(input);

    // Auth Check
    assertAuthenticated({ userId: user.id, role });

    // Pre-fetch if we need data for status automation and it's missing
    let propertyId = validated.property_id;
    let dealType = validated.deal_type;

    if (validated.status === "CLOSED_WIN" && (!propertyId || !dealType)) {
      const { data: currentDeal } = await supabase
        .from("deals")
        .select("property_id, deal_type")
        .eq("id", validated.id)
        .single();

      if (currentDeal) {
        propertyId = propertyId || currentDeal.property_id;
        dealType = dealType || currentDeal.deal_type;
      }
    }

    // Calculate end date for RENT deals if duration is updated
    const dealData = { ...validated };
    if (
      dealData.deal_type === "RENT" &&
      dealData.transaction_date &&
      dealData.duration_months
    ) {
      dealData.transaction_end_date = addMonths(
        new Date(dealData.transaction_date),
        dealData.duration_months
      ).toISOString();
    }
    // Cleanup virtual field
    delete (dealData as any).duration_months;

    const { error } = await supabase
      .from("deals")
      .update(dealData)
      .eq("id", validated.id)
      .single();

    if (error) throw new Error(error.message);

    await logAudit(
      { supabase, user, role },
      {
        action: "deal.update",
        entity: "deals",
        entityId: validated.id,
        metadata: validated,
      }
    );

    // Auto-update property status if deal is closed
    if (validated.status === "CLOSED_WIN" && propertyId && dealType) {
      const newStatus = dealType === "SALE" ? "SOLD" : "RENTED";
      await supabase
        .from("properties")
        .update({ status: newStatus })
        .eq("id", propertyId);
    }

    // We don't have lead_id in input easily unless passed, creating separate revalidate often
    // But typically we are on lead detail page, so we need to know lead_id to revalidate correctly
    // Since we don't strictly have it in partial update, we might rely on client refresh or fetch lead_id first.
    // For MVPs, revalidatePath for specific lead might be tricky without fetching.
    // Let's fetch the deal to get lead_id for revalidation if needed, or revalidate global leads?
    // Optimization: Just return success and let client router.refresh().

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteDealAction(dealId: string, leadId: string) {
  try {
    const { supabase, user, role } = await requireAuthContext();

    assertAuthenticated({ userId: user.id, role });
    // TODO: Add refined ownership check if needed (only owner/admin can delete)

    const { error } = await supabase.from("deals").delete().eq("id", dealId);

    if (error) throw new Error(error.message);

    await logAudit(
      { supabase, user, role },
      {
        action: "deal.delete",
        entity: "deals",
        entityId: dealId,
        metadata: { leadId },
      }
    );

    revalidatePath(`/protected/leads/${leadId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
