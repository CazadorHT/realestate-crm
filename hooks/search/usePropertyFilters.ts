"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function usePropertyFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters - Init from URL
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [type, setType] = useState(searchParams.get("property_type") || "ALL");
  const [listingType, setListingType] = useState(
    searchParams.get("listing_type") || "ALL",
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [priceType, setPriceType] = useState(
    searchParams.get("price_type") || "",
  );
  const [minSize, setMinSize] = useState(searchParams.get("min_size") || "");
  const [maxSize, setMaxSize] = useState(searchParams.get("max_size") || "");
  const [sort, setSort] = useState("NEWEST");
  const [transitStation, setTransitStation] = useState(searchParams.get("transit_station") || "");

  const [area, setArea] = useState(searchParams.get("popular_area") || "ALL");
  const [province, setProvince] = useState(
    searchParams.get("province") || "ALL",
  );
  const [nearTrain, setNearTrain] = useState(
    searchParams.get("near_train") === "true",
  );
  const [petFriendly, setPetFriendly] = useState(
    searchParams.get("pet_friendly") === "true",
  );
  const [fullyFurnished, setFullyFurnished] = useState(
    searchParams.get("fully_furnished") === "true",
  );
  const [bedrooms, setBedrooms] = useState(
    searchParams.get("bedrooms") || "ALL",
  );
  const [isForeigner, setIsForeigner] = useState(
    searchParams.get("foreigner") === "true",
  );
  const [companyRegistered, setCompanyRegistered] = useState(
    searchParams.get("company_registered") === "true",
  );
  const [isHotDeal, setIsHotDeal] = useState(
    searchParams.get("hot_deal") === "true",
  );

  // --- Agentic AI State ---
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- ⚡ Performance: Keyword Debouncing (Diamond Optimization) ---
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Update state when params change (for back/forward navigation)
  useEffect(() => {
    console.log("usePropertyFilters [searchParams change]:", {
      keyword: searchParams.get("keyword"),
      property_type: searchParams.get("property_type"),
      listing_type: searchParams.get("listing_type"),
      transit_station: searchParams.get("transit_station"),
    });
    setKeyword(searchParams.get("keyword") || "");
    setType(searchParams.get("property_type") || "ALL");
    setListingType(searchParams.get("listing_type") || "ALL");
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setPriceType(searchParams.get("price_type") || "");
    setMinSize(searchParams.get("min_size") || "");
    setMaxSize(searchParams.get("max_size") || "");
    setArea(searchParams.get("popular_area") || "ALL");
    setProvince(searchParams.get("province") || "ALL");
    setNearTrain(searchParams.get("near_train") === "true");
    setPetFriendly(searchParams.get("pet_friendly") === "true");
    setFullyFurnished(searchParams.get("fully_furnished") === "true");
    setIsForeigner(searchParams.get("foreigner") === "true");
    setCompanyRegistered(searchParams.get("company_registered") === "true");
    setIsHotDeal(searchParams.get("hot_deal") === "true");
    setBedrooms(searchParams.get("bedrooms") || "ALL");
    setTransitStation(searchParams.get("transit_station") || "");
    
    // Clear AI insight on manual navigation change
    setAiInsight(null);
  }, [searchParams]);
 
  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (keyword) params.set("keyword", keyword); else params.delete("keyword");
    if (type !== "ALL") params.set("property_type", type); else params.delete("property_type");
    if (listingType !== "ALL") params.set("listing_type", listingType); else params.delete("listing_type");
    if (minPrice) params.set("min_price", minPrice); else params.delete("min_price");
    if (maxPrice) params.set("max_price", maxPrice); else params.delete("max_price");
    if (area !== "ALL") params.set("popular_area", area); else params.delete("popular_area");
    if (province !== "ALL") params.set("province", province); else params.delete("province");
    if (nearTrain) params.set("near_train", "true"); else params.delete("near_train");
    if (petFriendly) params.set("pet_friendly", "true"); else params.delete("pet_friendly");
    if (fullyFurnished) params.set("fully_furnished", "true"); else params.delete("fully_furnished");
    if (bedrooms !== "ALL") params.set("bedrooms", bedrooms); else params.delete("bedrooms");
    if (isForeigner) params.set("foreigner", "true"); else params.delete("foreigner");
    if (companyRegistered) params.set("company_registered", "true"); else params.delete("company_registered");
    if (isHotDeal) params.set("hot_deal", "true"); else params.delete("hot_deal");
    if (transitStation) params.set("transit_station", transitStation); else params.delete("transit_station");
    if (minSize) params.set("min_size", minSize); else params.delete("min_size");
    if (maxSize) params.set("max_size", maxSize); else params.delete("max_size");
    if (priceType && (minPrice || maxPrice)) params.set("price_type", priceType); else params.delete("price_type");
 
    const query = params.toString();
    const url = `/properties${query ? `?${query}` : ""}`;
    console.log("usePropertyFilters [Sync state to URL]:", url);
    router.replace(url, { scroll: false });
  }, [
    keyword, type, listingType, priceType, minPrice, maxPrice, area, province,
    nearTrain, petFriendly, fullyFurnished, bedrooms, isForeigner,
    companyRegistered, isHotDeal, minSize, maxSize, transitStation,
  ]);

  const clearFilters = useCallback(() => {
    setKeyword("");
    setType("ALL");
    setListingType("ALL");
    setMinPrice("");
    setMaxPrice("");
    setPriceType("");
    setMinSize("");
    setMaxSize("");
    setArea("ALL");
    setProvince("ALL");
    setNearTrain(false);
    setPetFriendly(false);
    setFullyFurnished(false);
    setBedrooms("ALL");
    setIsForeigner(false);
    setCompanyRegistered(false);
    setIsHotDeal(false);
    setTransitStation("");
    setAiInsight(null);
  }, []);

  /**
   * [S-Tier] Bulk Filter Update
   * Allows the AI Agent to set multiple filters in one pass.
   */
  const setBulkFilters = useCallback((updates: any) => {
    if (updates.keyword !== undefined) setKeyword(updates.keyword);
    if (updates.propertyType !== undefined) setType(updates.propertyType);
    if (updates.listingType !== undefined) setListingType(updates.listingType);
    if (updates.minPrice !== undefined) setMinPrice(updates.minPrice?.toString() || "");
    if (updates.maxPrice !== undefined) setMaxPrice(updates.maxPrice?.toString() || "");
    if (updates.area !== undefined) setArea(updates.area);
    if (updates.province !== undefined) setProvince(updates.province);
    if (updates.nearTrain !== undefined) setNearTrain(updates.nearTrain);
    if (updates.petFriendly !== undefined) setPetFriendly(updates.petFriendly);
    if (updates.fullyFurnished !== undefined) setFullyFurnished(updates.fullyFurnished);
    if (updates.bedrooms !== undefined) setBedrooms(updates.bedrooms);
    if (updates.isHotDeal !== undefined) setIsHotDeal(updates.isHotDeal);
    if (updates.transitStation !== undefined) setTransitStation(updates.transitStation);
    if (updates.aiInsight !== undefined) setAiInsight(updates.aiInsight);
  }, []);

  return {
    keyword, setKeyword,
    debouncedKeyword,
    type, setType,
    listingType, setListingType,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    priceType, setPriceType,
    minSize, setMinSize,
    maxSize, setMaxSize,
    sort, setSort,
    area, setArea,
    province, setProvince,
    nearTrain, setNearTrain,
    petFriendly, setPetFriendly,
    fullyFurnished, setFullyFurnished,
    bedrooms, setBedrooms,
    isForeigner, setIsForeigner,
    companyRegistered, setCompanyRegistered,
    isHotDeal, setIsHotDeal,
    transitStation, setTransitStation,
    aiInsight, setAiInsight,
    clearFilters,
    setBulkFilters,
  };
}
