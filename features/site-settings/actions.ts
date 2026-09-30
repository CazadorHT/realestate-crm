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
  MetaConnectedAccount,
} from "./schema";
import { Json } from "@/lib/database.types.generated";
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
    try {
      after(async () => {
        try {
          console.log(`[LAZY-ENCRYPTION] Encrypting plaintext key on-the-fly: ${key}`);
          await updateSiteSettingAdmin(key as SiteSettingKey, value);
        } catch (err) {
          console.error(`[LAZY-ENCRYPTION-FAILED] Key: ${key}`, err);
        }
      });
    } catch (afterError) {
      // Fallback: update in background without after() if not in request scope
      console.warn(`[LAZY-ENCRYPTION] outside request scope, running inline for key: ${key}`);
      updateSiteSettingAdmin(key as SiteSettingKey, value).catch(err => {
        console.error(`[LAZY-ENCRYPTION-FAILED] Key: ${key}`, err);
      });
    }
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
  meta_connected_accounts: [],
  instagram_story_reply_enabled: false,
  direct_dm_reply_enabled: false,
  story_ads_welcome_message: "เซฮายยย ขอบคุณที่แวะมาสอบถามน้า ✨\nยินดีให้บริการค่ะ ต้องการสอบถามข้อมูลห้อง นัดชมสถานที่จริง หรือพูดคุยกับทีมงาน เลือกรายการด้านล่างได้เลยน้าาา 💕",
  story_ads_welcome_message_en: "Hello! Thank you for reaching out ✨\nWe're delighted to assist you. Would you like to schedule a viewing, check available units, or chat with our team? Please choose an option below 💕",
  story_ads_welcome_message_cn: "您好！感谢您的咨询 ✨\n很高兴为您服务。如果您想预约看房、查看最新房源或与客服交谈，请选择下方选项 💕",
  story_ads_welcome_message_ru: "Здравствуйте! Спасибо за обращение ✨\nБудем рады помочь! Выберите нужный пункт ниже: запись на просмотр, свободные варианты или связь с менеджером 💕",
  story_ads_buttons_enabled: true,
  story_ads_custom_buttons: [],
  auto_featured_carousel_enabled: true,
  questionnaire_budget_options: [],
  questionnaire_zone_options: [],
  follow_gate_enabled: false,
  lead_capture_gate_enabled: false,
  facebook_post_template: "",
  facebook_post_template_en: "",
  facebook_post_template_cn: "",
  facebook_post_template_ru: "",
  instagram_post_template: "",
  instagram_post_template_en: "",
  instagram_post_template_cn: "",
  instagram_post_template_ru: "",
  line_post_template: "",
  line_post_template_en: "",
  line_post_template_cn: "",
  line_post_template_ru: "",
  tiktok_post_template: "",
  tiktok_post_template_en: "",
  tiktok_post_template_cn: "",
  tiktok_post_template_ru: "",
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
  partners_description: "เราโปรโมทและลงประกาศทรัพย์สินของคุณผ่านช่องทางการตลาดและโซเชียลมีเดียชั้นนำ เช่น Facebook, Instagram, TikTok, LivingInsider และเว็บไซต์ของเรา เพื่อความคุ้มค่าและโอกาสขายสำเร็จสูงสุด",
  partners_description_en: "We promote and advertise your properties across leading channels and social media including Facebook, Instagram, TikTok, LivingInsider, and our website.",
  partners_description_cn: "我们在领先的营销渠道和社交媒体上推广并发布您的房产，包括 Facebook, Instagram, TikTok, LivingInsider 以及我们的官方网站。",
  follow_gate_message: "ขอบคุณที่สนใจน้า ✨ เพื่อรับรายละเอียดห้องและราคาพิเศษ รบกวนกดติดตามโปรไฟล์ {{handle}} ก่อนน้า แล้วกดปุ่ม \"ฟอลแล้ว\" ด้านล่างได้เลยครับ 💕",
  follow_gate_message_en: "Thanks for your interest! ✨ To receive room details and special price, please follow our profile {{handle}} first, then tap 'Followed' below 💕",
  follow_gate_retry_message: "ระบบตรวจพบว่ายังไม่ได้กดติดตามเลยน้า 🥺 ฝากกดติดตาม {{handle}} ก่อนน้าเด่วส่งข้อมูลให้ทันทีเลยครับ ✨",
  follow_gate_retry_message_en: "It looks like you haven't followed yet 🥺 Please follow {{handle}} first, then tap the button below to get the details! ✨",
  follow_gate_success_message: "ขอบคุณที่กดติดตามน้า 🙏✨ นี่คือรายละเอียดโครงการที่ขอไว้ครับ 👇",
  follow_gate_success_message_en: "Thank you for following! 🙏✨ Here are the property details you requested 👇",
  follow_gate_public_reply: "ส่งข้อมูลให้ทาง DM แล้วน้า ฝากกดติดตาม {{handle}} แล้วเช็ก Inbox ได้เลยครับ 😊📩",
  follow_gate_public_reply_en: "Sent you a DM! Please follow {{handle}} and check your Inbox 😊📩",
  follow_gate_btn_profile: "👉 ไปที่หน้าโปรไฟล์",
  follow_gate_btn_profile_en: "👉 View Profile",
  follow_gate_btn_check: "✅ ฟอลแล้ว (รับข้อมูล)",
  follow_gate_btn_check_en: "✅ Followed (Get Info)",
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

// 🚀 Fast In-Memory Cache for Site Settings (1-hour TTL) for zero database egress across navigations
const siteSettingsMemoryCache = new Map<string, { data: SiteSettings; timestamp: number }>();
const SITE_SETTINGS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function invalidateSiteSettingsCache(tenantId?: string) {
  if (tenantId) {
    siteSettingsMemoryCache.delete(tenantId);
  } else {
    siteSettingsMemoryCache.clear();
  }
}

/**
 * Internal function to get all site settings (Hits DB only on cache miss)
 */
async function getSiteSettingsInternal(tenantId: string): Promise<SiteSettings> {
  const now = Date.now();
  const cached = siteSettingsMemoryCache.get(tenantId);
  if (cached && now - cached.timestamp < SITE_SETTINGS_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = await createAdminClient();
    
    let query = supabase.from("site_settings").select("tenant_id, key, value");
    
    if (tenantId && tenantId !== "global") {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is("tenant_id", null);
    }

    const { data, error } = await query
      .order("tenant_id", { ascending: true, nullsFirst: true })
      .order("updated_at", { ascending: true });

    if (error) {
      console.error("Error fetching site settings:", error);
      return DEFAULT_SETTINGS;
    }

    const settings = { ...DEFAULT_SETTINGS };

    for (const row of (data || [])) {
      const key = row.key as SiteSettingKey;
      if (!(key in settings)) continue;

      const val = await decryptValue(key, row.value);

      // 1. Handle Arrays (Keywords, Buttons, Questionnaire Options, Connected Accounts)
      if (
        key === "social_automation_keywords" ||
        key === "story_ads_custom_buttons" ||
        key === "questionnaire_budget_options" ||
        key === "questionnaire_zone_options" ||
        key === "meta_connected_accounts"
      ) {
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
        "facebook_app_id",
        "partners_description", "partners_description_en", "partners_description_cn", "partners_description_ru",
        "follow_gate_message", "follow_gate_message_en", "follow_gate_retry_message", "follow_gate_retry_message_en",
        "follow_gate_success_message", "follow_gate_success_message_en", "follow_gate_public_reply", "follow_gate_public_reply_en",
        "follow_gate_btn_profile", "follow_gate_btn_profile_en", "follow_gate_btn_check", "follow_gate_btn_check_en"
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

    // 7. Backward-Compatibility for Meta Connected Accounts
    const fallbackToken = settings.meta_page_access_token || process.env.META_PAGE_ACCESS_TOKEN || "";
    if (
      (!settings.meta_connected_accounts || settings.meta_connected_accounts.length === 0) &&
      fallbackToken
    ) {
      settings.meta_connected_accounts = [
        {
          id: "default-vcc-account",
          name: settings.meta_page_name || "VC Connect Asset",
          handle: "@vccasset",
          platform: "INSTAGRAM",
          page_id: (settings as any).meta_page_id || "111608617234370",
          page_name: settings.meta_page_name || "VC Connect Asset",
          instagram_business_id: process.env.META_INSTAGRAM_BUSINESS_ID || "17841446199195491",
          instagram_username: "vccasset",
          page_access_token: fallbackToken,
          is_active: true,
          is_default: true,
          token_status: "VALID",
          created_at: new Date().toISOString(),
        },
      ];
    }

    siteSettingsMemoryCache.set(tenantId, { data: settings, timestamp: now });
    return settings;
  } catch (error: unknown) {
    console.error("Error in getSiteSettings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get all site settings (Cached with revalidation tag scoped by tenant)
 */
const getCachedSiteSettingsInternal = (tenantId: string) =>
  unstable_cache(
    async () => getSiteSettingsInternal(tenantId),
    ["site-settings", tenantId],
    {
      revalidate: 31536000, // 1 year cache (tag-invalidated on update)
      tags: [`site-settings-${tenantId}`, "site-settings"],
    }
  )();

export async function getSiteSettings() {
  let tenantId = "global";
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some((c) => c.name.includes("-auth-token"));
    
    if (hasAuthCookie) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.app_metadata?.tenant_id) {
        tenantId = user.app_metadata.tenant_id;
      }
    }
  } catch (e) {
    // Ignore error for public/anonymous access
  }

  try {
    return await getCachedSiteSettingsInternal(tenantId);
  } catch (cacheError) {
    console.warn("[SITE-SETTINGS] unstable_cache failed, falling back to direct DB fetch:", cacheError);
    return getSiteSettingsInternal(tenantId);
  }
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

    const { error } = await (supabase as any).from("system_settings_v3").upsert(
      {
        tenant_id: ctx.tenantId || null,
        category: "general",
        key,
        value: (encryptedValue ?? "") as Json,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "tenant_id,category,key" },
    );

    if (error) {
      console.error(`Error updating site setting [${key}]:`, error);
      return { success: false, message: mapDbError(error) };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");
    revalidateTag(`site-settings-${ctx.tenantId || "global"}`, "hours");
    revalidateTag("site-settings", "hours");
    invalidateSiteSettingsCache(ctx.tenantId || "global");
    invalidateSiteSettingsCache("global");

    const { purgeCloudflareCache } = await import("@/lib/cloudflare");
    purgeCloudflareCache().catch((e) =>
      console.error("[Cloudflare] Site settings purge failed:", e)
    );

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

    const { error } = await (supabase as any).from("system_settings_v3").upsert(
      {
        tenant_id: null,
        category: "general",
        key,
        value: (encryptedValue ?? "") as Json,
        updated_at: new Date().toISOString(),
        updated_by: null,
      },
      { onConflict: "tenant_id,category,key" },
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
    const { data: settings, error: fetchError } = await (supabase as any)
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
        tenant_id: ctx.tenantId || null,
        category: "general",
        key,
        value: ((await encryptValue(key, value)) ?? "") as Json,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }))
    );

    const { error } = await (supabase as any)
      .from("system_settings_v3")
      .upsert(updates, { onConflict: "tenant_id,category,key" });

    if (error) {
      console.error("Error updating site settings:", error);
      return { success: false, message: mapDbError(error) };
    }

    revalidatePath("/");
    revalidatePath("/protected/settings");
    revalidateTag(`site-settings-${ctx.tenantId || "global"}`, "hours");
    revalidateTag("site-settings", "hours");

    const { purgeCloudflareCache } = await import("@/lib/cloudflare");
    purgeCloudflareCache().catch((e) =>
      console.error("[Cloudflare] Site settings purge failed:", e)
    );

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
  type: "SOCIAL_POST" | "INSTAGRAM_POST" | "KEYWORD_DM" | "LINE_POST" | "TIKTOK_POST",
  keyword?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
): Promise<{ success: boolean; data?: string; message?: string }> {
  try {
    const { generateText } = await import("@/lib/ai/gemini");
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");

    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model || "gemini-flash-lite-latest";

    let prompt = "";
    if (type === "SOCIAL_POST" || type === "INSTAGRAM_POST") {
      const isInstagram = type === "INSTAGRAM_POST" || keyword === "instagram"; // We can reuse keyword field for platform hint
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

/**
 * Validates and saves a manually entered Meta Page Access Token.
 * Fetches Page ID and Page Name from Facebook Graph API using the token.
 */
export async function saveManualMetaTokenAction(
  token: string
): Promise<{ success: boolean; message: string; pageName?: string }> {
  try {
    const { getCurrentProfile } = await import("@/lib/supabase/getCurrentProfile");
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    if (!token || token.trim() === "") {
      return { success: false, message: "กรุณากรอก Token" };
    }

    // Call Facebook Graph API to validate token and fetch page details
    const fbUrl = `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token.trim()}`;
    const fbRes = await fetch(fbUrl);
    
    if (!fbRes.ok) {
      const fbError = await fbRes.json().catch(() => ({}));
      return { 
        success: false, 
        message: `Token ไม่ถูกต้องหรือหมดอายุ: ${fbError.error?.message || "ไม่สามารถเชื่อมต่อ Facebook ได้"}` 
      };
    }

    const fbData = await fbRes.json();
    const pageId = fbData.id;
    const pageName = fbData.name;

    if (!pageId || !pageName) {
      return { success: false, message: "ไม่พบข้อมูลเพจ Facebook จาก Token นี้" };
    }

    // Save tokens and page info to site settings
    await updateSiteSetting("meta_page_access_token", token.trim());
    await updateSiteSetting("meta_page_id" as any, pageId);
    await updateSiteSetting("meta_page_name", pageName);

    return { 
      success: true, 
      message: `เชื่อมต่อกับเพจ "${pageName}" สำเร็จแล้ว!`,
      pageName 
    };
  } catch (error: any) {
    console.error("Error in saveManualMetaTokenAction:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ" };
  }
}

/**
 * Helper to mask access token for UI safe rendering (e.g. EAAB...****...XYZ)
 */
function maskToken(token: string): string {
  if (!token || token.length < 12) return "••••••••";
  const start = token.substring(0, 4);
  const end = token.substring(token.length - 4);
  return `${start}...••••...${end}`;
}

/**
 * Get all connected Meta accounts with masked tokens for client UI
 */
export async function getMaskedMetaAccountsAction(): Promise<{
  success: boolean;
  accounts: Array<Omit<MetaConnectedAccount, "page_access_token"> & { masked_token: string }>;
}> {
  try {
    const settings = await getSiteSettings();
    const accounts = (settings.meta_connected_accounts || []).map((acc) => ({
      ...acc,
      masked_token: maskToken(acc.page_access_token),
      page_access_token: undefined as any,
    }));
    return { success: true, accounts };
  } catch (err: any) {
    console.error("Error getting masked meta accounts:", err);
    return { success: false, accounts: [] };
  }
}

/**
 * Saves or updates a Meta Connected Account (Instagram/Facebook)
 * Validates token via Meta Graph API and automatically fetches Page ID, Page Name,
 * and connected Instagram Business Account ID.
 */
export async function saveMetaConnectedAccountAction(input: {
  id?: string;
  name: string;
  handle?: string;
  platform?: "INSTAGRAM" | "FACEBOOK" | "BOTH";
  page_access_token: string;
  is_default?: boolean;
  assigned_agent_id?: string;
}): Promise<{ success: boolean; message: string; account?: any }> {
  try {
    const { getCurrentProfile } = await import("@/lib/supabase/getCurrentProfile");
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized: สิทธิ์ไม่เพียงพอ" };
    }

    const token = input.page_access_token?.trim();
    if (!token) {
      return { success: false, message: "กรุณาระบุ Page Access Token" };
    }

    // Call Facebook Graph API to validate token and fetch page & IG business account details
    // If the input indicates hunter.vcc or Hunter VCC, query that specific page directly if accessible with this token
    const targetEndpoint =
      input.handle?.toLowerCase().includes("hunter") || input.name?.toLowerCase().includes("hunter")
        ? "1386378974552787"
        : "me";

    let fbUrl = `https://graph.facebook.com/v19.0/${targetEndpoint}?fields=id,name,instagram_business_account{id,username}&access_token=${token}`;
    let fbRes = await fetch(fbUrl);

    if (!fbRes.ok && targetEndpoint !== "me") {
      fbUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,instagram_business_account{id,username}&access_token=${token}`;
      fbRes = await fetch(fbUrl);
    }

    if (!fbRes.ok) {
      const fbError = await fbRes.json().catch(() => ({}));
      return {
        success: false,
        message: `Token ไม่ถูกต้องหรือหมดอายุ: ${fbError.error?.message || "ไม่สามารถเชื่อมต่อ Facebook Graph API ได้"}`,
      };
    }

    const fbData = await fbRes.json();
    const pageId = fbData.id;
    const pageName = fbData.name;
    const igAccount = fbData.instagram_business_account;
    const igId = igAccount?.id || "";
    const igUsername = igAccount?.username || (input.handle ? input.handle.replace("@", "") : "");

    if (!pageId) {
      return { success: false, message: "ไม่พบ Facebook Page ID จาก Token นี้" };
    }

    const settings = await getSiteSettings();
    const currentAccounts: MetaConnectedAccount[] = [...(settings.meta_connected_accounts || [])];

    const accountId = input.id || `meta_acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isFirstAccount = currentAccounts.length === 0;
    const isDefault = input.is_default !== undefined ? input.is_default : isFirstAccount;

    // If setting this account as default, unmark default on other accounts
    if (isDefault) {
      for (const acc of currentAccounts) {
        if (acc.id !== accountId) {
          acc.is_default = false;
        }
      }
    }

    const newAccount: MetaConnectedAccount = {
      id: accountId,
      name: input.name?.trim() || pageName || "Meta Account",
      handle: input.handle?.trim() || (igUsername ? `@${igUsername}` : undefined),
      platform: input.platform || "INSTAGRAM",
      page_id: pageId,
      page_name: pageName,
      instagram_business_id: igId,
      instagram_username: igUsername,
      page_access_token: token,
      is_active: true,
      is_default: isDefault,
      token_status: "VALID",
      last_token_check_at: new Date().toISOString(),
      assigned_agent_id: input.assigned_agent_id || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existingIndex = currentAccounts.findIndex(
      (a) => a.id === accountId || (a.page_id === pageId && (a.instagram_business_id === igId || !igId || !a.instagram_business_id))
    );
    if (existingIndex >= 0) {
      currentAccounts[existingIndex] = {
        ...currentAccounts[existingIndex],
        ...newAccount,
        created_at: currentAccounts[existingIndex].created_at,
      };
    } else {
      currentAccounts.push(newAccount);
    }

    // Save to site_settings (encrypted by SENSITIVE_KEYS)
    await updateSiteSetting("meta_connected_accounts", currentAccounts as any);

    // If default, also update legacy single keys for 100% backward compatibility
    if (isDefault) {
      await updateSiteSetting("meta_page_access_token", token);
      await updateSiteSetting("meta_page_id" as any, pageId);
      await updateSiteSetting("meta_page_name", pageName);
    }

    let warningNotice = "";
    if (!igId) {
      warningNotice = " (คำเตือน: เพจนี้ยังไม่ได้ผูกกับ Instagram Business Account ในระบบ Meta โปรดเชื่อมต่อ IG กับเพจใน Meta Business Suite เพื่อให้บอท IG ทำงานได้สมบูรณ์)";
    }

    return {
      success: true,
      message: `เชื่อมต่อบัญชี "${newAccount.name}" (${newAccount.handle || newAccount.page_name}) สำเร็จแล้ว!${warningNotice}`,
      account: {
        ...newAccount,
        masked_token: maskToken(newAccount.page_access_token),
        page_access_token: undefined,
      },
    };
  } catch (error: any) {
    console.error("Error in saveMetaConnectedAccountAction:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการบันทึกบัญชี Meta" };
  }
}

/**
 * Delete a connected Meta Account
 */
export async function deleteMetaConnectedAccountAction(
  accountId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { getCurrentProfile } = await import("@/lib/supabase/getCurrentProfile");
    const user = await getCurrentProfile();

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const settings = await getSiteSettings();
    const accounts = [...(settings.meta_connected_accounts || [])];
    const filtered = accounts.filter((a) => a.id !== accountId);

    if (filtered.length === accounts.length) {
      return { success: false, message: "ไม่พบบัญชีที่ต้องการลบ" };
    }

    // If we deleted the default account, make the first remaining one default
    if (filtered.length > 0 && !filtered.some((a) => a.is_default)) {
      filtered[0].is_default = true;
    }

    await updateSiteSetting("meta_connected_accounts", filtered as any);

    // If remaining default exists, sync legacy key
    const newDefault = filtered.find((a) => a.is_default);
    if (newDefault) {
      await updateSiteSetting("meta_page_access_token", newDefault.page_access_token);
      await updateSiteSetting("meta_page_id" as any, newDefault.page_id);
      await updateSiteSetting("meta_page_name", newDefault.page_name || newDefault.name);
    }

    return { success: true, message: "ลบบัญชีเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("Error in deleteMetaConnectedAccountAction:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการลบบัญชี" };
  }
}

/**
 * Toggle active status of a connected Meta Account
 */
export async function toggleMetaAccountStatusAction(
  accountId: string,
  isActive: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getSiteSettings();
    const accounts = [...(settings.meta_connected_accounts || [])];
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return { success: false, message: "ไม่พบบัญชี" };

    acc.is_active = isActive;
    acc.updated_at = new Date().toISOString();

    await updateSiteSetting("meta_connected_accounts", accounts as any);
    return { success: true, message: isActive ? "เปิดใช้งานบัญชีแล้ว" : "ปิดการใช้งานบัญชีชั่วคราวแล้ว" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Check health status of a Meta Account's token
 */
export async function checkMetaAccountTokenHealthAction(
  accountId: string
): Promise<{ success: boolean; status: "VALID" | "EXPIRED" | "REVOKED"; message: string }> {
  try {
    const settings = await getSiteSettings();
    const accounts = [...(settings.meta_connected_accounts || [])];
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return { success: false, status: "REVOKED", message: "ไม่พบบัญชี" };

    const fbUrl = `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${acc.page_access_token}`;
    const res = await fetch(fbUrl);

    acc.last_token_check_at = new Date().toISOString();

    if (res.ok) {
      acc.token_status = "VALID";
      await updateSiteSetting("meta_connected_accounts", accounts as any);
      return { success: true, status: "VALID", message: "Token ใช้งานได้ปกติ (Active)" };
    } else {
      const errData = await res.json().catch(() => ({}));
      acc.token_status = "EXPIRED";
      await updateSiteSetting("meta_connected_accounts", accounts as any);

      // Alert via Telegram
      await sendAdminNotification(
        `🚨 <b>[CRM Alert] Meta Token หมดอายุหรือถูกเพิกถอน!</b>\n━━━━━━━━━━━━━━━━━━\n` +
        `<b>บัญชี:</b> ${acc.name} (${acc.handle || acc.page_name || acc.id})\n` +
        `<b>ข้อความผิดพลาด:</b> ${errData.error?.message || "Invalid or Expired Token"}\n` +
        `กรุณาอัปเดต Token ในหน้า Settings เพื่อให้ระบบ Auto-DM ทำงานต่อได้`
      ).catch(console.error);

      return {
        success: false,
        status: "EXPIRED",
        message: `Token มีปัญหา: ${errData.error?.message || "หมดอายุ"}`,
      };
    }
  } catch (err: any) {
    return { success: false, status: "EXPIRED", message: err.message || "เกิดข้อผิดพลาดในการตรวจสอบ" };
  }
}
