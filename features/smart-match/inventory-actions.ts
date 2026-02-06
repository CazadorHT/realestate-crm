"use server";

import { createClient } from "@/lib/supabase/server";

export type InventoryCheckResult = {
  available: string[]; // List of IDs or Values that have inventory
};

// Check which office sizes have inventory
export async function checkOfficeSizeAvailability(
  purpose: "RENT" | "BUY" | "INVEST",
): Promise<{ size: string; count: number }[]> {
  const supabase = await createClient();

  // Query to count properties by size range
  // S: < 40, M: 40-70, L: 71-100, XL: > 100
  let query = supabase
    .from("properties")
    .select("size_sqm, id")
    .eq("property_type", "OFFICE_BUILDING")
    .eq("status", "ACTIVE")
    .not("size_sqm", "is", null);

  if (purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  } else {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking office inventory:", error);
    return [];
  }

  const counts = {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
  };

  data.forEach((p) => {
    const area = p.size_sqm || 0;
    if (area < 40) counts.S++;
    else if (area <= 70) counts.M++;
    else if (area <= 100) counts.L++;
    else counts.XL++;
  });

  return [
    { size: "S", count: counts.S },
    { size: "M", count: counts.M },
    { size: "L", count: counts.L },
    { size: "XL", count: counts.XL },
  ];
}

// Check which budget ranges have inventory
export async function checkBudgetAvailability(
  purpose: "RENT" | "BUY",
  options: {
    propertyType?: string;
    officeSize?: { min: number; max: number };
    budgetRanges: { id?: string; min: number; max: number }[];
  },
): Promise<string[]> {
  const supabase = await createClient();

  // Build base query
  let query = supabase
    .from("properties")
    .select(
      "price, original_price, rental_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, property_type",
    );

  // Filter by active status
  query = query.eq("status", "ACTIVE");

  if (purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  } else {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  }

  // Filter by property type
  if (options.propertyType) {
    query = query.eq("property_type", options.propertyType as any);
  }

  // Filter by area (if office size selected)
  if (options.officeSize) {
    query = query
      .gte("size_sqm", options.officeSize.min)
      .lte("size_sqm", options.officeSize.max);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error checking budget inventory:", error);
    return [];
  }

  const availableRangeIds: string[] = [];

  // Check each range against the fetched prices
  options.budgetRanges.forEach((range) => {
    const hasMatch = data.some((p: any) => {
      let price =
        purpose === "RENT"
          ? p.rental_price || p.original_rental_price
          : p.price || p.original_price;

      // Office fallback: estimate total price if missing
      if (!price && p.property_type === "OFFICE_BUILDING") {
        const sqmPrice =
          purpose === "RENT" ? p.rent_price_per_sqm : p.price_per_sqm;
        if (sqmPrice && p.size_sqm) {
          price = sqmPrice * p.size_sqm;
        }
      }

      // "Call for Price" (null or 0) acts as a wildcard
      if (price === null || price === 0) return true;
      return price >= range.min && price <= range.max;
    });

    if (hasMatch && range.id) {
      availableRangeIds.push(range.id);
    }
  });

  return availableRangeIds;
}

// Check which property types have inventory
export async function checkPropertyTypeAvailability(
  purpose: "RENT" | "BUY",
): Promise<string[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("property_type")
    .eq("status", "ACTIVE");

  if (purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  } else {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error checking type inventory:", error);
    return [];
  }

  // Return unique property types
  const types = new Set(data.map((p) => p.property_type).filter(Boolean));
  return Array.from(types) as string[];
}

// Check which locations have inventory
export async function checkLocationAvailability(
  purpose: "RENT" | "BUY",
  options: {
    propertyType?: string;
    officeSize?: { min: number; max: number };
    budget?: { min: number; max: number };
    nearTransit?: boolean;
  },
): Promise<string[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select(
      "district, popular_area, price, original_price, rental_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, property_type",
    )
    .eq("status", "ACTIVE");

  if (purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  } else {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  }

  if (options.propertyType) {
    query = query.eq("property_type", options.propertyType as any);
  }

  if (options.officeSize) {
    query = query
      .gte("size_sqm", options.officeSize.min)
      .lte("size_sqm", options.officeSize.max);
  }

  if (options.nearTransit) {
    query = query.eq("near_transit", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error checking location inventory:", error);
    return [];
  }

  // Filter by budget locally
  let filteredData = data;
  if (options.budget) {
    filteredData = data.filter((p: any) => {
      let price =
        purpose === "RENT"
          ? p.rental_price || p.original_rental_price
          : p.price || p.original_price;

      // Office fallback
      if (!price && p.property_type === "OFFICE_BUILDING") {
        const sqmPrice =
          purpose === "RENT" ? p.rent_price_per_sqm : p.price_per_sqm;
        if (sqmPrice && p.size_sqm) {
          price = sqmPrice * p.size_sqm;
        }
      }

      // "Call for Price" (null or 0) acts as a wildcard
      if (price === null || price === 0) return true;
      return (
        price >= (options.budget?.min ?? 0) &&
        price <= (options.budget?.max ?? 999999999)
      );
    });
  }

  const areas = new Set<string>();
  filteredData.forEach((p: any) => {
    if (p.district) areas.add(p.district);
    if (p.popular_area) areas.add(p.popular_area);
  });

  return Array.from(areas);
}

// Check which purposes (RENT/BUY/INVEST) have any active inventory
export async function checkPurposeAvailability(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("listing_type")
    .eq("status", "ACTIVE");

  if (error || !data) {
    console.error("Error checking purpose inventory:", error);
    return [];
  }

  const available = new Set<string>();
  data.forEach((p) => {
    if (p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") {
      available.add("RENT");
    }
    if (p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") {
      available.add("BUY");
      available.add("INVEST");
    }
  });

  return Array.from(available);
}

// Check which transit options have inventory
export async function checkTransitAvailability(
  purpose: "RENT" | "BUY",
  options: {
    propertyType?: string;
    officeSize?: { min: number; max: number };
    budget?: { min: number; max: number };
  },
): Promise<string[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select(
      "near_transit, price, original_price, rental_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, property_type",
    )
    .eq("status", "ACTIVE");

  if (purpose === "RENT") {
    query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  } else {
    query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
  }

  if (options.propertyType) {
    query = query.eq("property_type", options.propertyType as any);
  }

  if (options.officeSize) {
    query = query
      .gte("size_sqm", options.officeSize.min)
      .lte("size_sqm", options.officeSize.max);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error checking transit inventory:", error);
    return [];
  }

  // Filter by budget locally if requested
  let filteredData = data;
  if (options.budget) {
    filteredData = data.filter((p: any) => {
      let price =
        purpose === "RENT"
          ? p.rental_price || p.original_rental_price
          : p.price || p.original_price;

      // Office fallback
      if (!price && p.property_type === "OFFICE_BUILDING") {
        const sqmPrice =
          purpose === "RENT" ? p.rent_price_per_sqm : p.price_per_sqm;
        if (sqmPrice && p.size_sqm) {
          price = sqmPrice * p.size_sqm;
        }
      }

      // "Call for Price" (null or 0) acts as a wildcard
      if (price === null || price === 0) return true;
      return (
        price >= (options.budget?.min ?? 0) &&
        price <= (options.budget?.max ?? 999999999)
      );
    });
  }

  const available = new Set<string>();
  const totalCount = filteredData.length;
  const nearTransitCount = filteredData.filter(
    (p: any) => p.near_transit === true,
  ).length;

  if (nearTransitCount > 0) {
    available.add("NEAR_TRANSIT");
  }

  if (totalCount > 0 && nearTransitCount < totalCount) {
    available.add("ANY_LOCATION");
  }

  return Array.from(available);
}
