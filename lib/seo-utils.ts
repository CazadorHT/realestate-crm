/**
 * SEO/AEO/GEO/AIO utilities
 * - Auto-generate SEO metadata
 * - Create slugs
 * - Generate structured data (Schema.org)
 */

import slugify from "slugify";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

import { siteConfig } from "@/lib/site-config";
import { getLocalizedField } from "@/lib/i18n";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

export interface PropertySEOData {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: string;
  structuredData: Record<string, unknown>; // Schema.org JSON-LD
  faqSchema?: Record<string, unknown>;
  breadcrumbSchema?: Record<string, unknown>; // Schema.org BreadcrumbList
  ogPriceAmount?: number;
  ogPriceCurrency?: string;
}

interface PropertyDataForSEO {
  id?: string;
  slug?: string;
  title: string;
  title_en?: string;
  title_cn?: string;
  property_type: PropertyType;
  listing_type: ListingType;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  price?: number;
  rental_price?: number;
  popular_area?: string;
  popular_area_en?: string;
  subdistrict?: string;
  subdistrict_en?: string;
  district?: string;
  district_en?: string;
  province?: string;
  province_en?: string;
  address_line1?: string;
  address_line1_en?: string;
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
  transit_station_name_en?: string;
  nearby_transits?: {
    type: string;
    station_name: string;
    station_name_en?: string | null;
    station_name_cn?: string | null;
  }[]; // Full list from Step 3
  nearby_places?: {
    category: string;
    name: string;
    name_en?: string | null;
    name_cn?: string | null;
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
    REAL_ESTATE_EN: "Real Estate Bangkok",
  },

  // FAQ Labels
  FAQ_Q_PRICE: {
    th: "ราคาของ {title} คือเท่าไหร่?",
    en: "What is the price of {title}?",
    cn: "{title} 的价格是多少？",
  },
  FAQ_A_PRICE: {
    th: "ราคาของ {title} คือ {price} {currency} ครับ ตั้งอยู่ในทำเล {location}",
    en: "The price of {title} is {price} {currency}, located in {location}.",
    cn: "{title} 的价格为 {price} {currency}，位于 {location}。",
  },
  FAQ_Q_PET: {
    th: "{title} เลี้ยงสัตว์ได้ไหม?",
    en: "Is {title} pet friendly?",
    cn: "{title} 可以养宠物吗？",
  },
  FAQ_A_PET_YES: {
    th: "ใช่ครับ {title} เป็นโครงการที่อนุญาตให้เลี้ยงสัตว์ได้ (Pet Friendly)",
    en: "Yes, {title} is a pet-friendly property.",
    cn: "是的，{title} 是一处宠物友好的房产。",
  },
  FAQ_A_PET_NO: {
    th: "ขออภัยครับ {title} ไม่อนุญาตให้เลี้ยงสัตว์ครับ",
    en: "Sorry, {title} does not allow pets.",
    cn: "抱歉，{title} 不允许携带宠物。",
  },
  FAQ_Q_TRANSIT: {
    th: "{title} ใกล้รถไฟฟ้าสถานีอะไร?",
    en: "Which transit station is near {title}?",
    cn: "哪个轻轨站靠近 {title}？",
  },
  FAQ_A_TRANSIT: {
    th: "{title} ตั้งอยู่ใกล้กับ {station} ทำให้เดินทางสะดวกมากครับ",
    en: "{title} is located near {station}, making it very convenient for commuting.",
    cn: "{title} 靠近 {station}，交通非常便利。",
  },
};

/**
 * Transliteration mapping for common Thai real estate terms
 * to keep URLs clean (ASCII) but SEO relevant.
 * This is populated dynamically from SEO_LABELS where possible.
 */
const TRANSLIT_MAP: Record<string, string> = {
  // Actions Special Cases
  ขายและเช่า: "sale-rent",
  ให้เช่า: "rent",
  ขาย: "sale",
  // Common Property Terms
  ห้องนอน: "bedroom",
  ห้องน้ำ: "bathroom",
  ตรม: "sqm",
  "ตร.ม.": "sqm",
  ตารางเมตร: "sqm",
  เมตร: "m",
  กม: "km",
  กิโลเมตร: "km",
  ชั้น: "floor",
  ที่ดิน: "land",
  บ้าน: "house",
  คอนโด: "condo",
  อพาร์ทเม้น: "apartment",
  สวย: "prime",
  หรู: "luxury",
  ถูก: "cheap",
  ลดราคา: "sale-off",
  ติดรถไฟฟ้า: "near-transit",
  ใกล้: "near",
  ใหม่: "new",
  พร้อมอยู่: "ready-to-move-in",
  // Locations (Common - these aren't in SEO_LABELS yet)
  กรุงเทพ: "bangkok",
  กรุงเทพมหานคร: "bangkok",
  ภูเก็ต: "phuket",
  เชียงใหม่: "chiang-mai",
  ชลบุรี: "chonburi",
  พัทยา: "pattaya",
  สมุทรปราการ: "samut-prakan",
  นนทบุรี: "nonthaburi",
  ปทุมธานี: "pathum-thani",
};

// Initialize mapping from SEO_LABELS to avoid duplication
Object.entries(SEO_LABELS).forEach(([th, labels]) => {
  if (labels.th && labels.en) {
    const enValue = labels.en.toLowerCase().replace(/[\s/]+/g, "-");
    TRANSLIT_MAP[labels.th] = enValue;
  }
});

function transliterate(text: string): string {
  if (!text) return "";
  let result = text.toLowerCase();

  // Apply mapping - Sort by length descending to match longer phrases first
  const sortedKeys = Object.keys(TRANSLIT_MAP).sort(
    (a, b) => b.length - a.length,
  );
  sortedKeys.forEach((th: string) => {
    result = result.replace(new RegExp(th, "g"), ` ${TRANSLIT_MAP[th]} `);
  });

  return result.trim();
}

/**
 * Generate URL-friendly slug
 * Strategy: Prioritize SEO-critical info first (Listing Type, Property Type, Title, Location)
 */
export function generatePropertySlug(
  data: PropertyDataForSEO,
  language: string = "th",
): string {
  const getWords = (s: string) =>
    s
      ? s
          .toLowerCase()
          .split(/[\s-]+/)
          .filter(Boolean)
      : [];
  const uniqueWords = new Set<string>();
  const addWords = (s: string | undefined | null) => {
    if (!s) return;
    getWords(s).forEach((w: string) => uniqueWords.add(w));
  };

  // 1. Action (e.g. "for-sale", "for-rent")
  const actionLabel =
    data.listing_type === "RENT"
      ? "for-rent"
      : data.listing_type === "SALE"
        ? "for-sale"
        : "for-sale-rent";
  addWords(actionLabel);

  // 2. Property Type (e.g. "condo", "house")
  addWords(
    data.property_type ? SEO_LABELS[data.property_type]?.["en"] : "property",
  );

  // Enforce English for fully ASCII URLs
  const slugLang = "en";

  // 3. Title / Project Name (Increasing to 15 words)
  const titlePart = data.title_en || transliterate(data.title);
  addWords(
    titlePart
      .split(/[\s-]+/)
      .slice(0, 20)
      .join("-"),
  );

  // 4. Detailed Location (Area, District, Province) - Move up for better SEO context
  addWords(data.popular_area_en || transliterate(data.popular_area || ""));
  addWords(data.district_en || transliterate(data.district || ""));
  addWords(data.province_en || transliterate(data.province || ""));

  // 5. Room Specs
  if (data.bedrooms) addWords(`${data.bedrooms}${SEO_LABELS.BEDS[slugLang]?.toLowerCase() || "bedroom"}`);
  if (data.bathrooms) addWords(`${data.bathrooms}${SEO_LABELS.BATHS[slugLang]?.toLowerCase() || "bathroom"}`);
  if (data.size_sqm) addWords(`${data.size_sqm}${SEO_LABELS.SQM[slugLang]?.toLowerCase() || "sqm"}`);

  // 6. Special Flags
  const getFlagLabel = (key: string) => SEO_LABELS[key]?.[slugLang] || SEO_LABELS[key]?.["en"] || key.toLowerCase().replace(/_/g, '-');

  if (data.is_pet_friendly) addWords(getFlagLabel("PET_FRIENDLY"));
  if (data.is_corner_unit) addWords(getFlagLabel("CORNER_UNIT"));
  if (data.is_renovated) addWords(getFlagLabel("RENOVATED"));
  if (data.is_fully_furnished) addWords(getFlagLabel("FULLY_FURNISHED"));
  if (data.is_foreigner_quota) addWords(getFlagLabel("FOREIGNER_QUOTA"));
  if (data.is_hot_sale) addWords(getFlagLabel("HOT_SALE"));

  // 7. Refined Transit & Nearby Places (2 each, unique categories/types)
  const addedTransitTypes = new Set<string>();
  let transitCount = 0;
  if (data.nearby_transits && data.nearby_transits.length > 0) {
    data.nearby_transits.forEach((transit: any) => {
      if (transitCount < 2 && !addedTransitTypes.has(transit.type)) {
        const station =
          transit.station_name_en || transliterate(transit.station_name || "");
        if (station) {
          addWords("near");
          addWords(station);
          addedTransitTypes.add(transit.type);
          transitCount++;
        }
      }
    });
  } else if (data.transit_station_name) {
    const station =
      data.transit_station_name_en || transliterate(data.transit_station_name);
    if (station) {
      addWords("near");
      addWords(station);
    }
  }

  const addedPlaceCats = new Set<string>();
  let placeCount = 0;
  if (data.nearby_places && data.nearby_places.length > 0) {
    data.nearby_places.forEach((place) => {
      if (placeCount < 2 && !addedPlaceCats.has(place.category)) {
        const placeName = place.name_en || transliterate(place.name || "");
        if (placeName) {
          addWords("near");
          addWords(placeName);
          addedPlaceCats.add(place.category);
          placeCount++;
        }
      }
    });
  }

  // Final assembly
  const baseSlug = Array.from(uniqueWords)
    .join("-")
    .replace(/[^\x00-\x7F]/g, "") // Strictly ASCII
    .replace(/[^a-zA-Z0-9\s_-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, "-")
    .replace(/-+/g, "-");

  const suffix = Date.now().toString(36).slice(-4);

  // High limit: 160 characters to allow more keywords while staying safe
  return `${baseSlug.slice(0, 180)}-${suffix}`;
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

  // Prioritize Popular Area (e.g., "Sukhumvit") > District > Province
  const locationStr = data.popular_area || data.district || data.province || "";
  if (locationStr) parts.push(locationStr);

  // If popular area is used, optionally add district for extra context if it's different and short
  if (
    data.popular_area &&
    data.district &&
    data.popular_area !== data.district
  ) {
    if ((parts.join(" | ") + data.district).length < 50) {
      parts.push(data.district);
    }
  }

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
  // Location: [Popular Area], [District], [Province]
  const locationParts = [
    data.popular_area,
    data.district,
    data.province,
  ].filter(Boolean);
  if (locationParts.length > 0) {
    parts.push(
      `${SEO_LABELS.LOCATION[lang]} ${locationParts.slice(0, 2).join(", ")}`,
    );
  }

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

  // 3. Combined Keywords (e.g. "Condo for Sale in Sukhumvit")
  const typeLabel =
    SEO_LABELS[data.property_type]?.[language] ||
    SEO_LABELS[data.property_type]?.["en"];
  const actionLabel =
    data.listing_type === "RENT"
      ? SEO_LABELS.FOR_RENT[language]
      : SEO_LABELS.FOR_SALE[language];
  // Prioritize Popular Area (Sukhumvit > Wattana)
  const locationPart =
    data.popular_area || data.district || data.province || "";
  const locationEn =
    data.popular_area_en || data.district_en || data.province_en || "";

  if (typeLabel && actionLabel && locationPart) {
    keywords.add(`${typeLabel}${actionLabel}${locationPart}`);
    keywords.add(`${actionLabel}${typeLabel}${locationPart}`);
  }

  if (language === "en" && typeLabel && locationEn) {
    keywords.add(
      `${typeLabel} for ${data.listing_type?.toLowerCase()} in ${locationEn}`,
    );
  }

  // 4. Feature & Status Keywords
  if (data.is_pet_friendly) keywords.add(SEO_LABELS.PET_FRIENDLY[language]);
  if (data.near_transit) keywords.add(SEO_LABELS.NEAR_TRANSIT[language]);
  if (data.is_fully_furnished)
    keywords.add(SEO_LABELS.FULLY_FURNISHED[language]);
  if (data.is_hot_sale) keywords.add(SEO_LABELS.HOT_SALE[language]);

  // 5. Language Specific Defaults
  if (language === "th") {
    keywords.add("อสังหาริมทรัพย์");
    keywords.add("บ้านมือสอง");
    keywords.add("ที่พักกรุงเทพ");
    keywords.add(`${typeLabel}ราคาถูก`);
  } else if (language === "cn") {
    keywords.add("曼谷房产");
    keywords.add("泰国买房");
    keywords.add(`${typeLabel}出售`);
  } else {
    keywords.add("real estate bangkok");
    keywords.add("thailand property");
    keywords.add(`cheap ${typeLabel?.toLowerCase()}`);
  }

  // 6. Title words (Long ones)
  const title =
    language === "en"
      ? data.title_en
      : language === "cn"
        ? data.title_cn
        : data.title;
  (title || data.title).split(/[\s,.-]+/).forEach((word: string) => {
    if (word.length > 3) keywords.add(word);
  });

  return Array.from(keywords).filter(Boolean).slice(0, 15); // Limit to top 15
}

/**
 * Generate FAQ Schema (JSON-LD)
 * Based on property features and location
 */
export function generateFAQSchema(
  data: PropertyDataForSEO,
  language: string = "th",
): Record<string, unknown> {
  const faqs = [];
  const title = getLocalizedField<string>(data, "title", language);
  // Important: Use popular_area for context if available
  const location = data.popular_area || data.district || data.province || "";

  // 1. Price FAQ
  if (data.price || data.rental_price) {
    const priceText = data.price
      ? `${data.price.toLocaleString()} ${SEO_LABELS.CURRENCY[language]}`
      : `${data.rental_price?.toLocaleString()} ${SEO_LABELS.CURRENCY[language]}${SEO_LABELS.PER_MONTH[language]}`;

    faqs.push({
      "@type": "Question",
      name: SEO_LABELS.FAQ_Q_PRICE[language].replace("{title}", title),
      acceptedAnswer: {
        "@type": "Answer",
        text: SEO_LABELS.FAQ_A_PRICE[language]
          .replace("{title}", title)
          .replace("{price}", priceText)
          .replace("{currency}", "")
          .replace("{location}", location),
      },
    });
  }

  // 2. Pet Friendly FAQ
  faqs.push({
    "@type": "Question",
    name: SEO_LABELS.FAQ_Q_PET[language].replace("{title}", title),
    acceptedAnswer: {
      "@type": "Answer",
      text: data.is_pet_friendly
        ? SEO_LABELS.FAQ_A_PET_YES[language].replace("{title}", title)
        : SEO_LABELS.FAQ_A_PET_NO[language].replace("{title}", title),
    },
  });

  // 3. Transit FAQ
  if (data.near_transit || data.popular_area) {
    const station = data.popular_area || data.district || "";
    faqs.push({
      "@type": "Question",
      name: SEO_LABELS.FAQ_Q_TRANSIT[language].replace("{title}", title),
      acceptedAnswer: {
        "@type": "Answer",
        text: SEO_LABELS.FAQ_A_TRANSIT[language]
          .replace("{title}", title)
          .replace("{station}", station),
      },
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs,
  };
}

/**
 * Generate Breadcrumb Schema (JSON-LD)
 * Helps Google display clean site structure (Home > Sale > Bangkok > Property)
 */
export function generateBreadcrumbSchema(
  data: PropertyDataForSEO,
  language: string = "th",
): Record<string, any> {
  const lang = (language === "cn" ? "cn" : language === "en" ? "en" : "th") as "th" | "en" | "cn";
  const title = getLocalizedField<string>(data, "title", language);
  
  const actionLabel = data.listing_type === "RENT" 
    ? SEO_LABELS.FOR_RENT[lang] 
    : SEO_LABELS.FOR_SALE[lang];
    
  const typeLabel = data.property_type 
    ? (SEO_LABELS[data.property_type]?.[lang] || SEO_LABELS[data.property_type]?.["en"]) 
    : "Property";
    
  // 1. Home
  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: language === "en" ? "Home" : language === "cn" ? "首页" : "หน้าแรก",
      item: `${siteConfig.url}/${language === "th" ? "" : language}`,
    },
  ];

  // 2. Action + Type (e.g. "Condo For Rent")
  itemListElement.push({
    "@type": "ListItem",
    position: 2,
    name: `${typeLabel} ${actionLabel}`,
    item: `${siteConfig.url}/${language === "th" ? "" : language}/properties?listing=${data.listing_type}&type=${data.property_type}`,
  });

  // 3. Location (Province)
  const province = getLocalizedField<string>(data, "province", language) || data.province;
  if (province) {
    itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: province,
      item: `${siteConfig.url}/${language === "th" ? "" : language}/properties?province=${encodeURIComponent(data.province || province || "")}`,
    });
  }

  // 4. District / Area
  const district = getLocalizedField<string>(data, "district", language) || data.district;
  const area = getLocalizedField<string>(data, "popular_area", language) || data.popular_area;
  const subLocation = area || district;
  
  if (subLocation && subLocation !== province) {
    itemListElement.push({
      "@type": "ListItem",
      position: province ? 4 : 3,
      name: subLocation,
      item: `${siteConfig.url}/${language === "th" ? "" : language}/properties?${area ? 'popular_area' : 'district'}=${encodeURIComponent( (area ? (data.popular_area || area) : (data.district || district)) || "" )}`,
    });
  }

  // 5. Current Property
  itemListElement.push({
    "@type": "ListItem",
    position: itemListElement.length + 1,
    name: title,
    item: `${siteConfig.url}/properties/${data.slug || data.id}`,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

/**
 * Generate Structured Data (JSON-LD)
 * Updated to include more granular details
 */
export function generateStructuredData(
  data: PropertyDataForSEO,
): Record<string, any> {
  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: data.title,
    description: data.description?.replace(/<[^>]*>?/gm, "") || data.title,
    url: `${siteConfig.url}/properties/${data.slug || data.id}`,
  };

  // Main Entity (The actual property)
  structuredData.mainEntity = {
    "@type": [
      "Place",
      "Accommodation",
      data.property_type === "HOUSE"
        ? "House"
        : data.property_type === "CONDO"
          ? "Apartment"
          : "Accommodation",
    ],
    name: data.title,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address_line1,
      addressLocality: data.district,
      addressRegion: data.province,
      postalCode: data.postal_code,
      addressCountry: "TH",
    },
  };

  // Offer Details
  if (data.price || data.rental_price) {
    structuredData.mainEntity.offers = {
      "@type": "Offer",
      price: data.price || data.rental_price,
      priceCurrency: "THB",
      availability: "https://schema.org/InStock",
    };
  }

  // Room details
  if (data.bedrooms) structuredData.mainEntity.numberOfRooms = data.bedrooms;
  if (data.size_sqm) {
    structuredData.mainEntity.floorSize = {
      "@type": "QuantitativeValue",
      value: data.size_sqm,
      unitCode: "MTK",
    };
  }

  return structuredData;
}

/**
 * Generate all SEO data at once
 * Added FAQ support
 */
export function generatePropertySEO(
  data: PropertyDataForSEO & { main_image?: string },
  language: string = "th",
): PropertySEOData {
  return {
    slug: generatePropertySlug(data, language),
    metaTitle: generateMetaTitle(data, language),
    metaDescription: generateMetaDescription(data, language),
    metaKeywords: generateMetaKeywords(data, language),
    ogImage: data.main_image || siteConfig.ogImage || "/hero-realestate.png",
    structuredData: generateStructuredData(data),
    faqSchema: generateFAQSchema(data, language),
    breadcrumbSchema: generateBreadcrumbSchema(data, language),
    ogPriceAmount: data.price || data.rental_price,
    ogPriceCurrency: "THB",
  };
}
