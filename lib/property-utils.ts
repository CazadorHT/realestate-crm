/**
 * Property Utilities
 * Shared helper functions for property-related operations across components
 */

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "บ้าน",
  CONDO: "คอนโด",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  OFFICE_BUILDING: "ออฟฟิศ",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
  WAREHOUSE: "โกดัง",
  OTHER: "อื่นๆ",
};

export const PROPERTY_TYPE_TH: Record<string, string> = {
  HOUSE: "บ้าน",
  CONDO: "คอนโด",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
  OFFICE_BUILDING: "อาคารสำนักงาน/ออฟฟิศ",
  WAREHOUSE: "โกดัง/โรงงาน",
  OTHER: "อื่นๆ",
};

export const PROPERTY_STATUS_TH: Record<string, string> = {
  ACTIVE: "พร้อมขาย/เช่า",
  RESERVED: "จองแล้ว",
  SOLD: "ขายแล้ว",
  RENTED: "เช่าแล้ว",
  INACTIVE: "ปิดประกาศ",
  DELETED: "ย้ายลงถังขยะ",
};

/**
 * Get display label for property type
 */
export function getTypeLabel(propertyType: string | null): string {
  if (!propertyType) return "อื่นๆ";
  return PROPERTY_TYPE_LABELS[propertyType] ?? "อื่นๆ";
}

/**
 * Get display label for property status
 */
export function getStatusLabel(status: string | null): string {
  if (!status) return "N/A";
  return PROPERTY_STATUS_TH[status] ?? status;
}

/**
 * Business Rule: Can a property be deleted?
 * Sold or Rented properties should be ARCHIVED/LOGGED, but not deleted from inventory
 * to maintain transaction history.
 */
export function canDeleteProperty(status: string | null): boolean {
  if (!status) return true;
  const restricted = ["SOLD", "RENTED"];
  return !restricted.includes(status.toUpperCase());
}

/**
 * Business Rule: Can status be changed based on AI review state?
 * If the property requires an AI review (typically newly created drafts), 
 * it must stay in DRAFT until the review is completed.
 */
export function isStatusChangeAllowed(
  currentStatus: string | null,
  targetStatus: string | null,
  requiresAiReview: boolean
): { allowed: boolean; message?: string } {
  if (requiresAiReview && currentStatus === "DRAFT" && targetStatus !== "DRAFT") {
    return { 
      allowed: false, 
      message: "กรุณาตรวจสอบข้อมูล AI ในหน้าแก้ไขก่อนเปลี่ยนสถานะ" 
    };
  }
  return { allowed: true };
}

/**
 * Business Rule: Does the user have permission to manage this property?
 * Admins/Managers bypass ownership. Agents must be the creator.
 */
export function isUserAuthorized(
  user: { id: string; role: string },
  property: { created_by?: string | null; tenant_id?: string | null },
  targetTenantId: string
): boolean {
  // 1. Tenant Isolation
  if (property.tenant_id && property.tenant_id !== targetTenantId) return false;

  // 2. Role bypass
  if (["ADMIN", "MANAGER"].includes(user.role)) return true;

  // 3. Ownership
  return property.created_by === user.id;
}

/**
 * Get color scheme for property type (matching PropertyTypeGrid)
 */
export function getTypeColor(propertyType: string | null): {
  text: string;
  bg: string;
  gradient: string;
} {
  const colorMap: Record<
    string,
    { text: string; bg: string; gradient: string }
  > = {
    CONDO: {
      text: "text-blue-700",
      bg: "bg-blue-50",
      gradient: "from-blue-500 to-blue-600",
    },
    HOUSE: {
      text: "text-purple-700",
      bg: "bg-purple-50",
      gradient: "from-purple-500 to-purple-600",
    },
    TOWNHOME: {
      text: "text-orange-700",
      bg: "bg-orange-50",
      gradient: "from-orange-500 to-orange-600",
    },
    OFFICE_BUILDING: {
      text: "text-sky-700",
      bg: "bg-sky-50",
      gradient: "from-sky-500 to-sky-600",
    },
    WAREHOUSE: {
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      gradient: "from-yellow-500 to-yellow-600",
    },
    LAND: {
      text: "text-green-700",
      bg: "bg-green-50",
      gradient: "from-green-500 to-green-600",
    },
    COMMERCIAL_BUILDING: {
      text: "text-indigo-700",
      bg: "bg-indigo-50",
      gradient: "from-indigo-500 to-indigo-600",
    },
    VILLA: {
      text: "text-rose-700",
      bg: "bg-rose-50",
      gradient: "from-rose-500 to-rose-600",
    },
    POOL_VILLA: {
      text: "text-cyan-700",
      bg: "bg-cyan-50",
      gradient: "from-cyan-500 to-blue-600",
    },
  };

  return (
    colorMap[propertyType || ""] || {
      text: "text-slate-700",
      bg: "bg-slate-50",
      gradient: "from-slate-500 to-slate-600",
    }
  );
}

/**
 * Get badge config for listing type
 */
export function getListingBadge(listingType: string | null): {
  label: string;
  className: string;
} | null {
  if (listingType === "SALE")
    return { label: "ขาย", className: "bg-emerald-600" };
  if (listingType === "RENT")
    return { label: "เช่า", className: "bg-indigo-600" };
  if (listingType === "SALE_AND_RENT")
    return { label: "ขาย/เช่า", className: "bg-slate-900" };
  return null;
}

/**
 * Get dynamic price formatter
 */
export function getPriceFormatter(language: string = "th") {
  return new Intl.NumberFormat(
    language === "th" ? "th-TH" : language === "cn" ? "zh-CN" : language === "ru" ? "ru-RU" : "en-US",
    {
      style: "decimal",
      maximumFractionDigits: 0,
    },
  );
}

export function formatPrice(value: number, language: string = "th"): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    const formattedMillions = Number(millions.toFixed(2));
    
    if (language === "th") {
      return `${formattedMillions.toLocaleString("th-TH")} ล้านบาท`;
    } else if (language === "cn") {
      return `฿ ${formattedMillions.toLocaleString("zh-CN")}M`;
    } else if (language === "ru") {
      return `฿ ${formattedMillions.toLocaleString("ru-RU")}M`;
    } else {
      return `฿ ${formattedMillions.toLocaleString("en-US")}M`;
    }
  }
  return `฿ ${getPriceFormatter(language).format(value)}`;
}

/**
 * Get safe text with fallback
 */

export function getSafeText(
  value: string | null | undefined,
  fallback: string,
): string {
  return value && value.trim() ? value : fallback;
}

/**
 * Get display price config (current price, original price, discount, etc.)
 */
export function getPriceDisplayConfig(property: {
  price?: number | null;
  rental_price?: number | null;
  original_price?: number | null;
  listing_type?: string | null;
}) {
  const isRent = property.listing_type === "RENT";
  const currentPrice = isRent ? property.rental_price : property.price;
  const originalPrice = property.original_price;

  const hasDiscount =
    originalPrice && currentPrice && originalPrice > currentPrice;

  return {
    currentPrice,
    originalPrice,
    hasDiscount,
    discountPercent: hasDiscount
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0,
  };
}

/**
 * Enhanced Office Price Helper
 * Calculates total price from SQM price if total is missing
 */
export function getOfficePrice(property: {
  price?: number | null;
  rental_price?: number | null;
  price_per_sqm?: number | null;
  rent_price_per_sqm?: number | null;
  size_sqm?: number | null;
  listing_type?: string | null;
  property_type?: string | null;
}) {
  if (property.property_type !== "OFFICE_BUILDING") return null;

  const isRent =
    property.listing_type === "RENT" ||
    property.listing_type === "SALE_AND_RENT";
  const mainPrice = isRent ? property.rental_price : property.price;
  const sqmPrice = isRent
    ? property.rent_price_per_sqm
    : property.price_per_sqm;

  if (!mainPrice && sqmPrice && property.size_sqm) {
    return {
      totalPrice: sqmPrice * property.size_sqm,
      sqmPrice: sqmPrice,
      isCalculated: true,
    };
  }

  return {
    totalPrice: mainPrice,
    sqmPrice: sqmPrice,
    isCalculated: false,
  };
}

/**
 * Format transit station with operator and line label nicely
 */
export function formatStationLabel(type: string, stationName: string, lang: string): string {
  const t = type.toUpperCase();
  const cleanName = stationName.replace("_", " ");
  
  if (lang === "en") {
    if (t === "BTS" || t === "GOLD") return `BTS: ${cleanName}`;
    if (t.startsWith("MRT")) return `MRT: ${cleanName}`;
    if (t === "SRT" || t === "SRT_RED") return `SRT: ${cleanName}`;
    if (t === "ARL") return `ARL: ${cleanName}`;
    if (t === "BRT") return `BRT: ${cleanName}`;
    return `${type}: ${cleanName}`;
  }
  
  if (lang === "cn") {
    if (t === "BTS" || t === "GOLD") return `BTS: ${cleanName}`;
    if (t.startsWith("MRT")) return `MRT: ${cleanName}`;
    if (t === "SRT" || t === "SRT_RED") return `SRT: ${cleanName}`;
    if (t === "ARL") return `ARL: ${cleanName}`;
    if (t === "BRT") return `BRT: ${cleanName}`;
    return `${type}: ${cleanName}`;
  }
  
  if (lang === "ru") {
    if (t === "BTS" || t === "GOLD") return `BTS: ${cleanName}`;
    if (t.startsWith("MRT")) return `MRT: ${cleanName}`;
    if (t === "SRT" || t === "SRT_RED") return `SRT: ${cleanName}`;
    if (t === "ARL") return `ARL: ${cleanName}`;
    if (t === "BRT") return `BRT: ${cleanName}`;
    return `${type}: ${cleanName}`;
  }
  
  // Default to TH
  if (t === "BTS" || t === "GOLD") return `BTS : ${cleanName}`;
  if (t.startsWith("MRT")) return `MRT : ${cleanName}`;
  if (t === "SRT" || t === "SRT_RED") return `SRT : ${cleanName}`;
  if (t === "ARL") return `ARL : ${cleanName}`;
  if (t === "BRT") return `BRT : ${cleanName}`;
  return `${type} : ${cleanName}`;
}

/**
 * Format land size from total square wah to a readable string with Rai, Ngan, Sq.wah.
 */
export function formatLandSize(totalSqwah: number | null | undefined, language: string = "th"): string {
  if (totalSqwah == null || isNaN(totalSqwah) || totalSqwah === 0) return "-";

  if (totalSqwah < 400) {
    if (language === "th") return `${totalSqwah} ตร.ว.`;
    if (language === "cn") return `${totalSqwah} 哇`;
    if (language === "ru") return `${totalSqwah} кв.ва`;
    return `${totalSqwah} Sq.w`;
  }

  const rai = Math.floor(totalSqwah / 400);
  const remaining = totalSqwah % 400;
  const ngan = Math.floor(remaining / 100);
  const sqwah = Math.round((remaining % 100) * 100) / 100;

  if (language === "th") {
    const parts = [];
    if (rai > 0) parts.push(`${rai} ไร่`);
    if (ngan > 0) parts.push(`${ngan} งาน`);
    if (sqwah > 0 || parts.length === 0) parts.push(`${sqwah} ตร.ว.`);
    return parts.join(" ");
  } else {
    const parts = [];
    if (rai > 0) parts.push(`${rai} Rai`);
    if (ngan > 0) parts.push(`${ngan} Ngan`);
    if (sqwah > 0 || parts.length === 0) parts.push(`${sqwah} Sq.w`);
    return parts.join(" ");
  }
}

/**
 * Parse a flexible Airbnb minimum contract string into its numeric amount and unit.
 * Format is expected to be "{number} {day|week|month}" (e.g. "3 day", "1 week")
 */
export function parseAirbnbMinContract(value: string | null | undefined): { number: string; unit: string } {
  if (!value) return { number: "", unit: "day" };
  
  const cleanVal = String(value).trim();
  const match = cleanVal.match(/^(\d+)\s*(day|week|month)s?$/i);
  if (match) {
    return {
      number: match[1],
      unit: match[2].toLowerCase(),
    };
  }
  
  const numMatch = cleanVal.match(/^(\d+)/);
  if (numMatch) {
    const num = numMatch[1];
    if (cleanVal.includes("วัน") || cleanVal.includes("day")) return { number: num, unit: "day" };
    if (cleanVal.includes("สัปดาห์") || cleanVal.includes("week") || cleanVal.includes("วีก")) return { number: num, unit: "week" };
    if (cleanVal.includes("เดือน") || cleanVal.includes("month")) return { number: num, unit: "month" };
    return { number: num, unit: "day" };
  }
  
  return { number: "", unit: "day" };
}

/**
 * CBD Popular Areas list matching backend database queries
 */
export const CBD_POPULAR_AREAS = [
  // สีลม - สาทร
  "สาทร",
  "สีลม",
  "ช่องนนทรี",
  "ศาลาแดง",
  "สุรศักดิ์",
  "sathorn",
  "silom",
  "chong nonsi",
  "sala daeng",
  "surasak",

  // เพลินจิต - ลุมพินี - วิทยุ
  "เพลินจิต",
  "ชิดลม",
  "ชิดลม - เพลินจิต",
  "วิทยุ",
  "หลังสวน",
  "หลังสวน - ลุมพินี",
  "ราชดำริ",
  "ลุมพินี",
  "ploenchit",
  "chidlom",
  "witthayu",
  "wireless",
  "langsuan",
  "lumpini",
  "ratchadamri",

  // สุขุมวิทชั้นใน (Prime Sukhumvit)
  "สุขุมวิท",
  "นานา",
  "อโศก",
  "พร้อมพงษ์",
  "ทองหล่อ",
  "เอกมัย",
  "sukhumvit",
  "nana",
  "asoke",
  "phrom phong",
  "thonglor",
  "thong lo",
  "ekkamai",

  // New CBD
  "พระราม 9",
  "รัชดา",
  "รัชดาภิเษก",
  "rama 9",
  "rama ix",
  "ratchada",
  "ratchadapisek",
];

/**
 * Helper to determine if a property is in a CBD location
 */
export function isCbdProperty(property: {
  popular_area?: string | { th?: string; en?: string; cn?: string; ru?: string } | null;
  meta_data?: any;
  amenities?: any;
  is_cbd?: boolean | null;
  description?: any;
} | Record<string, any>): boolean {
  if (!property) return false;
  if (property.is_cbd === true) return true;
  if (property.is_cbd === false) return false;
  if (property.amenities?.is_cbd === true) return true;
  if (property.meta_data?.is_cbd === true) return true;
  if (
    typeof property.description === "object" &&
    property.description?.is_cbd !== undefined
  ) {
    return property.description.is_cbd === true;
  }
  if (property.popular_area) {
    const rawArea = typeof property.popular_area === "string"
      ? property.popular_area
      : (property.popular_area as any).th || (property.popular_area as any).en || "";
    const area = rawArea.toLowerCase();
    return CBD_POPULAR_AREAS.some((cbdArea) =>
      area.includes(cbdArea.toLowerCase())
    );
  }
  return false;
}

/**
 * Hybrid Social Proof & Urgency stats calculation (Global Standard)
 * Combines a smart, location/popularity-aware baseline with real analytics from database.
 * Ensures numbers never drop to 0 while naturally growing with real visitor traffic.
 */
export function getSocialProofStats(
  propertyId?: string | null,
  propertyData?: {
    meta_data?: any;
    view_count?: number | null;
    favorite_count?: number | null;
    is_hot_deal?: boolean | null;
    is_cbd?: boolean | null;
    popular_area?: any;
  } | null
) {
  if (!propertyId) {
    return { savedCount: 14, recentViews24h: 6 };
  }

  // 1. Calculate deterministic baseline seed from property ID
  let hash = 0;
  for (let i = 0; i < propertyId.length; i++) {
    hash = (hash << 5) - hash + propertyId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Baseline ranges: Base saved: 6 - 22, Base views 24h: 4 - 12
  let baseSaved = 6 + (positiveHash % 17);
  let baseViews = 4 + (positiveHash % 9);

  // Boost baseline slightly if property is Hot Deal or Prime CBD
  if (propertyData?.is_hot_deal) {
    baseSaved += 6;
    baseViews += 4;
  }
  if (propertyData?.is_cbd) {
    baseSaved += 3;
    baseViews += 2;
  }

  // 2. Extract real metrics from DB if available
  const realTotalViews =
    propertyData?.view_count ??
    propertyData?.meta_data?.view_count ??
    0;

  const realFavorites =
    propertyData?.favorite_count ??
    propertyData?.meta_data?.favorite_count ??
    0;

  // Hybrid addition: organically grows as real users view/save the property
  const organicRecentViews = Math.max(0, Math.floor(Number(realTotalViews) % 25));
  const organicSaves = Math.max(0, Number(realFavorites));

  const savedCount = baseSaved + organicSaves;
  const recentViews24h = baseViews + organicRecentViews;

  return { savedCount, recentViews24h };
}




