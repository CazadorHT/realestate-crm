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
  | "brand_gradient_to"
  // Phase 1: Typography
  | "brand_heading_font"
  | "brand_body_font"
  // Phase 1: Border Radius
  | "brand_border_radius"
  // Phase 1: Button Geometry
  | "brand_button_style"
  | "brand_solid_radius"
  | "brand_outline_radius"
  | "brand_ghost_radius";

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
  // Phase 1: Typography
  brand_heading_font: string;
  brand_body_font: string;
  // Phase 1: Border Radius
  brand_border_radius: string;
  // Phase 1: Button Geometry
  brand_button_style: string;
  brand_solid_radius: string;
  brand_outline_radius: string;
  brand_ghost_radius: string;
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
  // Phase 1: Typography
  brand_heading_font: "Prompt",
  brand_body_font: "Noto Sans Thai",
  // Phase 1: Border Radius
  brand_border_radius: "md",
  // Phase 1: Button Geometry
  brand_button_style: "solid",
  brand_solid_radius: "rounded",
  brand_outline_radius: "rounded",
  brand_ghost_radius: "rounded",
};
