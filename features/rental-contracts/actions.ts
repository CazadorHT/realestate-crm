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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_contracts")
    .select("*")
    .eq("deal_id", dealId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function upsertContractAction(
  input: ContractFormInput & { id?: string }
) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertAuthenticated({ userId: user.id, role });

    const validated = contractFormSchema.parse(input);

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
      // Create
      result = await supabase
        .from("rental_contracts")
        .insert(validated)
        .select()
        .single();
    }

    if (result.error) throw new Error(result.error.message);

    // revalidatePath based on deal -> lead ? bit hard to trace back url here without extra info/query
    // Just return success

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("Upsert Contract Error:", error);
    return { success: false, message: error.message };
  }
}
