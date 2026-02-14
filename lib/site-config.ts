const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const siteConfig = {
  name: "OMA Asset",
  company: "OMA Asset Co., Ltd.",
  description: "Real Estate CRM & Listing Portal",
  url: getBaseUrl(),
  ogImage: "/opengraph-image.png",
  links: {
    facebook: "https://facebook.com/omaasset",
    instagram: "https://instagram.com/omaasset",
    line: "https://line.me/ti/p/@omaasset",
    tiktok: "https://tiktok.com/@omaasset",
  },
  contact: {
    email: "contact@oma-asset.com",
    phone: "+66-XX-XXX-XXXX",
    lineId: "@omaasset",
    address: "123 Business Road, Bangkok, Thailand 10110",
  },
  tier: (process.env.NEXT_PUBLIC_APP_TIER || process.env.APP_TIER || "PRO") as
    | "LITE"
    | "PRO"
    | "ENTERPRISE",
};

export const FEATURES = {
  LITE: {
    dashboard_analytics: false,
    ai_smart_summary: false,
    ai_auto_description: false,
    advanced_reports: false,
    line_integration: true,
    max_properties: 50,
  },
  PRO: {
    dashboard_analytics: true,
    ai_smart_summary: true,
    ai_auto_description: true,
    advanced_reports: true,
    line_integration: true,
    max_properties: 500,
  },
  ENTERPRISE: {
    dashboard_analytics: true,
    ai_smart_summary: true,
    ai_auto_description: true,
    advanced_reports: true,
    line_integration: true,
    max_properties: 10000,
  },
};

export type SiteConfig = typeof siteConfig;
export type AppTier = keyof typeof FEATURES;
export type FeatureName = keyof (typeof FEATURES)["PRO"];
