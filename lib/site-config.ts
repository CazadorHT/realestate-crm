import { BarChart } from "lucide-react";

const getBaseUrl = () => {
  // Support standard NEXT_PUBLIC_SITE_URL first
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  
  // High Priority: Use the verified production domain if in production environment
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return "https://vccasset.com";
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://vccasset.com";
};

const isDev = process.env.NODE_ENV === "development";
const siteUrl = isDev 
  ? "http://localhost:3000" 
  : getBaseUrl();

export const siteConfig = {
  name: "VC Connect Asset",
  company: "VC Connect Asset Co., Ltd.",
  description: "VC Connect Asset นายหน้าอสังหาริมทรัพย์มืออาชีพ บริการรับฝากขาย ฝากเช่า บ้าน คอนโด และที่ดิน ครบวงจร ดูแลและให้คำปรึกษาอย่างใกล้ชิดในทุกขั้นตอน เพื่อให้คุณได้ข้อเสนอที่ดีที่สุด",
  url: siteUrl,
  logo: "/images/branding/vcc-asset/png/logo-dark.png",
  logoDark: "/images/branding/vcc-asset/png/logo-light.png",
  brandCard: "/images/branding/vcc-asset/favicon-animated-light.svg",
  brandCardDark: "/images/branding/vcc-asset/png/favicon-dark.png",
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
    facebook: "https://facebook.com/vcc.asset",
    instagram: "https://instagram.com/vcc.asset/",
    line: "https://line.me/ti/p/@811slazm",
    tiktok: "https://tiktok.com/@vcconnectasset",
  },
  contact: {
    email: "vcconnect.asset@gmail.com",
    phone: "02-096-2588",
    lineId: "@vcconnectasset",
    address: "20th Floor, G Tower, Ratchadaphisek Road, Huai Khwang Subdistrict, Huai Khwang District, Bangkok 10310",
  },
  companySignature: "/images/branding/vcc-asset/png/logo-dark.png",
  companyStamp: "/images/branding/vcc-asset/png/logo-dark.png",
  // ============================================================
  // Third-party site verification tokens
  // Update these when transferring ownership of the project
  // ============================================================
  verificationTokens: {
    // TikTok domain verification tokens (TikTok Developer Portal → Verify domains)
    // Each token is tied to the specific URL that was verified
    tiktok: "E6rcb6VwOKMyZdCIb2Rhv8daRZFnseIs", // https://vccasset.com
    tiktokTerms: "THmI1159aIMINgBLwHXndjlEg1RiEErv", // /terms
    tiktokPrivacy: "jboAcFQJ7goXNfp0CPmq9vN4AqI0nfuK", // /privacy-policy
    google: "", // Google Search Console verification (if needed)
    facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "", // Facebook App ID for Open Graph
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
