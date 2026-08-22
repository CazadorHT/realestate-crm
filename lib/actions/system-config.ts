"use server";

import { createClient } from "@/lib/supabase/server";

export type SystemConfig = {
  multi_tenant_enabled: boolean;
  default_tenant_id: string | null;
};

import { cache } from "react";
import { unstable_cache } from "next/cache";

let configMemoryCache: { data: SystemConfig; timestamp: number } | null = null;
const CONFIG_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Fetches the global system configuration from site_settings.
 * Fast 30-day In-Memory & Request-level Cache with instant update invalidation.
 */
export const getSystemConfig = cache(async (): Promise<SystemConfig> => {
  const now = Date.now();
  if (configMemoryCache && now - configMemoryCache.timestamp < CONFIG_CACHE_TTL_MS) {
    return configMemoryCache.data;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "system_config")
      .maybeSingle();

    if (!error && data?.value) {
      const config = data.value as SystemConfig;
      configMemoryCache = { data: config, timestamp: now };
      return config;
    }
  } catch (err) {
    console.warn("[getSystemConfig] Cache fetch failed:", err);
  }

  const fallback: SystemConfig = { multi_tenant_enabled: false, default_tenant_id: null };
  return fallback;
});

import type { Json } from "@/lib/database.types.generated";

/**
 * Updates the global system configuration.
 */
export async function updateSystemConfig(config: Partial<SystemConfig>) {
  const supabase = await createClient();

  const current = await getSystemConfig();
  const newValue = { ...current, ...config };

  const { error } = await supabase.from("system_settings_v3").upsert({
    tenant_id: null,
    category: "general",
    key: "system_config",
    value: newValue as Json,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id,category,key" });

  // Clear memory cache so next request loads fresh config
  configMemoryCache = null;

  if (error) {
    throw error;
  }

  return { success: true };
}
