"use server";

import { requireAuthContext, assertAdmin, assertStaff } from "@/lib/authz";
import {
  createTemplateSchema,
  CreateTemplateInput,
  updateTemplateSchema,
  UpdateTemplateInput,
} from "./schema";
import { revalidatePath } from "next/cache";

// 1. Get All Templates
export async function getTemplatesAction() {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch Templates Error:", error);
    return [];
  }

  return data;
}

// 2. Create Template (Admin only)
export async function createTemplateAction(input: CreateTemplateInput) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertAdmin(role);

    const validated = createTemplateSchema.parse(input);

    const { data, error } = await supabase
      .from("contract_templates")
      .insert({
        ...validated,
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/protected/documents");
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}

// 3. Update Template (Admin only)
export async function updateTemplateAction(
  id: string,
  input: UpdateTemplateInput,
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertAdmin(role);

    const validated = updateTemplateSchema.parse(input);

    const { data, error } = await supabase
      .from("contract_templates")
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/protected/documents");
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}

// 4. Delete Template (Soft delete)
export async function deleteTemplateAction(id: string) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertAdmin(role);

    const { error } = await supabase
      .from("contract_templates")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/protected/documents");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}
