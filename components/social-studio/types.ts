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

  // Modular Field Toggles
  showBrandingHeader?: boolean;
  showTopListingBadge?: boolean;
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
}

