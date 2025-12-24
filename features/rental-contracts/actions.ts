"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAuthenticated } from "@/lib/authz";
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
    const { supabase, user, role } = ctx;

    // Load contract
    const { data: contract, error } = await supabase
      .from("rental_contracts")
      .select("*")
      .eq("deal_id", dealId)
      .single();

    if (error || !contract) return null;

    // Authorization: allow staff or deal owner
    const { data: deal } = await supabase
      .from("deals")
      .select("id, created_by")
      .eq("id", dealId)
      .single();

    const { isStaff } = await import("@/lib/auth-shared");
    if (!isStaff(role) && deal?.created_by !== user.id) {
      // Not the owner nor staff
      return null;
    }

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

    const validated = contractFormSchema.parse(input);

    // 1) fetch deal and validate it's a RENT deal
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .select("id, deal_type")
      .eq("id", validated.deal_id)
      .single();

    if (dealErr || !deal) return { success: false, message: "Deal not found" };
    if (!['RENT', 'SALE'].includes(deal.deal_type)) return { success: false, message: "Contracts are allowed only for RENT or SALE deals" };

    // 2) auth: only staff (ADMIN/AGENT) can create/update
    const { isStaff } = await import("@/lib/auth-shared");
    if (!isStaff(role)) return { success: false, message: "Forbidden: only staff can manage contracts" };

    // 3) Create or update
    let result;
    if (input.id) {
      // Update
      result = await supabase
        .from("rental_contracts")
        .update(validated)
        .eq("id", input.id)
        .select()
        .single();
    } else {
      // Create -> auto-generate contract number if not provided
      const toInsert = { ...validated } as any;
      if (!toInsert.contract_number) {
        toInsert.contract_number = `RC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
      }

      result = await supabase
        .from("rental_contracts")
        .insert(toInsert)
        .select()
        .single();
    }

    if (result.error) {
      // Improve uniqueness error message for duplicate deal
      if (result.error.message && /unique/.test(result.error.message.toLowerCase())) {
        return { success: false, message: "A contract already exists for this deal" };
      }
      throw new Error(result.error.message);
    }

    // Log audit
    try {
      await logAudit({ user: user.id } as any, {
        action: input.id ? "rental_contract.update" : "rental_contract.create",
        entity: "rental_contracts",
        entityId: result.data.id,
        metadata: { dealId: validated.deal_id },
      });
    } catch (e) {
      // ignore audit errors
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("Upsert Contract Error:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteContractAction(id: string) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertAuthenticated({ userId: user.id, role });
    const { isStaff } = await import("@/lib/auth-shared");
    if (!isStaff(role)) return { success: false, message: "Forbidden: only staff can delete contracts" };

    // Ensure contract exists
    const { data: existing, error: fetchErr } = await supabase
      .from("rental_contracts")
      .select("id, deal_id")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) return { success: false, message: "Contract not found" };

    const { error } = await supabase.from("rental_contracts").delete().eq("id", id);
    if (error) return { success: false, message: error.message };

    await logAudit({ user: user.id } as any, {
      action: "rental_contract.delete",
      entity: "rental_contracts",
      entityId: id,
      metadata: { dealId: existing.deal_id },
    });

    // revalidate deal pages
    revalidatePath(`/protected/deals/${existing.deal_id}`);

    return { success: true };
  } catch (err: any) {
    console.error("deleteContractAction error:", err);
    return { success: false, message: err.message };
  }
}
