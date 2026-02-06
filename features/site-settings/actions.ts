"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SiteSettingKey =
  | "smart_match_wizard_enabled"
  | "chatbot_enabled"
  | "floating_contact_enabled";

export interface SiteSettings {
  smart_match_wizard_enabled: boolean;
  chatbot_enabled: boolean;
  floating_contact_enabled: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  smart_match_wizard_enabled: true,
  chatbot_enabled: true,
  floating_contact_enabled: true,
};

/**
 * Get all site settings
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (error) {
      console.error("Error fetching site settings:", error);
      return DEFAULT_SETTINGS;
    }

    const settings = { ...DEFAULT_SETTINGS };

    for (const row of data || []) {
      const key = row.key as SiteSettingKey;
      if (key in settings) {
        // Value is stored as JSONB, parse boolean
        settings[key] = row.value === true || row.value === "true";
      }
    }

    return settings;
  } catch (error) {
    console.error("Error in getSiteSettings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get a specific site setting
 */
export async function getSiteSetting(key: SiteSettingKey): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) {
      return DEFAULT_SETTINGS[key];
    }

    return data.value === true || data.value === "true";
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return DEFAULT_SETTINGS[key];
  }
}

/**
 * Update a site setting
 */
export async function updateSiteSetting(
  key: SiteSettingKey,
  value: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "key" },
    );

    if (error) {
      console.error("Error updating site setting:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");

    return { success: true };
  } catch (error) {
    console.error("Error in updateSiteSetting:", error);
    return { success: false, message: "Unknown error" };
  }
}

/**
 * Update multiple site settings at once
 */
export async function updateSiteSettings(
  settings: Partial<SiteSettings>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    }));

    const { error } = await supabase
      .from("site_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      console.error("Error updating site settings:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");

    return { success: true };
  } catch (error) {
    console.error("Error in updateSiteSettings:", error);
    return { success: false, message: "Unknown error" };
  }
}
