export type AspectRatio = "9:16" | "1:1" | "4:5";
export type StudioTheme = "luxury" | "modern" | "hotdeal" | "emerald" | "purple" | "orange" | "custom";
export type StudioLayout = "single" | "split_two" | "hero_plus_two" | "four_grid" | "five_grid" | "six_grid";
export type CardBackground = "glass" | "solid" | "minimal_gradient";
export type ContentPosition = "bottom" | "center" | "top" | "split_hero";
export type FontSizeScale = "sm" | "md" | "lg" | "xl";
export type SpecFontSizeScale = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type ElementZone = "zone_a" | "zone_b"; // zone_a = การ์ดบน/กลาง, zone_b = การ์ดล่าง
export type StudioLanguage = "th" | "en" | "zh" | "ru";
export type StudioPriceFormatStyle =
  | "default"
  | "symbol_short"
  | "code_short_prefix"
  | "code_short_suffix"
  | "code_full_suffix"
  | "thai_lakh"
  | "usd_approx";

// Feature 3: Background Photo Filters
export type PhotoFilter = "none" | "bright" | "dark_moody" | "warm_gold" | "high_contrast" | "bw";

// Feature 2: Promotional Badge Position
export type PromoPosition = "top_left" | "top_right" | "bottom_left" | "bottom_right";

// Feature 5: Carousel Page Types
export type CarouselPageType = "cover" | "specs_highlights" | "location_map" | "contact_cta";

export type TextEffectTemplate =
  | "none"
  // TikTok & Social Hook
  | "tiktok_yellow"
  | "tiktok_red"
  | "tiktok_dark"
  | "yt_bold_stroke"
  // CapCut
  | "capcut_outline"
  | "capcut_neon"
  | "capcut_gradient"
  // Lemon8 & Lifestyle
  | "lemon8_magazine"
  | "lemon8_highlighter"
  | "lemon8_bubble"
  | "lemon8_tag"
  | "korean_cafe"
  // Minimal & Modern
  | "minimal_clean"
  | "minimal_glass"
  | "minimal_underline"
  | "minimal_monochrome"
  // Business, Property & Ads
  | "real_estate_badge"
  | "luxury_editorial"
  | "urgent_promo"
  | "price_tag"
  // Graphic & Vector / Illustrator
  | "illustrator_pop"
  | "illustrator_stamp"
  | "illustrator_dashed"
  | "illustrator_gold"
  | "illustrator_curve"
  | "sticker_border"
  // Custom
  | "custom";

export type TextEffectCardMode = "stacked_pills" | "single_card";

export type TextEffectPosition =
  // Standard vertical
  | "top"
  | "center"
  | "bottom"
  // Layout-aware
  | "above_card"
  | "below_card"
  // Safe-zone positions (สำหรับ TikTok / Reels / Shorts หลบ UI แพลตฟอร์ม)
  | "safe_top"
  | "safe_bottom"
  // Pinning corners (สำหรับป้ายราคา / โปรโมชันมุมภาพ)
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right";

export interface TextEffectLineConfig {
  id: string;
  text: string;
  template: TextEffectTemplate | "same";
  sizeScale?: number; // 0.5x to 1.6x ratio (default 1.0 for line 1, 0.85 for sub-lines)
  customTextColor?: string;
  customBgColor?: string;
  customBorderColor?: string;
  // Independent layer positioning, transforms & curve
  position?: TextEffectPosition;
  xOffset?: number; // -350 to +350 px
  yOffset?: number; // -350 to +350 px
  rotation?: number; // -45 to +45 deg
  curve?: number; // -60 to +60 deg (Curved Arc per layer!)
}

export type CalloutPointerStyle = "lemon8_yellow" | "clean_white" | "neon_glow" | "dark_luxury";
export type CalloutPointerDirection = "top_left" | "top_right" | "bottom_left" | "bottom_right";

export interface CalloutPointer {
  id: string;
  text: string;
  x: number; // 0 to 100 (% of canvas width)
  y: number; // 0 to 100 (% of canvas height)
  direction: CalloutPointerDirection;
  style: CalloutPointerStyle;
  fontSize?: number; // Font size in px (default 22, range 16 to 36)
  arrowScale?: number; // Arrow length & size scale (default 1.0, range 0.5 to 2.0)
}

export interface CustomTextItem {
  id: string;
  text: string;
  x: number; // 0 to 100 (% of canvas width)
  y: number; // 0 to 100 (% of canvas height)
  fontSize?: number; // 16 to 64px (default 30)
  textColor?: string; // default #FFFFFF
  bgColor?: string; // default rgba(15, 23, 42, 0.88)
  borderColor?: string; // default #F59E0B
  borderWidth?: number; // 0 to 4 (default 1.5)
  borderRadius?: number; // 0 to 30 (default 12)
  isBold?: boolean; // default true
}

export interface CarouselPageConfig {
  type: CarouselPageType;
  enabled: boolean;
}

export interface ElementZoneMapping {
  projectName?: ElementZone;
  title?: ElementZone;
  headline?: ElementZone;
  location?: ElementZone;
  price?: ElementZone;
  specs?: ElementZone;
  contact?: ElementZone;
}

export interface SocialStudioProperty {
  id: string;
  slug?: string | null;
  title: string;
  title_en?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  project?: { id?: string; name?: any; slug?: string; developer?: string } | null;
  property_type?: string | null;
  listing_type?: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  price?: number | null;
  rental_price?: number | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  popular_area?: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  popular_area_ru?: string | null;
  province?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  floor?: number | null;
  transit_type?: string | null;
  transit_station_name?: string | null;
  transit_station_name_en?: string | null;
  transit_station_name_cn?: string | null;
  transit_station_name_ru?: string | null;
  transit_distance_meters?: number | null;
  is_pet_friendly?: boolean | null;
  images?: (string | { url?: string; image_url?: string; storage_path?: string })[] | null;
  assigned_agent?: {
    full_name?: string | null;
    phone?: string | null;
    line_id?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface BannerRenderOptions {
  aspectRatio: AspectRatio;
  theme: StudioTheme;
  layout: StudioLayout;
  language?: StudioLanguage;
  cardBackground?: CardBackground;
  cardHeightPercent?: number;
  cardWidthPercent?: number;
  cardYOffset?: number;
  cardRightMargin?: number;
  cardTextAlign?: "left" | "center" | "right";
  cardOpacity?: number;
  scrimOpacity?: number;
  topScrimOpacity?: number;
  bottomScrimOpacity?: number;
  priceFormatStyle?: StudioPriceFormatStyle;
  contentPosition?: ContentPosition;
  fontSizeScale?: FontSizeScale;
  priceFontSizeScale?: FontSizeScale;

  // Feature 1: Custom Accent Color & Custom Element Colors
  customAccentColor?: string;
  customTitleColor?: string;
  customPriceColor?: string;
  customHeadlineColor?: string;
  customProjectNameColor?: string;
  customCardBgColor?: string;
  customCanvasBgColor?: string;

  // Grid Lines Customization
  gridLineWidth?: number;
  gridLineColor?: string;

  // Feature 2: Promotional Overlay
  promoText?: string;
  promoPosition?: PromoPosition;
  promoColor?: string;
  promoTextColor?: string;

  // Feature 3: Photo Filter
  photoFilter?: PhotoFilter;

  // Dual Zone Controls
  zoneMapping?: ElementZoneMapping;
  card1YOffset?: number;
  card2YOffset?: number;

  // Card Content Master Toggle
  showCardContent?: boolean;

  // Text Effect Template (TikTok / CapCut / Lemon8 / Minimal / Illustrator / Custom)
  textEffectTemplate?: TextEffectTemplate;
  textEffectText?: string;
  textEffectPosition?: TextEffectPosition;
  textEffectSize?: FontSizeScale | "2xl";
  textEffectXOffset?: number;
  textEffectYOffset?: number;
  textEffectRotation?: number;
  textEffectCurve?: number; // Arc curve degrees (-60 to 60, 0 = straight)
  textEffectCustomTextColor?: string;
  textEffectCustomBgColor?: string;
  textEffectCustomBorderColor?: string;
  textEffectCustomShadowColor?: string;
  textEffectCustomBgAlpha?: number;
  textEffectCustomBorderWidth?: number;

  // Sub-line / Line 2 Independent Typography & Styling
  textEffectLine2Template?: TextEffectTemplate | "same";
  textEffectLine2SizeScale?: number; // 0.5x to 1.6x ratio (default 0.85)
  textEffectLine2CustomTextColor?: string;
  textEffectLine2CustomBgColor?: string;
  textEffectLine2CustomBorderColor?: string;
  textEffectLine2CustomShadowColor?: string;
  textEffectLineSpacing?: number; // gap between pills (default 12)
  textEffectLineConfigs?: TextEffectLineConfig[]; // Multi-line Dynamic Text Layers (Canva / CapCut standard)

  // Single Card Mode (ยุบรวมทุกบรรทัดเป็นการ์ดแผ่นเดียว ลดความหนา >30%)
  textEffectCardMode?: TextEffectCardMode;
  textEffectSingleCardBgColor?: string;
  textEffectSingleCardTextColor?: string;
  textEffectSingleCardBorderColor?: string;
  textEffectSingleCardBorderWidth?: number;
  textEffectSingleCardRadius?: number;
  textEffectSingleCardPadding?: number;
  textEffectSingleCardAlign?: "center" | "left" | "right";
  textEffectSingleCardOpacity?: number;

  calloutPointers?: CalloutPointer[];
  bgDimOpacity?: number; // 0 - 100 (% of dark overlay on background image)
  customTexts?: CustomTextItem[];

  // Modular Field Toggles
  showBrandingHeader?: boolean;
  showTopListingBadge?: boolean;
  brandingTitleColor?: string;
  brandingSubtitleColor?: string;
  customCompanyName?: string;
  customCompanySubtitle?: string;
  headerYOffset?: number;
  headerFontSizeScale?: FontSizeScale;
  badgeFontSizeScale?: FontSizeScale;
  specFontSizeScale?: SpecFontSizeScale;
  customListingBadgeText?: string;
  customListingBadgeBgColor?: string;
  customListingBadgeTextColor?: string;
  showLocation?: boolean;
  showProjectName?: boolean;
  showListingType?: boolean;
  showTitle?: boolean;
  showHeadline?: boolean;
  showSpecs?: boolean;
  showPrice?: boolean;
  showOriginalPrice?: boolean;
  showQrCode?: boolean;
  showContact?: boolean;
  showAgentAvatar?: boolean;

  // Data Payload
  imageUrls: string[];
  title: string;
  projectName?: string | null;
  headline?: string;
  highlights?: string[];
  propertyType?: string | null;
  listingType?: string | null;
  priceText: string;
  originalPriceText?: string;
  locationText?: string;
  transitText?: string;
  specs: {
    bedrooms?: number | null;
    bathrooms?: number | null;
    sizeSqm?: number | null;
    floor?: number | null;
  };
  badges?: string[];
  qrCodeUrl?: string;
  companyName?: string;
  contactPhone?: string;
  contactLine?: string;
  agentAvatarUrl?: string;
  agentName?: string;
}

export interface AvailableBadgeItem {
  id: string;
  label: string;
  labelEn?: string;
}


// Preset Settings (Everything except content/text)
export interface SocialStudioPresetConfig {
  aspectRatio: AspectRatio;
  theme: StudioTheme;
  layout: StudioLayout;
  contentPosition: ContentPosition;
  fontSizeScale: FontSizeScale;
  priceFontSizeScale: FontSizeScale;
  specFontSizeScale: SpecFontSizeScale;
  zoneMapping: ElementZoneMapping;
  card1YOffset: number;
  card2YOffset: number;
  cardHeightPercent: number;
  cardWidthPercent: number;
  cardTextAlign: "left" | "center" | "right";
  cardOpacity: number;
  scrimOpacity: number;
  topScrimOpacity: number;
  bottomScrimOpacity: number;
  priceFormatStyle: StudioPriceFormatStyle;
  cardBackground: CardBackground;
  cardYOffset: number;
  customAccentColor: string;
  promoPosition: PromoPosition;
  promoColor: string;
  promoTextColor: string;
  photoFilter: PhotoFilter;
  gridLineWidth: number;
  gridLineColor: string;
  customTitleColor: string;
  customPriceColor: string;
  customHeadlineColor: string;
  customProjectNameColor: string;
  customCardBgColor: string;
  customCanvasBgColor: string;
  customListingBadgeBgColor: string;
  customListingBadgeTextColor: string;
  showBrandingHeader: boolean;
  showTopListingBadge: boolean;
  brandingTitleColor?: string;
  brandingSubtitleColor?: string;
  customCompanyName?: string;
  customCompanySubtitle?: string;
  headerFontSizeScale: FontSizeScale;
  badgeFontSizeScale: FontSizeScale;
  headerYOffset: number;
  cardRightMargin: number;
  showHeadline: boolean;
  showCardContent?: boolean;
  textEffectTemplate?: TextEffectTemplate;
  textEffectPosition?: TextEffectPosition;
  textEffectSize?: FontSizeScale | "2xl";
  textEffectXOffset?: number;
  textEffectYOffset?: number;
  textEffectRotation?: number;
  textEffectCurve?: number;
  textEffectCustomTextColor?: string;
  textEffectCustomBgColor?: string;
  textEffectCustomBorderColor?: string;
  textEffectCustomShadowColor?: string;
  textEffectCustomBgAlpha?: number;
  textEffectCustomBorderWidth?: number;
  textEffectLine2Template?: TextEffectTemplate | "same";
  textEffectLine2SizeScale?: number;
  textEffectLine2CustomTextColor?: string;
  textEffectLine2CustomBgColor?: string;
  textEffectLine2CustomBorderColor?: string;
  textEffectLine2CustomShadowColor?: string;
  textEffectLineSpacing?: number;
  textEffectLineConfigs?: TextEffectLineConfig[];
  textEffectCardMode?: TextEffectCardMode;
  textEffectSingleCardBgColor?: string;
  textEffectSingleCardTextColor?: string;
  textEffectSingleCardBorderColor?: string;
  textEffectSingleCardBorderWidth?: number;
  textEffectSingleCardRadius?: number;
  textEffectSingleCardPadding?: number;
  textEffectSingleCardAlign?: "center" | "left" | "right";
  textEffectSingleCardOpacity?: number;
  calloutPointers?: CalloutPointer[];
  bgDimOpacity?: number;
  customTexts?: CustomTextItem[];
}
