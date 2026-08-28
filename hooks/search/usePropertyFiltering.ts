import { useMemo, useCallback } from "react";
import { PropertyCardProps } from "@/components/public/PropertyCard";
import { PropertyFacets } from "@/features/properties/types/search";
import { detectSearchIntent } from "@/lib/search-config";
import { isCbdProperty } from "@/lib/property-utils";

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
  allowAirbnb: boolean;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  sort: string;
  transitStation: string;
  luxuryVilla?: boolean;
  cbd?: boolean;
}

/**
 * [Ultra S-Tier] Optimized Property Filtering Hook (Version 6.0 - Centralized)
 * Uses shared intent detection logic to ensure 100% consistency with server results.
 */
export function usePropertyFiltering(
  properties: ApiProperty[],
  options: FilteringOptions,
  serverFacets?: PropertyFacets | null
) {
  const {
    keyword, province, type, listingType, priceType, area,
    nearTrain, petFriendly, fullyFurnished, bedrooms,
    isForeigner, companyRegistered, isHotDeal, allowAirbnb,
    minPrice, maxPrice, minSize, maxSize, sort, transitStation,
    luxuryVilla, cbd,
  } = options;

  const CBD_AREAS = useMemo(() => [
    "สุขุมวิท", "สาทร", "สีลม", "ทองหล่อ", "พร้อมพงษ์", "พระราม 9",
    "เพลินจิต", "ชิดลม - เพลินจิต", "ชิดลม", "อโศก", "เอกมัย", "วิทยุ",
    "หลังสวน - ลุมพินี", "หลังสวน", "ลุมพินี", "ราชดำริ", "นานา",
    "ช่องนนทรี", "ศาลาแดง", "สุรศักดิ์", "รัชดา", "รัชดาภิเษก"
  ], []);

  // --- ⚡ Centralized Search Intent (Diamond Optimization) ---
  const searchIntent = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return null;
    const tokens = k.split(/\s+/).filter(t => t.length > 0);
    return {
      k,
      ...detectSearchIntent(tokens)
    };
  }, [keyword]);

  // Optimized match checker
  const checkMatch = useCallback((p: ApiProperty, excludeFilters: string[] = []) => {
    if (!excludeFilters.includes("keyword") && searchIntent) {
      const { 
        targetCategories, targetListing, targetBeds, 
        targetBaths, targetMinSize, targetLandSize, isSearchingPool, remainingTokens 
      } = searchIntent;

      // 1. Strict Category Enforcement
      if (targetCategories.length > 0) {
        if (targetCategories.includes("OFFICE_BUILDING") || targetCategories.includes("COMMERCIAL_BUILDING")) {
           if (p.property_type !== "OFFICE_BUILDING" && p.property_type !== "COMMERCIAL_BUILDING") return false;
        } else if (targetCategories.includes("VILLA")) {
           if (isSearchingPool) { if (p.property_type !== "POOL_VILLA") return false; }
           else { if (p.property_type !== "VILLA" && p.property_type !== "POOL_VILLA") return false; }
        } else {
           if (!targetCategories.includes(p.property_type || "")) return false;
        }
      }

      // 2. Strict Listing Enforcement
      if (targetListing) {
        if (targetListing === "SALE") {
          if (p.listing_type !== "SALE" && p.listing_type !== "SALE_AND_RENT") return false;
        } else if (targetListing === "RENT") {
          if (p.listing_type !== "RENT" && p.listing_type !== "SALE_AND_RENT") return false;
        } else if (targetListing === "SALE_AND_RENT") {
          if (p.listing_type !== "SALE_AND_RENT") return false;
        }
      }

      // 3. Number Enforcement
      if (targetBeds !== null && p.bedrooms !== targetBeds) return false;
      if (targetBaths !== null && p.bathrooms !== targetBaths) return false;
      if (targetMinSize !== null && (p.size_sqm || 0) < targetMinSize) return false;
      if (targetLandSize !== null && (p.land_size_sqwah || 0) < targetLandSize) return false;

      // 4. Remaining Text Token Match (AND logic)
      if (remainingTokens.length > 0) {
        const allMatch = remainingTokens.every(token => {
          const projNameTh = (p as any).projects?.name_th || (p as any).project_name || "";
          const projNameEn = (p as any).projects?.name_en || "";
          return p.title.toLowerCase().includes(token) || 
                 (p.title_en || "").toLowerCase().includes(token) ||
                 (p.title_cn || "").toLowerCase().includes(token) ||
                 (p.title_ru || "").toLowerCase().includes(token) ||
                 (p.description || "").toLowerCase().includes(token) || 
                 (p.description_en || "").toLowerCase().includes(token) ||
                 projNameTh.toLowerCase().includes(token) ||
                 projNameEn.toLowerCase().includes(token) ||
                 (p.popular_area || "").toLowerCase().includes(token) || 
                 (p.province || "").toLowerCase().includes(token) ||
                 (p.meta_keywords || []).some(mk => mk.toLowerCase().includes(token)) ||
                 (p.ai_summary_content || "").toLowerCase().includes(token);
        });
        if (!allMatch) return false;
      }
    }

    // 2. Base Metadata Filters (Sidebar)
    if (!excludeFilters.includes("province") && province !== "ALL" && p.province !== province) return false;
    
    if (!excludeFilters.includes("type") && type !== "ALL") {
      if (type.includes(",")) {
        if (!type.split(",").includes(p.property_type || "")) return false;
      } else {
        if (p.property_type !== type) return false;
      }
    }

    if (!excludeFilters.includes("area") && area !== "ALL" && p.popular_area !== area) return false;

    if (!excludeFilters.includes("listingType") && listingType !== "ALL") {
      if (listingType === "SALE") {
        if (p.listing_type !== "SALE" && p.listing_type !== "SALE_AND_RENT") return false;
      } else if (listingType === "RENT") {
        if (p.listing_type !== "RENT" && p.listing_type !== "SALE_AND_RENT") return false;
      } else if (listingType === "SALE_AND_RENT") {
        if (p.listing_type !== "SALE_AND_RENT") return false;
      }
    }

    if (!excludeFilters.includes("nearTrain") && nearTrain && !p.near_transit && !(p.nearby_transits && p.nearby_transits.length > 0)) return false;
    if (!excludeFilters.includes("petFriendly") && petFriendly && !p.is_pet_friendly) return false;
    if (!excludeFilters.includes("fullyFurnished") && fullyFurnished && !p.is_fully_furnished) return false;
    if (!excludeFilters.includes("isForeigner") && isForeigner && !p.is_foreigner_quota) return false;
    if (!excludeFilters.includes("companyRegistered") && companyRegistered && !p.is_tax_registered) return false;
    if (!excludeFilters.includes("isHotDeal") && isHotDeal && !p.is_hot_deal) return false;
    if (!excludeFilters.includes("allowAirbnb") && allowAirbnb && !p.allow_airbnb) return false;

    if (!excludeFilters.includes("luxuryVilla") && luxuryVilla) {
      const isVillaOrPoolVilla = (p.property_type === "VILLA" || p.property_type === "POOL_VILLA") && ((p.price || 0) > 0 || (p.rental_price || 0) > 0);
      const isLuxuryHouse = p.property_type === "HOUSE" && (p.price || 0) >= 8000000;
      if (!isVillaOrPoolVilla && !isLuxuryHouse) return false;
    }

    if (!excludeFilters.includes("cbd") && cbd) {
      if (!isCbdProperty(p)) return false;
    }

    if (!excludeFilters.includes("bedrooms") && bedrooms !== "ALL") {
      const beds = p.bedrooms || 0;
      if (bedrooms === "4+") { if (beds < 4) return false; }
      else if (beds !== parseInt(bedrooms)) return false;
    }

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

    if (!excludeFilters.includes("size")) {
      const minS = minSize ? Number(minSize) : 0;
      const maxS = maxSize ? Number(maxSize) : Infinity;
      const size = p.size_sqm || 0;
      if (size < minS || size > maxS) return false;
    }

    if (!excludeFilters.includes("transitStation") && transitStation) {
      const [stationName, stationType] = transitStation.toLowerCase().split("|");
      const station = stationName.replace(/_/g, " ");
      const hasStation = (p.nearby_transits || []).some(t => {
        const matchesName = t.station_name.toLowerCase() === station ||
          (t.station_name_en || "").toLowerCase() === station ||
          (t.station_name_cn || "").toLowerCase() === station ||
          (t.station_name_ru || "").toLowerCase() === station;
        if (!matchesName) return false;
        if (stationType) {
          return t.type.toLowerCase() === stationType;
        }
        return true;
      });
      if (!hasStation) return false;
    }

    return true;
  }, [searchIntent, province, type, listingType, priceType, area, nearTrain, petFriendly, fullyFurnished, bedrooms, isForeigner, companyRegistered, isHotDeal, allowAirbnb, luxuryVilla, cbd, CBD_AREAS, minPrice, maxPrice, minSize, maxSize, transitStation]);

  // Single-Pass Engine (O(N))
  const results = useMemo(() => {
    const filteredList: ApiProperty[] = [];
    const provinceMap = new Map<string, number>();
    const areaMap = new Map<string, { count: number; name_en?: string | null; name_cn?: string | null; name_ru?: string | null }>();
    const typeCounts: Record<string, number> = {};
    const listingTypeCounts: Record<string, number> = { ALL: 0, SALE: 0, RENT: 0, SALE_AND_RENT: 0 };
    const quickCounts = { nearTrain: 0, petFriendly: 0, fullyFurnished: 0, isForeigner: 0, companyRegistered: 0, isHotDeal: 0, allowAirbnb: 0, cbd: 0 };
    const bedroomCounts: Record<string, number> = { ALL: 0, "1": 0, "2": 0, "3": 0, "4+": 0 };
    const stationMap = new Map<string, { count: number; type: string; name_en?: string | null; name_cn?: string | null; name_ru?: string | null }>();
    const allStationsMap = new Map<string, { type: string; name_en?: string | null; name_cn?: string | null; name_ru?: string | null }>();

    properties.forEach((p) => {
      // Collect all stations unfiltered for metadata resolution
      (p.nearby_transits || []).forEach((t: any) => {
        const key = `${t.station_name}|${t.type}`;
        if (!allStationsMap.has(key)) {
          allStationsMap.set(key, {
            type: t.type,
            name_en: t.station_name_en,
            name_cn: t.station_name_cn,
            name_ru: t.station_name_ru
          });
        }
      });

      const fullMatch = checkMatch(p);
      if (fullMatch) {
        filteredList.push(p);
        
        // Extract available stations from MATCHED properties
        (p.nearby_transits || []).forEach((t: any) => {
          const key = `${t.station_name}|${t.type}`;
          const existing = stationMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            stationMap.set(key, {
              count: 1,
              type: t.type,
              name_en: t.station_name_en,
              name_cn: t.station_name_cn,
              name_ru: t.station_name_ru
            });
          }
        });
      }

      if (checkMatch(p, ["province"]) && p.province) {
        provinceMap.set(p.province, (provinceMap.get(p.province) || 0) + 1);
      }

      if (checkMatch(p, ["area"]) && p.popular_area) {
        const existing = areaMap.get(p.popular_area) || { count: 0, name_en: null as string | null, name_cn: null as string | null, name_ru: null as string | null };
        areaMap.set(p.popular_area, { 
          count: existing.count + 1, 
          name_en: p.popular_area_en || existing.name_en,
          name_cn: p.popular_area_cn || existing.name_cn,
          name_ru: p.popular_area_ru || existing.name_ru
        });
      }

      if (checkMatch(p, ["type"]) && p.property_type) {
        typeCounts[p.property_type] = (typeCounts[p.property_type] || 0) + 1;
      }

      if (checkMatch(p, ["listingType"])) {
        listingTypeCounts.ALL++;
        if (p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") listingTypeCounts.SALE++;
        if (p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") listingTypeCounts.RENT++;
        if (p.listing_type === "SALE_AND_RENT") listingTypeCounts.SALE_AND_RENT++;
      }

      if (checkMatch(p, ["nearTrain"]) && (p.near_transit || (p.nearby_transits && p.nearby_transits.length > 0))) quickCounts.nearTrain++;
      if (checkMatch(p, ["petFriendly"]) && p.is_pet_friendly) quickCounts.petFriendly++;
      if (checkMatch(p, ["cbd"]) && isCbdProperty(p)) quickCounts.cbd++;
      if (checkMatch(p, ["fullyFurnished"]) && p.is_fully_furnished) quickCounts.fullyFurnished++;
      if (checkMatch(p, ["isForeigner"]) && p.is_foreigner_quota) quickCounts.isForeigner++;
      if (checkMatch(p, ["companyRegistered"]) && p.is_tax_registered) quickCounts.companyRegistered++;
      if (checkMatch(p, ["isHotDeal"]) && p.is_hot_deal) quickCounts.isHotDeal++;
      if (checkMatch(p, ["allowAirbnb"]) && p.allow_airbnb) quickCounts.allowAirbnb++;

      if (checkMatch(p, ["bedrooms"])) {
        bedroomCounts.ALL++;
        const beds = p.bedrooms || 0;
        if (beds >= 4) bedroomCounts["4+"]++;
        else if (beds >= 1 && beds <= 3) bedroomCounts[beds.toString()]++;
      }
    });

    filteredList.sort((a, b) => {
      if (sort === "NEWEST") return (b.created_at_time || 0) - (a.created_at_time || 0);
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
      availableStations: Array.from(stationMap.entries()).map(([name, val]) => ({
        name,
        count: val.count,
        type: val.type,
        name_en: val.name_en,
        name_cn: val.name_cn,
        name_ru: val.name_ru
      })).sort((a, b) => b.count - a.count),
      allStations: Array.from(allStationsMap.entries()).map(([name, val]) => ({
        name,
        type: val.type,
        name_en: val.name_en,
        name_cn: val.name_cn,
        name_ru: val.name_ru
      })),
      availablePrices: undefined as Record<string, number> | undefined,
      availableSizes: undefined as Record<string, number> | undefined,
    };
  }, [properties, checkMatch, sort, listingType, priceType]);

  const finalFacets = useMemo(() => {
    if (!serverFacets) return results;
    const serverProvinces = Object.entries(serverFacets.availableProvinces || {}).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const serverAreas = Object.entries(serverFacets.availableAreas || {}).map(([name, val]) => ({ name, count: val.count, name_en: val.name_en, name_cn: val.name_cn, name_ru: val.name_ru })).sort((a, b) => a.name.localeCompare(b.name));
    const serverStations = Object.entries(serverFacets.availableStations || {}).map(([name, val]) => ({
      name,
      count: val.count,
      type: val.type,
      name_en: val.name_en,
      name_cn: val.name_cn,
      name_ru: val.name_ru
    })).sort((a, b) => b.count - a.count);

    // If we have active category/quick/landing filters, the local quickCounts accurately reflect this subset.
    // Use serverFacets only when no restrictive filters are applied.
    const hasActiveRestrictions = Boolean(
      petFriendly || luxuryVilla || cbd || (type && type !== "ALL") || (province && province !== "ALL") || (area && area !== "ALL") || searchIntent
    );

    return {
      ...results,
      availableProvinces: serverProvinces.length > 0 && !hasActiveRestrictions ? serverProvinces : results.availableProvinces,
      availableAreas: serverAreas.length > 0 && !hasActiveRestrictions ? serverAreas : results.availableAreas,
      availableStations: serverStations.length > 0 && !hasActiveRestrictions ? serverStations : results.availableStations,
      availableTypes: !hasActiveRestrictions && serverFacets.availableTypes ? serverFacets.availableTypes : results.availableTypes,
      availableListingTypes: !hasActiveRestrictions && serverFacets.availableListingTypes ? serverFacets.availableListingTypes : results.availableListingTypes,
      availableQuickFilters: !hasActiveRestrictions && serverFacets.availableQuickFilters
        ? {
            ...results.availableQuickFilters,
            ...serverFacets.availableQuickFilters,
          }
        : results.availableQuickFilters,
      availablePrices: serverFacets.availablePrices || undefined,
      availableSizes: serverFacets.availableSizes || undefined,
    };
  }, [results, serverFacets, petFriendly, luxuryVilla, cbd, type, province, area, searchIntent]);

  return {
    ...finalFacets,
    matchesFilters: checkMatch,
  };
}
