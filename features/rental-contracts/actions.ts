"use server";

import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
} from "@/lib/authz";
import {
  contractFormSchema,
  updateContractSchema,
  ContractFormInput,
  UpdateContractInput,
  RentalContract,
} from "./schema";
import { logAudit } from "@/lib/audit"; // Need to update audit types if I log specific contract events
import { revalidatePath } from "next/cache";

export async function getContractByDealId(
  dealId: string
): Promise<RentalContract | null> {
  try {
    const ctx = await requireAuthContext();
    const { supabase, role } = ctx;
    assertStaff(role);

    // Load contract
    const { data: contract, error } = await supabase
      .from("rental_contracts")
      .select("*")
      .eq("deal_id", dealId)
      .single();

    if (error || !contract) return null;

    return contract as RentalContract;
  } catch (err) {
    return null;
  }
}

export async function upsertContractAction(
  input: ContractFormInput & { id?: string }
) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    // 3) Create or update
    let data: RentalContract | null = null;
    let error: any = null;
    let dealIdForAudit = "";

    if (input.id) {
      // Update - Use partial schema
      const validatedUpdate = updateContractSchema.parse(input);
      // Remove id from update payload to avoid primary key update attempt
      const { id, ...updateData } = validatedUpdate;

      // Try to get deal_id for audit if provided in update
      dealIdForAudit = validatedUpdate.deal_id || "";

      const updateRes = await supabase
        .from("rental_contracts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      data = updateRes.data;
      error = updateRes.error;

      // If dealId wasn't in update, get it from the result for audit
      if (data && !dealIdForAudit) {
        dealIdForAudit = data.deal_id;
      }
    } else {
      // Create - Use full schema
      const validatedCreate = contractFormSchema.parse(input);
      dealIdForAudit = validatedCreate.deal_id;

      // Validate deal type
      const { data: deal, error: dealErr } = await supabase
        .from("deals")
        .select("id, deal_type")
        .eq("id", validatedCreate.deal_id)
        .single();

      if (dealErr || !deal)
        return { success: false, message: "Deal not found" };
      if (!["RENT", "SALE"].includes(deal.deal_type))
        return {
          success: false,
          message: "Contracts are allowed only for RENT or SALE deals",
        };

      // Create -> auto-generate contract number if not provided
      const toInsert: any = { ...validatedCreate };
      if (!toInsert.contract_number) {
        toInsert.contract_number = `RC-${new Date().getFullYear()}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`;
      }

      const insertRes = await supabase
        .from("rental_contracts")
        .insert(toInsert)
        .select()
        .single();

      data = insertRes.data;
      error = insertRes.error;
    }

    if (error || !data) {
      const errMsg = error?.message || "Operation failed";
      // Improve uniqueness error message for duplicate deal
      if (errMsg && /unique/.test(errMsg.toLowerCase())) {
        return {
          success: false,
          message: "A contract already exists for this deal",
        };
      }
      throw new Error(errMsg);
    }

    // Log audit
    try {
      await logAudit({ supabase, user, role } as any, {
        action: input.id ? "rental_contract.update" : "rental_contract.create",
        entity: "rental_contracts",
        entityId: data.id,
        metadata: { dealId: dealIdForAudit },
      });
    } catch (e) {
      // ignore audit errors
    }

    return { success: true, data: data };
  } catch (error: unknown) {
    console.error("Upsert Contract Error:", error);
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}

export async function deleteContractAction(id: string) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    // Ensure contract exists
    const { data: existing, error: fetchErr } = await supabase
      .from("rental_contracts")
      .select("id, deal_id")
      .eq("id", id)
      .single();

    if (fetchErr || !existing)
      return { success: false, message: "Contract not found" };

    const { error } = await supabase
      .from("rental_contracts")
      .delete()
      .eq("id", id);
    if (error) return { success: false, message: error.message };

    await logAudit({ supabase, user, role } as any, {
      action: "rental_contract.delete",
      entity: "rental_contracts",
      entityId: id,
      metadata: { dealId: existing.deal_id },
    });

    // revalidate deal pages
    revalidatePath(`/protected/deals/${existing.deal_id}`);

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteContractAction error:", err);
    const msg = err instanceof Error ? err.message : "An error occurred";
    return { success: false, message: msg };
  }
}
