"use client";

import { useMemo, useCallback } from "react";
import { PropertyCardProps } from "@/components/public/PropertyCard";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

type ApiProperty = PropertyCardProps;

interface FilteringOptions {
  keyword: string;
  province: string;
  type: string;
  listingType: string;
  priceType: string;
  area: string;
  nearTrain: boolean;
  petFriendly: boolean;
  fullyFurnished: boolean;
  bedrooms: string;
  isForeigner: boolean;
  companyRegistered: boolean;
  isHotDeal: boolean;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  sort: string;
}

export function usePropertyFiltering(
  properties: ApiProperty[],
  options: FilteringOptions,
) {
  const {
    keyword, province, type, listingType, priceType, area,
    nearTrain, petFriendly, fullyFurnished, bedrooms,
    isForeigner, companyRegistered, isHotDeal,
    minPrice, maxPrice, minSize, maxSize, sort,
  } = options;

  const matchesFilters = useCallback(
    (p: ApiProperty, excludeFilters: string[] = []) => {
      // Keyword
      if (!excludeFilters.includes("keyword") && keyword.trim()) {
        const k = keyword.toLowerCase();
        const matchesKeyword =
          p.title.toLowerCase().includes(k) ||
          (p.description || "").toLowerCase().includes(k) ||
          (p.popular_area || "").toLowerCase().includes(k) ||
          (p.province || "").toLowerCase().includes(k);
        if (!matchesKeyword) return false;
      }

      // Province
      if (!excludeFilters.includes("province") && province !== "ALL") {
        if (p.province !== province) return false;
      }

      // Type
      if (!excludeFilters.includes("type") && type !== "ALL") {
        if (p.property_type !== type) return false;
      }

      // Listing Type
      if (!excludeFilters.includes("listingType") && listingType !== "ALL") {
        if (listingType === "SALE") {
          if (p.listing_type !== "SALE" && p.listing_type !== "SALE_AND_RENT")
            return false;
        } else if (listingType === "RENT") {
          if (p.listing_type !== "RENT" && p.listing_type !== "SALE_AND_RENT")
            return false;
        } else if (listingType === "SALE_AND_RENT") {
          if (p.listing_type !== "SALE_AND_RENT") return false;
        }
      }

      // Area
      if (!excludeFilters.includes("area") && area !== "ALL") {
        if (p.popular_area !== area) return false;
      }

      // Near Train
      if (!excludeFilters.includes("nearTrain") && nearTrain) {
        const txt = (p.title + " " + (p.description || "")).toLowerCase();
        const isNearTrain =
          p.near_transit === true ||
          txt.includes("bts") ||
          txt.includes("mrt") ||
          txt.includes("รถไฟฟ้า") ||
          txt.includes("ใกล้สถานี");
        if (!isNearTrain) return false;
      }

      // Pet Friendly
      if (!excludeFilters.includes("petFriendly") && petFriendly) {
        if (p.is_pet_friendly !== true) return false;
      }

      // Fully Furnished
      if (!excludeFilters.includes("fullyFurnished") && fullyFurnished) {
        const isFurnished =
          p.is_fully_furnished === true ||
          p.meta_keywords?.includes("Fully Furnished");
        if (!isFurnished) return false;
      }

      // Foreigner Quota
      if (!excludeFilters.includes("isForeigner") && isForeigner) {
        if (p.is_foreigner_quota !== true) return false;
      }

      // Company Registered
      if (!excludeFilters.includes("companyRegistered") && companyRegistered) {
        if (p.is_tax_registered !== true) return false;
      }

      // Hot Deal
      if (!excludeFilters.includes("isHotDeal") && isHotDeal) {
        const hasPriceDrop =
          (p.original_price && p.price && p.original_price > p.price) ||
          (p.original_rental_price &&
            p.rental_price &&
            p.original_rental_price > p.rental_price);
        if (!hasPriceDrop) return false;
      }

      // Bedrooms
      if (!excludeFilters.includes("bedrooms") && bedrooms !== "ALL") {
        const beds = p.bedrooms || 0;
        if (bedrooms === "4+") {
          if (beds < 4) return false;
        } else if (beds !== parseInt(bedrooms)) {
          return false;
        }
      }

      // Price Range Check
      if (!excludeFilters.includes("price")) {
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        if (min > 0 || max < Infinity) {
          const price = p.price || p.original_price || 0;
          const rent = p.rental_price || p.original_rental_price || 0;

          let matchesPrice = false;
          const effectiveIntent = priceType ? priceType : listingType;

          if (effectiveIntent === "RENT") {
            if (rent > 0 && rent >= min && rent <= max) matchesPrice = true;
          } else if (effectiveIntent === "SALE") {
            if (price > 0 && price >= min && price <= max) matchesPrice = true;
          } else {
            if ((price > 0 && price >= min && price <= max) || 
                (rent > 0 && rent >= min && rent <= max)) {
              matchesPrice = true;
            }
          }
          if (!matchesPrice) return false;
        }
      }

      // Size Range
      if (!excludeFilters.includes("size")) {
        const minS = minSize ? parseFloat(minSize) : 0;
        const maxS = maxSize ? parseFloat(maxSize) : Infinity;
        if (minS > 0 || maxS < Infinity) {
          const size = p.size_sqm || 0;
          if (size < minS || size > maxS) return false;
        }
      }

      return true;
    },
    [
      keyword, province, type, listingType, priceType, area, nearTrain,
      petFriendly, fullyFurnished, bedrooms, isForeigner, companyRegistered,
      isHotDeal, minPrice, maxPrice, minSize, maxSize,
    ],
  );

  const availableProvinces = useMemo(() => {
    const map = new Map<string, number>();
    properties.forEach((p) => {
      if (!matchesFilters(p, ["province"])) return;
      if (p.province) {
        map.set(p.province, (map.get(p.province) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [properties, matchesFilters]);

  const availableAreas = useMemo(() => {
    const map = new Map<
      string,
      { count: number; name_en?: string | null; name_cn?: string | null }
    >();
    properties.forEach((p) => {
      if (!matchesFilters(p, ["area", "keyword"])) return;

      if (p.popular_area) {
        const existing = map.get(p.popular_area) || {
          count: 0,
          name_en: null,
          name_cn: null,
        };
        map.set(p.popular_area, {
          count: existing.count + 1,
          name_en: p.popular_area_en || existing.name_en,
          name_cn: p.popular_area_cn || existing.name_cn,
        });
      }
    });

    return Array.from(map.entries())
      .map(([name, val]) => ({
        name,
        count: val.count,
        name_en: val.name_en,
        name_cn: val.name_cn,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties, matchesFilters]);

  const availableTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach((p) => {
      if (!matchesFilters(p, ["type"])) return;
      const t = p.property_type;
      if (t) counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [properties, matchesFilters]);

  const filtered = useMemo(() => {
    let result = properties.filter((p) => matchesFilters(p));

    // Sort
    result.sort((a, b) => {
      if (sort === "NEWEST") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sort === "PRICE_ASC" || sort === "PRICE_DESC") {
        const pA = a.price || a.rental_price || 0;
        const pB = b.price || b.rental_price || 0;
        return sort === "PRICE_ASC" ? pA - pB : pB - pA;
      }
      if (sort === "AREA_ASC" || sort === "AREA_DESC") {
        const areaA = a.size_sqm || 0;
        const areaB = b.size_sqm || 0;
        return sort === "AREA_ASC" ? areaA - areaB : areaB - areaA;
      }
      return 0;
    });

    return result;
  }, [properties, matchesFilters, sort]);

  return {
    filtered,
    availableProvinces,
    availableAreas,
    availableTypes,
    matchesFilters,
  };
}
