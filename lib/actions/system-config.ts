"use server";

import { createClient } from "@/lib/supabase/server";

export type SystemConfig = {
  multi_tenant_enabled: boolean;
  default_tenant_id: string | null;
};

import { cache } from "react";

/**
 * Fetches the global system configuration from site_settings.
 * Memoized per request to prevent DB waterfalls.
 */
export const getSystemConfig = cache(async (): Promise<SystemConfig> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "system_config")
    .single();

  if (error || !data) {
    return {
      multi_tenant_enabled: false,
      default_tenant_id: null,
    };
  }

  return data.value as SystemConfig;
});

import type { Json } from "@/lib/database.types";

/**
 * Updates the global system configuration.
 */
export async function updateSystemConfig(config: Partial<SystemConfig>) {
  const supabase = await createClient();

  const current = await getSystemConfig();
  const newValue = { ...current, ...config };

  const { error } = await supabase.from("site_settings").upsert({
    key: "system_config",
    value: newValue as Json,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return newValue;
}
