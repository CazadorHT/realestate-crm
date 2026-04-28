import { useMemo, useCallback } from "react";
import { PropertyCardProps } from "@/components/public/PropertyCard";
import { PropertyFacets } from "@/features/properties/types/search";

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
 * [S-Tier] Optimized Property Filtering Hook (Version 2.0 - Hardened)
 * High-performance single-pass faceting and filtering.
 */
export function usePropertyFiltering(
  properties: ApiProperty[],
  options: FilteringOptions,
  serverFacets?: PropertyFacets | null
) {
  const {
    keyword, province, type, listingType, priceType, area,
    nearTrain, petFriendly, fullyFurnished, bedrooms,
    isForeigner, companyRegistered, isHotDeal,
    minPrice, maxPrice, minSize, maxSize, sort,
  } = options;

  // Optimized match checker (Pure function)
  const checkMatch = useCallback((p: ApiProperty, excludeFilters: string[] = []) => {
    // 1. Keyword search (Multi-language & AI-ready)
    if (!excludeFilters.includes("keyword") && keyword.trim()) {
      const k = keyword.toLowerCase();
      const match = p.title.toLowerCase().includes(k) || 
                   (p.title_en || "").toLowerCase().includes(k) ||
                   (p.title_cn || "").toLowerCase().includes(k) ||
                   (p.title_ru || "").toLowerCase().includes(k) ||
                   (p.description || "").toLowerCase().includes(k) || 
                   (p.description_en || "").toLowerCase().includes(k) ||
                   (p.description_cn || "").toLowerCase().includes(k) ||
                   (p.description_ru || "").toLowerCase().includes(k) ||
                   (p.popular_area || "").toLowerCase().includes(k) || 
                   (p.province || "").toLowerCase().includes(k) ||
                   (p.ai_summary_content || "").toLowerCase().includes(k);
      if (!match) return false;
    }

    // 2. Base Metadata
    if (!excludeFilters.includes("province") && province !== "ALL" && p.province !== province) return false;
    if (!excludeFilters.includes("type") && type !== "ALL" && p.property_type !== type) return false;
    if (!excludeFilters.includes("area") && area !== "ALL" && p.popular_area !== area) return false;

    // 3. Listing Type (Hardened logic)
    if (!excludeFilters.includes("listingType") && listingType !== "ALL") {
      if (listingType === "SALE") {
        if (p.listing_type !== "SALE" && p.listing_type !== "SALE_AND_RENT") return false;
      } else if (listingType === "RENT") {
        if (p.listing_type !== "RENT" && p.listing_type !== "SALE_AND_RENT") return false;
      } else if (listingType === "SALE_AND_RENT") {
        if (p.listing_type !== "SALE_AND_RENT") return false;
      }
    }

    // 4. Boolean Features
    if (!excludeFilters.includes("nearTrain") && nearTrain && !p.near_transit) return false;
    if (!excludeFilters.includes("petFriendly") && petFriendly && !p.is_pet_friendly) return false;
    if (!excludeFilters.includes("fullyFurnished") && fullyFurnished && !p.is_fully_furnished) return false;
    if (!excludeFilters.includes("isForeigner") && isForeigner && !p.is_foreigner_quota) return false;
    if (!excludeFilters.includes("companyRegistered") && companyRegistered && !p.is_tax_registered) return false;
    if (!excludeFilters.includes("isHotDeal") && isHotDeal && !p.is_hot_deal) return false;

    // 5. Bedrooms
    if (!excludeFilters.includes("bedrooms") && bedrooms !== "ALL") {
      const beds = p.bedrooms || 0;
      if (bedrooms === "4+") { if (beds < 4) return false; }
      else if (beds !== parseInt(bedrooms)) return false;
    }

    // 6. Price (Optimized parseFloat)
    if (!excludeFilters.includes("price")) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      if (min > 0 || max < Infinity) {
        const price = p.price || p.original_price || 0;
        const rent = p.rental_price || p.original_rental_price || 0;
        const effectiveIntent = priceType || listingType;
        let matchesPrice = false;
        if (effectiveIntent === "RENT") { if (rent >= min && rent <= max) matchesPrice = true; }
        else if (effectiveIntent === "SALE") { if (price >= min && price <= max) matchesPrice = true; }
        else if ((price >= min && price <= max) || (rent >= min && rent <= max)) matchesPrice = true;
        if (!matchesPrice) return false;
      }
    }

    // 7. Size
    if (!excludeFilters.includes("size")) {
      const minS = minSize ? Number(minSize) : 0;
      const maxS = maxSize ? Number(maxSize) : Infinity;
      const size = p.size_sqm || 0;
      if (size < minS || size > maxS) return false;
    }

    return true;
  }, [keyword, province, type, listingType, priceType, area, nearTrain, petFriendly, fullyFurnished, bedrooms, isForeigner, companyRegistered, isHotDeal, minPrice, maxPrice, minSize, maxSize]);

  // Single-Pass Engine (O(N))
  const results = useMemo(() => {
    const filteredList: ApiProperty[] = [];
    const provinceMap = new Map<string, number>();
    const areaMap = new Map<string, { count: number; name_en?: string | null; name_cn?: string | null; name_ru?: string | null }>();
    const typeCounts: Record<string, number> = {};
    const listingTypeCounts: Record<string, number> = { ALL: 0, SALE: 0, RENT: 0, SALE_AND_RENT: 0 };
    const quickCounts = { nearTrain: 0, petFriendly: 0, fullyFurnished: 0, isForeigner: 0, companyRegistered: 0, isHotDeal: 0 };
    const bedroomCounts: Record<string, number> = { ALL: 0, "1": 0, "2": 0, "3": 0, "4+": 0 };

    properties.forEach((p) => {
      // Main Filter pass
      const fullMatch = checkMatch(p);
      if (fullMatch) filteredList.push(p);

      // Faceting logic (Single pass using exclusion checks where needed)
      // We only re-check specific filters if they aren't part of the core match
      
      // Province Facets
      if (checkMatch(p, ["province"]) && p.province) {
        provinceMap.set(p.province, (provinceMap.get(p.province) || 0) + 1);
      }

      // Area Facets
      if (checkMatch(p, ["area"]) && p.popular_area) {
        const existing = areaMap.get(p.popular_area) || { count: 0, name_en: null as string | null, name_cn: null as string | null, name_ru: null as string | null };
        areaMap.set(p.popular_area, { 
          count: existing.count + 1, 
          name_en: p.popular_area_en || existing.name_en,
          name_cn: p.popular_area_cn || existing.name_cn,
          name_ru: p.popular_area_ru || existing.name_ru
        });
      }

      // Type Facets
      if (checkMatch(p, ["type"]) && p.property_type) {
        typeCounts[p.property_type] = (typeCounts[p.property_type] || 0) + 1;
      }

      // Listing Type Facets
      if (checkMatch(p, ["listingType"])) {
        listingTypeCounts.ALL++;
        if (p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") listingTypeCounts.SALE++;
        if (p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") listingTypeCounts.RENT++;
        if (p.listing_type === "SALE_AND_RENT") listingTypeCounts.SALE_AND_RENT++;
      }

      // Quick Filters Facets
      if (checkMatch(p, ["nearTrain"]) && p.near_transit) quickCounts.nearTrain++;
      if (checkMatch(p, ["petFriendly"]) && p.is_pet_friendly) quickCounts.petFriendly++;
      if (checkMatch(p, ["fullyFurnished"]) && p.is_fully_furnished) quickCounts.fullyFurnished++;
      if (checkMatch(p, ["isForeigner"]) && p.is_foreigner_quota) quickCounts.isForeigner++;
      if (checkMatch(p, ["companyRegistered"]) && p.is_tax_registered) quickCounts.companyRegistered++;
      if (checkMatch(p, ["isHotDeal"]) && p.is_hot_deal) quickCounts.isHotDeal++;

      // Bedrooms
      if (checkMatch(p, ["bedrooms"])) {
        bedroomCounts.ALL++;
        const beds = p.bedrooms || 0;
        if (beds >= 4) bedroomCounts["4+"]++;
        else if (beds >= 1 && beds <= 3) bedroomCounts[beds.toString()]++;
      }
    });

    // ⚡ Hardened Sorting Implementation
    filteredList.sort((a, b) => {
      if (sort === "NEWEST") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      
      const getPrice = (p: ApiProperty) => {
        const pSale = p.price || p.original_price || 0;
        const pRent = p.rental_price || p.original_rental_price || 0;
        if (listingType === "RENT" || priceType === "RENT") return pRent || pSale;
        return pSale || pRent;
      };

      if (sort === "PRICE_ASC") return getPrice(a) - getPrice(b);
      if (sort === "PRICE_DESC") return getPrice(b) - getPrice(a);
      if (sort === "AREA_ASC") return (a.size_sqm || 0) - (b.size_sqm || 0);
      if (sort === "AREA_DESC") return (b.size_sqm || 0) - (a.size_sqm || 0);
      
      return 0;
    });

    return {
      filtered: filteredList,
      availableProvinces: Array.from(provinceMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      availableAreas: Array.from(areaMap.entries()).map(([name, val]) => ({ name, count: val.count, name_en: val.name_en, name_cn: val.name_cn, name_ru: val.name_ru })).sort((a, b) => a.name.localeCompare(b.name)),
      availableTypes: typeCounts,
      availableListingTypes: listingTypeCounts,
      availableQuickFilters: quickCounts,
      availableBedrooms: bedroomCounts,
    };
  }, [properties, checkMatch, sort, listingType, priceType]);

  // Integrated Server Facets (Hybrid logic)
  const finalFacets = useMemo(() => {
    if (!serverFacets) return results;

    // Convert Record<string, number> to Array<{name, count}> for provinces
    const serverProvinces = Object.entries(serverFacets.availableProvinces || {}).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    // Convert Areas Record to expected format
    const serverAreas = Object.entries(serverFacets.availableAreas || {}).map(([name, val]) => ({
      name,
      count: val.count,
      name_en: val.name_en,
      name_cn: val.name_cn,
      name_ru: val.name_ru
    })).sort((a, b) => a.name.localeCompare(b.name));

    return {
      ...results,
      // Use server-side accuracy for core facets
      availableProvinces: serverProvinces.length > 0 ? serverProvinces : results.availableProvinces,
      availableAreas: serverAreas.length > 0 ? serverAreas : results.availableAreas,
      availableTypes: serverFacets.availableTypes || results.availableTypes,
      availableListingTypes: serverFacets.availableListingTypes || results.availableListingTypes,
    };
  }, [results, serverFacets]);

  return {
    ...finalFacets,
    matchesFilters: checkMatch,
  };
}
