/**
 * SEO/AEO/GEO/AIO utilities
 * - Auto-generate SEO metadata
 * - Create slugs
 * - Generate structured data (Schema.org)
 */

import slugify from "slugify";
import type { Database } from "@/lib/database.types";

import { siteConfig } from "@/lib/site-config";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

export interface PropertySEOData {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  structuredData: any; // Schema.org JSON-LD
}

interface PropertyDataForSEO {
  title: string;
  property_type: PropertyType;
  listing_type: ListingType;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  price?: number;
  rental_price?: number;
  popular_area?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  address_line1?: string;
  postal_code?: string;
  description?: string;
  // SEO Flags for Keyword-Rich Slugs
  is_pet_friendly?: boolean;
  is_corner_unit?: boolean;
  is_renovated?: boolean;
  is_fully_furnished?: boolean;
  is_selling_with_tenant?: boolean;
  is_foreigner_quota?: boolean;
  is_hot_sale?: boolean;
  near_transit?: boolean;
  transit_station_name?: string; // Legacy/Single field
  nearby_transits?: {
    type: string;
    station_name: string;
    station_name_en?: string;
    station_name_cn?: string;
  }[]; // Full list from Step 3
  nearby_places?: {
    category: string;
    name: string;
    name_en?: string;
    name_cn?: string;
  }[];
  features?: string[];
}

/**
 * Localized labels for SEO generation
 */
const SEO_LABELS: Record<string, Record<string, string>> = {
  // Property Types
  HOUSE: { th: "บ้านเดี่ยว", en: "House", cn: "别墅" },
  CONDO: { th: "คอนโด", en: "Condo", cn: "公寓" },
  TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅" },
  LAND: { th: "ที่ดิน", en: "Land", cn: "土地" },
  OFFICE_BUILDING: {
    th: "อาคารสำนักงานออฟฟิศ",
    en: "Office Building",
    cn: "办公楼",
  },
  COMMERCIAL_BUILDING: {
    th: "อาคารพาณิชย์",
    en: "Commercial Building",
    cn: "商业建筑",
  },
  WAREHOUSE: { th: "โกดัง", en: "Warehouse", cn: "仓库" },
  OTHER: { th: "อื่นๆ", en: "Others", cn: "其他" },

  // SEO Flags
  HOT_SALE: { th: "ราคาถูก-ลดราคาพิเศษ", en: "cheap-hot-sale", cn: "特价房源" },
  NEAR_TRANSIT: { th: "ใกล้รถไฟฟ้า", en: "near-transit", cn: "靠近轻轨" },
  PET_FRIENDLY: { th: "เลี้ยงสัตว์ได้", en: "pet-friendly", cn: "可养宠物" },
  CORNER_UNIT: { th: "ห้องมุม", en: "corner-unit", cn: "边间" },
  RENOVATED: { th: "รีโนเวทใหม่", en: "renovated", cn: "全新装修" },
  FULLY_FURNISHED: {
    th: "แต่งครบ-พร้อมอยู่",
    en: "fully-furnished",
    cn: "家具齐全",
  },
  WITH_TENANT: {
    th: "พร้อมผู้เช่า-ลงทุนคุ้ม",
    en: "with-tenant",
    cn: "带租约",
  },
  FOREIGNER_QUOTA: {
    th: "ต่างชาติซื้อได้",
    en: "foreigner-quota",
    cn: "外籍配额",
  },

  // Prepositions & Labels
  NEAR_STATION: {
    th: "ใกล้รถไฟฟ้าสถานี-",
    en: "near-transit-station-",
    cn: "靠近轻轨站-",
  },
  NEAR: { th: "ใกล้-", en: "near-", cn: "靠近-" },
  FOR_RENT: { th: "ให้เช่า", en: "For Rent", cn: "出租" },
  FOR_SALE: { th: "ขาย", en: "For Sale", cn: "出售" },

  // Units
  BEDS: { th: "นอน", en: "BR", cn: "卧" },
  BATHS: { th: "น้ำ", en: "BA", cn: "卫" },
  SQM: { th: "ตรม", en: "sqm", cn: "sqm" },

  // Meta Description phrases
  BEDROOMS_FULL: { th: "ห้องนอน", en: "Bedrooms", cn: "卧室" },
  BATHROOMS_FULL: { th: "ห้องน้ำ", en: "Bathrooms", cn: "浴室" },
  AREA_SIZE: { th: "พื้นที่", en: "Size", cn: "面积" },
  SQM_FULL: { th: "ตร.ม.", en: "sqm", cn: "平方米" },
  LOCATION: { th: "ทำเล", en: "Location", cn: "地点" },
  PRICE: { th: "ราคา", en: "Price", cn: "价格" },
  RENT: { th: "ค่าเช่า", en: "Rent", cn: "租金" },
  CURRENCY: { th: "บาท", en: "THB", cn: "泰铢" },
  PER_MONTH: { th: "/เดือน", en: "/month", cn: "/月" },

  // Meta Keywords
  KEYWORDS: {
    SALE_TH: "ขายบ้าน",
    RENT_TH: "เช่าบ้าน",
    REAL_ESTATE_TH: "อสังหาริมทรัพย์",
    SECOND_HAND_TH: "บ้านมือสอง",
    SALE_EN: "Property for Sale",
    RENT_EN: "Property for Rent",
    REAL_ESTATE_EN: "Real Estate Thailand",
  },
};

/**
 * Generate URL-friendly slug
 * Preserves Thai characters while removing symbols/emojis
 * Enriched with: Title, Bedrooms, Bathrooms, Area, Type, Location
 */
export function generatePropertySlug(
  data: PropertyDataForSEO,
  language: string = "th",
): string {
  const lang = (
    language === "th" || language === "en" || language === "cn"
      ? language
      : "th"
  ) as "th" | "en" | "cn";

  const typeLabel = data.property_type
    ? SEO_LABELS[data.property_type]?.[lang] ||
      SEO_LABELS[data.property_type]?.["th"]
    : "";

  const seoKeywords = [
    data.is_hot_sale && SEO_LABELS.HOT_SALE[lang],
    data.near_transit && SEO_LABELS.NEAR_TRANSIT[lang],
    data.is_pet_friendly && SEO_LABELS.PET_FRIENDLY[lang],
    data.is_corner_unit && SEO_LABELS.CORNER_UNIT[lang],
    data.is_renovated && SEO_LABELS.RENOVATED[lang],
    data.is_fully_furnished && SEO_LABELS.FULLY_FURNISHED[lang],
    data.is_selling_with_tenant && SEO_LABELS.WITH_TENANT[lang],
    data.is_foreigner_quota && SEO_LABELS.FOREIGNER_QUOTA[lang],
  ].filter(Boolean);

  // Extract Top 2 Nearby Places (Priority: Transit > Others)
  const nearbyKeywords: string[] = [];
  const nearTransitLabel = SEO_LABELS.NEAR_STATION[lang];

  // 1. Priority: Main Transit Station from Form (Legacy/Simple)
  if (data.near_transit && data.transit_station_name) {
    const stationName = data.transit_station_name.trim().replace(/\s+/g, "-");
    nearbyKeywords.push(`${nearTransitLabel}${stationName}`);
  }

  // 1.5 Priority: Transit List from Step 3 (nearby_transits) - Covers BTS, MRT, ARL, etc.
  if (data.nearby_transits && data.nearby_transits.length > 0) {
    data.nearby_transits.forEach((transit: any) => {
      // Use localized station name if available
      let stationNameValue = transit.station_name;
      if (language === "en" && transit.station_name_en) {
        stationNameValue = transit.station_name_en;
      } else if (language === "cn" && transit.station_name_cn) {
        stationNameValue = transit.station_name_cn;
      }

      if (stationNameValue) {
        const type = transit.type || "";
        const name = stationNameValue.trim().replace(/\s+/g, "-");
        // e.g. "ใกล้รถไฟฟ้าสถานี-bts-ทองหล่อ" or "near-transit-station-bts-thong-lo"
        const keyword = `${nearTransitLabel}${type}-${name}`;

        if (!nearbyKeywords.includes(keyword)) {
          nearbyKeywords.push(keyword);
        }
      }
    });
  }

  // 2. Secondary: Transit from Nearby Places (Google Places API or similar)
  if (data.nearby_places && data.nearby_places.length > 0) {
    // Explicitly find transit stations and add them to URL
    data.nearby_places.forEach((place: any) => {
      // Use name from item, or localized if available
      let placeNameValue = place.name;
      if (language === "en" && place.name_en) {
        placeNameValue = place.name_en;
      } else if (language === "cn" && place.name_cn) {
        placeNameValue = place.name_cn;
      }

      const isTransit =
        placeNameValue.includes("BTS") ||
        placeNameValue.includes("MRT") ||
        placeNameValue.includes("สายสี");

      if (isTransit) {
        const stationName = placeNameValue.trim().replace(/\s+/g, "-");
        const keyword = `${nearTransitLabel}${stationName}`;

        if (!nearbyKeywords.includes(keyword)) {
          nearbyKeywords.push(keyword);
        }
      }
    });

    const addedCategories = new Set<string>();
    const selectedNearbyPlaces: any[] = [];

    for (const place of data.nearby_places) {
      if (selectedNearbyPlaces.length >= 3) break;

      // Localized name check for transit exclusion
      let placeNameValue = place.name;
      if (language === "en" && place.name_en) {
        placeNameValue = place.name_en;
      } else if (language === "cn" && place.name_cn) {
        placeNameValue = place.name_cn;
      }

      const isTransit =
        placeNameValue.includes("BTS") ||
        placeNameValue.includes("MRT") ||
        placeNameValue.includes("สายสี");

      if (isTransit) continue;

      const category = place.category || "Other";

      if (!addedCategories.has(category)) {
        selectedNearbyPlaces.push(place);
        addedCategories.add(category);
      }
    }

    const nearLabel = SEO_LABELS.NEAR[lang];
    selectedNearbyPlaces.forEach((place) => {
      // Final localized name for Slug
      let placeNameValue = place.name;
      if (language === "en" && place.name_en) {
        placeNameValue = place.name_en;
      } else if (language === "cn" && place.name_cn) {
        placeNameValue = place.name_cn;
      }

      const keyword = `${nearLabel}${placeNameValue.replace(/\s+/g, "-")}`;
      if (!nearbyKeywords.includes(keyword)) {
        nearbyKeywords.push(keyword);
      }
    });
  }

  const featureKeywords: string[] = [];
  if (data.features && data.features.length > 0) {
    data.features.slice(0, 2).forEach((feat) => {
      featureKeywords.push(feat);
    });
  }

  const parts = [
    data.title,
    ...featureKeywords,
    ...nearbyKeywords,
    ...seoKeywords,
    data.bedrooms && `${data.bedrooms}${SEO_LABELS.BEDS[lang]}`,
    data.bathrooms && `${data.bathrooms}${SEO_LABELS.BATHS[lang]}`,
    data.size_sqm && `${data.size_sqm}${SEO_LABELS.SQM[lang]}`,
    typeLabel,
    data.popular_area,
    data.subdistrict,
    data.district,
    data.province,
  ].filter(Boolean);

  const rawString = parts.join(" ");

  const cleaned = rawString
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s_-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, "-")
    .replace(/-+/g, "-");

  const suffix = Date.now().toString(36).slice(-4);
  return `${cleaned.slice(0, 220)}-${suffix}`;
}

/**
 * Generate meta title (max 60 characters for SEO)
 */
export function generateMetaTitle(
  data: PropertyDataForSEO,
  language: string = "th",
): string {
  const parts = [data.title];

  if (data.listing_type === "RENT") {
    parts.push(
      SEO_LABELS.FOR_RENT[
        language === "cn" ? "cn" : language === "en" ? "en" : "th"
      ],
    );
  } else {
    parts.push(
      SEO_LABELS.FOR_SALE[
        language === "cn" ? "cn" : language === "en" ? "en" : "th"
      ],
    );
  }

  if (data.district) parts.push(data.district);
  if (data.province) parts.push(data.province);

  const title = parts.join(" | ");
  const suffix = ` - ${siteConfig.name}`;

  // Truncate if too long (max 60)
  if (title.length + suffix.length > 60) {
    return title.slice(0, 60 - suffix.length - 3) + "..." + suffix;
  }

  return title + suffix;
}

/**
 * Generate meta description (max 160 characters for SEO)
 */
export function generateMetaDescription(
  data: PropertyDataForSEO,
  language: string = "th",
): string {
  const lang = (language === "cn" ? "cn" : language === "en" ? "en" : "th") as
    | "th"
    | "en"
    | "cn";
  const parts = [data.title];

  if (data.bedrooms)
    parts.push(`${data.bedrooms} ${SEO_LABELS.BEDROOMS_FULL[lang]}`);
  if (data.bathrooms)
    parts.push(`${data.bathrooms} ${SEO_LABELS.BATHROOMS_FULL[lang]}`);
  if (data.size_sqm)
    parts.push(
      `${SEO_LABELS.AREA_SIZE[lang]} ${data.size_sqm} ${SEO_LABELS.SQM_FULL[lang]}`,
    );
  if (data.district && data.province)
    parts.push(
      `${SEO_LABELS.LOCATION[lang]} ${data.district}, ${data.province}`,
    );

  let description = parts.join(" ");

  // Add price
  if (data.price) {
    const label = ` ${SEO_LABELS.PRICE[lang]} `;
    const unit = ` ${SEO_LABELS.CURRENCY[lang]}`;
    description += `${label}${data.price.toLocaleString()}${unit}`;
  } else if (data.rental_price) {
    const label = ` ${SEO_LABELS.RENT[lang]} `;
    const unit = ` ${SEO_LABELS.CURRENCY[lang]}${SEO_LABELS.PER_MONTH[lang]}`;
    description += `${label}${data.rental_price.toLocaleString()}${unit}`;
  }

  // Truncate if too long (max 160)
  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  return description;
}

/**
 * Generate meta keywords
 */
export function generateMetaKeywords(
  data: PropertyDataForSEO,
  language: string = "th",
): string[] {
  const keywords = new Set<string>();

  if (data.property_type) keywords.add(data.property_type);
  if (data.listing_type) keywords.add(data.listing_type);
  if (data.district) keywords.add(data.district);
  if (data.province) keywords.add(data.province);
  if (data.bedrooms)
    keywords.add(
      `${data.bedrooms} ${SEO_LABELS.BEDROOMS_FULL[language === "en" ? "en" : "th"]}`,
    );

  // Add common keywords
  if (language === "th") {
    keywords.add(SEO_LABELS.KEYWORDS.SALE_TH);
    keywords.add(SEO_LABELS.KEYWORDS.RENT_TH);
    keywords.add(SEO_LABELS.KEYWORDS.REAL_ESTATE_TH);
    keywords.add(SEO_LABELS.KEYWORDS.SECOND_HAND_TH);
  } else {
    keywords.add(SEO_LABELS.KEYWORDS.SALE_EN);
    keywords.add(SEO_LABELS.KEYWORDS.RENT_EN);
    keywords.add(SEO_LABELS.KEYWORDS.REAL_ESTATE_EN);
  }

  // Add title words (split by space)
  data.title.split(/\s+/).forEach((word) => {
    if (word.length > 2) keywords.add(word);
  });

  return Array.from(keywords);
}

/**
 * Generate Schema.org structured data (JSON-LD)
 * For better SEO and rich snippets
 */
export function generateStructuredData(data: PropertyDataForSEO): any {
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.title,
  };

  // Address
  if (data.address_line1 || data.district || data.province) {
    structuredData.address = {
      "@type": "PostalAddress",
      streetAddress: data.address_line1,
      addressLocality: data.district,
      addressRegion: data.province,
      postalCode: data.postal_code,
      addressCountry: "TH",
    };
  }

  // Offer (price)
  if (data.price || data.rental_price) {
    structuredData.offers = {
      "@type": "Offer",
      price: data.price || data.rental_price,
      priceCurrency: "THB",
    };
  }

  // Property details
  if (data.bedrooms) {
    structuredData.numberOfRooms = data.bedrooms;
  }

  if (data.size_sqm) {
    structuredData.floorSize = {
      "@type": "QuantitativeValue",
      value: data.size_sqm,
      unitCode: "MTK", // Square meter
    };
  }

  if (data.description) {
    structuredData.description = data.description.replace(/<[^>]*>?/gm, ""); // Clean HTML
  }

  return structuredData;
}

/**
 * Generate all SEO data at once
 */
export function generatePropertySEO(data: PropertyDataForSEO): PropertySEOData {
  return {
    slug: generatePropertySlug(data),
    metaTitle: generateMetaTitle(data),
    metaDescription: generateMetaDescription(data),
    metaKeywords: generateMetaKeywords(data),
    structuredData: generateStructuredData(data),
  };
}
