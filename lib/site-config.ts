const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const siteConfig = {
  name: "V-LINK ASSET",
  company: "V-LINK ASSET Co., Ltd.",
  description: "Real Estate CRM & Listing Portal",
  url: getBaseUrl(),
  logo: "/images/v-link-svg-png-logo.svg",
  logoDark: "/images/v-link-svg-png-dark.svg",
  ogImage: "/opengraph-image.png",
  keywords: [
    "ซื้อขายบ้าน",
    "เช่าคอนโด",
    "ค้นหาที่ดิน",
    "ฝากขายอสังหาฟรี",
    "นายหน้าอสังหาริมทรัพย์",
    "ลงประกาศขายบ้าน",
    "Real Estate Thailand",
    "V-LINK ASSET",
  ],
  googleMapsUrl: "https://maps.app.goo.gl/xxxx", // ลิงก์แผนที่ของออฟฟิศ
  pagination: {
    defaultPerPage: 12,
  },
  links: {
    facebook: "https://facebook.com/vlinkasset",
    instagram: "https://instagram.com/vlinkasset",
    line: "https://line.me/ti/p/@vlinkasset",
    tiktok: "https://tiktok.com/@vlinkasset",
  },
  contact: {
    email: "vlink.asset@gmail.com",
    phone: "0XX-XXX-XXXX",
    lineId: "@vlinkasset",
    address: "ที่ตั้งออฟฟิศของคุณ...",
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
