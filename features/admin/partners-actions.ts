"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type CreatePartnerInput = {
  name: string;
  logo_url: string;
  website_url?: string;
  sort_order?: number;
};

type UpdatePartnerInput = {
  id: string;
  name?: string;
  logo_url?: string;
  website_url?: string;
  sort_order?: number;
  is_active?: boolean;
};

export async function getPartners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getPartner(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createPartner(input: CreatePartnerInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("partners").insert([input]);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/partners");
  revalidatePath("/");
}

export async function updatePartner(input: UpdatePartnerInput) {
  const supabase = await createClient();
  const { id, ...updates } = input;
  const { error } = await supabase
    .from("partners")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/partners");
  revalidatePath("/");
}

export async function deletePartner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("partners").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/partners");
  revalidatePath("/");
}
