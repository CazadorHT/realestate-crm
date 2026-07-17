"use client";

import { useState, useEffect, useMemo } from "react";
import { FilterBarSkeleton } from "../FilterBarSkeleton";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

import { DesktopFilters } from "./DesktopFilters";
import { MobileFilters } from "./MobileFilters";

interface SearchFilterBarProps {
  isLoading: boolean;
  keyword: string;
  setKeyword: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  listingType: string;
  setListingType: (v: string) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  minSize: string;
  setMinSize: (v: string) => void;
  maxSize: string;
  setMaxSize: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  nearTrain: boolean;
  setNearTrain: (v: boolean) => void;
  petFriendly: boolean;
  setPetFriendly: (v: boolean) => void;
  fullyFurnished: boolean;
  setFullyFurnished: (v: boolean) => void;
  isForeigner: boolean;
  setIsForeigner: (v: boolean) => void;
  companyRegistered: boolean;
  setCompanyRegistered: (v: boolean) => void;
  isHotDeal: boolean;
  setIsHotDeal: (v: boolean) => void;
  allowAirbnb: boolean;
  setAllowAirbnb: (v: boolean) => void;
  priceType?: string;
  setPriceType?: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  transitStation: string;
  setTransitStation: (v: string) => void;
  filteredLength: number;
  availableAreas: {
    name: string;
    count: number;
    name_en?: string | null;
    name_cn?: string | null;
    name_ru?: string | null;
  }[];
  province: string;
  setProvince: (v: string) => void;
  availableProvinces: { name: string; count: number }[];
  availableTypes: Record<string, number>;
  availableListingTypes: Record<string, number>;
  availableQuickFilters: Record<string, number>;
  availableBedrooms: Record<string, number>;
  availableStations: {
    name: string;
    count: number;
    type: string;
    name_en?: string | null;
    name_cn?: string | null;
    name_ru?: string | null;
  }[];
  allStations?: {
    name: string;
    type: string;
    name_en?: string | null;
    name_cn?: string | null;
    name_ru?: string | null;
  }[];
  properties?: any[];
  matchesFilters?: (p: any, excludeFilters?: string[]) => boolean;
  setBulkFilters: (updates: any) => void;
}

export function SearchFilterBar({
  isLoading,
  keyword,
  setKeyword,
  type,
  setType,
  listingType,
  setListingType,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minSize,
  setMinSize,
  maxSize,
  setMaxSize,
  sort,
  setSort,
  area,
  setArea,
  nearTrain,
  setNearTrain,
  petFriendly,
  setPetFriendly,
  fullyFurnished,
  setFullyFurnished,
  isForeigner,
  setIsForeigner,
  companyRegistered,
  setCompanyRegistered,
  isHotDeal,
  setIsHotDeal,
  allowAirbnb,
  setAllowAirbnb,
  priceType,
  setPriceType,
  bedrooms,
  setBedrooms,
  transitStation,
  setTransitStation,
  filteredLength,
  availableAreas,
  province,
  setProvince,
  availableProvinces,
  availableTypes,
  availableListingTypes,
  availableQuickFilters,
  availableBedrooms,
  availableStations,
  allStations,
  properties,
  matchesFilters,
  setBulkFilters,
}: SearchFilterBarProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAreaSection, setShowAreaSection] = useState(true);
  const [showAllProvincesMobile, setShowAllProvincesMobile] = useState(false);
  const [showAllAreasMobile, setShowAllAreasMobile] = useState(false);

  const priceOptions = useMemo(() => {
    const isEn = language === "en";
    const isCn = language === "cn";
    const isRu = language === "ru";
    const allPrices = isEn ? "All Prices" : isCn ? "所有价格" : isRu ? "Все цены" : "ทุกราคา";
    const m = isEn ? "M" : isCn ? "百万" : isRu ? "млн" : "ล้าน";
    const rentSuffix = isEn ? " (Rent)" : isCn ? " (租)" : isRu ? " (Аренда)" : " (เช่า)";
    const saleSuffix = isEn ? " (Sale)" : isCn ? " (售)" : isRu ? " (Продажа)" : " (ขาย)";
    
    const rentOptions = [
      { label: `< 15,000`, min: "0", max: "15000", type: "RENT" },
      { label: `15,000 - 50,000`, min: "15000", max: "50000", type: "RENT" },
      { label: `50,000 - 100,000`, min: "50000", max: "100000", type: "RENT" },
      { label: `100,000 - 150,000`, min: "100000", max: "150000", type: "RENT" },
      { label: `150,000 - 250,000`, min: "150000", max: "250000", type: "RENT" },
      { label: `> 250,000`, min: "250000", max: "", type: "RENT" },
    ];
    
    const saleOptions = [
      { label: `< 2 ${m}`, min: "0", max: "2000000", type: "SALE" },
      { label: `2 - 5 ${m}`, min: "2000000", max: "5000000", type: "SALE" },
      { label: `5 - 10 ${m}`, min: "5000000", max: "10000000", type: "SALE" },
      { label: `10 - 20 ${m}`, min: "10000000", max: "20000000", type: "SALE" },
      { label: `> 20 ${m}`, min: "20000000", max: "", type: "SALE" },
    ];

    if (listingType === "RENT") {
      return [{ label: allPrices, min: "", max: "" }, ...rentOptions];
    }
    
    if (listingType === "SALE") {
      return [{ label: allPrices, min: "", max: "" }, ...saleOptions];
    }

    // ALL or SALE_AND_RENT
    return [
      { label: allPrices, min: "", max: "" },
      { isGroup: true, label: isEn ? "Sale Pricing" : isCn ? "出售价格" : isRu ? "Цены продажи" : "ราคาขาย", options: saleOptions },
      { isGroup: true, label: isEn ? "Rent Pricing" : isCn ? "出租价格" : isRu ? "Цены аренды" : "ราคาเช่า", options: rentOptions },
    ];
  }, [listingType, language]);

  const flatPriceOptions = useMemo(() => {
    return priceOptions.flatMap((opt: any) => (opt.isGroup ? opt.options : [opt]));
  }, [priceOptions]);

  // Compute counts per price option
  const priceCounts = useMemo(() => {
    if (!properties || !matchesFilters) return new Map<string, number>();
    const counts = new Map<string, number>();
    const opts = flatPriceOptions.filter((o: any) => o.min !== "" || o.max !== "");
    
    properties.forEach((p: any) => {
      // Apply all filters EXCEPT price
      if (!matchesFilters(p, ["price"])) return;
      
      const salePrice = p.price || p.original_price || 0;
      const rentPrice = p.rental_price || p.original_rental_price || 0;
      
      opts.forEach((opt: any) => {
        const min = opt.min ? parseFloat(opt.min) : 0;
        const max = opt.max ? parseFloat(opt.max) : Infinity;
        const key = `${opt.min}-${opt.max}-${opt.type || "ALL"}`;
        
        let matches = false;
        if (opt.type === "RENT") {
          matches = rentPrice > 0 && rentPrice >= min && rentPrice <= max;
        } else if (opt.type === "SALE") {
          matches = salePrice > 0 && salePrice >= min && salePrice <= max;
        } else {
          matches = (salePrice > 0 && salePrice >= min && salePrice <= max) ||
                    (rentPrice > 0 && rentPrice >= min && rentPrice <= max);
        }
        
        if (matches) {
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      });
    });
    return counts;
  }, [properties, matchesFilters, flatPriceOptions]);

  const sizeOptions = useMemo(() => {
    const isEn = language === "en";
    const isCn = language === "cn";
    const isRu = language === "ru";
    const allSizes = isEn ? "All Sizes" : isCn ? "所有面积" : isRu ? "Все размеры" : "ทุกขนาด";
    const sqm = isEn ? "sqm" : isCn ? "平米" : isRu ? "м²" : "ตร.ม.";
    return [
      { label: allSizes, min: "", max: "" },
      { label: `< 30 ${sqm}`, min: "0", max: "30" },
      { label: `30 - 50 ${sqm}`, min: "30", max: "50" },
      { label: `50 - 100 ${sqm}`, min: "50", max: "100" },
      { label: `100 - 200 ${sqm}`, min: "100", max: "200" },
      { label: `> 200 ${sqm}`, min: "200", max: "" },
    ];
  }, [language]);

  // Compute counts per size option
  const sizeCounts = useMemo(() => {
    if (!properties || !matchesFilters) return new Map<string, number>();
    const counts = new Map<string, number>();
    const opts = sizeOptions.filter((o) => o.min !== "" || o.max !== "");

    properties.forEach((p: any) => {
      // Apply all filters EXCEPT size
      if (!matchesFilters(p, ["size"])) return;

      const size = p.size_sqm || 0;

      opts.forEach((opt) => {
        const min = opt.min ? parseFloat(opt.min) : 0;
        const max = opt.max ? parseFloat(opt.max) : Infinity;
        const key = `${opt.min}-${opt.max}`;

        if (size >= min && size <= max) {
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      });
    });
    return counts;
  }, [properties, matchesFilters, sizeOptions]);

  const currentPriceOption =
    flatPriceOptions.find(
      (o: any) =>
        o.min === minPrice &&
        o.max === maxPrice &&
        (!priceType || priceType === "ALL" || o.type === priceType)
    ) || flatPriceOptions[0];
  const currentSizeOption =
    sizeOptions.find(
      (o: { min: string; max: string }) => o.min === minSize && o.max === maxSize
    ) || sizeOptions[0];

  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  // Debounce keyword GTM tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== debouncedKeyword) {
        setDebouncedKeyword(keyword);
        if (keyword.trim()) {
          try {
              pushToDataLayer(GTM_EVENTS.SEARCH_KEYWORD, { 
                keyword,
                province,
                popular_area: area,
                item_category: type,
                listing_type: listingType,
                near_train: nearTrain,
                pet_friendly: petFriendly,
                fully_furnished: fullyFurnished,
                foreigner_quota: isForeigner,
                company_registered: companyRegistered,
                // Meta Pixel (Search)
                search_string: keyword,
              });
          } catch (e) {}
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [keyword, debouncedKeyword]);

  const MOBILE_ITEMS_LIMIT = 9;

  if (isLoading) return <FilterBarSkeleton />;

  const PROPERTY_TYPES = [
    { 
      value: "ALL", 
      label: language === "en" ? "All Property Types" : language === "cn" ? "所有物业类型" : language === "ru" ? "Все типы" : "ทุกประเภททรัพย์" 
    },
    { value: "HOUSE", label: t("home.property_types.house") },
    { value: "CONDO", label: t("home.property_types.condo") },
    {
      value: "OFFICE_BUILDING,COMMERCIAL_BUILDING,HOME_OFFICE",
      label: language === "en" ? "Office, Commercial & Home Office" : language === "cn" ? "写字楼、商业楼 & 家庭办公室" : language === "ru" ? "Офис, коммерция и домашний офис" : "ออฟฟิศ, อาคารพาณิชย์ & โฮมออฟฟิศ"
    },
    {
      value: "OFFICE_BUILDING",
      label: t("home.property_types.office_building"),
    },
    {
      value: "HOME_OFFICE",
      label: t("home.property_types.home_office"),
    },
    { value: "VILLA", label: t("home.property_types.villa") },
    { value: "POOL_VILLA", label: t("home.property_types.pool_villa") },
    { value: "TOWNHOME", label: t("home.property_types.townhome") },
    { value: "LAND", label: t("home.property_types.land") },
    {
      value: "COMMERCIAL_BUILDING",
      label: t("home.property_types.commercial_building"),
    },
    { value: "WAREHOUSE", label: t("home.property_types.warehouse") },
  ];

  const clearFilters = () => {
    setKeyword("");
    setType("ALL");
    setListingType("ALL");
    setMinPrice("");
    setMaxPrice("");
    setMinSize("");
    setMaxSize("");
    setSort("NEWEST");
    setArea("ALL");
    setProvince("ALL");
    setNearTrain(false);
    setPetFriendly(false);
    setFullyFurnished(false);
    setIsForeigner(false);
    setCompanyRegistered(false);
    setBedrooms("ALL");
    setTransitStation("");
    setPriceType && setPriceType("");
  };

  return (
    <div className="bg-white border-b border-slate-100 sticky top-(--nav-offset,64px) z-30 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-[top] duration-300 ease-in-out">
      <div className="max-w-screen-2xl mx-auto p-4 pb-0 sm:px-6 lg:px-8">
        <MobileFilters
          keyword={keyword}
          setKeyword={setKeyword}
          province={province}
          setProvince={setProvince}
          area={area}
          setArea={setArea}
          nearTrain={nearTrain}
          setNearTrain={setNearTrain}
          petFriendly={petFriendly}
          setPetFriendly={setPetFriendly}
          fullyFurnished={fullyFurnished}
          setFullyFurnished={setFullyFurnished}
          isForeigner={isForeigner}
          setIsForeigner={setIsForeigner}
          companyRegistered={companyRegistered}
          setCompanyRegistered={setCompanyRegistered}
          isHotDeal={isHotDeal}
          setIsHotDeal={setIsHotDeal}
          allowAirbnb={allowAirbnb}
          setAllowAirbnb={setAllowAirbnb}
          transitStation={transitStation}
          setTransitStation={setTransitStation}
          type={type}
          setType={setType}
          listingType={listingType}
          setListingType={setListingType}
          priceType={priceType}
          setPriceType={setPriceType}
          currentPriceOption={currentPriceOption}
          flatPriceOptions={flatPriceOptions}
          priceOptions={priceOptions}
          priceCounts={priceCounts}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          currentSizeOption={currentSizeOption}
          sizeOptions={sizeOptions}
          sizeCounts={sizeCounts}
          setMinSize={setMinSize}
          setMaxSize={setMaxSize}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          availableProvinces={availableProvinces}
          availableAreas={availableAreas}
          availableTypes={availableTypes}
          availableListingTypes={availableListingTypes}
          availableQuickFilters={availableQuickFilters}
          availableBedrooms={availableBedrooms}
          availableStations={availableStations}
          allStations={allStations}
          filteredLength={filteredLength}
          showAllProvincesMobile={showAllProvincesMobile}
          setShowAllProvincesMobile={setShowAllProvincesMobile}
          showAllAreasMobile={showAllAreasMobile}
          setShowAllAreasMobile={setShowAllAreasMobile}
          sort={sort}
          setSort={setSort}
          t={t}
          language={language}
          PROPERTY_TYPES={PROPERTY_TYPES}
          getProvinceName={getProvinceName}
          getLocaleValue={getLocaleValue}
          MOBILE_ITEMS_LIMIT={MOBILE_ITEMS_LIMIT}
          pushToDataLayer={pushToDataLayer}
          GTM_EVENTS={GTM_EVENTS}
          setBulkFilters={setBulkFilters}
        />

        <DesktopFilters
          keyword={keyword}
          setKeyword={setKeyword}
          province={province}
          setProvince={setProvince}
          type={type}
          setType={setType}
          listingType={listingType}
          setListingType={setListingType}
          sort={sort}
          setSort={setSort}
          currentPriceOption={currentPriceOption}
          flatPriceOptions={flatPriceOptions}
          priceOptions={priceOptions}
          priceCounts={priceCounts}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          setPriceType={setPriceType}
          currentSizeOption={currentSizeOption}
          sizeOptions={sizeOptions}
          sizeCounts={sizeCounts}
          setMinSize={setMinSize}
          setMaxSize={setMaxSize}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          nearTrain={nearTrain}
          setNearTrain={setNearTrain}
          petFriendly={petFriendly}
          setPetFriendly={setPetFriendly}
          fullyFurnished={fullyFurnished}
          setFullyFurnished={setFullyFurnished}
          isForeigner={isForeigner}
          setIsForeigner={setIsForeigner}
          companyRegistered={companyRegistered}
          setCompanyRegistered={setCompanyRegistered}
          isHotDeal={isHotDeal}
          setIsHotDeal={setIsHotDeal}
          allowAirbnb={allowAirbnb}
          setAllowAirbnb={setAllowAirbnb}
          transitStation={transitStation}
          setTransitStation={setTransitStation}
          availableBedrooms={availableBedrooms}
          availableProvinces={availableProvinces}
          availableTypes={availableTypes}
          availableListingTypes={availableListingTypes}
          availableQuickFilters={availableQuickFilters}
          availableStations={availableStations}
          allStations={allStations}
          availableAreas={availableAreas}
          area={area}
          setArea={setArea}
          showAreaSection={showAreaSection}
          setShowAreaSection={setShowAreaSection}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          clearFilters={clearFilters}
          t={t}
          language={language}
          PROPERTY_TYPES={PROPERTY_TYPES}
          getProvinceName={getProvinceName}
          getLocaleValue={getLocaleValue}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minSize={minSize}
          maxSize={maxSize}
          setBulkFilters={setBulkFilters}
        />
      </div>
    </div>
  );
}
