"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ThemeSettings = {
  primary?: string;
  secondary?: string;
  accent?: string;
};

export type TenantBranding = {
  theme?: ThemeSettings;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  favicon_url?: string | null;
};

/**
 * Update tenant branding settings (colors and logos)
 */
export async function updateTenantBranding(
  tenantId: string,
  branding: TenantBranding,
) {
  try {
    const supabase = await createClient();

    // 1. Fetch current settings to merge
    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .single();

    if (fetchError) throw fetchError;

    const currentSettings = (tenant.settings as any) || {};
    const newSettings = {
      ...currentSettings,
      theme: branding.theme || (currentSettings as any).theme,
      logo_dark_url:
        branding.logo_dark_url !== undefined
          ? branding.logo_dark_url
          : (currentSettings as any).logo_dark_url,
      favicon_url:
        branding.favicon_url !== undefined
          ? branding.favicon_url
          : (currentSettings as any).favicon_url,
    };

    // 2. Prepare update payload
    const updateData: any = {
      settings: newSettings,
      updated_at: new Date().toISOString(),
    };

    // If logo_url is provided in the root of the branding object, update the column
    if (branding.logo_url !== undefined) {
      updateData.logo_url = branding.logo_url;
    }

    const { error: updateError } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", tenantId);

    if (updateError) throw updateError;

    revalidatePath("/");
    revalidatePath("/protected/settings");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating tenant branding:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Upload tenant branding asset to storage
 */
export async function uploadTenantAsset(
  tenantId: string,
  formData: FormData,
  type: "logo" | "logo_dark" | "favicon",
) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const supabase = await createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${tenantId}/${type}_${Math.random()}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("tenant_assets")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("tenant_assets").getPublicUrl(filePath);

    // Update the tenant record with the new asset URL
    const brandingUpdate: TenantBranding = {};
    if (type === "logo") brandingUpdate.logo_url = publicUrl;
    else if (type === "logo_dark") brandingUpdate.logo_dark_url = publicUrl;
    else if (type === "favicon") brandingUpdate.favicon_url = publicUrl;

    await updateTenantBranding(tenantId, brandingUpdate);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error(`Error uploading tenant ${type}:`, error);
    return { success: false, message: error.message };
  }
}
