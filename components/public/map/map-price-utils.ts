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
