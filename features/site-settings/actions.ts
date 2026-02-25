"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SiteSettingKey =
  | "smart_match_wizard_enabled"
  | "chatbot_enabled"
  | "floating_contact_enabled"
  | "isolation_properties_enabled"
  | "isolation_leads_enabled"
  | "isolation_deals_enabled"
  | "social_automation_keywords"
  | "social_post_template";

export interface SocialKeyword {
  keyword: string;
  dm_content: string;
  public_reply?: string;
  enabled?: boolean;
}

export interface SiteSettings {
  smart_match_wizard_enabled: boolean;
  chatbot_enabled: boolean;
  floating_contact_enabled: boolean;
  isolation_properties_enabled: boolean;
  isolation_leads_enabled: boolean;
  isolation_deals_enabled: boolean;
  social_automation_keywords: SocialKeyword[];
  social_post_template?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  smart_match_wizard_enabled: true,
  chatbot_enabled: true,
  floating_contact_enabled: true,
  isolation_properties_enabled: false,
  isolation_leads_enabled: false,
  isolation_deals_enabled: false,
  social_automation_keywords: [],
  social_post_template: `🏠 {{title}}\n💰 {{price}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}`,
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
        if (key === "social_automation_keywords") {
          // It's an array of objects stored as JSONB
          (settings as any)[key] = Array.isArray(row.value)
            ? (row.value as any)
            : [];
        } else if (key === "social_post_template") {
          (settings as any)[key] =
            typeof row.value === "string" ? row.value : (settings as any)[key];
        } else {
          // Value is stored as JSONB, parse boolean
          // Handle cases where it might be a string "true" or a boolean true
          (settings as any)[key] = row.value === true || row.value === "true";
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
      value: value as any,
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
