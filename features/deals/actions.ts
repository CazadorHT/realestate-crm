"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
} from "@/lib/authz";
import {
  createDealSchema,
  updateDealSchema,
  CreateDealInput,
  UpdateDealInput,
} from "./schema";
import { logAudit } from "@/lib/audit";

// Helper: Adjust property stock and auto-update status
async function adjustPropertyStock(
  supabase: Awaited<ReturnType<typeof requireAuthContext>>["supabase"],
  tenantId: string,
  propertyId: string,
  adjustment: number, // +1 or -1
  dealType?: "SALE" | "RENT",
) {
  if (!propertyId) return;

  // 1. Get current stock
  const { data: prop, error } = await supabase
    .from("properties")
    .select("id, total_units, sold_units, status, tenant_id")
    .eq("id", propertyId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !prop) {
    console.error("adjustPropertyStock error:", error);
    return;
  }

  // 2. Calculate new sold units
  const currentSold = prop.sold_units || 0;
  const total = prop.total_units || 1;
  let newSold = currentSold + adjustment;

  // Safety bounds
  if (newSold < 0) newSold = 0;

  // 3. Determine new status
  let newStatus = prop.status;
  if (newSold >= total) {
    // Determine status based on deal type
    if (dealType === "RENT") {
      newStatus = "RENTED";
    } else {
      newStatus = "SOLD";
    }
  } else {
    // If stock is available, it's ACTIVE
    newStatus = "ACTIVE";
  }

  // 4. Update DB
  await supabase
    .from("properties")
    .update({
      sold_units: newSold,
      status: newStatus,
    })
    .eq("id", propertyId)
    .eq("tenant_id", tenantId);
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
      if (
        (insertData as any)[key] === "" ||
        (insertData as any)[key] === null
      ) {
        delete (insertData as any)[key];
      }
    });

    // Remove any keys that are explicitly `undefined` (helpful for partial updates to preserve DB values)
    Object.keys(insertData).forEach((k) => {
      const key = k as keyof typeof insertData;
      if ((insertData as any)[key] === undefined) {
        delete (insertData as any)[key];
      }
    });

    const { data, error } = await supabase
      .from("deals")
      .insert({
        ...insertData,
        tenant_id: tenantId,
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
      },
    );

    // Auto-update stock if deal is WON
    if (validated.status === "CLOSED_WIN" && validated.property_id) {
      await adjustPropertyStock(
        supabase,
        tenantId,
        validated.property_id,
        1,
        validated.deal_type,
      );
    }

    revalidatePath(`/protected/leads/${validated.lead_id}`);
    revalidatePath("/protected/deals");
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Create Deal Error:", error);
    const msg =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างดีล";
    return { success: false, message: msg };
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

    const { data: currentDeal, error: currentErr } = await supabase
      .from("deals")
      .select("id, status, property_id, deal_type, tenant_id")
      .eq("id", validated.id)
      .eq("tenant_id", tenantId)
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
    const updateData: any = { ...dealData };
    delete updateData.duration_months;

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
      if (updateData[k] === "") {
        delete updateData[k];
      }
    });

    // Remove explicit undefined keys
    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === undefined) {
        delete updateData[k];
      }
    });

    const { error } = await supabase
      .from("deals")
      .update(updateData)
      .eq("id", validated.id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw new Error(error.message);

    await logAudit(
      { supabase, user, role },
      {
        action: "deal.update",
        entity: "deals",
        entityId: validated.id,
        metadata: validated,
      },
    );

    // --- Stock Management Logic ---
    // 1. If ID Changed:
    //    - If Prev was WON: Decrement Prev Prop
    //    - If Next is WON: Increment Next Prop
    // 2. If ID Same:
    //    - If Prev != WON && Next == WON: Increment (+1)
    //    - If Prev == WON && Next != WON: Decrement (-1)

    // Handle Property Change first (Complex case)
    if (prevPropertyId !== nextPropertyId) {
      // Revert old property if it was maintained by this deal
      if (prevStatus === "CLOSED_WIN" && prevPropertyId) {
        await adjustPropertyStock(
          supabase,
          tenantId,
          prevPropertyId,
          -1,
          currentDeal.deal_type,
        );
      }
      // Apply to new property if this deal is winning
      if (nextStatus === "CLOSED_WIN" && nextPropertyId) {
        await adjustPropertyStock(
          supabase,
          tenantId,
          nextPropertyId,
          1,
          validated.deal_type || currentDeal.deal_type,
        );
      }
    } else {
      // Same Property, just Status Change
      if (nextPropertyId) {
        if (prevStatus !== "CLOSED_WIN" && nextStatus === "CLOSED_WIN") {
          // Won!
          await adjustPropertyStock(
            supabase,
            tenantId,
            nextPropertyId,
            1,
            validated.deal_type || currentDeal.deal_type,
          );
        } else if (prevStatus === "CLOSED_WIN" && nextStatus !== "CLOSED_WIN") {
          // Lost/Cancelled!
          await adjustPropertyStock(
            supabase,
            tenantId,
            nextPropertyId,
            -1,
            currentDeal.deal_type,
          );
        }
      }
    }

    revalidatePath("/protected/deals");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteDealAction(dealId: string, leadId: string) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    const { data: existingDeal, error: fetchErr } = await supabase
      .from("deals")
      .select("id, status, property_id, deal_type, tenant_id")
      .eq("id", dealId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !existingDeal) {
      return { success: false, message: "Deal not found" };
    }

    const { error } = await supabase
      .from("deals")
      .delete()
      .eq("id", dealId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    await logAudit(
      { supabase, user, role },
      {
        action: "deal.delete",
        entity: "deals",
        entityId: dealId,
        metadata: { leadId },
      },
    );

    revalidatePath(`/protected/leads/${leadId}`);

    // If deleting a WON deal, release the stock
    if (existingDeal.status === "CLOSED_WIN" && existingDeal.property_id) {
      // Release stock using the deal_type from the deleted deal
      await adjustPropertyStock(
        supabase,
        tenantId,
        existingDeal.property_id,
        -1,
        (existingDeal as any).deal_type,
      );
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
