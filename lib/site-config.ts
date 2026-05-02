const getBaseUrl = () => {
  // Support standard NEXT_PUBLIC_SITE_URL first
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  
  // High Priority: Use the verified production domain if in production environment
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return "https://realestate-crm-rho.vercel.app";
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const siteConfig = {
  name: "VC Connect Asset",
  company: "VC Connect Asset Co., Ltd.",
  description: "ระบบจัดการอสังหาริมทรัพย์และพอร์ทัลประกาศขาย-เช่า",
  url: getBaseUrl(),
  logo: "/images/branding/vcc-asset/logo-dark.svg",
  logoDark: "/images/branding/vcc-asset/logo-light.svg",
  brandCard: "/images/branding/vcc-asset/favicon-animated-light.svg",
  ogImage: "/images/hero-realestate.png",
  keywords: [
    "ซื้อขายบ้าน",
    "เช่าคอนโด",
    "ค้นหาที่ดิน",
    "ฝากขายอสังหาฟรี",
    "นายหน้าอสังหาริมทรัพย์",
    "ลงประกาศขายบ้าน",
    "Real Estate Thailand",
    "VC Connect Asset",
    "VC Connect Asset Co., Ltd.",
    "ซื้อขายอสังหาริมทรัพย์",
    "คอนโดใกล้รถไฟฟ้า",
    "บ้านมือสองสภาพดี",
    "ที่ดินแปลงสวย",
    "ออฟฟิศให้เช่า",
    "Property Agent Bangkok",
    "สำนักงานออฟฟิศให้เช่า",
    "สำนักงานออฟฟิศ",
    "co-working space",
    "office space",
    "office",
    "Luxury Property Thailand",
    "Investment Property",
  ],
  googleMapsUrl: "https://maps.app.goo.gl/xxxx", // ลิงก์แผนที่ของออฟฟิศ
  pagination: {
    defaultPerPage: 12,
  },
  links: {
    facebook: "https://facebook.com/vcconnectasset",
    instagram: "https://instagram.com/vcconnectasset",
    line: "https://line.me/ti/p/@811slazm",
    tiktok: "https://tiktok.com/@vcconnectasset",
  },
  contact: {
    email: "vcconnect.asset@gmail.com",
    phone: "0XX-XXX-XXXX",
    lineId: "@vcconnectasset",
    address: "ที่ตั้งออฟฟิศของคุณ...",
  },
  companySignature: "/images/branding/vcc-asset/logo-dark.svg",
  companyStamp: "/images/branding/vcc-asset/logo-light.svg",
  // ============================================================
  // Third-party site verification tokens
  // Update these when transferring ownership of the project
  // ============================================================
  verificationTokens: {
    // TikTok domain verification tokens (TikTok Developer Portal → Verify domains)
    // Each token is tied to the specific URL that was verified
    tiktok: "D0uyXuS1UJ3oH5abBBbzzMSHQ6SK5ooO", // https://realestate-crm-rho.vercel.app
    tiktokTerms: "OWiapI7Ko87ppBWuO7psFBTnEpxggyIk", // /terms
    tiktokPrivacy: "4jTLp4VRupfxpoJNzW7uVkA5dL0SXWTX", // /privacy-policy
    google: "", // Google Search Console verification (if needed)
  },
};

export type SiteConfig = typeof siteConfig;
export type FeatureName =
  | "dashboard_analytics"
  | "ai_smart_summary"
  | "ai_auto_description"
  | "advanced_reports"
  | "line_integration"
  | "max_properties";
