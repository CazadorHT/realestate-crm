import { useMemo, useCallback } from "react";
import { PropertyCardProps } from "@/components/public/PropertyCard";

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

/**
 * [S-Tier] Optimized Property Filtering Hook
 * Calculates all facets in a high-performance single pass where possible.
 */
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

  // 1. Matches Filter Logic (Hardened)
  const matchesFilters = useCallback(
    (p: ApiProperty, excludeFilters: string[] = []) => {
      if (!excludeFilters.includes("keyword") && keyword.trim()) {
        const k = keyword.toLowerCase();
        if (!(p.title.toLowerCase().includes(k) || (p.description || "").toLowerCase().includes(k) || (p.popular_area || "").toLowerCase().includes(k) || (p.province || "").toLowerCase().includes(k))) return false;
      }
      if (!excludeFilters.includes("province") && province !== "ALL" && p.province !== province) return false;
      if (!excludeFilters.includes("type") && type !== "ALL" && p.property_type !== type) return false;
      
      if (!excludeFilters.includes("listingType") && listingType !== "ALL") {
        if (listingType === "SALE") {
          if (p.listing_type !== "SALE" && p.listing_type !== "SALE_AND_RENT") return false;
        } else if (listingType === "RENT") {
          if (p.listing_type !== "RENT" && p.listing_type !== "SALE_AND_RENT") return false;
        } else if (listingType === "SALE_AND_RENT" && p.listing_type !== "SALE_AND_RENT") return false;
      }

      if (!excludeFilters.includes("area") && area !== "ALL" && p.popular_area !== area) return false;

      if (!excludeFilters.includes("nearTrain") && nearTrain) {
        const txt = (p.title + " " + (p.description || "")).toLowerCase();
        if (!(p.near_transit === true || txt.includes("bts") || txt.includes("mrt") || txt.includes("รถไฟฟ้า") || txt.includes("ใกล้สถานี"))) return false;
      }

      if (!excludeFilters.includes("petFriendly") && petFriendly && p.is_pet_friendly !== true) return false;
      if (!excludeFilters.includes("fullyFurnished") && fullyFurnished && !(p.is_fully_furnished === true || p.meta_keywords?.includes("Fully Furnished"))) return false;
      if (!excludeFilters.includes("isForeigner") && isForeigner && p.is_foreigner_quota !== true) return false;
      if (!excludeFilters.includes("companyRegistered") && companyRegistered && p.is_tax_registered !== true) return false;

      if (!excludeFilters.includes("isHotDeal") && isHotDeal) {
        const hasPriceDrop = (p.original_price && p.price && p.original_price > p.price) || (p.original_rental_price && p.rental_price && p.original_rental_price > p.rental_price);
        if (!hasPriceDrop) return false;
      }

      if (!excludeFilters.includes("bedrooms") && bedrooms !== "ALL") {
        const beds = p.bedrooms || 0;
        if (bedrooms === "4+") { if (beds < 4) return false; }
        else if (beds !== parseInt(bedrooms)) return false;
      }

      if (!excludeFilters.includes("price")) {
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        if (min > 0 || max < Infinity) {
          const price = p.price || p.original_price || 0;
          const rent = p.rental_price || p.original_rental_price || 0;
          const effectiveIntent = priceType ? priceType : listingType;
          let matchesPrice = false;
          if (effectiveIntent === "RENT") { if (rent > 0 && rent >= min && rent <= max) matchesPrice = true; }
          else if (effectiveIntent === "SALE") { if (price > 0 && price >= min && price <= max) matchesPrice = true; }
          else if ((price > 0 && price >= min && price <= max) || (rent > 0 && rent >= min && rent <= max)) matchesPrice = true;
          if (!matchesPrice) return false;
        }
      }

      if (!excludeFilters.includes("size")) {
        const minS = minSize ? parseFloat(minSize) : 0;
        const maxS = maxSize ? parseFloat(maxSize) : Infinity;
        const size = p.size_sqm || 0;
        if (size < minS || size > maxS) return false;
      }

      return true;
    },
    [keyword, province, type, listingType, priceType, area, nearTrain, petFriendly, fullyFurnished, bedrooms, isForeigner, companyRegistered, isHotDeal, minPrice, maxPrice, minSize, maxSize]
  );

  // 2. Optimized Multi-Pass Calculation
  // We use useMemo to calculate all facets in a way that minimizes re-renders
  const facets = useMemo(() => {
    const provinceMap = new Map<string, number>();
    const areaMap = new Map<string, { count: number; name_en?: string | null; name_cn?: string | null }>();
    const typeCounts: Record<string, number> = {};
    const listingTypeCounts: Record<string, number> = { ALL: 0, SALE: 0, RENT: 0, SALE_AND_RENT: 0 };
    const quickCounts = { nearTrain: 0, petFriendly: 0, fullyFurnished: 0, isForeigner: 0, companyRegistered: 0, isHotDeal: 0 };
    const bedroomCounts: Record<string, number> = { ALL: 0, "1": 0, "2": 0, "3": 0, "4+": 0 };
    const filteredList: ApiProperty[] = [];

    properties.forEach((p) => {
      const isBaseMatched = matchesFilters(p);
      if (isBaseMatched) filteredList.push(p);

      // Provinces (Exclude only province)
      if (matchesFilters(p, ["province"])) {
        if (p.province) provinceMap.set(p.province, (provinceMap.get(p.province) || 0) + 1);
      }

      // Areas (Exclude area & keyword)
      if (matchesFilters(p, ["area", "keyword"])) {
        if (p.popular_area) {
          const existing = areaMap.get(p.popular_area) || { count: 0, name_en: null, name_cn: null };
          areaMap.set(p.popular_area, {
            count: existing.count + 1,
            name_en: p.popular_area_en || existing.name_en,
            name_cn: p.popular_area_cn || existing.name_cn,
          });
        }
      }

      // Types
      if (matchesFilters(p, ["type"])) {
        if (p.property_type) typeCounts[p.property_type] = (typeCounts[p.property_type] || 0) + 1;
      }

      // Listing Types
      if (matchesFilters(p, ["listingType"])) {
        listingTypeCounts.ALL++;
        if (p.listing_type === "SALE") listingTypeCounts.SALE++;
        else if (p.listing_type === "RENT") listingTypeCounts.RENT++;
        else if (p.listing_type === "SALE_AND_RENT") {
          listingTypeCounts.SALE++; listingTypeCounts.RENT++; listingTypeCounts.SALE_AND_RENT++;
        }
      }

      // Quick Filters
      if (matchesFilters(p, ["nearTrain"])) {
        const txt = (p.title + " " + (p.description || "")).toLowerCase();
        if (p.near_transit === true || txt.includes("bts") || txt.includes("mrt") || txt.includes("รถไฟฟ้า") || txt.includes("ใกล้สถานี")) quickCounts.nearTrain++;
      }
      if (matchesFilters(p, ["petFriendly"]) && p.is_pet_friendly === true) quickCounts.petFriendly++;
      if (matchesFilters(p, ["fullyFurnished"]) && (p.is_fully_furnished === true || p.meta_keywords?.includes("Fully Furnished"))) quickCounts.fullyFurnished++;
      if (matchesFilters(p, ["isForeigner"]) && p.is_foreigner_quota === true) quickCounts.isForeigner++;
      if (matchesFilters(p, ["companyRegistered"]) && p.is_tax_registered === true) quickCounts.companyRegistered++;
      if (matchesFilters(p, ["isHotDeal"])) {
        const disc = (p.original_price && p.price && p.original_price > p.price) || (p.original_rental_price && p.rental_price && p.original_rental_price > p.rental_price);
        if (disc) quickCounts.isHotDeal++;
      }

      // Bedrooms
      if (matchesFilters(p, ["bedrooms"])) {
        bedroomCounts.ALL++;
        const beds = p.bedrooms || 0;
        if (beds >= 4) bedroomCounts["4+"]++;
        else if (beds >= 1 && beds <= 3) bedroomCounts[beds.toString()]++;
      }
    });

    // Final sorting
    const availableProvinces = Array.from(provinceMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const availableAreas = Array.from(areaMap.entries()).map(([name, val]) => ({ name, count: val.count, name_en: val.name_en, name_cn: val.name_cn })).sort((a, b) => a.name.localeCompare(b.name));

    // Client-side Sort implementation
    filteredList.sort((a, b) => {
      if (sort === "NEWEST") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "PRICE_ASC" || sort === "PRICE_DESC") {
        const getPrice = (p: ApiProperty) => {
          const pSale = p.price || p.original_price || 0;
          const pRent = p.rental_price || p.original_rental_price || 0;
          if (listingType === "RENT" || priceType === "RENT") return pRent || pSale;
          if (listingType === "SALE" || priceType === "SALE") return pSale || pRent;
          return pSale || pRent;
        };
        const pA = getPrice(a), pB = getPrice(b);
        return sort === "PRICE_ASC" ? pA - pB : pB - pA;
      }
      if (sort === "AREA_ASC" || sort === "AREA_DESC") {
        const aA = a.size_sqm || 0, aB = b.size_sqm || 0;
        return sort === "AREA_ASC" ? aA - aB : aB - aA;
      }
      return 0;
    });

    return {
      filtered: filteredList,
      availableProvinces,
      availableAreas,
      availableTypes: typeCounts,
      availableListingTypes: listingTypeCounts,
      availableQuickFilters: quickCounts,
      availableBedrooms: bedroomCounts,
    };
  }, [properties, matchesFilters, sort, listingType, priceType]);

  return {
    ...facets,
    matchesFilters,
  };
}
