import { z } from "zod";

export type SiteSettingKey =
  | "smart_match_wizard_enabled"
  | "chatbot_enabled"
  | "floating_contact_enabled"
  | "isolation_properties_enabled"
  | "isolation_leads_enabled"
  | "isolation_deals_enabled"
  | "social_automation_keywords"
  | "social_post_template"
  | "site_name"
  | "company_name"
  | "site_description"
  | "contact_phone"
  | "contact_email"
  | "contact_address"
  | "google_maps_url"
  | "facebook_url"
  | "instagram_url"
  | "line_url"
  | "tiktok_url"
  | "line_id"
  | "logo_light"
  | "logo_dark"
  | "favicon"
  | "onboarding_line_skipped"
  | "onboarding_staff_skipped";

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
  site_name: string;
  company_name: string;
  site_description: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  google_maps_url: string;
  facebook_url: string;
  instagram_url: string;
  line_url: string;
  tiktok_url: string;
  line_id: string;
  logo_light: string;
  logo_dark: string;
  favicon: string;
  onboarding_line_skipped?: boolean;
  onboarding_staff_skipped?: boolean;
}

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1, "กรุณากรอกชื่อเว็บไซต์").max(100),
  company_name: z.string().min(1, "กรุณากรอกชื่อบริษัท").max(100),
  site_description: z.string().max(500),
  contact_phone: z.string().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
  contact_email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  contact_address: z.string().max(500),
  google_maps_url: z
    .string()
    .url("รูปแบบ URL ไม่ถูกต้อง")
    .or(z.literal(""))
    .optional(),
  facebook_url: z
    .string()
    .url("รูปแบบ URL ไม่ถูกต้อง")
    .or(z.literal(""))
    .optional(),
  instagram_url: z
    .string()
    .url("รูปแบบ URL ไม่ถูกต้อง")
    .or(z.literal(""))
    .optional(),
  line_url: z
    .string()
    .url("รูปแบบ URL ไม่ถูกต้อง")
    .or(z.literal(""))
    .optional(),
  tiktok_url: z
    .string()
    .url("รูปแบบ URL ไม่ถูกต้อง")
    .or(z.literal(""))
    .optional(),
  line_id: z.string().max(50),
  logo_light: z.string().or(z.literal("")).optional(),
  logo_dark: z.string().or(z.literal("")).optional(),
  favicon: z.string().or(z.literal("")).optional(),
  smart_match_wizard_enabled: z.boolean().optional(),
  chatbot_enabled: z.boolean().optional(),
  floating_contact_enabled: z.boolean().optional(),
  isolation_properties_enabled: z.boolean().optional(),
  isolation_leads_enabled: z.boolean().optional(),
  isolation_deals_enabled: z.boolean().optional(),
  onboarding_line_skipped: z.boolean().optional(),
  onboarding_staff_skipped: z.boolean().optional(),
});
