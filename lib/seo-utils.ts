/**
 * SEO/AEO/GEO/AIO utilities
 * - Auto-generate SEO metadata
 * - Create slugs
 * - Generate structured data (Schema.org)
 */

import slugify from "slugify";
import type { Database } from "@/lib/database.types";

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
  nearby_transits?: { type: string; station_name: string }[]; // Full list from Step 3
  nearby_places?: any[];
  features?: string[];
}

/**
 * Generate URL-friendly slug
 * Preserves Thai characters while removing symbols/emojis
 * Enriched with: Title, Bedrooms, Bathrooms, Area, Type, Location
 */
export function generatePropertySlug(
  data: PropertyDataForSEO,
  language: string = "th",
): string {
  // Map type to Localized Label
  const typeMap: Record<string, Record<string, string>> = {
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
  };
  const typeLabel = data.property_type
    ? typeMap[data.property_type]?.[language] ||
      typeMap[data.property_type]?.["th"]
    : "";

  const seoKeywords = [
    data.is_hot_sale &&
      (language === "th"
        ? "ราคาถูก-ลดราคาพิเศษ"
        : language === "en"
          ? "cheap-hot-sale"
          : "特价房源"),
    data.near_transit &&
      (language === "th"
        ? "ใกล้รถไฟฟ้า"
        : language === "en"
          ? "near-transit"
          : "靠近轻轨"),
    data.is_pet_friendly &&
      (language === "th"
        ? "เลี้ยงสัตว์ได้"
        : language === "en"
          ? "pet-friendly"
          : "可养宠物"),
    data.is_corner_unit &&
      (language === "th"
        ? "ห้องมุม"
        : language === "en"
          ? "corner-unit"
          : "边间"),
    data.is_renovated &&
      (language === "th"
        ? "รีโนเวทใหม่"
        : language === "en"
          ? "renovated"
          : "全新装修"),
    data.is_fully_furnished &&
      (language === "th"
        ? "แต่งครบ-พร้อมอยู่"
        : language === "en"
          ? "fully-furnished"
          : "家具齐全"),
    data.is_selling_with_tenant &&
      (language === "th"
        ? "พร้อมผู้เช่า-ลงทุนคุ้ม"
        : language === "en"
          ? "with-tenant"
          : "带租约"),
    data.is_foreigner_quota &&
      (language === "th"
        ? "ต่างชาติซื้อได้"
        : language === "en"
          ? "foreigner-quota"
          : "外籍配额"),
  ].filter(Boolean);

  // Extract Top 2 Nearby Places (Priority: Transit > Others)
  const nearbyKeywords: string[] = [];
  const nearTransitLabel =
    language === "th"
      ? "ใกล้รถไฟฟ้าสถานี-"
      : language === "en"
        ? "near-transit-station-"
        : "靠近轻轨站-";

  // 1. Priority: Main Transit Station from Form (Legacy/Simple)
  if (data.near_transit && data.transit_station_name) {
    const stationName = data.transit_station_name.trim().replace(/\s+/g, "-");
    nearbyKeywords.push(`${nearTransitLabel}${stationName}`);
  }

  // 1.5 Priority: Transit List from Step 3 (nearby_transits) - Covers BTS, MRT, ARL, etc.
  if (data.nearby_transits && data.nearby_transits.length > 0) {
    data.nearby_transits.forEach((transit) => {
      if (transit.station_name) {
        const type = transit.type || "";
        const name = transit.station_name.trim().replace(/\s+/g, "-");
        // e.g. "ใกล้รถไฟฟ้าสถานี-bts-ทองหล่อ" or "ใกล้รถไฟฟ้าสถานี-arl-มักกะสัน"
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
    data.nearby_places.forEach((place) => {
      const isTransit =
        place.name.includes("BTS") ||
        place.name.includes("MRT") ||
        place.name.includes("สายสี");

      if (isTransit) {
        const stationName = place.name.trim().replace(/\s+/g, "-");
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

      const isTransit =
        place.name.includes("BTS") ||
        place.name.includes("MRT") ||
        place.name.includes("สายสี");

      if (isTransit) continue;

      const category = place.category || "Other";

      if (!addedCategories.has(category)) {
        selectedNearbyPlaces.push(place);
        addedCategories.add(category);
      }
    }

    const nearLabel =
      language === "th" ? "ใกล้-" : language === "en" ? "near-" : "靠近-";
    selectedNearbyPlaces.forEach((place) => {
      const keyword = `${nearLabel}${place.name.replace(/\s+/g, "-")}`;
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
    data.bedrooms &&
      (language === "th"
        ? `${data.bedrooms} นอน`
        : language === "en"
          ? `${data.bedrooms}BR`
          : `${data.bedrooms}卧`),
    data.bathrooms &&
      (language === "th"
        ? `${data.bathrooms} น้ำ`
        : language === "en"
          ? `${data.bathrooms}BA`
          : `${data.bathrooms}卫`),
    data.size_sqm &&
      (language === "th" ? `${data.size_sqm} ตรม` : `${data.size_sqm}sqm`),
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
      language === "th" ? "ให้เช่า" : language === "en" ? "For Rent" : "出租",
    );
  } else {
    parts.push(
      language === "th" ? "ขาย" : language === "en" ? "For Sale" : "出售",
    );
  }

  if (data.district) parts.push(data.district);
  if (data.province) parts.push(data.province);

  const title = parts.join(" | ");
  const suffix = language === "th" ? " - OMA Asset" : " - Real Estate Thailand";

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
  const parts = [data.title];

  if (data.bedrooms)
    parts.push(
      language === "th"
        ? `${data.bedrooms} ห้องนอน`
        : language === "en"
          ? `${data.bedrooms} Bedrooms`
          : `${data.bedrooms} 卧室`,
    );
  if (data.bathrooms)
    parts.push(
      language === "th"
        ? `${data.bathrooms} ห้องน้ำ`
        : language === "en"
          ? `${data.bathrooms} Bathrooms`
          : `${data.bathrooms} 浴室`,
    );
  if (data.size_sqm)
    parts.push(
      language === "th"
        ? `พื้นที่ ${data.size_sqm} ตร.ม.`
        : `Size ${data.size_sqm} sqm`,
    );
  if (data.district && data.province)
    parts.push(
      language === "th"
        ? `ทำเล ${data.district} ${data.province}`
        : `Location ${data.district}, ${data.province}`,
    );

  let description = parts.join(" ");

  // Add price
  if (data.price) {
    const label =
      language === "th" ? " ราคา " : language === "en" ? " Price " : " 价格 ";
    const unit =
      language === "th" ? " บาท" : language === "en" ? " THB" : " 泰铢";
    description += `${label}${data.price.toLocaleString()}${unit}`;
  } else if (data.rental_price) {
    const label =
      language === "th" ? " ค่าเช่า " : language === "en" ? " Rent " : " 租金 ";
    const unit =
      language === "th"
        ? " บาท/เดือน"
        : language === "en"
          ? " THB/month"
          : " 泰铢/月";
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
      language === "th"
        ? `${data.bedrooms} ห้องนอน`
        : `${data.bedrooms} Bedrooms`,
    );

  // Add common keywords
  if (language === "th") {
    keywords.add("ขายบ้าน");
    keywords.add("เช่าบ้าน");
    keywords.add("อสังหาริมทรัพย์");
    keywords.add("บ้านมือสอง");
  } else {
    keywords.add("Property for Sale");
    keywords.add("Property for Rent");
    keywords.add("Real Estate Thailand");
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
