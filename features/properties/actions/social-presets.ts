"use server";

import { createClient } from "@/lib/supabase/server";
import type { SocialStudioPresetConfig } from "@/components/social-studio/types";

export async function getSocialStudioPresets() {
  try {
    const supabase = await createClient();

    // Fetch all presets for the current tenant
    // RLS handles the tenant isolation
    const { data, error } = await supabase
      .from("system_settings_v3")
      .select("key, value")
      .eq("category", "SOCIAL_STUDIO")
      .in("key", ["CUSTOM_1", "CUSTOM_2", "CUSTOM_3", "CUSTOM_4", "CUSTOM_5"]);

    if (error) {
      console.error("[getSocialStudioPresets] DB Error:", error);
      return {};
    }

    const presets: Record<string, SocialStudioPresetConfig> = {};
    if (data) {
      for (const row of data) {
        presets[row.key] = row.value as unknown as SocialStudioPresetConfig;
      }
    }

    return presets;
  } catch (error) {
    console.error("[getSocialStudioPresets] Error:", error);
    return {};
  }
}

export async function saveSocialStudioPreset(presetKey: string, config: SocialStudioPresetConfig) {
  try {
    const supabase = await createClient();

    // Ensure presetKey is valid
    if (!["CUSTOM_1", "CUSTOM_2", "CUSTOM_3", "CUSTOM_4", "CUSTOM_5"].includes(presetKey)) {
      throw new Error("Invalid preset key");
    }

    const { error } = await supabase
      .from("system_settings_v3")
      .upsert(
        {
          category: "SOCIAL_STUDIO",
          key: presetKey,
          value: config as any,
        },
        { onConflict: "tenant_id, category, key" }
      );

    if (error) {
      console.error("[saveSocialStudioPreset] DB Error:", error);
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("[saveSocialStudioPreset] Error:", error);
    return { success: false, error: error.message };
  }
}
