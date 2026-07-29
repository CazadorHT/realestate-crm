"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { postToMetaPage } from "@/lib/meta";
import { getSiteSettings } from "@/features/site-settings/actions";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { PropertyRow } from "@/lib/services/properties";
import { generateText } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getPublicImageUrl } from "../image-utils";
import { LOCATION_MAP } from "@/lib/line-flex-builders";

function getDistrictName(districtName: string | null | undefined, lang: string): string {
  if (!districtName) return "";
  const cleanName = districtName.replace(/^เขต/, "").trim();
  const mapped = (LOCATION_MAP as any)[cleanName] || (LOCATION_MAP as any)[districtName];
  if (mapped && mapped[lang as any]) {
    return mapped[lang as any];
  }
  return districtName;
}

export interface SocialProperty {
  [key: string]: unknown;
  id: string;
  slug?: string | null;
  title: string;
  description: string | null;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  price: number | null;
  rental_price: number | null;
  original_price: number | null;
  original_rental_price: number | null;
  price_per_sqm: number | null;
  rent_price_per_sqm: number | null;
  size_sqm: number | null;
  land_size_sqwah: number | null;
  property_type: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  popular_area: string | null;
  transit_station_name: string | null;
  transit_type: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  parking_slots?: number | null;
  office_capacity?: string | null;
  halls?: number | null;
  maid_rooms?: number | null;
  verified: boolean | null;
  is_exclusive: boolean | null;
  property_agents?: {
    profiles: { full_name?: string; nickname?: string; phone?: string; line_id?: string };
  }[];
  property_features?: {
    features: {
      id: string;
      name: string;
      icon_key: string;
      [key: string]: unknown;
    } | null;
  }[];
  nearby_places?: { name?: string; distance?: string; category?: string }[];
  nearby_transits?: { name?: string; distance?: string }[];
  property_images?: { image_url: string }[];
}

/**
 * Helper function for formatting prices consistently
 */
const formatPrice = (p: number | string | null | undefined) => {
  if (p === null || p === undefined) return "";
  const num = Number(p);
  return isNaN(num) ? p.toString() : num.toLocaleString();
};

/**
 * Convert HTML content to beautiful plain text suitable for social posts
 */
function htmlToPlainText(html: string): string {
  if (!html) return "";
  
  let text = html;
  
  // Replace headings with newlines before/after
  text = text.replace(/<h[1-6][^>]*>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n");
  
  // Replace br with newline
  text = text.replace(/<br\s*\/?>/gi, "\n");
  
  // Replace list items with bullet points
  text = text.replace(/<li[^>]*>/gi, "\n- ");
  text = text.replace(/<\/li>/gi, "");
  
  // Replace paragraph tags with newlines
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<\/p>/gi, "\n");
  
  // Replace other common block tags with spaces/newlines
  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "\n");
  
  // Strip all other HTML tags
  text = text.replace(/<[^>]*>/g, "");
  
  // Decode HTML entities
  text = text.replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, " ");
             
  // Normalize consecutive newlines and spaces
  text = text.split("\n")
             .map(line => line.trim())
             .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
             .join("\n");
             
  return text.trim();
}

/**
 * Render social template with property data
 */
export async function renderPropertySocialTemplate(
  template: string,
  property: SocialProperty,
  lang: string,
) {
  if (!template) return "";
  if (!property) return template;

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).replace(/\/$/, "");
  const publicUrl = `${baseUrl}/properties/${property.slug || property.id || ""}`;

  const tSale =
    lang === "th"
      ? "ขาย"
      : lang === "en"
        ? "Sale"
        : lang === "ru"
          ? "Продажа"
          : "售价";
  const tRent =
    lang === "th"
      ? "เช่า"
      : lang === "en"
        ? "Rent"
        : lang === "ru"
          ? "Аренда"
          : "租金";
  const tBaht =
    lang === "th"
      ? "บาท"
      : lang === "en"
        ? "THB"
        : lang === "ru"
          ? "ТНВ"
          : "泰铢";
  const tPerMonth =
    lang === "th"
      ? "/เดือน"
      : lang === "en"
        ? "/mo"
        : lang === "ru"
          ? "/мес"
          : "/月";

  let priceText = "";
  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (property.price)
      parts.push(`${tSale} ${formatPrice(property.price)} ${tBaht}`);
    if (property.rental_price)
      parts.push(
        `${tRent} ${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}`,
      );
    priceText = parts.join(" | ");
  } else if (property.listing_type === "RENT") {
    priceText = property.rental_price
      ? `${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}`
      : "";
  } else {
    priceText = property.price ? `${formatPrice(property.price)} ${tBaht}` : "";
  }

  let originalPriceText = "";
  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (property.original_price)
      parts.push(`${tSale} ${formatPrice(property.original_price)} ${tBaht}`);
    if (property.original_rental_price)
      parts.push(
        `${tRent} ${formatPrice(property.original_rental_price)} ${tBaht}${tPerMonth}`,
      );
    originalPriceText = parts.join(" | ");
  } else if (property.listing_type === "RENT") {
    originalPriceText = property.original_rental_price
      ? `${formatPrice(property.original_rental_price)} ${tBaht}${tPerMonth}`
      : "";
  } else {
    originalPriceText = property.original_price
      ? `${formatPrice(property.original_price)} ${tBaht}`
      : "";
  }

  const primaryAgent = property.property_agents?.[0]?.profiles || {};
  const tTitle =
    (lang === "th" ? property.title : (property[`title_${lang}`] as string)) ||
    property.title ||
    "";
  const tDescriptionRaw =
    (lang === "th"
      ? property.description
      : (property[`description_${lang}`] as string)) ||
    property.description ||
    "";
  const tDescription = htmlToPlainText(tDescriptionRaw);

  // Use same logic as PropertyCard for consistent localization
  const tPopularArea = getLocaleValue(property, "popular_area", lang);
  const tProvince = getProvinceName(property.province || "", lang);
  const tLocation = [tPopularArea, tProvince]
    .filter(Boolean)
    .join(lang === "th" ? " " : ", ");

  const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: {
      CONDO: "คอนโด",
      HOUSE: "บ้าน",
      TOWNHOUSE: "ทาวน์เฮ้าส์",
      LAND: "ที่ดิน",
      COMMERCIAL: "อาคารพาณิชย์",
      OFFICE: "ออฟฟิศ",
      WAREHOUSE: "โกดัง",
      VILLA: "วิลล่า",
      POOL_VILLA: "พูลวิลล่า",
    },
    en: {
      CONDO: "Condo",
      HOUSE: "House",
      TOWNHOUSE: "Townhouse",
      LAND: "Land",
      COMMERCIAL: "Commercial",
      OFFICE: "Office",
      WAREHOUSE: "Warehouse",
      VILLA: "Villa",
      POOL_VILLA: "Pool Villa",
    },
    cn: {
      CONDO: "公寓",
      HOUSE: "别墅",
      TOWNHOUSE: "联排别墅",
      LAND: "土地",
      COMMERCIAL: "商用楼",
      OFFICE: "办公室",
      WAREHOUSE: "仓库",
      VILLA: "别墅",
      POOL_VILLA: "泳池别墅",
    },
    ru: {
      CONDO: "Кондо",
      HOUSE: "Дом",
      TOWNHOUSE: "Таунхаус",
      LAND: "Земля",
      COMMERCIAL: "Коммерция",
      OFFICE: "Офис",
      WAREHOUSE: "Склад",
      VILLA: "Вилла",
      POOL_VILLA: "Пул Вилла",
    },
  };
  const tPropertyType = property.property_type
    ? PROPERTY_TYPE_LABELS[lang]?.[property.property_type] ||
      property.property_type
    : "";

  const LISTING_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { SALE: "ขาย", RENT: "ให้เช่า", SALE_AND_RENT: "ขาย/เช่า" },
    en: { SALE: "Sale", RENT: "Rent", SALE_AND_RENT: "Sale/Rent" },
    cn: { SALE: "出售", RENT: "出租", SALE_AND_RENT: "出售/出租" },
    ru: { SALE: "Продажа", RENT: "Аренда", SALE_AND_RENT: "Продажа/Аренда" },
  };
  const tListingType = property.listing_type
    ? LISTING_TYPE_LABELS[lang]?.[property.listing_type] ||
      property.listing_type
    : "";

  const tAmenities =
    property.property_features
      ?.map((f) => {
        const name =
          (lang === "th"
            ? f.features?.name
            : (f.features?.[`name_${lang}`] as string)) || f.features?.name;
        return name ? `- ${name}` : null;
      })
      .filter(Boolean)
      .join("\n") || "-";

  const nearbyPlaces =
    (property.nearby_places || [])
      ?.map((p) =>
        p.name ? `- ${p.name}${p.distance ? ` (${p.distance})` : ""}` : null,
      )
      .filter(Boolean)
      .slice(0, 5)
      .join("\n") || "-";

  const nearbyTransits =
    (property.nearby_transits || [])
      ?.map((p) =>
        p.name ? `- ${p.name}${p.distance ? ` (${p.distance})` : ""}` : null,
      )
      .filter(Boolean)
      .join("\n") || "-";

  const closestTransitName =
    (lang === "th"
      ? property.transit_station_name
      : (property[`transit_station_name_${lang}`] as string)) ||
    property.transit_station_name ||
    "";
  const closestTransit = closestTransitName
    ? `${property.transit_type || ""} ${closestTransitName} (${property.transit_distance_meters || "0"}m.)`
    : "-";

  const formatDetails = () => {
    const parts = [
      property.bedrooms
        ? lang === "th"
          ? `${property.bedrooms} ห้องนอน`
          : lang === "en"
            ? `${property.bedrooms} Bed`
            : lang === "ru"
              ? `${property.bedrooms} Спальни`
              : `${property.bedrooms} 卧室`
        : null,
      property.bathrooms
        ? lang === "th"
          ? `${property.bathrooms} ห้องน้ำ`
          : lang === "en"
            ? `${property.bathrooms} Bath`
            : lang === "ru"
              ? `${property.bathrooms} Ванные`
              : `${property.bathrooms} 浴室`
        : null,
      property.size_sqm
        ? `${property.size_sqm} ${lang === "th" ? "ตร.ม." : lang === "en" ? "sq.m." : lang === "cn" ? "平米" : lang === "ru" ? "кв.м." : "Sq.m."}`
        : null,
      property.land_size_sqwah
        ? lang === "th"
          ? `${property.land_size_sqwah} ตร.ว.`
          : lang === "en"
            ? `${property.land_size_sqwah} sq.wah`
            : lang === "cn"
              ? `${property.land_size_sqwah} 哇`
              : lang === "ru"
                ? `${property.land_size_sqwah} кв.ва`
                : `${property.land_size_sqwah} Sq.wah`
        : null,
      property.floor
        ? lang === "th"
          ? `ชั้น ${property.floor}`
          : lang === "en"
            ? `Floor ${property.floor}`
            : lang === "ru"
              ? `${property.floor} этаж`
              : `${property.floor} 层`
        : null,
      property.parking_slots
        ? lang === "th"
          ? `${property.parking_slots} ที่จอดรถ`
          : lang === "en"
            ? `${property.parking_slots} Parking`
            : lang === "ru"
              ? `${property.parking_slots} Парковка`
              : `${property.parking_slots} 车位`
        : null,
      property.office_capacity
        ? lang === "th"
          ? `ความจุ ${property.office_capacity} คน`
          : lang === "en"
            ? `Capacity ${property.office_capacity} Pax`
            : lang === "ru"
              ? `Вместимость ${property.office_capacity} чел.`
              : `容量 ${property.office_capacity} คน`
        : null,
      property.halls
        ? lang === "th"
          ? `${property.halls} ห้องโถง`
          : lang === "en"
            ? `${property.halls} Hall`
            : lang === "ru"
              ? `${property.halls} Холл`
              : `${property.halls} 大厅`
        : null,
      property.maid_rooms
        ? lang === "th"
          ? `${property.maid_rooms} ห้องแม่บ้าน`
          : lang === "en"
            ? `${property.maid_rooms} Maid Room`
            : lang === "ru"
              ? `${property.maid_rooms} Комната для прислуги`
              : `${property.maid_rooms} 保姆房`
        : null,
    ];
    return parts.filter(Boolean).join(" | ") || "-";
  };

  const formatSaleTag = (price: number, original?: number) => {
    const pStr = formatPrice(price);
    const oStr = original ? formatPrice(original) : "";
    if (original && original > price) {
      const pct = Math.round(((original - price) / original) * 100);
      return lang === "th"
        ? `🔥 ลดพิเศษ! ${pStr} ${tBaht} (จาก ${oStr} - ลด ${pct}%)`
        : lang === "en"
          ? `🔥 Hot Deal! ${pStr} ${tBaht} (Was ${oStr} - ${pct}% OFF)`
          : lang === "ru"
            ? `🔥 Горячее предложение! ${pStr} ${tBaht} (Было ${oStr} - скидка ${pct}%)`
            : `🔥 特价! ${pStr} ${tBaht} (原价 ${oStr} - 优惠 ${pct}%)`;
    }
    return lang === "th"
      ? `ราคาขาย: ${pStr} ${tBaht}`
      : lang === "en"
        ? `Sale Price: ${pStr} ${tBaht}`
        : lang === "ru"
          ? `Цена продажи: ${pStr} ${tBaht}`
          : `售价: ${pStr} ${tBaht}`;
  };

  const formatRentTag = (price: number, original?: number) => {
    const pStr = formatPrice(price);
    const oStr = original ? formatPrice(original) : "";
    if (original && original > price) {
      const pct = Math.round(((original - price) / original) * 100);
      return lang === "th"
        ? `🔥 ดีลดี! เช่า ${pStr} ${tBaht}${tPerMonth} (จาก ${oStr} - ลด ${pct}%)`
        : lang === "en"
          ? `🔥 Great Deal! Rent ${pStr} ${tBaht}${tPerMonth} (Was ${oStr} - ${pct}% OFF)`
          : lang === "ru"
            ? `🔥 Отличное предложение! Аренда ${pStr} ${tBaht}${tPerMonth} (Было ${oStr} - скидка ${pct}%)`
            : `🔥 优选! 租金 ${pStr} ${tBaht}${tPerMonth} (原价 ${oStr} - 优惠 ${pct}%)`;
    }
    return lang === "th"
      ? `ค่าเช่า: ${pStr} ${tBaht}${tPerMonth}`
      : lang === "en"
        ? `Rent: ${pStr} ${tBaht}${tPerMonth}`
        : lang === "ru"
          ? `Аренда: ${pStr} ${tBaht}${tPerMonth}`
          : `租金: ${pStr} ${tBaht}${tPerMonth}`;
  };

  let priceTag = "";
  const contactPrice =
    lang === "th"
      ? "ติดต่อสอบถามราคา"
      : lang === "en"
        ? "Contact for Price"
        : lang === "ru"
          ? "Цена по запросу"
          : "联系咨询价格";

  // Robust price extraction (matches website behavior)
  const actualPrice =
    property.price ||
    Number(property.price_per_sqm || 0) * Number(property.size_sqm || 0) ||
    0;
  const actualRentPrice =
    property.rental_price ||
    Number(property.rent_price_per_sqm || 0) * Number(property.size_sqm || 0) ||
    0;

  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (actualPrice)
      parts.push(formatSaleTag(actualPrice, property.original_price as number));
    if (actualRentPrice)
      parts.push(
        formatRentTag(
          actualRentPrice,
          property.original_rental_price as number,
        ),
      );
    priceTag = parts.length > 0 ? parts.join("\n") : contactPrice;
  } else if (property.listing_type === "RENT") {
    const finalPrice = actualRentPrice || actualPrice;
    priceTag = finalPrice
      ? formatRentTag(finalPrice, property.original_rental_price as number)
      : lang === "th"
        ? "ติดต่อสอบถามราคาเช่า"
        : lang === "en"
          ? "Contact for Rent"
          : lang === "ru"
            ? "Цена аренды по запросу"
            : "联系咨询租金";
  } else {
    const finalPrice = actualPrice || actualRentPrice;
    priceTag = finalPrice
      ? formatSaleTag(finalPrice, property.original_price as number)
      : lang === "th"
        ? "ติดต่อสอบถามราคาขาย"
        : lang === "en"
          ? "Contact for Sale"
          : lang === "ru"
            ? "Цена продажи по запросу"
            : "联系咨询售价";
  }

  const tVerified = property.verified
    ? lang === "th"
      ? "✅ ตรวจสอบแล้ว"
      : lang === "cn"
        ? "✅ 已验证"
        : lang === "ru"
          ? "✅ Проверено"
          : "✅ Verified"
    : "";

  const tExclusive = property.is_exclusive
    ? lang === "th"
      ? "🌟 Exclusive"
      : lang === "cn"
        ? "🌟 独家"
        : lang === "ru"
          ? "🌟 Эксклюзив"
          : "🌟 Exclusive"
    : "";

  const dbDistrict =
    (lang === "th"
      ? property.district
      : (property[`district_${lang}`] as string)) ||
    property.district ||
    "";
  const tDistrict = lang === "th" ? dbDistrict : getDistrictName(dbDistrict, lang);
  const tProvinceName = getProvinceName(property.province || "", lang);

  const cleanForHashtag = (str: string | null | undefined): string => {
    if (!str || str === "-") return "";
    return str.toString().replace(/[\s,()\-./]/g, "");
  };

  const projectObj = (property as any).project || null;
  let tProjectName = (property as any).project_name || "";
  if (projectObj) {
    if (typeof projectObj === "string") {
      tProjectName = projectObj;
    } else if (projectObj.name) {
      if (typeof projectObj.name === "object" && projectObj.name !== null) {
        tProjectName =
          (projectObj.name as any)[lang] ||
          (projectObj.name as any).th ||
          (projectObj.name as any).en ||
          (projectObj.name as any).cn ||
          (projectObj.name as any).ru ||
          Object.values(projectObj.name)[0] ||
          "";
      } else {
        tProjectName = String(projectObj.name || "");
      }
    }
  }

  const tPropertyTypeClean = cleanForHashtag(tPropertyType);
  const tListingTypeClean = cleanForHashtag(tListingType);
  const tPopularAreaClean = cleanForHashtag(tPopularArea);
  const tDistrictClean = cleanForHashtag(tDistrict);
  const tProvinceClean = cleanForHashtag(tProvinceName);
  const tLocationClean = cleanForHashtag(tPopularArea || tDistrict || tProvinceName);
  const tTransitClean = cleanForHashtag(property.transit_station_name);
  const tProjectClean = cleanForHashtag(tProjectName);

  // --- Dynamic Instagram SEO Hashtags ---
  // Group 1: Project & Location
  const projectTag = tProjectClean ? `#${tProjectClean}` : "";
  const projectLocationTag = tProjectClean && tLocationClean ? `#${tProjectClean}${tLocationClean}` : "";
  const locationTag = tLocationClean ? `#${tLocationClean}` : "";
  const propertyLocationTag = tPropertyTypeClean && tLocationClean ? `#${tPropertyTypeClean}${tLocationClean}` : "";

  // Group 2: Transit
  const transitTag = tTransitClean ? `#${tTransitClean}` : "";
  const transitType = property.transit_type || "";
  const transitTypeTag = tTransitClean && transitType ? `#${transitType}${tTransitClean}` : "";
  const transitCondoTag = tPropertyTypeClean && tTransitClean ? `#${tPropertyTypeClean}ใกล้${tTransitClean}` : "";

  // Group 3: Landmark
  const landmarkTags = (property.nearby_places || [])
    .slice(0, 2)
    .map((p: any) => p.name ? `#ใกล้${cleanForHashtag(p.name)}` : "")
    .filter(Boolean)
    .join(" ");

  // Group 4: Budget & Rent Type
  let budgetTag = "";
  if (property.listing_type === "RENT" && property.rental_price) {
    const priceVal = Number(property.rental_price);
    if (!isNaN(priceVal)) {
      const tier = Math.ceil(priceVal / 5000) * 5000;
      budgetTag = `#เช่า${tPropertyTypeClean}ไม่เกิน${tier}`;
    }
  } else if (property.listing_type === "SALE" && property.price) {
    const priceVal = Number(property.price);
    if (!isNaN(priceVal)) {
      const millions = priceVal / 1000000;
      if (millions < 10) {
        const tier = Math.ceil(millions);
        budgetTag = `#ซื้อ${tPropertyTypeClean}ไม่เกิน${tier}ล้าน`;
      }
    }
  }

  // Group 5: Expat & Foreigner Search
  const propTypeEn = property.property_type === "CONDO" ? "Condo" : "House";
  const expatTagsList = [];
  if (property.listing_type === "RENT") {
    expatTagsList.push(`#BangkokCondoForRent`, `#ExpatBangkok`, `#RentCondoBangkok`);
    if (tProvinceClean) expatTagsList.push(`#Rent${propTypeEn}${cleanForHashtag(tProvinceName)}`);
  } else {
    expatTagsList.push(`#BangkokCondoForSale`, `#BangkokProperty`, `#ThailandRealEstate`);
    if (tProvinceClean) expatTagsList.push(`#Buy${propTypeEn}${cleanForHashtag(tProvinceName)}`);
  }
  const expatTags = expatTagsList.join(" ");

  // Combine into SEO string
  const seoHashtagsStr = [
    `#vconnectasset ${projectTag} ${locationTag} ${propertyLocationTag} ${projectLocationTag}`.trim(),
    `${transitTag} ${transitTypeTag} ${transitCondoTag}`.trim(),
    landmarkTags.trim(),
    `#${tListingTypeClean}${tPropertyTypeClean} ${budgetTag}`.trim(),
    expatTags.trim()
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  return template
    .replace(/{{instagram_seo}}/g, seoHashtagsStr)
    .replace(/{{seo_hashtags}}/g, seoHashtagsStr)
    .replace(/{{project_name}}/g, tProjectName)
    .replace(/{{project_name_clean}}/g, tProjectClean)
    .replace(/{{title}}/g, tTitle)
    .replace(/{{description}}/g, tDescription)
    .replace(/{{price}}/g, priceText)
    .replace(/{{original}}/g, originalPriceText)
    .replace(/{{original_price}}/g, originalPriceText)
    .replace(
      /{{sale_price}}/g,
      property.price ? `${formatPrice(property.price as number)} ${tBaht}` : "",
    )
    .replace(
      /{{rent_price}}/g,
      property.rental_price
        ? `${formatPrice(property.rental_price as number)} ${tBaht}${tPerMonth}`
        : "",
    )
    .replace(
      /{{rental_price}}/g,
      property.rental_price
        ? `${formatPrice(property.rental_price as number)} ${tBaht}${tPerMonth}`
        : "",
    )
    .replace(
      /{{original_sale_price}}/g,
      property.original_price
        ? `${formatPrice(property.original_price as number)} ${tBaht}`
        : "",
    )
    .replace(
      /{{original_rent_price}}/g,
      property.original_rental_price
        ? `${formatPrice(property.original_rental_price as number)} ${tBaht}${tPerMonth}`
        : "",
    )
    .replace(
      /{{original_rental_price}}/g,
      property.original_rental_price
        ? `${formatPrice(property.original_rental_price as number)} ${tBaht}${tPerMonth}`
        : "",
    )
    .replace(/{{price_tag}}/g, priceTag)
    .replace(/{{details}}/g, formatDetails())
    .replace(/{{location}}/g, tLocation)
    .replace(/{{popular_area}}/g, tPopularArea)
    .replace(/{{district}}/g, tDistrict)
    .replace(/{{province}}/g, tProvinceName)
    .replace(/{{property_type_clean}}/g, tPropertyTypeClean)
    .replace(/{{listing_type_clean}}/g, tListingTypeClean)
    .replace(/{{popular_area_clean}}/g, tPopularAreaClean)
    .replace(/{{district_clean}}/g, tDistrictClean)
    .replace(/{{province_clean}}/g, tProvinceClean)
    .replace(/{{location_clean}}/g, tLocationClean)
    .replace(/{{transit_clean}}/g, tTransitClean)
    .replace(/{{amenities}}/g, tAmenities)
    .replace(/{{nearby_places}}/g, nearbyPlaces)
    .replace(/{{near_transit}}/g, nearbyTransits)
    .replace(/{{transit}}/g, closestTransit)
    .replace(/{{google_maps}}/g, property.google_maps_link || (property.address_info as any)?.maps_link || "")
    .replace(/{{property_type}}/g, tPropertyType)
    .replace(/{{listing_type}}/g, tListingType)
    .replace(/{{bedrooms}}/g, property.bedrooms?.toString() || "-")
    .replace(/{{bathrooms}}/g, property.bathrooms?.toString() || "-")
    .replace(/{{size_sqm}}/g, property.size_sqm?.toString() || "-")
    .replace(/{{land_size}}/g, property.land_size_sqwah?.toString() || "-")
    .replace(/{{land_size_sqwah}}/g, property.land_size_sqwah?.toString() || "-")
    .replace(/{{parking}}/g, property.parking_slots?.toString() || "-")
    .replace(/{{parking_slots}}/g, property.parking_slots?.toString() || "-")
    .replace(/{{office_capacity}}/g, property.office_capacity?.toString() || "-")
    .replace(/{{halls}}/g, property.halls?.toString() || "-")
    .replace(/{{maid_rooms}}/g, property.maid_rooms?.toString() || "-")
    .replace(/{{floor}}/g, property.floor?.toString() || "-")
    .replace(/{{verified}}/g, tVerified)
    .replace(/{{exclusive}}/g, tExclusive)
    .replace(/{{link}}/g, publicUrl)
    .replace(/{{agent_name}}/g, primaryAgent.nickname || primaryAgent.full_name || "")
    .replace(/{{agent_phone}}/g, primaryAgent.phone || "")
    .replace(/{{agent_line}}/g, primaryAgent.line_id || "");
}

/**
 * Helper to decrypt and populate agent profile details, falling back to assigned_to/created_by if no property agents are explicitly linked.
 */
export async function populateAgentProfiles(supabase: any, property: any) {
  if (!property) return;

  const decryptOrRaw = (val: any) => {
    if (!val) return "";
    try {
      return decrypt(val) || val;
    } catch {
      return val;
    }
  };

  const hasAgents = property.property_agents && property.property_agents.length > 0;

  if (!hasAgents) {
    const fallbackId = property.assigned_to || property.created_by;
    if (fallbackId) {
      const { data: identityData } = await supabase
        .from("identities_v3")
        .select("display_name, nickname, phone, line_id")
        .eq("id", fallbackId)
        .maybeSingle();

      const { data: staffProfile } = await supabase
        .from("profiles")
        .select("full_name, nickname, phone, line_id")
        .eq("id", fallbackId)
        .maybeSingle();

      property.property_agents = [
        {
          agent_id: fallbackId,
          profiles: {
            full_name: decryptOrRaw(identityData?.display_name) || staffProfile?.full_name || identityData?.display_name || "",
            nickname: decryptOrRaw(identityData?.nickname) || staffProfile?.nickname || identityData?.nickname || "",
            phone: decryptOrRaw(identityData?.phone) || staffProfile?.phone || identityData?.phone || "",
            line_id: decryptOrRaw(identityData?.line_id) || staffProfile?.line_id || identityData?.line_id || "",
          },
        },
      ];
    }
  } else {
    for (const pa of property.property_agents) {
      if (pa.agent_id) {
        const { data: staffProfile } = await supabase
          .from("profiles")
          .select("full_name, nickname, phone, line_id")
          .eq("id", pa.agent_id)
          .maybeSingle();

        if (staffProfile) {
          pa.profiles = {
            ...pa.profiles,
            full_name: decryptOrRaw(pa.profiles?.full_name) || staffProfile.full_name || pa.profiles?.full_name || "",
            nickname: decryptOrRaw(pa.profiles?.nickname) || staffProfile.nickname || pa.profiles?.nickname || "",
            phone: decryptOrRaw(pa.profiles?.phone) || staffProfile.phone || pa.profiles?.phone || "",
            line_id: decryptOrRaw(pa.profiles?.line_id) || staffProfile.line_id || pa.profiles?.line_id || "",
          };
        } else if (pa.profiles) {
          pa.profiles = {
            ...pa.profiles,
            full_name: decryptOrRaw(pa.profiles.full_name) || "",
            nickname: decryptOrRaw(pa.profiles.nickname) || "",
            phone: decryptOrRaw(pa.profiles.phone) || "",
            line_id: decryptOrRaw(pa.profiles.line_id) || "",
          };
        }
      }
    }
  }
}

/**
 * Get social content data for posting
 */
export async function getPropertySocialContent(
  propertyId: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
  platform?: "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK",
) {
  const { supabase } = await requireAuthContext();

  // 1. Fetch property data
  const { data: propData, error: propError } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images ( image_url, storage_path ),
      property_agents ( agent_id, profiles:identities_v3 ( full_name:display_name, nickname, phone, line_id ) ),
      property_features ( features ( name, name_en, name_cn, name_ru, icon_key ) )
    `,
    )
    .eq("id", propertyId)
    .single();

  if (propError || !propData) {
    throw new Error("Property not found");
  }

  const property = propData as any;

  // Fetch project separately to bypass view join restrictions
  if (property.project_id) {
    try {
      const { data: projData } = await supabase
        .from("projects")
        .select("name")
        .eq("id", property.project_id)
        .single();
      property.project = projData;
    } catch (err) {
      console.warn("[Social] Failed to fetch project relation:", err);
    }
  }

  // Fetch popular area translations separately from master table
  if (property.popular_area) {
    try {
      const { data: areaData } = await supabase
        .from("popular_areas")
        .select("name, name_en, name_cn, name_ru")
        .eq("name", property.popular_area)
        .limit(1);
      if (areaData && areaData[0]) {
        const area = areaData[0];
        property.popular_area_en = area.name_en || property.popular_area_en;
        property.popular_area_cn = area.name_cn || property.popular_area_cn;
        property.popular_area_ru = area.name_ru || property.popular_area_ru;
      }
    } catch (err) {
      console.warn("[Social] Failed to fetch popular area translation:", err);
    }
  }

  await populateAgentProfiles(supabase, property);

  const settings = await getSiteSettings();

  const isLine = platform === "LINE";
  const isTikTok = platform === "TIKTOK";
  const isFacebook = platform === "FACEBOOK";
  const isInstagram = platform === "INSTAGRAM";

  const { getTikTokToken } = await import("@/lib/tiktok");
  const tiktokToken = await getTikTokToken();
  const isTikTokConnected = !!tiktokToken;
  const isFacebookConnected =
    !!process.env.META_PAGE_ACCESS_TOKEN || !!settings.meta_page_access_token;
  const isInstagramConnected =
    !!process.env.META_PAGE_ACCESS_TOKEN || !!settings.meta_page_access_token;
  const isLineConnected = !!(
    process.env.LINE_CHANNEL_ACCESS_TOKEN || settings.line_channel_access_token
  );

  const isConnected = isTikTok
    ? isTikTokConnected
    : isLine
      ? isLineConnected
      : isFacebook
        ? isFacebookConnected
        : isInstagram
          ? isInstagramConnected
          : false;

  // 2. Fetch integration metadata
  let identity: { display_name?: string; avatar_url?: string } = {};

  if (isTikTok && tiktokToken) {
    identity = {
      display_name: tiktokToken.display_name,
      avatar_url: tiktokToken.avatar_url,
    };
  } else if (isLine && isLineConnected) {
    const { getLineBotInfo } = await import("@/lib/line");
    const botInfo = await getLineBotInfo();
    if (botInfo) {
      identity = {
        display_name: botInfo.displayName,
        avatar_url: botInfo.pictureUrl,
      };
    }
  } else if ((isFacebook || isInstagram) && settings.meta_page_name) {
    identity = {
      display_name: settings.meta_page_name,
    };
  }

  let template = "";
  if (isLine) {
    template =
      lang === "th"
        ? settings.line_post_template || ""
        : lang === "en"
          ? settings.line_post_template_en || ""
          : lang === "ru"
            ? settings.line_post_template_ru || ""
            : settings.line_post_template_cn || "";
  } else if (isTikTok) {
    template =
      lang === "th"
        ? settings.tiktok_post_template || ""
        : lang === "en"
          ? settings.tiktok_post_template_en || ""
          : lang === "ru"
            ? settings.tiktok_post_template_ru || ""
            : settings.tiktok_post_template_cn || "";
  } else if (isInstagram) {
    template =
      lang === "th"
        ? settings.instagram_post_template || ""
        : lang === "en"
          ? settings.instagram_post_template_en || ""
          : lang === "ru"
            ? settings.instagram_post_template_ru || ""
            : settings.instagram_post_template_cn || "";
  } else {
    // Default to Facebook for Meta platforms or fallback
    template =
      lang === "th"
        ? settings.facebook_post_template || ""
        : lang === "en"
          ? settings.facebook_post_template_en || ""
          : lang === "ru"
            ? settings.facebook_post_template_ru || ""
            : settings.facebook_post_template_cn || "";
  }

  const templates = {
    th: isLine
      ? settings.line_post_template
      : isTikTok
        ? settings.tiktok_post_template
        : isInstagram
          ? settings.instagram_post_template
          : settings.facebook_post_template,
    en: isLine
      ? settings.line_post_template_en
      : isTikTok
        ? settings.tiktok_post_template_en
        : isInstagram
          ? settings.instagram_post_template_en
          : settings.facebook_post_template_en,
    cn: isLine
      ? settings.line_post_template_cn
      : isTikTok
        ? settings.tiktok_post_template_cn
        : isInstagram
          ? settings.instagram_post_template_cn
          : settings.facebook_post_template_cn,
    ru: isLine
      ? settings.line_post_template_ru
      : isTikTok
        ? settings.tiktok_post_template_ru
        : isInstagram
          ? settings.instagram_post_template_ru
          : settings.facebook_post_template_ru,
  };

  const tSale =
    lang === "th"
      ? "ขาย"
      : lang === "en"
        ? "Sale"
        : lang === "ru"
          ? "Продажа"
          : "出售";
  const tRent =
    lang === "th"
      ? "เช่า"
      : lang === "en"
        ? "Rent"
        : lang === "ru"
          ? "Аренда"
          : "出租";
  const tBaht =
    lang === "th"
      ? "บาท"
      : lang === "en"
        ? "THB"
        : lang === "ru"
          ? "ТНВ"
          : "泰铢";
  const tPerMonth =
    lang === "th"
      ? "/เดือน"
      : lang === "en"
        ? "/mo"
        : lang === "ru"
          ? "/мес"
          : "/月";

  let priceText = "";
  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (property.price)
      parts.push(`${tSale} ${formatPrice(property.price)} ${tBaht}`);
    if (property.rental_price)
      parts.push(
        `${tRent} ${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}`,
      );
    priceText = parts.join(" | ");
  } else if (property.listing_type === "RENT") {
    priceText = property.rental_price
      ? `${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}`
      : "";
  } else {
    priceText = property.price ? `${formatPrice(property.price)} ${tBaht}` : "";
  }

  const tTitle =
    (lang === "th"
      ? (property.title as string)
      : (property[`title_${lang}`] as string)) ||
    (property.title as string) ||
    "";
  const dbDistrictVal =
    (lang === "th"
      ? (property.district as string)
      : (property[`district_${lang}`] as string)) ||
    (property.district as string) ||
    "";
  const tDistrict = lang === "th" ? dbDistrictVal : getDistrictName(dbDistrictVal, lang);
  const tProvince =
    (lang === "th"
      ? (property.province as string)
      : (property[`province_${lang}`] as string)) ||
    (property.province as string) ||
    "";

  const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: {
      CONDO: "คอนโด",
      HOUSE: "บ้าน",
      TOWNHOUSE: "ทาวน์เฮ้าส์",
      LAND: "ที่ดิน",
      COMMERCIAL: "อาคารพาณิชย์",
      OFFICE: "ออฟฟิศ",
      WAREHOUSE: "โกดัง",
      VILLA: "วิลล่า",
      POOL_VILLA: "พูลวิลล่า",
    },
    en: {
      CONDO: "Condo",
      HOUSE: "House",
      TOWNHOUSE: "Townhouse",
      LAND: "Land",
      COMMERCIAL: "Commercial",
      OFFICE: "Office",
      WAREHOUSE: "Warehouse",
      VILLA: "Villa",
      POOL_VILLA: "Pool Villa",
    },
    cn: {
      CONDO: "公寓",
      HOUSE: "别墅",
      TOWNHOUSE: "联排别墅",
      LAND: "土地",
      COMMERCIAL: "商用楼",
      OFFICE: "办公室",
      WAREHOUSE: "仓库",
      VILLA: "别墅",
      POOL_VILLA: "泳池别墅",
    },
    ru: {
      CONDO: "Кондо",
      HOUSE: "Дом",
      TOWNHOUSE: "Таунхаус",
      LAND: "Земля",
      COMMERCIAL: "Коммерция",
      OFFICE: "Офис",
      WAREHOUSE: "Склад",
      VILLA: "Вилла",
      POOL_VILLA: "Пул Вилла",
    },
  };
  const tPropertyType = property.property_type
    ? PROPERTY_TYPE_LABELS[lang]?.[property.property_type] ||
      property.property_type
    : "";

  const content = await renderPropertySocialTemplate(
    template,
    property,
    lang,
  );
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawImages =
    ((property.property_images as { image_url: string; storage_path?: string }[])
      ?.map((img) => {
        const path = img.storage_path || img.image_url;
        if (!path) return null;
        if (path.startsWith("http")) return path;
        
        // Return original high-resolution public URL using storage_path
        return getPublicImageUrl(path);
      })
      .filter(Boolean) as string[]) || [];

  const images = rawImages;

  return {
    content,
    template,
    templates,
    images,
    title: tTitle,
    priceDisplay: priceText,
    location: `${tDistrict} ${tProvince}`.trim(),
    propertyType: tPropertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    size_sqm: property.size_sqm,
    land_size_sqwah: property.land_size_sqwah,
    listingType: property.listing_type,
    listingType_label:
      property.listing_type === "SALE"
        ? tSale
        : property.listing_type === "RENT"
          ? tRent
          : "Sale/Rent",
    isExclusive: property.is_exclusive,
    verified: property.verified,
    isConnected,
    identity,
  };
}

/**
 * Post property to Meta (Facebook/Instagram)
 */
export async function postPropertyToMetaAction(
  propertyId: string,
  platform: "FACEBOOK" | "INSTAGRAM" = "FACEBOOK",
  customContent?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const { data: p, error: propError } = await supabase
      .from("properties")
      .select(
        `*, property_images(image_url, storage_path), property_agents(profiles:identities_v3(*)), property_features(features(*))`,
      )
      .eq("id", propertyId)
      .single();

    if (propError || !p) throw new Error("ไม่พบข้อมูลอสังหาริมทรัพย์");

    await populateAgentProfiles(supabase, p);

    const contentData = await getPropertySocialContent(
      propertyId,
      lang,
      platform,
    );
    const rawImages = contentData.images;

    const images = rawImages
      .map((url) => {
        let activeUrl = url;
        // Rewrite localhost URLs in production to prevent Facebook from failing to fetch them
        if (process.env.NODE_ENV === "production" && (activeUrl.includes("localhost") || activeUrl.includes("127.0.0.1"))) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl && activeUrl.includes("/storage/v1/object/public/")) {
            const pathParts = activeUrl.split("/storage/v1/object/public/");
            if (pathParts.length === 2) {
              activeUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${pathParts[1]}`;
            }
          }
        }

        return activeUrl;
      })
      .filter(Boolean) as string[];

    const finalContent = customContent
      ? await renderPropertySocialTemplate(
          customContent,
          p as SocialProperty,
          lang,
        )
      : contentData.content;

    const result = await postToMetaPage(finalContent, images, platform);

    if (result.success) {
      await logAudit(
        { supabase, user, role },
        {
          action: "property.social_post",
          entity: "properties",
          entityId: propertyId,
          metadata: { platform, post_id: result.data?.id },
        },
      );

      if (platform === "FACEBOOK") {
        await supabase
          .from("properties_core")
          .update({ posted_to_facebook_at: new Date().toISOString() })
          .eq("id", propertyId);
      } else {
        await supabase
          .from("properties_core")
          .update({ posted_to_instagram_at: new Date().toISOString() })
          .eq("id", propertyId);
      }

      revalidatePath("/protected/properties");

      return {
        success: true,
        message: `โพสต์ไปที่ ${platform} สำเร็จแล้ว`,
        data: result.data,
      };
    } else {
      return { success: false, message: `ข้อผิดพลาด: ${result.error}` };
    }
  } catch (err: any) {
    console.error("postPropertyToMetaAction error:", err);
    return { success: false, message: `เกิดข้อผิดพลาด: ${err?.message || err || "ในการเชื่อมต่อ"}` };
  }
}

/**
 * [AI Extension] Generate social media captions for properties using Gemini AI
 */
export async function generateSocialCaptionsAction(propertyId: string, platform: 'facebook' | 'tiktok' | 'instagram' | 'all') {
  const supabase = await createClient();
  
  // 1. Fetch Property Data
  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (error || !property) {
    throw new Error("Property not found");
  }

  // 2. Build Prompt
  const prompt = `
    You are an expert real estate social media manager. 
    Create engaging, high-conversion captions for a property with these details:
    - Title: ${property.title}
    - Location: ${property.popular_area}, ${property.province}
    - Price: ${property.price || property.rental_price}
    - Type: ${property.property_type}
    - Key Features: ${property.description}

    Requirements:
    - Use professional yet friendly tone.
    - Include relevant emojis.
    - Include hashtags (e.g., #RealEstate #LuxuryLiving).
    - Language: Thai (with English summary if possible).
    
    Target Platform: ${platform === 'all' ? 'Facebook, Instagram, and TikTok' : platform}
    
    Format the output as a JSON object with keys: facebook, instagram, tiktok.
  `;

  try {
    const result = await generateText(prompt, "gemini-flash-lite-latest");
    
    // Attempt to parse JSON from AI response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { raw: result.text };
  } catch (e) {
    console.error("Caption generation error:", e);
    throw e;
  }
}

/**
 * Update social post timestamp directly (used as fallback when main action times out)
 */
export async function updateSocialPostTimestampAction(
  propertyId: string,
  platform: "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK"
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const columnName = 
      platform === "FACEBOOK" 
        ? "posted_to_facebook_at" 
        : platform === "INSTAGRAM"
          ? "posted_to_instagram_at"
          : platform === "LINE"
            ? "posted_to_line_at"
            : "posted_to_tiktok_at";

    const updatePayload: any = {};
    updatePayload[columnName] = new Date().toISOString();

    const { error } = await supabase
      .from("properties_core")
      .update(updatePayload)
      .eq("id", propertyId);

    if (error) throw error;
    
    revalidatePath("/protected/properties");
    return { success: true };
  } catch (err: any) {
    console.error("updateSocialPostTimestampAction error:", err);
    return { success: false, error: err.message };
  }
}
