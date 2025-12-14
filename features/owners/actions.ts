/**
 * Owner server actions
 * CRUD operations for property owners
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OwnerFormValues } from "./types";

/**
 * Get all owners
 */
export async function getOwnersAction() {
  const supabase = await createClient();

  const { data: owners, error } = await supabase
    .from("owners")
    .select("*")
    .order("full_name");

  if (error) {
    console.error("Error fetching owners:", error);
    return [];
  }

  return owners;
}

/**
 * Get single owner by ID
 */
export async function getOwnerByIdAction(id: string) {
  const supabase = await createClient();

  const { data: owner, error } = await supabase
    .from("owners")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching owner:", error);
    throw new Error("Owner not found");
  }

  return owner;
}

/**
 * Create new owner
 */
export async function createOwnerAction(values: OwnerFormValues) {
  const supabase = await createClient();

  const { data: owner, error } = await supabase
    .from("owners")
    .insert({
      full_name: values.full_name,
      phone: values.phone || null,
      line_id: values.line_id || null,
      facebook_url: values.facebook_url || null,
      other_contact: values.other_contact || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating owner:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/protected/owners");
  redirect("/protected/owners");
}

/**
 * Update existing owner
 */
export async function updateOwnerAction(id: string, values: OwnerFormValues) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("owners")
    .update({
      full_name: values.full_name,
      phone: values.phone || null,
      line_id: values.line_id || null,
      facebook_url: values.facebook_url || null,
      other_contact: values.other_contact || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating owner:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/protected/owners");
  revalidatePath("/protected/properties");
  redirect("/protected/owners");
}

/**
 * Delete owner
 * Sets properties.owner_id = NULL for affected properties
 */
export async function deleteOwnerAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("owners").delete().eq("id", id);

  if (error) {
    console.error("Error deleting owner:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/protected/owners");
  revalidatePath("/protected/properties");
  return { success: true };
}

/**
 * Get owner with property count
 */
export async function getOwnersWithPropertyCountAction() {
  const supabase = await createClient();

  // Get all owners
  const { data: owners, error: ownersError } = await supabase
    .from("owners")
    .select("*")
    .order("full_name");

  if (ownersError) {
    console.error("Error fetching owners:", ownersError);
    return [];
  }

  // Get property counts
  const { data: propertyCounts, error: countsError } = await supabase
    .from("properties")
    .select("owner_id");

  if (countsError) {
    console.error("Error fetching property counts:", countsError);
    return owners.map((o) => ({ ...o, property_count: 0 }));
  }

  // Count properties per owner
  const countMap = new Map<string, number>();
  propertyCounts.forEach((p) => {
    if (p.owner_id) {
      countMap.set(p.owner_id, (countMap.get(p.owner_id) || 0) + 1);
    }
  });

  return owners.map((owner) => ({
    ...owner,
    property_count: countMap.get(owner.id) || 0,
  }));
}
