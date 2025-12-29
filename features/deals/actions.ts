"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import { requireAuthContext, assertAuthenticated, assertStaff } from "@/lib/authz";
import {
  createDealSchema,
  updateDealSchema,
  CreateDealInput,
  UpdateDealInput,
} from "./schema";
import { logAudit } from "@/lib/audit";

async function updatePropertyStatusFromDeals(
  supabase: Awaited<ReturnType<typeof requireAuthContext>>["supabase"],
  propertyId: string
) {
  if (!propertyId) return;

  const { data, error } = await supabase
    .from("deals")
    .select("deal_type")
    .eq("property_id", propertyId)
    .eq("status", "CLOSED_WIN")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("updatePropertyStatusFromDeals error:", error);
    return;
  }

  if (!data || data.length === 0) {
    await supabase.from("properties").update({ status: "ACTIVE" }).eq("id", propertyId);
    return;
  }

  const newStatus = data[0].deal_type === "SALE" ? "SOLD" : "RENTED";
  await supabase.from("properties").update({ status: newStatus }).eq("id", propertyId);
}

export async function createDealAction(input: CreateDealInput) {
  try {
    const { supabase, user, role } = await requireAuthContext();

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
        dealData.duration_months
      ).toISOString();
    }
    // duration_months is a virtual field for the form, remove it before DB insert
    delete (dealData as any).duration_months;

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
      const key = k as keyof typeof dealData;
      if ((dealData as any)[key] === "" || (dealData as any)[key] === null) {
        delete (dealData as any)[key];
      }
    });

    // Remove any keys that are explicitly `undefined` (helpful for partial updates to preserve DB values)
    Object.keys(dealData).forEach((k) => {
      const key = k as keyof typeof dealData;
      if ((dealData as any)[key] === undefined) {
        delete (dealData as any)[key];
      }
    });

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
    assertStaff(role);

    const { data: currentDeal, error: currentErr } = await supabase
      .from("deals")
      .select("id, status, property_id, deal_type")
      .eq("id", validated.id)
      .single();

    if (currentErr || !currentDeal) {
      return { success: false, message: "Deal not found" };
    }

    const prevStatus = currentDeal.status;
    const prevPropertyId = currentDeal.property_id;
    const prevDealType = currentDeal.deal_type;

    const nextStatus = validated.status ?? prevStatus;
    const nextPropertyId = validated.property_id ?? prevPropertyId;
    const nextDealType = validated.deal_type ?? prevDealType;

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

    // Clean empty-string fields before update (keep `null` to explicitly clear DB columns)
    const _updateCleanKeys = [
      "transaction_date",
      "transaction_end_date",
      "co_agent_name",
      "co_agent_contact",
      "source",
    ] as const;
    _updateCleanKeys.forEach((k) => {
      const key = k as keyof typeof dealData;
      if ((dealData as any)[key] === "") {
        delete (dealData as any)[key];
      }
    });

    // Remove explicit undefined keys so we don't overwrite existing values unintentionally
    Object.keys(dealData).forEach((k) => {
      const key = k as keyof typeof dealData;
      if ((dealData as any)[key] === undefined) {
        delete (dealData as any)[key];
      }
    });

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
    if (nextStatus === "CLOSED_WIN" && nextPropertyId && nextDealType) {
      const newStatus = nextDealType === "SALE" ? "SOLD" : "RENTED";
      await supabase
        .from("properties")
        .update({ status: newStatus })
        .eq("id", nextPropertyId);
    }

    const shouldRecomputePrev =
      prevStatus === "CLOSED_WIN" &&
      prevPropertyId &&
      (nextStatus !== "CLOSED_WIN" || nextPropertyId !== prevPropertyId);

    if (shouldRecomputePrev) {
      await updatePropertyStatusFromDeals(supabase, prevPropertyId);
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
    assertStaff(role);
    // TODO: Add refined ownership check if needed (only owner/admin can delete)

    const { data: existingDeal, error: fetchErr } = await supabase
      .from("deals")
      .select("id, status, property_id")
      .eq("id", dealId)
      .single();

    if (fetchErr || !existingDeal) {
      return { success: false, message: "Deal not found" };
    }

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

    if (existingDeal.status === "CLOSED_WIN" && existingDeal.property_id) {
      await updatePropertyStatusFromDeals(supabase, existingDeal.property_id);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
