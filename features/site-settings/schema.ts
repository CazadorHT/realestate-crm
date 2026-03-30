import { z } from "zod";

export type SiteSettingKey =
  | "smart_match_wizard_enabled"
  | "chatbot_enabled"
  | "floating_contact_enabled"
  | "isolation_properties_enabled"
  | "isolation_leads_enabled"
  | "isolation_deals_enabled"
  | "social_automation_keywords"
  | "facebook_post_template"
  | "facebook_post_template_en"
  | "facebook_post_template_cn"
  | "instagram_post_template"
  | "instagram_post_template_en"
  | "instagram_post_template_cn"
  | "line_post_template"
  | "line_post_template_en"
  | "line_post_template_cn"
  | "tiktok_post_template"
  | "tiktok_post_template_en"
  | "tiktok_post_template_cn"
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
  | "onboarding_staff_skipped"
  | "google_tag_manager_id"
  | "google_tag_manager_enabled"
  | "hot_lead_threshold"
  | "executive_summary_enabled"
  | "tiktok_auth_token"
  | "google_integration_tokens"
  | "meta_page_access_token"
  | "line_channel_access_token"
  | "meta_page_name";

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
  facebook_post_template?: string;
  facebook_post_template_en?: string;
  facebook_post_template_cn?: string;
  instagram_post_template?: string;
  instagram_post_template_en?: string;
  instagram_post_template_cn?: string;
  line_post_template?: string;
  line_post_template_en?: string;
  line_post_template_cn?: string;
  tiktok_post_template?: string;
  tiktok_post_template_en?: string;
  tiktok_post_template_cn?: string;
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
  google_tag_manager_id?: string;
  google_tag_manager_enabled?: boolean;
  hot_lead_threshold?: number;
  executive_summary_enabled?: boolean;
  tiktok_auth_token?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    open_id: string;
    scope: string;
    updated_at?: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
  google_integration_tokens?: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    email?: string;
  } | null;
  meta_page_access_token?: string;
  line_channel_access_token?: string;
  meta_page_name?: string;
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
  google_tag_manager_id: z.string().max(20).optional(),
  google_tag_manager_enabled: z.boolean().optional(),
  hot_lead_threshold: z.number().optional(),
  executive_summary_enabled: z.boolean().optional(),
  tiktok_auth_token: z
    .object({
      access_token: z.string(),
      refresh_token: z.string(),
      expires_in: z.number(),
      refresh_expires_in: z.number(),
      open_id: z.string(),
      scope: z.string(),
      updated_at: z.string().optional(),
      display_name: z.string().optional(),
      avatar_url: z.string().optional(),
    })
    .optional()
    .nullable(),
  google_integration_tokens: z
    .object({
      access_token: z.string(),
      refresh_token: z.string().optional(),
      expiry_date: z.number().optional(),
      email: z.string().optional(),
    })
    .optional()
    .nullable(),
  meta_page_access_token: z.string().optional(),
  line_channel_access_token: z.string().optional(),
  meta_page_name: z.string().optional(),
});
