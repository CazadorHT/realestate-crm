"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function getPopularAreasAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("popular_areas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPopularAreaAction(name: string) {
  const { supabase, role } = await requireAuthContext();
  assertAdmin(role);

  const parsed = schema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("popular_areas")
    .insert({ name: parsed.data.name });

  if (error) return { error: error.message };
  revalidatePath("/protected/admin/popular-areas");
  return { success: true };
}

export async function updatePopularAreaAction(id: string, name: string) {
  const { supabase, role } = await requireAuthContext();
  assertAdmin(role);

  const parsed = schema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("popular_areas")
    .update({ name: parsed.data.name })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/protected/admin/popular-areas");
  return { success: true };
}

export async function deletePopularAreaAction(id: string) {
  const { supabase, role } = await requireAuthContext();
  assertAdmin(role);

  const { error } = await supabase.from("popular_areas").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/protected/admin/popular-areas");
  return { success: true };
}
