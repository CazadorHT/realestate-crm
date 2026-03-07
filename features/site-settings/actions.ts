"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  SiteSettingKey,
  SocialKeyword,
  SiteSettings,
  siteSettingsSchema,
} from "./schema";
import { mapDbError } from "@/lib/db-error";

const DEFAULT_SETTINGS: SiteSettings = {
  smart_match_wizard_enabled: true,
  chatbot_enabled: true,
  floating_contact_enabled: true,
  isolation_properties_enabled: false,
  isolation_leads_enabled: false,
  isolation_deals_enabled: false,
  social_automation_keywords: [],
  social_post_template: `🏠 {{title}}\n💰 {{price}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}`,
  site_name: "VC Connect Asset",
  company_name: "VC Connect Asset Co., Ltd.",
  site_description: "Real Estate CRM & Listing Portal",
  contact_phone: "0XX-XXX-XXXX",
  contact_email: "vcconnect.asset@gmail.com",
  contact_address: "ที่ตั้งออฟฟิศของคุณ...",
  google_maps_url: "",
  facebook_url: "https://facebook.com/vcconnectasset",
  instagram_url: "https://instagram.com/vcconnectasset",
  line_url: "https://line.me/ti/p/@811slazm",
  tiktok_url: "https://tiktok.com/@vcconnectasset",
  line_id: "@vcconnectasset",
  logo_light: "/images/v-link-svg-png-logo.svg",
  logo_dark: "/images/v-link-svg-png-dark.svg",
  favicon: "/favicon.ico",
  onboarding_line_skipped: false,
  onboarding_staff_skipped: false,
  google_tag_manager_id: "GTM-NBG46JLN",
  google_tag_manager_enabled: true,
  hot_lead_threshold: 80,
  executive_summary_enabled: true,
};

/**
 * Action to skip an onboarding step
 */
export async function skipOnboardingStepAction(
  step: "line" | "staff",
): Promise<{ success: boolean; message?: string }> {
  const key: SiteSettingKey =
    step === "line" ? "onboarding_line_skipped" : "onboarding_staff_skipped";
  return updateSiteSetting(key, true);
}

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
        if (key === "social_automation_keywords") {
          // It's an array of objects stored as JSONB
          (settings as any)[key] = Array.isArray(row.value)
            ? (row.value as any)
            : [];
        } else if (
          key === "social_post_template" ||
          key === "site_name" ||
          key === "company_name" ||
          key === "site_description" ||
          key === "contact_phone" ||
          key === "contact_email" ||
          key === "contact_address" ||
          key === "google_maps_url" ||
          key === "facebook_url" ||
          key === "instagram_url" ||
          key === "line_url" ||
          key === "tiktok_url" ||
          key === "line_id" ||
          key === "logo_light" ||
          key === "logo_dark" ||
          key === "favicon" ||
          key === "google_tag_manager_id"
        ) {
          (settings as any)[key] =
            typeof row.value === "string" ? row.value : (settings as any)[key];
        } else {
          // Value is stored as JSONB, parse boolean or number
          // Handle cases where it might be a string "true" or a boolean true
          if (key === "hot_lead_threshold") {
            (settings as any)[key] = Number(row.value) || 80;
          } else {
            (settings as any)[key] = row.value === true || row.value === "true";
          }
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
export async function getSiteSetting(key: SiteSettingKey): Promise<any> {
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

    if (key === "social_automation_keywords") {
      return Array.isArray(data.value) ? data.value : [];
    }

    if (key === "social_post_template") {
      return typeof data.value === "string"
        ? data.value
        : DEFAULT_SETTINGS[key];
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
  value: boolean | any[] | string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Basic validation for single key update if it's part of branding
    if (
      [
        "contact_email",
        "google_maps_url",
        "facebook_url",
        "instagram_url",
        "line_url",
        "tiktok_url",
        "logo_light",
        "logo_dark",
        "favicon",
      ].includes(key)
    ) {
      const partialSchema = siteSettingsSchema.partial();
      const result = partialSchema.safeParse({ [key]: value });
      if (!result.success) {
        return {
          success: false,
          message: result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
        };
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        value: value as any,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "key" },
    );

    if (error) {
      console.error("Error updating site setting:", error);
      return { success: false, message: mapDbError(error) };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");

    return { success: true };
  } catch (error) {
    console.error("Error in updateSiteSetting:", error);
    return { success: false, message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
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

    // Validation
    const result = siteSettingsSchema.partial().safeParse(settings);
    if (!result.success) {
      return {
        success: false,
        message: result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value as any,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    }));

    const { error } = await supabase
      .from("site_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      console.error("Error updating site settings:", error);
      return { success: false, message: mapDbError(error) };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");

    return { success: true };
  } catch (error) {
    console.error("Error in updateSiteSettings:", error);
    return { success: false, message: "Unknown error" };
  }
}

/**
 * AI Generate Social Post or DM templates
 */
export async function generateSocialAutomationTemplatesAction(
  type: "SOCIAL_POST" | "KEYWORD_DM",
  keyword?: string,
): Promise<{ success: boolean; data?: string; message?: string }> {
  try {
    const { generateText } = await import("@/lib/ai/gemini");
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");

    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model || "gemini-2.0-flash-exp";

    let prompt = "";
    if (type === "SOCIAL_POST") {
      prompt = `
        คุณเป็นนักการตลาดอสังหาริมทรัพย์มืออาชีพ
        ช่วยเขียน Template สำหรับโพสต์ลง Facebook/Instagram เพื่อดึงดูดลูกค้า
        ให้ใช้ "Dynamic Tags" เหล่านี้ประกอบในเนื้อหา:
        - {{title}}: ชื่อทรัพย์
        - {{price}}: ราคา
        - {{location}}: ทำเล
        - {{link}}: ลิงก์ทรัพย์
        - {{bedrooms}}: ห้องนอน
        - {{size_sqm}}: พื้นที่
        - {{agent_phone}}: เบอร์ติดต่อ
        
        คำแนะนำ:
        1. ใช้ภาษาไทยที่น่าสนใจ เร้าอารมณ์
        2. ใส่ Emoji ให้ดูสวยงาม
        3. เขียนให้สั้น กระชับ แต่อ่านแล้วอยากกดดูต่อ
        4. ส่งกลับเฉพาะเนื้อหา Template เท่านั้น ไม่ต้องขยายความ
      `;
    } else {
      prompt = `
        คุณเป็นเอเจนท์อสังหาริมทรัพย์ที่บริการดีเยี่ยม
        ช่วยเขียนข้อความตอบกลับลูกค้าทาง Inbox (DM) เมื่อลูกค้าสนใจสอบถามข้อมูล
        โดยลูกค้าพิมพ์ Keyword ว่า "${keyword || "สนใจ"}"
        
        ให้ใช้ "Dynamic Tags" เหล่านี้ประกอบในเนื้อหา:
        - {{title}}: ชื่อทรัพย์
        - {{price}}: ราคา
        - {{link}}: ลิงก์รายละเอียด
        - {{description}}: รายละเอียดเต็ม
        
        คำแนะนำ:
        1. ใช้ภาษาไทยที่สุภาพ เป็นกันเอง และดูเป็นมืออาชีพ
        2. ใส่ Emoji ให้ดูเป็นมิตร
        3. ควรเริ่มด้วยการทักทายและขอบคุณที่สนใจ
        4. ส่งกลับเฉพาะเนื้อหาข้อความตอบกลับเท่านั้น ไม่ต้องขยายความ
      `;
    }

    const result = await generateText(prompt, modelName);

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName,
      feature: "social_template_generator",
      status: "success",
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
    });

    return {
      success: true,
      data: result.text.trim().replace(/^```/, "").replace(/```$/, ""),
    };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return {
      success: false,
      message: "ไม่สามารถสร้างข้อความด้วย AI ได้ในขณะนี้",
    };
  }
}

/**
 * Action to upload site assets (logos, favicon)
 */
export async function uploadSiteAssetAction(
  formData: FormData,
  folder: string = "branding",
): Promise<{
  success: boolean;
  message: string;
  data?: { publicUrl: string };
}> {
  try {
    const { getCurrentProfile } =
      await import("@/lib/supabase/getCurrentProfile");
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "No file provided" };

    const { uploadSiteAsset } = await import("./storage");
    const result = await uploadSiteAsset(file, file.name, file.type, folder);

    return result;
  } catch (error) {
    console.error("Error in uploadSiteAssetAction:", error);
    return { success: false, message: "Internal server error" };
  }
}
