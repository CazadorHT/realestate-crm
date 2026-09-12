import type {
  AspectRatio,
  StudioLayout,
  StudioTheme,
  CardBackground,
  ContentPosition,
  FontSizeScale,
  SpecFontSizeScale,
  StudioPriceFormatStyle,
  PhotoFilter,
  TextEffectTemplate,
  TextEffectPosition,
} from "../types";

export interface StarterTemplateConfig {
  aspectRatio: AspectRatio;
  layout: StudioLayout;
  theme: StudioTheme;
  cardBackground: CardBackground;
  cardOpacity: number;
  contentPosition: ContentPosition;
  fontSizeScale: FontSizeScale;
  priceFontSizeScale: FontSizeScale;
  specFontSizeScale?: SpecFontSizeScale;
  priceFormatStyle: StudioPriceFormatStyle;
  photoFilter: PhotoFilter;
  bgBlur?: number;
  bgDimOpacity?: number;
  fitWithBlurredBackdrop?: boolean;
  gridLineWidth?: number;
  gridLineColor?: string;
  customPriceColor?: string;
  customAccentColor?: string;
  customCardBgColor?: string;
  showCardContent?: boolean;
  showSpecs?: boolean;
  showPrice?: boolean;
  showHeadline?: boolean;
  showBrandingHeader?: boolean;
  brandingHeaderStyle?: "classic_left" | "frosted_capsule";
  brandingHeaderAlign?: "center" | "left";
  showUsdApprox?: boolean;
  textEffectTemplate?: TextEffectTemplate;
  textEffectPosition?: TextEffectPosition;
  badges?: string[];
}

export interface StarterTemplate {
  id: string;
  name: {
    th: string;
    en: string;
  };
  subtitle: {
    th: string;
    en: string;
  };
  icon: string;
  badge: {
    th: string;
    en: string;
  };
  badgeColor: "amber" | "indigo" | "red" | "emerald" | "cyan" | "purple";
  ratio: AspectRatio;
  category: "all" | AspectRatio;
  description: {
    th: string;
    en: string;
  };
  config: StarterTemplateConfig;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // --- 1. FACEBOOK HORIZONTAL ALBUM (3:2) ---
  {
    id: "fb_cover_minimal",
    name: {
      th: "FB ปกแนวนอน มินิมอล",
      en: "FB Cover Minimal",
    },
    subtitle: {
      th: "1 รูปเด่น + การ์ดแก้วล่าง + เบลอขอบละมุน 4px",
      en: "1 Hero + Glass Card + Soft Blur 4px",
    },
    icon: "🖼️",
    badge: {
      th: "FB ปกนอน 3:2",
      en: "FB Cover 3:2",
    },
    badgeColor: "cyan",
    ratio: "3:2",
    category: "3:2",
    description: {
      th: "เหมาะสำหรับทำหน้าปกอัลบั้ม Facebook หรือ Cover แนวนอน ตัวหนังสืออ่านง่าย ไม่บังวิวหลัก",
      en: "Optimized for Facebook album cover with clear bottom text that doesn't block the focal point.",
    },
    config: {
      aspectRatio: "3:2",
      layout: "single",
      theme: "luxury",
      cardBackground: "glass",
      cardOpacity: 70,
      contentPosition: "bottom",
      fontSizeScale: "md",
      priceFontSizeScale: "lg",
      priceFormatStyle: "default",
      photoFilter: "bright",
      bgBlur: 4,
      bgDimOpacity: 10,
      customAccentColor: "#F59E0B",
      customPriceColor: "#F59E0B",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: true,
      showBrandingHeader: false,
    },
  },
  {
    id: "fb_album_master",
    name: {
      th: "FB อัลบั้ม มาสเตอร์ 3 รูป",
      en: "FB Album Master 3-Grid",
    },
    subtitle: {
      th: "1 ใหญ่ + 2 เล็ก + โทนหรู Dark Moody",
      en: "1 Hero + 2 Split + Dark Moody Luxury",
    },
    icon: "📑",
    badge: {
      th: "FB Album 3:2",
      en: "FB Album 3:2",
    },
    badgeColor: "amber",
    ratio: "3:2",
    category: "3:2",
    description: {
      th: "เลย์เอาต์ 1 รูปใหญ่ด้านซ้าย + 2 รูปขวา จัดตำแหน่งการ์ดหรูหราดึงดูดสายตาบนหน้าฟีด",
      en: "1 Hero left + 2 right layout with elegant pricing card built for Facebook feed engagement.",
    },
    config: {
      aspectRatio: "3:2",
      layout: "hero_plus_two",
      theme: "luxury",
      cardBackground: "obsidian_glass",
      cardOpacity: 85,
      contentPosition: "bottom",
      fontSizeScale: "sm",
      priceFontSizeScale: "md",
      priceFormatStyle: "symbol_short",
      photoFilter: "dark_moody",
      bgBlur: 0,
      gridLineWidth: 6,
      gridLineColor: "#0F172A",
      customAccentColor: "#E5B869",
      customPriceColor: "#E5B869",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: false,
      showBrandingHeader: true,
      brandingHeaderStyle: "frosted_capsule",
      brandingHeaderAlign: "left",
    },
  },

  // --- 2. FACEBOOK VERTICAL ALBUM (2:3) ---
  {
    id: "fb_vertical_magazine",
    name: {
      th: "FB ปกแนวตั้ง สไตล์นิตยสาร",
      en: "FB Vertical Magazine",
    },
    subtitle: {
      th: "ทรงสูงโปร่ง + แคปซูลแบรนด์บน + สเปกเต็มใบล่าง",
      en: "Editorial Tall + Top Capsule + Rich Bottom Card",
    },
    icon: "🏛️",
    badge: {
      th: "FB ปกตั้ง 2:3",
      en: "FB Vertical 2:3",
    },
    badgeColor: "indigo",
    ratio: "2:3",
    category: "2:3",
    description: {
      th: "สัดส่วน 2:3 ยอดนิยมสำหรับหน้าปกอัลบั้มแนวตั้ง สวยสะกดเหมือนเปิดหน้านิตยสารระดับไฮเอนด์",
      en: "Tall 2:3 aspect ratio tailored for vertical Facebook albums and high-end editorial brochures.",
    },
    config: {
      aspectRatio: "2:3",
      layout: "single",
      theme: "luxury",
      cardBackground: "frosted_luxury",
      cardOpacity: 82,
      contentPosition: "bottom",
      fontSizeScale: "md",
      priceFontSizeScale: "lg",
      specFontSizeScale: "lg",
      priceFormatStyle: "thb_with_usd",
      photoFilter: "none",
      bgBlur: 0,
      customAccentColor: "#F59E0B",
      customPriceColor: "#FBBF24",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: true,
      showBrandingHeader: true,
      brandingHeaderStyle: "frosted_capsule",
      brandingHeaderAlign: "center",
      showUsdApprox: true,
      badges: ["Foreign Freehold", "Exclusive Listing"],
    },
  },
  {
    id: "pinterest_luxury_villa",
    name: {
      th: "พินเทอเรสต์ วิลล่าหรู 2 รูป",
      en: "Pinterest Luxury Villa",
    },
    subtitle: {
      th: "2 รูปคู่ Split + สเปกการ์ดสีทองโมเดิร์น",
      en: "Split 2 Photos + Modern Gold Accents",
    },
    icon: "✨",
    badge: {
      th: "Pinterest 2:3",
      en: "Pinterest 2:3",
    },
    badgeColor: "purple",
    ratio: "2:3",
    category: "2:3",
    description: {
      th: "แสดง 2 มุมมอง (ภายนอก + ภายใน) บนภาพแนวตั้ง 2:3 ชวนคลิกบันทึกลงบอร์ด",
      en: "Shows 2 key perspectives in a split 2 layout, perfect for Pinterest boards and real estate saves.",
    },
    config: {
      aspectRatio: "2:3",
      layout: "split_two",
      theme: "luxury",
      cardBackground: "champagne_glass",
      cardOpacity: 78,
      contentPosition: "bottom",
      fontSizeScale: "sm",
      priceFontSizeScale: "md",
      priceFormatStyle: "default",
      photoFilter: "warm_gold",
      bgBlur: 0,
      gridLineWidth: 8,
      gridLineColor: "#1E293B",
      customAccentColor: "#F59E0B",
      customPriceColor: "#FFFFFF",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: false,
      showBrandingHeader: true,
      brandingHeaderStyle: "classic_left",
      brandingHeaderAlign: "left",
    },
  },

  // --- 3. SQUARE POST (1:1) ---
  {
    id: "square_four_grid",
    name: {
      th: "จัตุรัส 4 ช่อง โปรโมชันเด็ด",
      en: "Square 4-Grid Deal",
    },
    subtitle: {
      th: "4 รูปกริด 2x2 + เส้นแบ่งสีทอง + ป้ายราคากลาง",
      en: "4 Grid 2x2 + Gold Borders + Center Price",
    },
    icon: "📐",
    badge: {
      th: "Square 1:1",
      en: "Square 1:1",
    },
    badgeColor: "amber",
    ratio: "1:1",
    category: "1:1",
    description: {
      th: "จัดเต็ม 4 รูปในเฟรมเดียว พร้อมแถบป้ายราคากึ่งกลาง ดึงดูดความสนใจได้ทันที",
      en: "Balanced 4-photo collage layout with center/bottom spotlight card for multi-view showcase.",
    },
    config: {
      aspectRatio: "1:1",
      layout: "four_grid",
      theme: "luxury",
      cardBackground: "solid",
      cardOpacity: 92,
      contentPosition: "bottom",
      fontSizeScale: "sm",
      priceFontSizeScale: "lg",
      priceFormatStyle: "symbol_short",
      photoFilter: "none",
      bgBlur: 0,
      gridLineWidth: 8,
      gridLineColor: "#D97706",
      customAccentColor: "#F59E0B",
      customPriceColor: "#FBBF24",
      customCardBgColor: "#090D16",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: false,
      showBrandingHeader: false,
    },
  },
  {
    id: "square_ultra_minimal",
    name: {
      th: "จัตุรัส อัลตร้า มินิมอล",
      en: "Square Ultra Minimal",
    },
    subtitle: {
      th: "1 รูปใหญ่เต็มเฟรม + เบลอพื้นหลัง 8px + ขอบเรืองแสง",
      en: "1 Full Hero + 8px Blur Backdrop + Glow Border",
    },
    icon: "💎",
    badge: {
      th: "Square 1:1",
      en: "Square 1:1",
    },
    badgeColor: "cyan",
    ratio: "1:1",
    category: "1:1",
    description: {
      th: "เน้นภาพบ้านเต็มใบ มีมิติด้วยเบลอฉากหลังและการ์ดกระจกบางเบาสไตล์ Ultra Luxury",
      en: "Full hero photo presentation with blurred backdrop depth and minimal glass pricing tag.",
    },
    config: {
      aspectRatio: "1:1",
      layout: "single",
      theme: "modern",
      cardBackground: "crystal_glass",
      cardOpacity: 65,
      contentPosition: "bottom",
      fontSizeScale: "md",
      priceFontSizeScale: "lg",
      priceFormatStyle: "default",
      photoFilter: "bright",
      bgBlur: 8,
      bgDimOpacity: 15,
      customAccentColor: "#38BDF8",
      customPriceColor: "#38BDF8",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: true,
      showBrandingHeader: true,
      brandingHeaderStyle: "frosted_capsule",
      brandingHeaderAlign: "center",
    },
  },

  // --- 4. STORY & REEL (9:16) ---
  {
    id: "story_tiktok_viral",
    name: {
      th: "TikTok ไวรัล ฮุคเตะตา",
      en: "TikTok Viral Hook",
    },
    subtitle: {
      th: "ป้ายเหลืองเตะตา + หลบปุ่มแพลตฟอร์ม Safe-Zone",
      en: "Bold Yellow Hook + UI Safe-Zone Centered",
    },
    icon: "🔥",
    badge: {
      th: "Story 9:16",
      en: "Story 9:16",
    },
    badgeColor: "red",
    ratio: "9:16",
    category: "9:16",
    description: {
      th: "ออกแบบสำหรับคลิปสั้น / สตอรี่ มีข้อความพาดหัวสไตล์ TikTok ดึงดูดสายตาตั้งแต่เสี้ยววินาทีแรก",
      en: "Specially configured with high-contrast hook text positioned away from TikTok/Reels UI buttons.",
    },
    config: {
      aspectRatio: "9:16",
      layout: "single",
      theme: "hotdeal",
      cardBackground: "smoked_glass",
      cardOpacity: 85,
      contentPosition: "bottom",
      fontSizeScale: "lg",
      priceFontSizeScale: "xl",
      priceFormatStyle: "default",
      photoFilter: "high_contrast",
      bgBlur: 6,
      bgDimOpacity: 25,
      customAccentColor: "#EF4444",
      customPriceColor: "#FDE047",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: true,
      showBrandingHeader: false,
      textEffectTemplate: "tiktok_yellow",
      textEffectPosition: "center",
    },
  },
  {
    id: "story_cinematic_luxury",
    name: {
      th: "สตอรี่ ซีนีมาติก ลักชูรี่",
      en: "Story Cinematic Luxury",
    },
    subtitle: {
      th: "1 รูปบน + 4 รูปกริดล่าง + เบลอขอบลึก 16px",
      en: "1 Hero + 4 Grid + Deep Blur 16px",
    },
    icon: "🌙",
    badge: {
      th: "Story 9:16",
      en: "Story 9:16",
    },
    badgeColor: "indigo",
    ratio: "9:16",
    category: "9:16",
    description: {
      th: "โชว์ได้ถึง 5 รูปในสตอรี่เดียว ด้วยเลย์เอาต์ 1 รูปใหญ่ด้านบน + 4 รูปย่อยด้านล่าง",
      en: "Showcase up to 5 pictures in a single story frame with 1 hero + 4 grid layout and cinematic blur.",
    },
    config: {
      aspectRatio: "9:16",
      layout: "five_grid",
      theme: "luxury",
      cardBackground: "frosted_luxury",
      cardOpacity: 80,
      contentPosition: "split_hero",
      fontSizeScale: "sm",
      priceFontSizeScale: "md",
      priceFormatStyle: "symbol_short",
      photoFilter: "dark_moody",
      bgBlur: 16,
      gridLineWidth: 4,
      gridLineColor: "#000000",
      customAccentColor: "#F59E0B",
      customPriceColor: "#FBBF24",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: false,
      showBrandingHeader: true,
      brandingHeaderStyle: "frosted_capsule",
      brandingHeaderAlign: "center",
    },
  },

  // --- 5. INSTAGRAM FEED (4:5) ---
  {
    id: "phuket_frosted_luxury",
    name: {
      th: "ภูเก็ต ฟรอสเต็ด ลักชูรี่",
      en: "Phuket Frosted Luxury",
    },
    subtitle: {
      th: "การ์ดแก้วฝ้า + ป้ายสิทธิ์ Freehold + ราคา 2 สกุล",
      en: "Frosted Glass Card + Freehold Badges + THB/USD",
    },
    icon: "💎",
    badge: {
      th: "IG Feed 4:5",
      en: "IG Feed 4:5",
    },
    badgeColor: "amber",
    ratio: "4:5",
    category: "4:5",
    description: {
      th: "เทมเพลตมาตรฐานสากลสำหรับพูลวิลล่าและคอนโดหรู การ์ดข้อมูลโปร่งแสงระดับเรือธง",
      en: "Our flagship template for luxury pool villas and high-end condos with dual currency pricing.",
    },
    config: {
      aspectRatio: "4:5",
      layout: "single",
      theme: "luxury",
      cardBackground: "frosted_luxury",
      cardOpacity: 78,
      contentPosition: "bottom",
      fontSizeScale: "md",
      priceFontSizeScale: "md",
      specFontSizeScale: "md",
      priceFormatStyle: "thb_with_usd",
      photoFilter: "none",
      bgBlur: 0,
      customAccentColor: "#F59E0B",
      customPriceColor: "#E5B869",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: true,
      showBrandingHeader: true,
      brandingHeaderStyle: "frosted_capsule",
      brandingHeaderAlign: "center",
      showUsdApprox: true,
      badges: ["Foreign Freehold", "Pool Villa"],
    },
  },
  {
    id: "hot_deal",
    name: {
      th: "ฮอตดีล แฟลชเซลล์ ด่วน",
      en: "Hot Deal Flash Sale",
    },
    subtitle: {
      th: "สีแดงคอนทราสต์จัดจ้าน + การ์ดทึบหนักแน่น",
      en: "High Contrast Red + Solid Dark Card",
    },
    icon: "🚨",
    badge: {
      th: "Promo 4:5",
      en: "Promo 4:5",
    },
    badgeColor: "red",
    ratio: "4:5",
    category: "4:5",
    description: {
      th: "เน้นสร้างความเร่งด่วน (Urgency) สำหรับห้องหลุดโอน ลดราคาพิเศษ หรือโปรโมชันด่วน",
      en: "High-urgency design with bold red branding, high contrast, and unmistakable price spotlight.",
    },
    config: {
      aspectRatio: "4:5",
      layout: "single",
      theme: "hotdeal",
      cardBackground: "solid",
      cardOpacity: 95,
      contentPosition: "bottom",
      fontSizeScale: "md",
      priceFontSizeScale: "xl",
      priceFormatStyle: "default",
      photoFilter: "high_contrast",
      bgBlur: 0,
      customAccentColor: "#EF4444",
      customPriceColor: "#EF4444",
      customCardBgColor: "#0F172A",
      showCardContent: true,
      showSpecs: true,
      showPrice: true,
      showHeadline: true,
      showBrandingHeader: false,
    },
  },
];
