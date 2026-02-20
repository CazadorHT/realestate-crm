"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SiteSettings, SiteSettingKey, DEFAULT_SETTINGS } from "./types";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { logAudit } from "@/lib/audit";
import { AuthContext } from "@/lib/authz";

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
        const defaultValue = DEFAULT_SETTINGS[key];
        if (typeof defaultValue === "boolean") {
          const val =
            row.value === true || row.value === "true" || row.value === 1;
          Object.assign(settings, { [key]: val });
        } else if (typeof defaultValue === "string") {
          Object.assign(settings, { [key]: String(row.value) });
        }
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
export async function getSiteSetting<T extends SiteSettingKey>(
  key: T,
): Promise<SiteSettings[T]> {
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

    const defaultValue = DEFAULT_SETTINGS[key];
    if (typeof defaultValue === "boolean") {
      return (data.value === true ||
        data.value === "true" ||
        data.value === 1) as SiteSettings[T];
    }

    return String(data.value) as SiteSettings[T];
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
  value: string | boolean | number,
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) {
      console.error("Error updating site setting:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");

    // Logging
    const currentProfile = await getCurrentProfile();
    if (currentProfile) {
      await logAudit(
        { supabase, user: { id: currentProfile.id } } as AuthContext,
        {
          action: "site_settings.update",
          entity: "site_settings",
          entityId: key,
          metadata: { value },
        },
      );
    }

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

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
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

    // Logging
    const currentProfile = await getCurrentProfile();
    if (currentProfile) {
      await logAudit(
        { supabase, user: { id: currentProfile.id } } as AuthContext,
        {
          action: "site_settings.update",
          entity: "site_settings",
          metadata: { settings },
        },
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateSiteSettings:", error);
    return { success: false, message: "Unknown error" };
  }
}

/**
 * Upload a site asset (logo, favicon, hero image)
 */
export async function uploadSiteAssetAction(
  formData: FormData,
  type: "logo" | "favicon" | "hero",
): Promise<{ success: boolean; message: string; publicUrl?: string }> {
  try {
    const user = await getCurrentProfile();
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "No file provided" };

    const supabase = await createClient();

    // Validation
    const maxSize = type === "favicon" ? 1 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        message: `ไฟล์ใหญ่เกินไป (สูงสุด ${maxSize / (1024 * 1024)}MB)`,
      };
    }

    const randomId = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split(".").pop();
    const fileName = `${type}_${randomId}.${extension}`;
    const path = `site-assets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload ${type} error:`, uploadError);
      return { success: false, message: "อัปโหลดล้มเหลว" };
    }

    const { data: publicUrlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(path);

    return {
      success: true,
      message: "อัปโหลดสำเร็จ",
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error("Error in uploadSiteAssetAction:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปโหลด" };
  }
}
