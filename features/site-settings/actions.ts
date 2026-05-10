"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { cache } from "react";
import { after } from "next/server";
import { z } from "zod";
import {
  SiteSettingKey,
  SocialKeyword,
  SiteSettings,
  siteSettingsSchema,
  SENSITIVE_KEYS,
} from "./schema";
import { Json } from "@/lib/database.types";
import { siteConfig } from "@/lib/site-config";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";
import { sendAdminNotification } from "@/lib/telegram";
import { mapDbError } from "@/lib/db-error";


/**
 * Helper to decrypt sensitive values with plaintext fallback
 */
export async function decryptValue(key: string, value: unknown): Promise<unknown> {
  if (!SENSITIVE_KEYS.includes(key as SiteSettingKey) || typeof value !== "string") {
    return value;
  }

  if (!isEncrypted(value)) {
    // 🛡️ Lazy Encryption Strategy: Re-save in background to encrypt
    // Since this runs in a server action/route, we use after() for non-blocking update
    after(async () => {
      try {
        console.log(`[LAZY-ENCRYPTION] Encrypting plaintext key on-the-fly: ${key}`);
        await updateSiteSettingAdmin(key as SiteSettingKey, value);
      } catch (err) {
        console.error(`[LAZY-ENCRYPTION-FAILED] Key: ${key}`, err);
      }
    });
    return value; // Return plaintext for immediate use
  }

  try {
    const decrypted = decrypt(value);
    if (decrypted === null) return value;
    // If it was originally a JSON object, parse it
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    // 🛡️ Security Watchdog: Alert on decryption failure
    await sendAdminNotification(
      `🚨 <b>SECURITY ALERT: Decryption Failed</b>\n━━━━━━━━━━━━━━━━━━\n\n<b>Key:</b> <code>${key}</code>\n<b>Warning:</b> ตรวจพบความผิดพลาดในการถอดรหัสข้อมูลสำคัญในฐานข้อมูล หรือกุญแจเข้ารหัสไม่ถูกต้อง!`
    ).catch(console.error);
    
    return undefined;
  }
}

/**
 * Helper to encrypt sensitive values
 */
export async function encryptValue(key: string, value: unknown): Promise<unknown> {
  if (!SENSITIVE_KEYS.includes(key as SiteSettingKey) || value === null || value === undefined) {
    return value;
  }

  const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
  
  try {
    return encrypt(stringValue);
  } catch (error) {
    console.error(`[CRYPTO-ERROR] Failed to encrypt key: ${key}`);
    throw error;
  }
}

const DEFAULT_SETTINGS: SiteSettings = {
  smart_match_wizard_enabled: true,
  chatbot_enabled: true,
  floating_contact_enabled: true,
  isolation_properties_enabled: false,
  isolation_leads_enabled: false,
  isolation_deals_enabled: false,
  social_automation_keywords: [],
  facebook_post_template: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}`,
  facebook_post_template_en: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nMore details: {{link}}`,
  facebook_post_template_cn: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\n更多详情: {{link}}`,
  facebook_post_template_ru: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nПодробнее: {{link}}`,
  instagram_post_template: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}`,
  instagram_post_template_en: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nMore details: {{link}}`,
  instagram_post_template_cn: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\n更多详情: {{link}}`,
  instagram_post_template_ru: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nПодробнее: {{link}}`,
  line_post_template: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}`,
  line_post_template_en: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nMore details: {{link}}`,
  line_post_template_cn: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\n更多详情: {{link}}`,
  line_post_template_ru: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nПодробнее: {{link}}`,
  tiktok_post_template: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}`,
  tiktok_post_template_en: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}`,
  tiktok_post_template_cn: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}`,
  tiktok_post_template_ru: `🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}`,
  site_name: siteConfig.name,
  company_name: siteConfig.company,
  site_description: siteConfig.description,
  contact_phone: siteConfig.contact.phone,
  contact_email: siteConfig.contact.email,
  contact_address: siteConfig.contact.address,
  google_maps_url: siteConfig.googleMapsUrl,
  facebook_url: siteConfig.links.facebook,
  instagram_url: siteConfig.links.instagram,
  line_url: siteConfig.links.line,
  tiktok_url: siteConfig.links.tiktok,
  line_id: siteConfig.contact.lineId,
  logo_light: siteConfig.logo,
  logo_dark: siteConfig.logoDark,
  favicon: "/favicon.png",
  onboarding_line_skipped: false,
  onboarding_staff_skipped: false,
  google_tag_manager_id: "GTM-NBG46JLN",
  google_tag_manager_enabled: true,
  hot_lead_threshold: 80,
  executive_summary_enabled: true,
  tiktok_auth_token: undefined,
  google_integration_tokens: undefined,
  meta_page_access_token: "",
  line_channel_access_token: "",
  meta_page_name: "",
  facebook_app_id: "",
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
 * Internal function to get all site settings (Hits DB)
 */
async function getSiteSettingsInternal(): Promise<SiteSettings> {
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

    for (const row of (data || [])) {
      const key = row.key as SiteSettingKey;
      if (!(key in settings)) continue;

      const val = await decryptValue(key, row.value);

      // 1. Handle Arrays (Keywords)
      if (key === "social_automation_keywords") {
        (settings as Record<string, unknown>)[key] = Array.isArray(val) ? val : [];
        continue;
      }

      // 2. Handle Objects (Tokens)
      if (key === "tiktok_auth_token" || key === "google_integration_tokens") {
        (settings as Record<string, unknown>)[key] = val && typeof val === "object" ? val : undefined;
        continue;
      }

      // 3. Handle Strings (Templates, URLs, Branding)
      const stringKeys: SiteSettingKey[] = [
        "site_name", "company_name", "site_description",
        "contact_phone", "contact_email", "contact_address",
        "google_maps_url", "facebook_url", "instagram_url", "line_url", "tiktok_url",
        "line_id", "logo_light", "logo_dark", "favicon",
        "google_tag_manager_id", "meta_page_access_token", "line_channel_access_token", "meta_page_name",
        "facebook_app_id"
      ];

      if (key.includes("_post_template") || stringKeys.includes(key)) {
        if (typeof val === "string") {
          (settings as Record<string, unknown>)[key] = val;
        }
        continue;
      }

      // 4. Handle Numbers
      if (key === "hot_lead_threshold") {
        (settings as Record<string, unknown>)[key] = typeof val === "number" ? val : Number(val) || 80;
        continue;
      }

      // 5. Handle Booleans (everything else)
      (settings as Record<string, unknown>)[key] = val === true || val === "true";
    }

    // 6. Post-process URLs to ensure they are absolute (Elite Hardening)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const urlKeys: SiteSettingKey[] = ["logo_light", "logo_dark", "favicon"];
      for (const key of urlKeys) {
        const val = (settings as Record<string, unknown>)[key];
        if (typeof val === "string" && val.startsWith("/storage/v1/object/public/")) {
          (settings as Record<string, unknown>)[key] = `${supabaseUrl}${val}`;
        }
      }
    }

    return settings;
  } catch (error: unknown) {
    console.error("Error in getSiteSettings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Internal cached getter for site settings
 */
const getCachedSiteSettings = cache(async () => {
  return unstable_cache(
    async () => getSiteSettingsInternal(),
    ["site-settings"],
    {
      revalidate: 3600, // Cache for 1 hour
      tags: ["site-settings"],
    }
  )();
});

/**
 * Get all site settings (Cached with revalidation tag)
 */
export async function getSiteSettings() {
  return getCachedSiteSettings();
}

/**
 * Get a specific site setting (Cached via getSiteSettings)
 */
export async function getSiteSetting(key: SiteSettingKey): Promise<unknown> {
  const settings = await getSiteSettings();
  return settings[key];
}

/**
 * Update a site setting
 */
export async function updateSiteSetting(
  key: SiteSettingKey,
  value: boolean | string[] | string | Record<string, unknown> | null | undefined,
): Promise<{ success: boolean; message?: string }> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const supabase = ctx.supabase;

    // Validation using partial schema
    const keysToValidate = [
      "contact_email", "google_maps_url", "facebook_url", 
      "instagram_url", "line_url", "tiktok_url",
      "logo_light", "logo_dark", "favicon",
      "tiktok_auth_token", "google_integration_tokens"
    ];

    if (keysToValidate.includes(key)) {
      const partialSchema = siteSettingsSchema.partial();
      const result = partialSchema.safeParse({ [key]: value });
      if (!result.success) {
        return {
          success: false,
          message: result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
        };
      }
    }

    const userId = ctx.user.id;
    const encryptedValue = await encryptValue(key, value);

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        value: (encryptedValue ?? "") as Json,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "key" },
    );

    if (error) {
      console.error(`Error updating site setting [${key}]:`, error);
      return { success: false, message: mapDbError(error) };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");
    revalidateTag("site-settings", "hours");

    return { success: true };
  } catch (error) {
    console.error("Error in updateSiteSetting:", error);
    return { success: false, message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}

/**
 * 🛡️ System-level update (Admin Client)
 * Used for background maintenance tasks like lazy encryption.
 */
async function updateSiteSettingAdmin(
  key: SiteSettingKey,
  value: boolean | string[] | string | Record<string, unknown> | null | undefined,
): Promise<{ success: boolean }> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = await createAdminClient();

    const encryptedValue = await encryptValue(key, value);

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        value: (encryptedValue ?? "") as Json,
        updated_at: new Date().toISOString(),
        updated_by: null,
      },
      { onConflict: "key" },
    );

    if (error) throw error;
    
    // 🛡️ Note: We skip revalidateTag here because this is often called 
    // from within a render/unstable_cache (Lazy Encryption).
    // The data is updated in DB, and will be fresh on next revalidation cycle.
    return { success: true };
  } catch (error) {
    console.error(`[ADMIN-UPDATE-FAILED] Key: ${key}`, error);
    return { success: false };
  }
}

/**
 * 🛡️ Phase 3 Migration: Encrypt existing plaintext secrets
 * This action fetches all sensitive keys and re-saves them to trigger encryption.
 */
export async function migrateSecretsAction(): Promise<{ 
  success: boolean; 
  message?: string;
  count?: number;
}> {
  try {
    const ctx = await requireAuthContext();
    if (ctx.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: Admin only" };
    }

    const supabase = ctx.supabase;
    const { data: settings, error: fetchError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SENSITIVE_KEYS);

    if (fetchError) throw fetchError;

    let migratedCount = 0;
    
    for (const row of (settings || [])) {
      const key = row.key as SiteSettingKey;
      const value = row.value;

      // Only migrate if it's not already encrypted and not empty
      if (value && typeof value === "string" && !isEncrypted(value)) {
        await updateSiteSetting(key, value);
        migratedCount++;
      } else if (value && typeof value === "object" && !isEncrypted(JSON.stringify(value))) {
        // Handle JSON objects (like google_integration_tokens)
        await updateSiteSetting(key, value as Record<string, unknown>);
        migratedCount++;
      }
    }

    return { 
      success: true, 
      message: `ดำเนินการเข้ารหัสข้อมูลเดิมเรียบร้อยแล้ว (${migratedCount} รายการ)`,
      count: migratedCount
    };
  } catch (error) {
    console.error("Error in migrateSecretsAction:", error);
    return { success: false, message: "Migration failed" };
  }
}

/**
 * Update multiple site settings at once
 */
export async function updateSiteSettings(
  settings: Partial<SiteSettings>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const supabase = ctx.supabase;

    // Validation
    const result = siteSettingsSchema.partial().safeParse(settings);
    if (!result.success) {
      return {
        success: false,
        message: result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    const userId = ctx.user.id;

    const updates = await Promise.all(
      Object.entries(settings).map(async ([key, value]) => ({
        key,
        value: ((await encryptValue(key, value)) ?? "") as Json,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }))
    );

    const { error } = await supabase
      .from("site_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      console.error("Error updating site settings:", error);
      return { success: false, message: mapDbError(error) };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");
    revalidateTag("site-settings", "hours");

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
  type: "SOCIAL_POST" | "KEYWORD_DM" | "LINE_POST" | "TIKTOK_POST",
  keyword?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
): Promise<{ success: boolean; data?: string; message?: string }> {
  try {
    const { generateText } = await import("@/lib/ai/gemini");
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");

    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model || "gemini-2.0-flash-exp";

    let prompt = "";
    if (type === "SOCIAL_POST") {
      const isInstagram = keyword === "instagram"; // We can reuse keyword field for platform hint
      const platformName = isInstagram ? "Instagram" : "Facebook";
      const langName =
        lang === "th"
          ? "ภาษาไทย"
          : lang === "en"
            ? "English"
            : lang === "ru"
              ? "Russian"
              : "Chinese";
      
      const igAdvice = isInstagram 
        ? "เน้นความสวยงาม ใช้ Hashtag ที่เกี่ยวข้อง (ไม่เกิน 30 อัน) และเขียนแคปชั่นให้น่าอ่านบนมือถือ"
        : "เน้นการให้ข้อมูลที่ครบพื้นฐาน ดึงดูดให้คนคอมเมนต์หรือแชร์";

      prompt = `
        คุณเป็นนักการตลาดอสังหาริมทรัพย์มืออาชีพ
        ช่วยเขียน Template สำหรับโพสต์ลง ${platformName} เพื่อดึงดูดลูกค้า
        โดยให้เขียนเป็น ${langName}
        
        ให้ใช้ "Dynamic Tags" เหล่านี้ประกอบในเนื้อหา:
        - {{title}}: ชื่อทรัพย์
        - {{price_tag}}: ป้ายราคาอัจฉริยะ (แนะนำให้ใช้แทน {{price}})
        - {{details}}: สรุปข้อมูลเบื้องต้น (เช่น 2 Bed | 2 Bath | 50 Sqm)
        - {{description}}: รายละเอียดทรัพย์สินเต็ม
        - {{location}}: ทำเล (เขต/จังหวัด) 
        - {{link}}: ลิงก์ทรัพย์
        - {{google_maps}}: ลิงก์ Google Maps 
        - {{agent_phone}}: เบอร์ติดต่อ
        
        คำแนะนำสำหรับ ${platformName}:
        1. ใช้ ${langName} ที่น่าสนใจ เร้าอารมณ์
        2. ใส่ Emoji ให้ดูสวยงาม
        3. ${igAdvice}
        4. ส่งกลับเฉพาะเนื้อหา Template เท่านั้น ไม่ต้องขยายความ
      `;
    } else if (type === "LINE_POST") {
      const langName =
        lang === "th"
          ? "ภาษาไทย"
          : lang === "en"
            ? "English"
            : lang === "ru"
              ? "Russian"
              : "Chinese";
      prompt = `
        คุณเป็นนักการตลาดอสังหาริมทรัพย์มืออาชีพ
        ช่วยเขียน Template สำหรับแสดงผลใน Line Flex Message (ส่วนข้อความรายละเอียด)
        โดยให้เขียนเป็น ${langName}
        
        ให้ใช้ "Dynamic Tags" เหล่านี้ประกอบในเนื้อหา:
        - {{title}}: ชื่อทรัพย์
        - {{price_tag}}: ป้ายราคาอัจฉริยะ (จัดการเรื่อง ลดราคา/ขาย/เช่า ให้อัตโนมัติ)
        - {{details}}: สรุปข้อมูลเบื้องต้น
        - {{location}}: ทำเล
        - {{link}}: ลิงก์ทรัพย์
        - {{google_maps}}: ลิงก์ Google Maps
        
        คำแนะนำ:
        1. เขียนให้สั้น กระชับ เพราะพื้นที่ใน Line Flex มีจำกัด
        2. ใส่ Emoji ให้ดูเป็นมิตร
        3. เน้นจุดเด่นของทรัพย์
        4. ส่งกลับเฉพาะเนื้อหา Template เท่านั้น ไม่ต้องขยายความ
      `;
    } else if (type === "TIKTOK_POST") {
      const langName =
        lang === "th"
          ? "ภาษาไทย"
          : lang === "en"
            ? "English"
            : lang === "ru"
              ? "Russian"
              : "Chinese";
      prompt = `
        คุณเป็นครีเอเตอร์ TikTok สายอสังหาริมทรัพย์ที่เก่งมาก
        ช่วยเขียน Caption สำหรับโพสต์ TikTok เพื่อดึงดูดคนดูคลิป (Photo Mode)
        โดยให้เขียนเป็น ${langName}
        
        ให้ใช้ "Dynamic Tags" เหล่านี้ประกอบในเนื้อหา:
        - {{title}}: ชื่อทรัพย์
        - {{price_tag}}: ป้ายราคาอัจฉริยะ (จัดการเรื่อง ลดราคา/ขาย/เช่า ให้อัตโนมัติ)
        - {{details}}: สรุปข้อมูลเบื้องต้น
        - {{location}}: ทำเล
        - {{link}}: ลิงก์ทรัพย์
        
        คำแนะนำสำหรับ TikTok:
        1. เขียนให้ดูสนุก เป็นกันเอง และทันสมัย (TikTok Style)
        2. ใส่ Emoji เยอะๆ และใส่ Hashtag ที่เกี่ยวข้อง (เช่น #vconnectasset #realestate)
        3. เขียนให้สั้น กระชับ แต่อ่านแล้วอยากหยุดดูคลิป
        4. ใช้ประโยคเปิด (Hook) ที่น่าสนใจใน 3-5 คำแรก
        5. ส่งกลับเฉพาะเนื้อหา Caption เท่านั้น ไม่ต้องขยายความ
      `;
    } else {
      const langName =
        lang === "th"
          ? "ภาษาไทย"
          : lang === "en"
            ? "English"
            : lang === "ru"
              ? "Russian"
              : "Chinese";
      prompt = `
        คุณเป็นเอเจนท์อสังหาริมทรัพย์ที่บริการดีเยี่ยม
        ช่วยเขียนข้อความตอบกลับลูกค้าทาง Inbox (DM) เมื่อลูกค้าสนใจสอบถามข้อมูล
        โดยลูกค้าพิมพ์ Keyword ว่า "${keyword || "สนใจ"}"
        และให้ตอบกลับเป็น ${langName}
        
        ให้ใช้ "Dynamic Tags" เหล่านี้ประกอบในเนื้อหา:
        - {{title}}: ชื่อทรัพย์
        - {{price_tag}}: ป้ายราคาอัจฉริยะ (จัดการเรื่อง ลดราคา/ขาย/เช่า ให้อัตโนมัติ)
        - {{details}}: สรุปข้อมูลเบื้องต้น
        - {{description}}: รายละเอียดทรัพย์สิน
        - {{link}}: ลิงก์รายละเอียด
        - {{google_maps}}: ลิงก์ Google Maps
        
        คำแนะนำ:
        1. ใช้ ${langName} ที่สุภาพ เป็นกันเอง และดูเป็นมืออาชีพ
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
  } catch (error: unknown) {
    console.error("AI Generation Error:", error);
    return {
      success: false,
      message: (error as Error).message || "ไม่สามารถสร้างข้อความด้วย AI ได้ในขณะนี้",
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
    return { success: false, message: mapDbError(error) };
  }
}
