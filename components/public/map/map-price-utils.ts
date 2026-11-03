import { getEffectivePrice } from "@/lib/property-hardened-utils";
import { getOfficePrice } from "@/lib/property-utils";
import type { SlimMapPin } from "@/lib/services/map-pins";

export interface ResolvedPinPrice {
  displayLabel: string;
  numericValue: number;
  mode: "SALE" | "RENT" | "POA";
  hasDiscount: boolean;
  discountPercent: number;
  originalNumericValue: number;
}

/**
 * Formats compact pill labels for map markers while respecting all price variables:
 * - price / original_price (Sale)
 * - rental_price / original_rental_price (Rent)
 * - price_per_sqm / rent_price_per_sqm * size_sqm (Office Building fallback via getOfficePrice)
 * - POA fallback when 0 or null (never renders "฿0")
 */
export function resolvePinPrice(
  pin: SlimMapPin,
  activeListingFilter: string = "ALL",
  language: string = "th"
): ResolvedPinPrice {
  const effective = getEffectivePrice(pin);
  const officeInfo = getOfficePrice(pin);

  let saleVal = effective.salePrice;
  let rentVal = effective.rentalPrice;

  if (officeInfo?.isCalculated && officeInfo.totalPrice) {
    if (pin.listing_type === "RENT") {
      if (!rentVal) rentVal = officeInfo.totalPrice;
    } else if (pin.listing_type === "SALE") {
      if (!saleVal) saleVal = officeInfo.totalPrice;
    } else if (pin.listing_type === "SALE_AND_RENT") {
      if (!rentVal) rentVal = officeInfo.totalPrice;
    }
  }

  // Decide whether to show RENT or SALE on the pill based on active filter & listing_type
  const filterUpper = (activeListingFilter || "ALL").toUpperCase();
  let preferRent = false;

  if (filterUpper === "RENT") {
    preferRent = true;
  } else if (filterUpper === "SALE") {
    preferRent = false;
  } else {
    // Filter is ALL or SALE_AND_RENT:
    if (pin.listing_type === "RENT") {
      preferRent = true;
    } else if (pin.listing_type === "SALE") {
      preferRent = false;
    } else {
      // SALE_AND_RENT: prefer sale price if > 0, else rent price
      preferRent = saleVal <= 0 && rentVal > 0;
    }
  }

  if (preferRent) {
    if (rentVal > 0) {
      return {
        displayLabel: formatCompactPillAmount(rentVal, "RENT", language),
        numericValue: rentVal,
        mode: "RENT",
        hasDiscount: effective.hasRentalDiscount,
        discountPercent: effective.rentalDiscountPercent,
        originalNumericValue: effective.originalRentalPrice,
      };
    }
    if (saleVal > 0) {
      return {
        displayLabel: formatCompactPillAmount(saleVal, "SALE", language),
        numericValue: saleVal,
        mode: "SALE",
        hasDiscount: effective.hasSaleDiscount,
        discountPercent: effective.saleDiscountPercent,
        originalNumericValue: effective.originalPrice,
      };
    }
  } else {
    if (saleVal > 0) {
      return {
        displayLabel: formatCompactPillAmount(saleVal, "SALE", language),
        numericValue: saleVal,
        mode: "SALE",
        hasDiscount: effective.hasSaleDiscount,
        discountPercent: effective.saleDiscountPercent,
        originalNumericValue: effective.originalPrice,
      };
    }
    if (rentVal > 0) {
      return {
        displayLabel: formatCompactPillAmount(rentVal, "RENT", language),
        numericValue: rentVal,
        mode: "RENT",
        hasDiscount: effective.hasRentalDiscount,
        discountPercent: effective.rentalDiscountPercent,
        originalNumericValue: effective.originalRentalPrice,
      };
    }
  }

  const poaLabel =
    language === "th"
      ? "สอบถามราคา"
      : language === "cn"
        ? "询价"
        : language === "ru"
          ? "По запросу"
          : "POA";

  return {
    displayLabel: poaLabel,
    numericValue: 0,
    mode: "POA",
    hasDiscount: false,
    discountPercent: 0,
    originalNumericValue: 0,
  };
}

export function formatCompactPillAmount(
  amount: number,
  mode: "SALE" | "RENT",
  language: string = "th"
): string {
  const monthSuffix =
    mode === "RENT"
      ? language === "th"
        ? "/ด."
        : language === "cn"
          ? "/月"
          : language === "ru"
            ? "/мес"
            : "/mo"
      : "";

  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    const rounded = m >= 100 ? Math.round(m) : Number(m.toFixed(m % 1 === 0 ? 0 : 1));
    return `฿${rounded}M${monthSuffix}`;
  }

  if (amount >= 1_000) {
    const k = amount / 1_000;
    const rounded = Number(k.toFixed(k % 1 === 0 ? 0 : 1));
    return `฿${rounded}K${monthSuffix}`;
  }

  return `฿${Math.round(amount).toLocaleString()}${monthSuffix}`;
}

export function getPinProjectOrPropertyHeadline(
  pin: SlimMapPin,
  language: string = "th"
): { primaryTitle: string; secondarySubtitle: string | null; isProjectHeadline: boolean } {
  const localizedUnitTitle =
    (language === "en" && pin.title_en) ||
    (language === "cn" && pin.title_cn) ||
    (language === "ru" && pin.title_ru) ||
    pin.title ||
    "";

  const projTh = pin.projects?.name_th || pin.project_name || null;
  const projEn = pin.projects?.name_en || projTh || null;
  const projCn = pin.project_name_cn || projEn || projTh || null;
  const projRu = pin.project_name_ru || projEn || projTh || null;

  const localizedProjectName =
    language === "en"
      ? projEn
      : language === "cn"
        ? projCn
        : language === "ru"
          ? projRu
          : projTh || projEn;

  if (localizedProjectName && localizedProjectName.trim() !== "") {
    return {
      primaryTitle: localizedProjectName.trim(),
      secondarySubtitle:
        localizedUnitTitle && localizedUnitTitle.trim() !== localizedProjectName.trim()
          ? localizedUnitTitle.trim()
          : null,
      isProjectHeadline: true,
    };
  }

  const localizedArea =
    (language === "en" && pin.popular_area_en) ||
    (language === "cn" && pin.popular_area_cn) ||
    (language === "ru" && pin.popular_area_ru) ||
    pin.popular_area ||
    pin.province ||
    null;

  return {
    primaryTitle: localizedUnitTitle || "-",
    secondarySubtitle: localizedArea,
    isProjectHeadline: false,
  };
}

export const TRANSIT_LOGOS: Record<string, string> = {
  BTS: "/images/transit/BTS-Logo.svg",
  GOLD: "/images/transit/BTS-Logo.svg",
  MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
  MRT_BLUE: "/images/transit/MRT_(Bangkok)_logo.svg",
  MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
  MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
  MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
  MRT_ORANGE: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
  ARL: "/images/transit/ARLbangkok.svg",
  SRT_RED: "/images/transit/SRT_Red_Lines_icon.svg",
  SRT: "/images/transit/SRT_Red_Lines_icon.svg",
  BRT: "/images/transit/Bangkok_BRT_logo.svg",
};

export function getTransitLogo(type?: string | null): string {
  if (!type) return "/images/transit/BTS-Logo.svg";
  const upper = type.toUpperCase().trim();
  if (upper.startsWith("MRT")) {
    if (upper.includes("PURPLE")) return TRANSIT_LOGOS.MRT_PURPLE;
    if (upper.includes("YELLOW")) return TRANSIT_LOGOS.MRT_YELLOW;
    if (upper.includes("PINK")) return TRANSIT_LOGOS.MRT_PINK;
    if (upper.includes("ORANGE")) return TRANSIT_LOGOS.MRT_ORANGE;
    return TRANSIT_LOGOS.MRT;
  }
  if (upper.startsWith("BTS") || upper === "GOLD") {
    return TRANSIT_LOGOS.BTS;
  }
  if (upper.startsWith("ARL")) {
    return TRANSIT_LOGOS.ARL;
  }
  if (upper.startsWith("SRT")) {
    return TRANSIT_LOGOS.SRT_RED;
  }
  if (upper.startsWith("BRT")) {
    return TRANSIT_LOGOS.BRT;
  }
  return TRANSIT_LOGOS[upper] || "/images/transit/BTS-Logo.svg";
}

/**
 * Converts raw DB enum keys (e.g. MRT_YELLOW, MRT_PURPLE, SRT_RED, ARL)
 * into friendly Thai/English public transit labels matching official icons
 */
export function getTransitTypeLabel(
  type?: string | null,
  language: string = "th"
): string {
  if (!type) return "BTS";
  const upper = type.toUpperCase().trim();

  const labels: Record<string, { th: string; en: string; cn: string; ru: string }> = {
    BTS: { th: "BTS", en: "BTS", cn: "BTS", ru: "BTS" },
    BTS_LIGHT_GREEN: { th: "BTS สายสุขุมวิท", en: "BTS Sukhumvit Line", cn: "素坤逸线", ru: "Линия Сукхумвит" },
    BTS_DARK_GREEN: { th: "BTS สายสีลม", en: "BTS Silom Line", cn: "是隆线", ru: "Линия Силом" },
    BTS_GOLD: { th: "BTS สายสีทอง", en: "BTS Gold Line", cn: "金色线", ru: "Золотая линия" },
    GOLD: { th: "BTS สายสีทอง", en: "BTS Gold Line", cn: "金色线", ru: "Золотая линия" },
    MRT: { th: "MRT", en: "MRT", cn: "MRT", ru: "MRT" },
    MRT_BLUE: { th: "MRT สายสีน้ำเงิน", en: "MRT Blue Line", cn: "MRT 蓝线", ru: "MRT Синяя линия" },
    MRT_PURPLE: { th: "MRT สายสีม่วง", en: "MRT Purple Line", cn: "MRT 紫线", ru: "MRT Фиолетовая линия" },
    MRT_YELLOW: { th: "MRT สายสีเหลือง", en: "MRT Yellow Line", cn: "MRT 黄线", ru: "MRT Жёлтая линия" },
    MRT_PINK: { th: "MRT สายสีชมพู", en: "MRT Pink Line", cn: "MRT 粉线", ru: "MRT Розовая линия" },
    MRT_ORANGE: { th: "MRT สายสีส้ม", en: "MRT Orange Line", cn: "MRT 橙线", ru: "MRT Оранжевая линия" },
    ARL: { th: "Airport Rail Link", en: "Airport Rail Link", cn: "机场快线 (ARL)", ru: "Airport Rail Link" },
    SRT_RED: { th: "รถไฟฟ้าสายสีแดง", en: "SRT Red Line", cn: "SRT 红线", ru: "SRT Красная линия" },
    SRT: { th: "รถไฟฟ้าสายสีแดง", en: "SRT Red Line", cn: "SRT 红线", ru: "SRT Красная линия" },
    BRT: { th: "BRT", en: "BRT", cn: "BRT 快速公交", ru: "BRT" },
  };

  const match = labels[upper];
  if (match) {
    if (language === "en") return match.en;
    if (language === "cn") return match.cn;
    if (language === "ru") return match.ru;
    return match.th;
  }

  // Fallbacks for compound strings
  if (upper.includes("YELLOW")) return language === "th" ? "MRT สายสีเหลือง" : "MRT Yellow Line";
  if (upper.includes("PURPLE")) return language === "th" ? "MRT สายสีม่วง" : "MRT Purple Line";
  if (upper.includes("PINK")) return language === "th" ? "MRT สายสีชมพู" : "MRT Pink Line";
  if (upper.includes("BLUE")) return language === "th" ? "MRT สายสีน้ำเงิน" : "MRT Blue Line";
  if (upper.includes("ORANGE")) return language === "th" ? "MRT สายสีส้ม" : "MRT Orange Line";

  return upper.replace(/_/g, " ");
}

/**
 * Standard Haversine distance in meters between two GPS coordinates
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Creates a 64-vertex GeoJSON Polygon representing a circular radius area around a GPS point
 */
export function createGeoJSONCircle(
  center: [number, number],
  radiusInKm: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  const km = radiusInKm;
  const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]); // close loop

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {},
  };
}

export interface TransitTravelInfo {
  distanceMeters: number | null;
  distLabel: string;
  minutes: number | null;
  timeLabel: string;
  isWalk: boolean;
  modeLabel: string;
  summaryLabel: string;
}

/**
 * Intelligent correlation between distance and travel time.
 * - Standard realistic walking speed: ~10-12 minutes per 1,000 meters (~85-100 m/min).
 * - If time was explicitly entered by the user (e.g. 700m in 3 minutes), checks speed:
 *   speed = 700 / 3 = 233 m/min (> 110 m/min) -> motorized vehicle / motorcycle taxi (วิน/รถยนต์)!
 * - If no time is entered:
 *   <= 800m -> Walk (~90-100m/min)
 *   > 800m  -> Drive / Motorcycle taxi (~300m/min)
 */
export function computeTransitTravelInfo({
  distanceMeters,
  explicitTime,
  language = "th",
}: {
  distanceMeters?: number | null;
  explicitTime?: string | number | null;
  language?: string;
}): TransitTravelInfo {
  const dist =
    distanceMeters != null && Number(distanceMeters) > 0
      ? Math.round(Number(distanceMeters))
      : null;

  // Format distance (e.g. 700 ม. or 1.2 กม.)
  let distLabel = "";
  if (dist != null) {
    if (dist < 1000) {
      distLabel = `${dist} ${language === "th" ? "ม." : "m"}`;
    } else {
      const km = (dist / 1000).toFixed(1).replace(/\.0$/, "");
      distLabel = `${km} ${language === "th" ? "กม." : "km"}`;
    }
  }

  // Parse explicit time if provided
  let userMinutes: number | null = null;
  let hasExplicitWalkText = false;
  let hasExplicitDriveText = false;

  if (explicitTime != null) {
    const rawStr = String(explicitTime).trim();
    if (rawStr) {
      const lower = rawStr.toLowerCase();
      if (lower.includes("เดิน") || lower.includes("walk")) {
        hasExplicitWalkText = true;
      }
      if (
        lower.includes("วิน") ||
        lower.includes("รถ") ||
        lower.includes("ขับ") ||
        lower.includes("drive") ||
        lower.includes("car") ||
        lower.includes("bike") ||
        lower.includes("moto")
      ) {
        hasExplicitDriveText = true;
      }
      const numMatch = rawStr.match(/\d+(\.\d+)?/);
      if (numMatch) {
        userMinutes = Math.round(Number(numMatch[0]));
      }
    }
  }

  let isWalk = true;
  let finalMinutes: number | null = null;

  if (dist != null && dist > 0) {
    if (userMinutes != null && userMinutes > 0) {
      finalMinutes = userMinutes;
      if (hasExplicitWalkText) {
        isWalk = true;
      } else if (hasExplicitDriveText) {
        isWalk = false;
      } else {
        // Speed check: speed = meters / minute
        // Realistic human walking speed: ~80-100 m/min (~5-6 km/h)
        // If speed > 110 m/min (e.g. 700m in 3 mins = 233 m/min),
        // human cannot walk that fast -> it is motorized transit (วิน/รถยนต์)!
        const speedMetersPerMin = dist / userMinutes;
        if (dist > 1200 || speedMetersPerMin > 110) {
          isWalk = false;
        } else {
          isWalk = true;
        }
      }
    } else {
      // No user time entered: calculate realistic time based on distance
      // Walking standard: ~10-12 mins per 1km (~90 m/min)
      if (dist <= 800) {
        isWalk = true;
        finalMinutes = Math.max(1, Math.round(dist / 90));
      } else {
        isWalk = false;
        finalMinutes = Math.max(2, Math.round(dist / 300));
      }
    }
  } else if (userMinutes != null) {
    finalMinutes = userMinutes;
    isWalk = !hasExplicitDriveText;
  }

  // Format time label (e.g. 3 นาที / 8 นาที)
  let timeLabel = "";
  if (finalMinutes != null) {
    const unit =
      language === "th"
        ? "นาที"
        : language === "cn"
          ? "分钟"
          : language === "ru"
            ? "мин"
            : "min";
    timeLabel = `${finalMinutes} ${unit}`;
  }

  const modeLabel = isWalk
    ? language === "th"
      ? "เดิน"
      : language === "cn"
        ? "步行"
        : language === "ru"
          ? "Пешком"
          : "Walk"
    : language === "th"
      ? "รถ/วิน"
      : language === "cn"
        ? "乘车"
        : language === "ru"
          ? "Авто"
          : "Drive";

  let summaryLabel = "";
  if (timeLabel && distLabel) {
    summaryLabel = `${timeLabel} (${distLabel})`;
  } else if (timeLabel) {
    summaryLabel = timeLabel;
  } else if (distLabel) {
    summaryLabel = distLabel;
  }

  return {
    distanceMeters: dist,
    distLabel,
    minutes: finalMinutes,
    timeLabel,
    isWalk,
    modeLabel,
    summaryLabel,
  };
}

