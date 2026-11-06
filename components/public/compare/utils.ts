import { CompareProperty } from "./types";
import { getLocalizedField } from "@/lib/i18n";

export const formatMoney = (amount: number, locale: string = "th-TH") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getListingTypeKey = (type: string | null) => {
  if (!type) return null;
  const upper = String(type).toUpperCase().trim();
  if (upper === "SALE" || upper === "ขาย") return "common.for_sale";
  if (upper === "RENT" || upper === "เช่า") return "common.for_rent";
  if (
    upper === "SALE_AND_RENT" ||
    upper === "SALE_RENT" ||
    upper === "RENT_AND_SALE" ||
    upper === "BOTH" ||
    upper === "ขายและเช่า" ||
    upper === "เช่าและขาย" ||
    upper === "ขาย/เช่า" ||
    upper === "เช่า/ขาย" ||
    upper === "เช่า/ซื้อ"
  ) {
    return "common.for_sale_rent";
  }
  return null;
};

export const getListingTypeLabel = (
  type: string | null,
  t: (key: string) => string
): string => {
  if (!type) return "-";
  const key = getListingTypeKey(type);
  if (key) {
    const val = t(key);
    if (val && !val.includes("COMMON.")) return val;
  }
  const upper = String(type).toUpperCase().trim();
  if (upper === "SALE_AND_RENT" || upper === "BOTH" || upper === "SALE_RENT") return "ขาย/เช่า";
  if (upper === "SALE") return "ขาย";
  if (upper === "RENT") return "เช่า";
  return type;
};

export const getPropertyTypeLabel = (
  type: string | null,
  language: string = "th"
): string => {
  if (!type) return "-";
  const upper = String(type).toUpperCase().trim();
  const langKey = (language === "cn" ? "cn" : language === "ru" ? "ru" : language === "en" ? "en" : "th") as "th" | "en" | "cn" | "ru";

  const map: Record<string, { th: string; en: string; cn: string; ru: string }> = {
    CONDO: { th: "คอนโด", en: "Condo", cn: "公寓", ru: "Кондо" },
    HOUSE: { th: "บ้านเดี่ยว", en: "House", cn: "独栋别墅", ru: "Дом" },
    TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅", ru: "Таунхаус" },
    LAND: { th: "ที่ดิน", en: "Land", cn: "土地", ru: "Земля" },
    COMMERCIAL_BUILDING: { th: "อาคารพาณิชย์", en: "Commercial Building", cn: "商用建筑", ru: "Коммерческое здание" },
    WAREHOUSE: { th: "โกดัง / คลังสินค้า", en: "Warehouse", cn: "仓库", ru: "Склад" },
    OFFICE_BUILDING: { th: "อาคารสำนักงาน", en: "Office Building", cn: "写字楼", ru: "Офисное здание" },
    OFFICE: { th: "สำนักงาน / ออฟฟิศ", en: "Office", cn: "办公室", ru: "Офис" },
    VILLA: { th: "วิลล่า", en: "Villa", cn: "别墅", ru: "Вилла" },
    POOL_VILLA: { th: "พูลวิลล่า", en: "Pool Villa", cn: "带泳池别墅", ru: "Вилла с бассейном" },
    HOME_OFFICE: { th: "โฮมออฟฟิศ", en: "Home Office", cn: "商住两用", ru: "Домашний офис" },
    OTHER: { th: "อื่นๆ", en: "Other", cn: "其他", ru: "Другое" },
  };

  if (map[upper]) {
    return map[upper][langKey] || map[upper].th;
  }
  return type;
};

export const isPetFriendly = (p: CompareProperty) => {
  return p.meta_keywords?.includes("Pet Friendly");
};

/**
 * Resolves the display title for a property in compare view.
 * Ensures that if language is 'en', 'cn', or 'ru', NO Thai characters are mixed in ("จะไม่มีไทยปน").
 */
export function getCompareDisplayTitle(
  property: CompareProperty,
  language: string = "th"
): string {
  const isThai = language === "th";
  if (isThai) {
    return (
      property.project_name_th ||
      property.project_name ||
      property.title ||
      "อสังหาริมทรัพย์"
    );
  }

  // Non-Thai languages (en, cn, ru) -> must not contain Thai characters
  const containsThai = (str?: string | null) => !!str && /[ก-๙]/.test(str);

  // 1. Try project English name if available and has no Thai
  if (property.project_name_en && !containsThai(property.project_name_en)) {
    return property.project_name_en.trim();
  }

  // 2. Try target localized title (e.g. title_cn, title_ru, title_en)
  const localized = getLocalizedField<string>(property, "title", language);
  if (localized && !containsThai(localized)) {
    return localized.trim();
  }

  // 3. Try title_en
  if (property.title_en && !containsThai(property.title_en)) {
    return property.title_en.trim();
  }

  // 4. Try project_name if it is pure Latin/English without Thai characters (e.g. "XT Huai Khwang", "Ashton Chula-Silom")
  if (property.project_name && !containsThai(property.project_name)) {
    return property.project_name.trim();
  }

  // 5. Clean fallback without Thai
  const areaFallback = property.popular_area_en || "Bangkok";
  return `Unit in ${areaFallback}`;
}

/**
 * Checks whether a property has meaningful data populated for a given comparison row key.
 */
export function isRowPopulated(rowKey: string, p: CompareProperty): boolean {
  switch (rowKey) {
    case "price":
      return Boolean(p.price || p.rental_price || p.original_price || p.original_rental_price);
    case "price_per_sqm":
      return Boolean((p.size_sqm && (p.price || p.original_price)) || p.price_per_sqm);
    case "min_contract_months":
      return Boolean(p.min_contract_months);
    case "deposit_advance":
      return Boolean(p.rental_price || p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT");
    case "common_fee":
      return Boolean(p.common_fee);
    case "ceiling_height":
      return Boolean(p.ceiling_height || (p.amenities as any)?.ceiling_height);
    case "direction":
      return Boolean(
        p.direction ||
        p.orientation ||
        (p.amenities as any)?.direction ||
        p.facing_north ||
        p.facing_south ||
        p.facing_east ||
        p.facing_west
      );
    case "furnishing":
      return Boolean(p.is_fully_furnished || p.is_bare_shell || p.furnishing_status);
    case "petFriendly":
      return Boolean(p.is_pet_friendly || p.pet_friendly || (p.amenities as any)?.pet_friendly);
    case "allow_airbnb":
      return Boolean(p.allow_airbnb || (p.amenities as any)?.allow_airbnb);
    case "foreigner_quota":
      return Boolean(p.is_foreigner_quota);
    case "property_size":
      return Boolean(p.size_sqm && p.size_sqm > 0);
    case "land_size_sqwah":
      return Boolean(p.land_size_sqwah && p.land_size_sqwah > 0);
    case "bedrooms":
      return typeof p.bedrooms === "number" && p.bedrooms > 0;
    case "bathrooms":
      return typeof p.bathrooms === "number" && p.bathrooms > 0;
    case "floor":
      return Boolean(p.floor && p.floor > 0);
    case "parking_slots":
      return Boolean(p.parking_slots && p.parking_slots > 0);
    case "description":
      return Boolean(p.description || p.description_en || p.description_cn || p.description_ru);
    case "google_maps_link":
      return Boolean(p.google_maps_link || p.latitude || p.longitude);
    case "transportation":
      return Boolean(
        (p.near_transit && (p.transit_station_name || p.transit_station_name_en)) ||
        (Array.isArray(p.nearby_transits) && p.nearby_transits.length > 0)
      );
    case "nearby_places": {
      let places: any[] = [];
      try {
        places = typeof p.nearby_places === "string" ? JSON.parse(p.nearby_places) : p.nearby_places || [];
      } catch {
        places = [];
      }
      return Array.isArray(places) && places.length > 0;
    }
    case "features": {
      const featCount = (p.features || []).length;
      const amenCount = Object.keys(p.amenities || {}).length;
      return featCount > 0 || amenCount > 0;
    }
    case "zone":
      return Boolean(p.popular_area || p.district);
    case "location":
      return Boolean(p.location || p.district || p.province);
    case "province":
      return Boolean(p.province);
    case "verified":
      return typeof p.verified === "boolean";
    case "listing_type":
      return Boolean(p.listing_type);
    case "property_type":
      return Boolean(p.property_type);
    case "updated_at":
      return Boolean(p.updated_at);
    default:
      return Boolean((p as any)[rowKey]);
  }
}
