"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";
import { ExternalAgentFormValues, ExternalAgentSchema } from "./schema";
import { revalidatePath } from "next/cache";

/**
 * Create a new external agent in the directory
 */
export async function createExternalAgent(values: ExternalAgentFormValues) {
  try {
    const { supabase, tenantId, user } = await requireAuthContext();

    // 1. Validate Schema
    const validated = ExternalAgentSchema.parse(values);

    // 2. Perform Insert
    const { data, error } = await supabase
      .from("external_agents")
      .insert({
        ...validated,
        tenant_id: tenantId!,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/(dashboard)/properties", "layout");
    return { success: true, data };
  } catch (error: any) {
    console.error("Error creating external agent:", error);
    return { success: false, error: error.message || "Failed to create agent" };
  }
}

/**
 * Fetch external agents for the current tenant
 */
export async function fetchExternalAgents() {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const { data, error } = await supabase
      .from("external_agents")
      .select("*")
      .eq("tenant_id", tenantId!)
      .order("name", { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching external agents:", error);
    return { success: false, error: error.message };
  }
}
