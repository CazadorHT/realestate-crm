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
  nearby_places?: any[];
  features?: string[];
}

/**
 * Generate URL-friendly slug
 * Preserves Thai characters while removing symbols/emojis
 * Enriched with: Title, Bedrooms, Bathrooms, Area, Type, Location
 */
export function generatePropertySlug(data: PropertyDataForSEO): string {
  // Map type to Thai
  const typeMap: Record<string, string> = {
    HOUSE: "บ้านเดี่ยว",
    CONDO: "คอนโด",
    TOWNHOME: "ทาวน์โฮม",
    LAND: "ที่ดิน",
    OFFICE_BUILDING: "อาคารสำนักงานออฟฟิศ",
    COMMERCIAL_BUILDING: "อาคารพาณิชย์",
    WAREHOUSE: "โกดัง",
  };
  const typeLabel = data.property_type ? typeMap[data.property_type] : "";

  const seoKeywords = [
    data.is_hot_sale && "ราคาถูก-ลดราคาพิเศษ",
    data.near_transit && "ใกล้รถไฟฟ้า",
    data.is_pet_friendly && "เลี้ยงสัตว์ได้",
    data.is_corner_unit && "ห้องมุม",
    data.is_renovated && "รีโนเวทใหม่",
    data.is_fully_furnished && "แต่งครบ-พร้อมอยู่",
    data.is_selling_with_tenant && "พร้อมผู้เช่า-ลงทุนคุ้ม",
    data.is_foreigner_quota && "ต่างชาติซื้อได้",
  ].filter(Boolean);

  // Extract Top 2 Nearby Places (Priority: Transit > Others)
  const nearbyKeywords: string[] = [];
  if (data.nearby_places && data.nearby_places.length > 0) {
    // Explicitly find transit stations and add them to URL
    data.nearby_places.forEach((place) => {
      const isTransit =
        place.name.includes("BTS") ||
        place.name.includes("MRT") ||
        place.name.includes("สายสี");

      if (isTransit) {
        // Add clean station name to keywords (e.g. "BTS ทองหล่อ")
        nearbyKeywords.push(place.name.replace(/\s+/g, "-"));
      }
    });

    // Also keep existing logic but ensure no duplicates if needed, or just prioritize transit
    // For now, let's just ensure standard "near-X" format for top places too
    const sorted = [...data.nearby_places].sort((a, b) => {
      const isTransit = (t: string) =>
        t.includes("BTS") || t.includes("MRT") || t.includes("สายสี");
      if (isTransit(a.name) && !isTransit(b.name)) return -1;
      if (!isTransit(a.name) && isTransit(b.name)) return 1;
      return 0;
    });

    // Add top 2 places as "near-X" keyword if not already added
    sorted.slice(0, 2).forEach((place) => {
      const keyword = `ใกล้-${place.name.replace(/\s+/g, "-")}`;
      if (!nearbyKeywords.includes(place.name.replace(/\s+/g, "-"))) {
        nearbyKeywords.push(keyword);
      }
    });
  }

  // Extract Top 2 Special Features
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
    data.bedrooms && `${data.bedrooms} นอน`,
    data.bathrooms && `${data.bathrooms} น้ำ`,
    data.size_sqm && `${data.size_sqm} ตรม`,
    typeLabel,
    data.popular_area,
    data.subdistrict,
    data.district,
    data.province,
  ].filter(Boolean);

  const rawString = parts.join(" ");

  // Manual Cleaning to ensure Thai characters are preserved
  // Keep Thai (\u0E00-\u0E7F), Alphanumeric, Hyphen, Underline, and Space
  const cleaned = rawString
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s_-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, "-") // Replace spaces and slashes with hyphens
    .replace(/-+/g, "-"); // Remove duplicate hyphens

  // Add random suffix to ensure uniqueness (project standard)
  const suffix = Date.now().toString(36).slice(-4);
  return `${cleaned.slice(0, 160)}-${suffix}`;
}

/**
 * Generate meta title (max 60 characters for SEO)
 */
export function generateMetaTitle(data: PropertyDataForSEO): string {
  const parts = [data.title];

  if (data.listing_type === "RENT") {
    parts.push("ให้เช่า");
  } else {
    parts.push("ขาย");
  }

  if (data.district) parts.push(data.district);
  if (data.province) parts.push(data.province);

  const title = parts.join(" | ");
  const suffix = " - Real Estate CRM";

  // Truncate if too long (max 60)
  if (title.length + suffix.length > 60) {
    return title.slice(0, 60 - suffix.length - 3) + "..." + suffix;
  }

  return title + suffix;
}

/**
 * Generate meta description (max 160 characters for SEO)
 */
export function generateMetaDescription(data: PropertyDataForSEO): string {
  const parts = [data.title];

  if (data.property_type) parts.push(data.property_type);
  if (data.bedrooms) parts.push(`${data.bedrooms} ห้องนอน`);
  if (data.bathrooms) parts.push(`${data.bathrooms} ห้องน้ำ`);
  if (data.size_sqm) parts.push(`พื้นที่ ${data.size_sqm} ตร.ม.`);
  if (data.district && data.province)
    parts.push(`ทำเล ${data.district} ${data.province}`);

  let description = parts.join(" ");

  // Add price
  if (data.price) {
    description += ` ราคา ${data.price.toLocaleString()} บาท`;
  } else if (data.rental_price) {
    description += ` ค่าเช่า ${data.rental_price.toLocaleString()} บาท/เดือน`;
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
export function generateMetaKeywords(data: PropertyDataForSEO): string[] {
  const keywords = new Set<string>();

  if (data.property_type) keywords.add(data.property_type);
  if (data.listing_type) keywords.add(data.listing_type);
  if (data.district) keywords.add(data.district);
  if (data.province) keywords.add(data.province);
  if (data.bedrooms) keywords.add(`${data.bedrooms} ห้องนอน`);

  // Add common keywords
  keywords.add("ขายบ้าน");
  keywords.add("เช่าบ้าน");
  keywords.add("อสังหาริมทรัพย์");
  keywords.add("บ้านมือสอง");

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
