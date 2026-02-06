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

/**
 * Get display label for property type
 */
export function getTypeLabel(propertyType: string | null): string {
  if (!propertyType) return "อื่นๆ";
  return PROPERTY_TYPE_LABELS[propertyType] ?? "อื่นๆ";
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
 * Format price with currency
 */
export const PRICE_FORMATTER = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

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
    priceLabel: isRent ? "/เดือน" : "",
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
