import { siteConfig } from "@/lib/site-config";

export type SiteSettingKey =
  | "smart_match_wizard_enabled"
  | "chatbot_enabled"
  | "floating_contact_enabled"
  | "brand_site_name"
  | "brand_primary_color"
  | "brand_secondary_color"
  | "brand_logo_url"
  | "brand_favicon_url"
  | "brand_hero_image_url"
  | "brand_active_profile"
  | "brand_gradient_from"
  | "brand_gradient_to";

export interface SiteSettings {
  smart_match_wizard_enabled: boolean;
  chatbot_enabled: boolean;
  floating_contact_enabled: boolean;
  brand_site_name: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_logo_url: string;
  brand_favicon_url: string;
  brand_hero_image_url: string;
  brand_active_profile: "profile1" | "profile2" | "profile3" | "custom";
  brand_gradient_from: string;
  brand_gradient_to: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  smart_match_wizard_enabled: true,
  chatbot_enabled: true,
  floating_contact_enabled: true,
  brand_site_name: siteConfig.name,
  brand_primary_color: "226 75% 48%", // Indigo/Blue
  brand_secondary_color: "210 40% 96.1%", // Light Slate
  brand_logo_url: siteConfig.logo,
  brand_favicon_url: siteConfig.logo,
  brand_hero_image_url: "/images/hero-realestate.png",
  brand_active_profile: "profile1",
  brand_gradient_from: "226 75% 48%", // Indigo-600
  brand_gradient_to: "280 60% 50%", // Purple-600
};
