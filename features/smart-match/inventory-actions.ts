"use server";

import { createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export type InventoryCheckResult = {
  available: string[]; // List of IDs or Values that have inventory
};

export type LocationOption = {
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  name_ru?: string | null;
};

// Check which office sizes have inventory (Long-lived Edge Cache)
export const checkOfficeSizeAvailability = unstable_cache(
  async (
    purpose: "RENT" | "BUY" | "INVEST",
  ): Promise<{ size: string; count: number }[]> => {
    const supabase = createPublicClient();

    // Get active office sizes from DB to count dynamically
    const { data: sizesData } = await supabase
      .from("smart_match_office_sizes")
      .select("id, min_sqm, max_sqm")
      .eq("is_active", true);

    // Query to count properties by size range
    let query = supabase
      .from("properties")
      .select("size_sqm, id")
      .eq("property_type", "OFFICE_BUILDING")
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .not("size_sqm", "is", null);

    if (purpose === "RENT") {
      query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
    } else {
      query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("Error checking office inventory:", error);
      return [];
    }

    if (sizesData && sizesData.length > 0) {
      return sizesData.map((opt: any) => {
        const min = opt.min_sqm;
        const max = opt.max_sqm;
        const count = data.filter((p: any) => {
          const size = p.size_sqm || 0;
          return size >= min && size <= max;
        }).length;

        return { size: opt.id, count };
      });
    }

    const counts = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
    };

    data.forEach((p: { size_sqm: number | null }) => {
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
  },
  ["smart-match-office-size-availability"],
  {
    revalidate: 31536000, // 1 Year (Permanent Cache, flushed on-demand by revalidateTag)
    tags: ["properties", "smart-match-inventory", "public-data"],
  },
);

// Check which budget ranges have inventory (Long-lived Edge Cache)
export const checkBudgetAvailability = unstable_cache(
  async (
    purpose: "RENT" | "BUY",
    options: {
      propertyType?: string;
      officeSize?: { min: number; max: number };
      budgetRanges: { id?: string; min: number; max: number }[];
    },
  ): Promise<string[]> => {
    const supabase = createPublicClient();

    // Build base query
    let query = supabase
      .from("properties")
      .select(
        "price, original_price, rental_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, property_type",
      )
      .eq("status", "ACTIVE")
      .is("deleted_at", null);

    if (purpose === "RENT") {
      query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
    } else {
      query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
    }

    // Filter by property type
    if (options.propertyType) {
      query = query.eq("property_type", options.propertyType as string);
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

    options.budgetRanges.forEach((range) => {
      const hasMatch = (data as Record<string, any>[]).some((p) => {
        const p_price =
          (p.rental_price as number | null) ||
          (p.original_rental_price as number | null);
        const p_price_buy =
          (p.price as number | null) || (p.original_price as number | null);

        let price = purpose === "RENT" ? p_price : p_price_buy;

        // Office fallback: estimate total price if missing
        if (!price && p.property_type === "OFFICE_BUILDING") {
          const sqmPrice =
            purpose === "RENT"
              ? (p.rent_price_per_sqm as number | null)
              : (p.price_per_sqm as number | null);
          const size = p.size_sqm as number | null;
          if (sqmPrice && size) {
            price = sqmPrice * size;
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
  },
  ["smart-match-budget-availability"],
  {
    revalidate: 31536000, // 1 Year (Permanent Cache, flushed on-demand by revalidateTag)
    tags: ["properties", "smart-match-inventory", "public-data"],
  },
);

// Check which property types have inventory (Long-lived Edge Cache)
export const checkPropertyTypeAvailability = unstable_cache(
  async (purpose: "RENT" | "BUY"): Promise<string[]> => {
    const supabase = createPublicClient();

    let query = supabase
      .from("properties")
      .select("property_type, price, original_price, rental_price, original_rental_price")
      .eq("status", "ACTIVE")
      .is("deleted_at", null);

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
    const types = new Set<string>();
    data.forEach((p: {
      property_type: string | null;
      price?: number | null;
      original_price?: number | null;
      rental_price?: number | null;
      original_rental_price?: number | null;
    }) => {
      if (!p.property_type) return;
      types.add(p.property_type);

      // If HOUSE > 8M (or rental >= 60k) or POOL_VILLA, mark VILLA as available
      if (
        p.property_type === "POOL_VILLA" ||
        (p.property_type === "HOUSE" &&
          ((p.price && p.price >= 8000000) ||
           (p.original_price && p.original_price >= 8000000) ||
           (p.rental_price && p.rental_price >= 60000) ||
           (p.original_rental_price && p.original_rental_price >= 60000)))
      ) {
        types.add("VILLA");
      }
    });

    return Array.from(types) as string[];
  },
  ["smart-match-property-type-availability"],
  {
    revalidate: 31536000, // 1 Year (Permanent Cache, flushed on-demand by revalidateTag)
    tags: ["properties", "smart-match-inventory", "public-data"],
  },
);

// Check which locations have inventory with full translations (Long-lived Edge Cache)
export const checkLocationAvailability = unstable_cache(
  async (
    purpose: "RENT" | "BUY",
    options: {
      propertyType?: string;
      officeSize?: { min: number; max: number };
      budget?: { min: number; max: number };
      nearTransit?: boolean;
    },
  ): Promise<LocationOption[]> => {
    const supabase = createPublicClient();

    const [propsRes, popularAreasRes] = await Promise.all([
      supabase
        .from("properties")
        .select(
          "district, popular_area, popular_area_en, popular_area_cn, popular_area_ru, price, original_price, rental_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, property_type, listing_type, near_transit",
        )
        .eq("status", "ACTIVE")
        .is("deleted_at", null),
      (supabase as any)
        .from("popular_areas_v3")
        .select("name, is_active"),
    ]);

    if (propsRes.error || !propsRes.data) {
      console.error("Error checking location inventory:", propsRes.error);
      return [];
    }

    const popularAreaMap = new Map<
      string,
      { en?: string | null; cn?: string | null; ru?: string | null }
    >();
    if (popularAreasRes.data) {
      popularAreasRes.data.forEach((row: any) => {
        const nameObj = row.name;
        if (nameObj && typeof nameObj === "object") {
          const th = nameObj.th || nameObj.name_th || "";
          if (th) {
            popularAreaMap.set(th.trim().toLowerCase(), {
              en: nameObj.en || nameObj.name_en || null,
              cn: nameObj.cn || nameObj.name_cn || null,
              ru: nameObj.ru || nameObj.name_ru || null,
            });
          }
        }
      });
    }

    let filteredData = (propsRes.data || []) as Record<string, any>[];

    if (purpose === "RENT") {
      filteredData = filteredData.filter(
        (p) => p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT",
      );
    } else {
      filteredData = filteredData.filter(
        (p) => p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT",
      );
    }

    if (options.propertyType) {
      filteredData = filteredData.filter(
        (p) => p.property_type === options.propertyType,
      );
    }

    if (options.officeSize) {
      filteredData = filteredData.filter(
        (p) =>
          (p.size_sqm || 0) >= (options.officeSize?.min || 0) &&
          (p.size_sqm || 0) <= (options.officeSize?.max || 999999),
      );
    }

    if (options.nearTransit) {
      filteredData = filteredData.filter((p) => p.near_transit === true);
    }

    // Filter by budget locally
    if (options.budget) {
      filteredData = filteredData.filter((p) => {
        const p_price_rent =
          (p.rental_price as number | null) ||
          (p.original_rental_price as number | null);
        const p_price_sale =
          (p.price as number | null) || (p.original_price as number | null);

        let price = purpose === "RENT" ? p_price_rent : p_price_sale;

        // Office fallback
        if (!price && p.property_type === "OFFICE_BUILDING") {
          const sqmPrice =
            purpose === "RENT"
              ? (p.rent_price_per_sqm as number | null)
              : (p.price_per_sqm as number | null);
          const size = p.size_sqm as number | null;
          if (sqmPrice && size) {
            price = sqmPrice * size;
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

    const { getDistrictName } = await import("@/lib/utils/provinces");

    const areaMap = new Map<string, LocationOption>();
    filteredData.forEach((p: any) => {
      const popularArea = (p.popular_area as string | null)?.trim();
      if (popularArea) {
        if (!areaMap.has(popularArea)) {
          const v3Match = popularAreaMap.get(popularArea.toLowerCase());
          const cleanName = popularArea.replace(/^(เขต|อำเภอ|อ\.)/, "").trim();
          areaMap.set(popularArea, {
            name: popularArea,
            name_en:
              v3Match?.en ||
              p.popular_area_en ||
              getDistrictName(cleanName, "en") ||
              popularArea,
            name_cn:
              v3Match?.cn ||
              p.popular_area_cn ||
              getDistrictName(cleanName, "cn") ||
              popularArea,
            name_ru:
              v3Match?.ru ||
              p.popular_area_ru ||
              getDistrictName(cleanName, "ru") ||
              popularArea,
          });
        }
      } else if (p.district) {
        const district = (p.district as string).trim();
        if (district && !areaMap.has(district)) {
          const cleanDistrict = district.replace(/^(เขต|อำเภอ|อ\.)/, "").trim();
          areaMap.set(district, {
            name: district,
            name_en: getDistrictName(district, "en") || cleanDistrict,
            name_cn: getDistrictName(district, "cn") || cleanDistrict,
            name_ru: getDistrictName(district, "ru") || cleanDistrict,
          });
        }
      }
    });

    return Array.from(areaMap.values());
  },
  ["smart-match-location-availability"],
  {
    revalidate: 31536000, // 1 Year (Permanent Cache, flushed on-demand by revalidateTag)
    tags: ["properties", "smart-match-inventory", "public-data"],
  },
);

// Check which purposes (RENT/BUY/INVEST) have any active inventory (Long-lived Edge Cache)
export const checkPurposeAvailability = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("properties")
      .select("listing_type, property_type")
      .eq("status", "ACTIVE")
      .is("deleted_at", null);

    if (error || !data) {
      console.error("Error checking purpose inventory:", error);
      return [];
    }

    const available = new Set<string>();
    data.forEach(
      (p: { listing_type: string | null; property_type: string | null }) => {
        if (p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") {
          available.add("RENT");
        }
        if (p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") {
          available.add("BUY");
          available.add("INVEST");
        }
        // Explicitly add OFFICE if any Office Building is found
        if (p.property_type === "OFFICE_BUILDING") {
          available.add("OFFICE");
        }
      },
    );

    return Array.from(available);
  },
  ["smart-match-purpose-availability"],
  {
    revalidate: 31536000, // 1 Year (Permanent Cache, flushed on-demand by revalidateTag)
    tags: ["properties", "smart-match-inventory", "public-data"],
  },
);

// Check which transit options have inventory (Long-lived Edge Cache)
export const checkTransitAvailability = unstable_cache(
  async (
    purpose: "RENT" | "BUY",
    options: {
      propertyType?: string;
      officeSize?: { min: number; max: number };
      budget?: { min: number; max: number };
    },
  ): Promise<string[]> => {
    const supabase = createPublicClient();

    let query = supabase
      .from("properties")
      .select(
        "near_transit, price, original_price, rental_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, property_type",
      )
      .eq("status", "ACTIVE")
      .is("deleted_at", null);

    if (purpose === "RENT") {
      query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
    } else {
      query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
    }

    if (options.propertyType) {
      query = query.eq("property_type", options.propertyType as string);
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
    let filteredData = (data || []) as Record<string, any>[];
    if (options.budget) {
      filteredData = filteredData.filter((p) => {
        const p_price_rent =
          (p.rental_price as number | null) ||
          (p.original_rental_price as number | null);
        const p_price_sale =
          (p.price as number | null) || (p.original_price as number | null);

        let price = purpose === "RENT" ? p_price_rent : p_price_sale;

        // Office fallback
        if (!price && p.property_type === "OFFICE_BUILDING") {
          const sqmPrice =
            purpose === "RENT"
              ? (p.rent_price_per_sqm as number | null)
              : (p.price_per_sqm as number | null);
          const size = p.size_sqm as number | null;
          if (sqmPrice && size) {
            price = sqmPrice * size;
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

    if (totalCount > 0) {
      available.add("ANY_LOCATION");
    }

    return Array.from(available);
  },
  ["smart-match-transit-availability"],
  {
    revalidate: 31536000, // 1 Year (Permanent Cache, flushed on-demand by revalidateTag)
    tags: ["properties", "smart-match-inventory", "public-data"],
  },
);
