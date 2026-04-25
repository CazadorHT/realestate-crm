"use server";

import { createClient } from "@/lib/supabase/server";
import { LineTemplate, LineTemplateConfig } from "./types";
import { revalidatePath } from "next/cache";

export async function getLineTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("line_templates")
    .select("key, label, is_active, config")
    .order("key");

  if (error) {
    console.error("Error fetching templates:", error);
    return [];
  }

  return data as LineTemplate[];
}

export async function updateLineTemplate(
  key: string,
  updates: { is_active?: boolean; config?: LineTemplateConfig },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("line_templates")
    .update(updates)
    .eq("key", key);

  if (error) {
    throw new Error("Failed to update template");
  }

  revalidatePath("/protected/line-manager");
  return { success: true };
}
