"use client";

import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  DialogClose,
} from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Building,
  Tag,
  DollarSign,
  BedDouble,
  Sparkles,
  MapPin,
  Activity,
  Layers,
  X,
} from "lucide-react";
import {
  LISTING_TYPE_ORDER,
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_ORDER,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_ORDER,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  PropertyType,
} from "@/features/properties/labels";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getProvinceName, getDistrictName } from "@/lib/utils/provinces";

interface Filters {
  q: string;
  listing: string;
  bedrooms: string;
  bathrooms: string;
  minPrice: string;
  maxPrice: string;
  province: string;
  district: string;
  popular_area: string;
  status: string;
  type: string;
  sortBy: string;
  sortOrder: string;
  nearTransit: string;
  petFriendly: string;
  fullyFurnished: string;
  needsAiReview: string;
}

interface AdvancedFiltersProps {
  id?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  filters: Filters;
  setFilters: (filters: any) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  activeFilterCount: number;
  totalCount: number;
  filterMetadata?: any[];
}

export function AdvancedFilters({
  id,
  open,
  setOpen,
  filters,
  setFilters,
  applyFilters,
  clearFilters,
  activeFilterCount,
  totalCount,
  filterMetadata = [],
}: AdvancedFiltersProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [priceMode, setPriceMode] = useState<"SALE" | "RENT">("SALE");
  const ITEMS_LIMIT = 8;

  // Metadata Extraction & Pre-aggregations
  const {
    typeCounts,
    statusCounts,
    listingCounts,
    availableProvinces,
    availableAreas,
    salePriceCounts,
    rentPriceCounts,
    bedroomCounts,
    bathroomCounts,
    amenityCounts,
  } = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const listingCounts: Record<string, number> = {
      SALE: 0,
      RENT: 0,
      SALE_AND_RENT: 0,
    };
    const provincesMap = new Map<string, number>();
    const areasMap = new Map<string, number>();

    const salePriceCounts = [0, 0, 0, 0];
    const rentPriceCounts = [0, 0, 0, 0];
    const bedroomCounts: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
    };
    const bathroomCounts: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
    };
    const amenityCounts = {
      nearTransit: 0,
      petFriendly: 0,
      fullyFurnished: 0,
      needsAiReview: 0,
    };

    filterMetadata.forEach((p: any) => {
      // Robust property type handling
      const pType = (p.property_type || p.type) as string;
      if (pType) {
        typeCounts[pType] = (typeCounts[pType] || 0) + 1;
      }

      if (p.status) {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      }

      if (p.listing_type && listingCounts[p.listing_type] !== undefined) {
        listingCounts[p.listing_type]++;
      }

      if (p.province) {
        provincesMap.set(p.province, (provincesMap.get(p.province) || 0) + 1);
      }

      if (p.popular_area && p.popular_area.trim() !== "") {
        const cleanArea = p.popular_area.trim();
        areasMap.set(cleanArea, (areasMap.get(cleanArea) || 0) + 1);
      }

      // Price ranges
      const sPrice = Number(p.price || p.original_price || 0);
      if (sPrice > 0) {
        if (sPrice <= 3000000) salePriceCounts[0]++;
        else if (sPrice <= 7000000) salePriceCounts[1]++;
        else if (sPrice <= 15000000) salePriceCounts[2]++;
        else salePriceCounts[3]++;
      }

      const rPrice = Number(p.rental_price || p.original_rental_price || 0);
      if (rPrice > 0) {
        if (rPrice <= 15000) rentPriceCounts[0]++;
        else if (rPrice <= 50000) rentPriceCounts[1]++;
        else if (rPrice <= 150000) rentPriceCounts[2]++;
        else rentPriceCounts[3]++;
      }

      if (p.bedrooms) {
        const b = Number(p.bedrooms);
        if (b >= 4) bedroomCounts["4"]++;
        else if (b > 0) bedroomCounts[String(b)] = (bedroomCounts[String(b)] || 0) + 1;
      }

      if (p.bathrooms) {
        const b = Number(p.bathrooms);
        if (b >= 4) bathroomCounts["4"]++;
        else if (b > 0) bathroomCounts[String(b)] = (bathroomCounts[String(b)] || 0) + 1;
      }

      // Special features normalization
      if (p.is_pet_friendly) amenityCounts.petFriendly++;
      if (p.is_fully_furnished) amenityCounts.fullyFurnished++;
      if (p.near_transit || p.transit_station_name) amenityCounts.nearTransit++;
      if (p.requires_ai_review || p.needs_ai_review) amenityCounts.needsAiReview++;
    });

    return {
      typeCounts,
      statusCounts,
      listingCounts,
      availableProvinces: Array.from(provincesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
          const nameA = getProvinceName(a.name, isEn ? "en" : "th");
          const nameB = getProvinceName(b.name, isEn ? "en" : "th");
          return nameA.localeCompare(nameB, isEn ? "en" : "th", { sensitivity: "base" });
        }),
      availableAreas: Array.from(areasMap.entries())
        .filter(([name]) => Boolean(name && name.trim() !== ""))
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
          const nameA = getDistrictName(a.name, isEn ? "en" : "th");
          const nameB = getDistrictName(b.name, isEn ? "en" : "th");
          return nameA.localeCompare(nameB, isEn ? "en" : "th", { sensitivity: "base" });
        }),
      salePriceCounts,
      rentPriceCounts,
      bedroomCounts,
      bathroomCounts,
      amenityCounts,
    };
  }, [filterMetadata, isEn]);

  // Live filter count calculation mirroring actual search query logic
  const liveFilteredCount = useMemo(() => {
    if (!filterMetadata || filterMetadata.length === 0) return 0;
    return filterMetadata.filter((p: any) => {
      // 1. Status
      if (filters.status !== "ALL" && p.status !== filters.status) return false;

      // 2. Property Type
      const pType = (p.property_type || p.type) as string;
      if (filters.type !== "ALL" && pType !== filters.type) return false;

      // 3. Listing Type
      if (filters.listing !== "ALL") {
        if (
          filters.listing === "SALE" &&
          p.listing_type !== "SALE" &&
          p.listing_type !== "SALE_AND_RENT"
        )
          return false;
        if (
          filters.listing === "RENT" &&
          p.listing_type !== "RENT" &&
          p.listing_type !== "SALE_AND_RENT"
        )
          return false;
        if (
          filters.listing === "SALE_AND_RENT" &&
          p.listing_type !== "SALE_AND_RENT"
        )
          return false;
      }

      // 4. Location
      if (filters.province && p.province !== filters.province) return false;
      if (filters.district && p.district !== filters.district) return false;
      if (filters.popular_area && p.popular_area !== filters.popular_area)
        return false;

      // 5. Bedrooms
      if (filters.bedrooms) {
        const b = Number(p.bedrooms || 0);
        if (filters.bedrooms === "4+" && b < 4) return false;
        else if (filters.bedrooms !== "4+" && b !== Number(filters.bedrooms))
          return false;
      }

      // 6. Bathrooms
      if (filters.bathrooms) {
        const b = Number(p.bathrooms || 0);
        if (filters.bathrooms === "4+" && b < 4) return false;
        else if (filters.bathrooms !== "4+" && b !== Number(filters.bathrooms))
          return false;
      }

      // 7. Special features
      if (filters.petFriendly === "true" && !p.is_pet_friendly) return false;
      if (filters.fullyFurnished === "true" && !p.is_fully_furnished)
        return false;
      if (
        filters.nearTransit === "true" &&
        !p.near_transit &&
        !p.transit_station_name
      )
        return false;
      if (
        filters.needsAiReview === "true" &&
        !p.requires_ai_review &&
        !p.needs_ai_review
      )
        return false;

      // 8. Price Range
      const checkPrice =
        filters.listing === "RENT"
          ? Number(p.rental_price || p.original_rental_price || 0)
          : Number(p.price || p.original_price || 0);

      if (filters.minPrice) {
        const min = Number(filters.minPrice);
        if (!checkPrice || checkPrice < min) return false;
      }
      if (filters.maxPrice) {
        const max = Number(filters.maxPrice);
        if (!checkPrice || checkPrice > max) return false;
      }

      return true;
    }).length;
  }, [filterMetadata, filters]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEn ? "Advanced Filters" : "ตัวกรองขั้นสูง"}
      description={
        isEn
          ? "Customize your search criteria to find the right properties"
          : "ปรับแต่งเงื่อนไขการค้นหาทรัพย์ตามความต้องการของคุณ"
      }
      trigger={
        <Button
          id={id}
          variant={activeFilterCount > 0 ? "default" : "outline"}
          className="hover:bg-blue-500! hover:text-white cursor-pointer font-medium"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {isEn ? "Filters" : "ตัวกรอง"}
          {activeFilterCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary-foreground text-primary rounded-full text-[10px] font-bold leading-none min-w-[18px] h-[18px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      }
      footer={
        <div className="grid grid-cols-2 gap-3 w-full">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-12 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1.5" />
              {isEn ? "Clear All" : "ล้างทั้งหมด"}
            </Button>
          </DialogClose>
          <Button
            className="h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 cursor-pointer"
            onClick={applyFilters}
          >
            <Check className="h-4 w-4 mr-1.5" />
            {isEn
              ? `Show ${liveFilteredCount} Listings`
              : `แสดง ${liveFilteredCount} รายการ`}
          </Button>
        </div>
      }
    >
      <div className="flex-1 h-[calc(85vh-200px)] overflow-y-auto px-1 py-1 space-y-4">
        <Accordion
          type="multiple"
          defaultValue={[
            "listing",
            "type",
            "price",
            "rooms",
            "special",
            "location",
          ]}
          className="w-full space-y-3.5"
        >
          {/* 1. รูปแบบรายการ (Listing Type: Sale / Rent) */}
          <AccordionItem
            value="listing"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Listing Type" : "รูปแบบรายการ"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() =>
                    setFilters((prev: any) => ({ ...prev, listing: "ALL" }))
                  }
                  className={`flex flex-col items-start justify-between p-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                    filters.listing === "ALL"
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs mb-1">
                    {isEn ? "All Listings" : "ทั้งหมด"}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      filters.listing === "ALL"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {filterMetadata.length}
                  </span>
                </button>
                {LISTING_TYPE_ORDER.map((t) => {
                  const count =
                    t === "SALE"
                      ? listingCounts.SALE + listingCounts.SALE_AND_RENT
                      : t === "RENT"
                        ? listingCounts.RENT + listingCounts.SALE_AND_RENT
                        : listingCounts[t];
                  const isActive = filters.listing === t;
                  const isDisabled = count === 0 && !isActive;
                  return (
                    <button
                      key={t}
                      disabled={isDisabled}
                      onClick={() =>
                        !isDisabled &&
                        setFilters((prev: any) => ({
                          ...prev,
                          listing: t,
                          // Auto clear irrelevant price when switching mode
                          minPrice: "",
                          maxPrice: "",
                        }))
                      }
                      className={`flex flex-col items-start justify-between p-3 rounded-xl border-2 transition-all font-bold text-xs ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                          : isDisabled
                            ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <span className="text-xs mb-1">
                        {isEn
                          ? LISTING_TYPE_LABELS[t].en
                          : LISTING_TYPE_LABELS[t].th}
                      </span>
                      <div className="flex items-center gap-1">
                        {count > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isDisabled
                                ? "bg-slate-200/60 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. ประเภททรัพย์ (Property Type) */}
          <AccordionItem
            value="type"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Property Type" : "ประเภททรัพย์"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    setFilters((prev: any) => ({ ...prev, type: "ALL" }))
                  }
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                    filters.type === "ALL"
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>{isEn ? "All Types" : "ทุกประเภท"}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      filters.type === "ALL"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {filterMetadata.length}
                  </span>
                </button>
                {PROPERTY_TYPE_ORDER.map((t) => {
                  const count = typeCounts[t] || 0;
                  const isActive = filters.type === t;
                  const isDisabled = count === 0 && !isActive;
                  const Icon = PROPERTY_TYPE_ICONS[t as PropertyType] || Building;
                  return (
                    <button
                      key={t}
                      disabled={isDisabled}
                      onClick={() =>
                        !isDisabled &&
                        setFilters((prev: any) => ({
                          ...prev,
                          type: isActive ? "ALL" : t,
                        }))
                      }
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all font-bold text-xs ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                          : isDisabled
                            ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-1">
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        <span className="truncate">
                          {isEn
                            ? PROPERTY_TYPE_LABELS[t].en
                            : PROPERTY_TYPE_LABELS[t].th}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {count > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isDisabled
                                ? "bg-slate-200/60 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. ช่วงราคา (Price Range) */}
          <AccordionItem
            id="tour-filter-price"
            value="price"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Price Range" : "ช่วงราคา"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {/* If listing is ALL, show tab selector for Sale vs Rent price presets */}
              {filters.listing === "ALL" && (
                <div className="flex p-1 bg-slate-100 rounded-xl max-w-xs mb-2">
                  <button
                    onClick={() => setPriceMode("SALE")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      priceMode === "SALE"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {isEn ? "Sale Price" : "ราคาขาย"}
                  </button>
                  <button
                    onClick={() => setPriceMode("RENT")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      priceMode === "RENT"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {isEn ? "Rent Price" : "ราคาเช่า"}
                  </button>
                </div>
              )}

              {/* Presets */}
              {(filters.listing === "SALE" ||
                (filters.listing === "ALL" && priceMode === "SALE")) && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {isEn
                      ? "Sale Price Presets (THB)"
                      : "ช่วงราคาขายด่วน (บาท)"}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { min: "0", max: "3000000", label: isEn ? "< 3M" : "< 3 ล้าน" },
                      {
                        min: "3000000",
                        max: "7000000",
                        label: isEn ? "3 - 7M" : "3 - 7 ล้าน",
                      },
                      {
                        min: "7000000",
                        max: "15000000",
                        label: isEn ? "7 - 15M" : "7 - 15 ล้าน",
                      },
                      {
                        min: "15000000",
                        max: "",
                        label: isEn ? "> 15M" : "> 15 ล้าน",
                      },
                    ].map((preset, idx) => {
                      const count = salePriceCounts[idx] || 0;
                      const isActive =
                        filters.minPrice === preset.min &&
                        filters.maxPrice === preset.max;
                      const isDisabled = count === 0 && !isActive;
                      return (
                        <button
                          key={preset.label}
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
                            if (isActive) {
                              setFilters((prev: any) => ({
                                ...prev,
                                minPrice: "",
                                maxPrice: "",
                              }));
                            } else {
                              setFilters((prev: any) => ({
                                ...prev,
                                minPrice: preset.min,
                                maxPrice: preset.max,
                              }));
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition-all font-bold text-xs ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                              : isDisabled
                                ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <span>{preset.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : isDisabled
                                  ? "bg-slate-200/60 text-slate-400"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(filters.listing === "RENT" ||
                (filters.listing === "ALL" && priceMode === "RENT")) && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {isEn
                      ? "Rent Price Presets (THB / mo)"
                      : "ช่วงราคาเช่าด่วน (บาท / เดือน)"}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { min: "0", max: "15000", label: "< 15,000" },
                      {
                        min: "15000",
                        max: "50000",
                        label: isEn ? "15K - 50K" : "1.5 - 5 หมื่น",
                      },
                      {
                        min: "50000",
                        max: "150000",
                        label: isEn ? "50K - 150K" : "5 หมื่น - 1.5 แสน",
                      },
                      {
                        min: "150000",
                        max: "",
                        label: isEn ? "> 150K" : "> 1.5 แสน",
                      },
                    ].map((preset, idx) => {
                      const count = rentPriceCounts[idx] || 0;
                      const isActive =
                        filters.minPrice === preset.min &&
                        filters.maxPrice === preset.max;
                      const isDisabled = count === 0 && !isActive;
                      return (
                        <button
                          key={preset.label}
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
                            if (isActive) {
                              setFilters((prev: any) => ({
                                ...prev,
                                minPrice: "",
                                maxPrice: "",
                              }));
                            } else {
                              setFilters((prev: any) => ({
                                ...prev,
                                minPrice: preset.min,
                                maxPrice: preset.max,
                              }));
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition-all font-bold text-xs ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                              : isDisabled
                                ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <span>{preset.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : isDisabled
                                  ? "bg-slate-200/60 text-slate-400"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Min / Max Price Inputs */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Custom Price Range (THB)" : "ระบุช่วงราคาเอง (บาท)"}
                </span>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {isEn ? "Min Price" : "ราคาต่ำสุด"}
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) =>
                        setFilters((prev: any) => ({
                          ...prev,
                          minPrice: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {isEn ? "Max Price" : "ราคาสูงสุด"}
                    </label>
                    <Input
                      type="number"
                      placeholder={isEn ? "No max" : "ไม่จำกัด"}
                      value={filters.maxPrice}
                      onChange={(e) =>
                        setFilters((prev: any) => ({
                          ...prev,
                          maxPrice: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. จำนวนห้องนอน & ห้องน้ำ (Bedrooms & Bathrooms) */}
          <AccordionItem
            value="rooms"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Bedrooms & Bathrooms" : "จำนวนห้องนอน & ห้องน้ำ"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {/* Bedrooms */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Bedrooms" : "ห้องนอน"}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({
                        ...prev,
                        bedrooms: "",
                      }))
                    }
                    className={`flex items-center justify-between h-9 min-w-20 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 cursor-pointer ${
                      !filters.bedrooms
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isEn ? "All" : "ทั้งหมด"}</span>
                  </button>
                  {["1", "2", "3", "4+"].map((val) => {
                    const countKey = val === "4+" ? "4" : val;
                    const count = bedroomCounts[countKey] || 0;
                    const isActive = filters.bedrooms === val;
                    const isDisabled = count === 0 && !isActive;
                    return (
                      <button
                        key={val}
                        disabled={isDisabled}
                        onClick={() =>
                          !isDisabled &&
                          setFilters((prev: any) => ({
                            ...prev,
                            bedrooms: isActive ? "" : val,
                          }))
                        }
                        className={`flex items-center justify-between h-9 min-w-16 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                            : isDisabled
                              ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <span className="mr-1.5">{val}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-md font-semibold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isDisabled
                                ? "bg-slate-200/60 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Bathrooms" : "ห้องน้ำ"}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({
                        ...prev,
                        bathrooms: "",
                      }))
                    }
                    className={`flex items-center justify-between h-9 min-w-20 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 cursor-pointer ${
                      !filters.bathrooms
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isEn ? "All" : "ทั้งหมด"}</span>
                  </button>
                  {["1", "2", "3", "4+"].map((val) => {
                    const countKey = val === "4+" ? "4" : val;
                    const count = bathroomCounts[countKey] || 0;
                    const isActive = filters.bathrooms === val;
                    const isDisabled = count === 0 && !isActive;
                    return (
                      <button
                        key={val}
                        disabled={isDisabled}
                        onClick={() =>
                          !isDisabled &&
                          setFilters((prev: any) => ({
                            ...prev,
                            bathrooms: isActive ? "" : val,
                          }))
                        }
                        className={`flex items-center justify-between h-9 min-w-16 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                            : isDisabled
                              ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <span className="mr-1.5">{val}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-md font-semibold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isDisabled
                                ? "bg-slate-200/60 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. ความต้องการพิเศษ (Special Features & Amenities) */}
          <AccordionItem
            value="special"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Special Features" : "ความต้องการพิเศษ"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "nearTransit",
                    label: isEn ? "Near BTS / MRT" : "ใกล้รถไฟฟ้า",
                    icon: "🚈",
                    desc: isEn ? "Within walking distance to transit" : "ใกล้สถานีรถไฟฟ้าเดินทางสะดวก",
                    count: amenityCounts.nearTransit,
                  },
                  {
                    id: "petFriendly",
                    label: isEn ? "Pet Friendly" : "เลี้ยงสัตว์ได้",
                    icon: "🐾",
                    desc: isEn ? "Allows dogs, cats & pets" : "อนุญาตให้เลี้ยงสัตว์เลี้ยงได้",
                    count: amenityCounts.petFriendly,
                  },
                  {
                    id: "fullyFurnished",
                    label: isEn ? "Fully Furnished" : "ตกแต่งครบ",
                    icon: "🛋️",
                    desc: isEn ? "Move-in ready with furniture" : "พร้อมเข้าอยู่ เฟอร์นิเจอร์ครบชุด",
                    count: amenityCounts.fullyFurnished,
                  },
                  {
                    id: "needsAiReview",
                    label: isEn ? "✨ AI Review Drafts" : "✨ ตรวจร่าง AI",
                    icon: "🤖",
                    desc: isEn ? "Listings auto-drafted by AI" : "รายการที่ AI ช่วยสรุปเนื้อหา",
                    count: amenityCounts.needsAiReview,
                  },
                ].map((item) => {
                  const isActive =
                    filters[item.id as keyof Filters] === "true";
                  const isDisabled = item.count === 0 && !isActive;
                  return (
                    <button
                      key={item.id}
                      disabled={isDisabled}
                      onClick={() =>
                        !isDisabled &&
                        setFilters((prev: any) => ({
                          ...prev,
                          [item.id]: isActive ? "" : "true",
                        }))
                      }
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                        isActive
                          ? "bg-blue-50 border-blue-600 text-blue-950 shadow-xs cursor-pointer"
                          : isDisabled
                            ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none">{item.icon}</span>
                        <div>
                          <p className="font-bold text-xs leading-tight">
                            {item.label}
                          </p>
                          <p className={`text-[10px] font-medium leading-tight mt-0.5 ${isDisabled ? "text-slate-300" : "text-slate-400"}`}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.count > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : isDisabled
                                ? "bg-slate-200/60 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. จังหวัด & ทำเล (Location & Area) */}
          <AccordionItem
            value="location"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Province & Area" : "จังหวัด & ทำเล"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {/* Provinces */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Province" : "จังหวัด"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({
                        ...prev,
                        province: "",
                        popular_area: "",
                      }))
                    }
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                      !filters.province
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isEn ? "All Provinces" : "ทุกจังหวัด"}</span>
                  </button>
                  {availableProvinces
                    .slice(0, showAllProvinces ? undefined : ITEMS_LIMIT)
                    .map((p) => {
                      const isActive = filters.province === p.name;
                      const isDisabled = p.count === 0 && !isActive;
                      return (
                        <button
                          key={p.name}
                          disabled={isDisabled}
                          onClick={() =>
                            !isDisabled &&
                            setFilters((prev: any) => ({
                              ...prev,
                              province: isActive ? "" : p.name,
                              popular_area: "",
                            }))
                          }
                          className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                              : isDisabled
                                ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <span className="mr-1.5">
                            {getProvinceName(p.name, isEn ? "en" : "th")}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : isDisabled
                                  ? "bg-slate-200/60 text-slate-400"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {p.count}
                          </span>
                        </button>
                      );
                    })}
                  {availableProvinces.length > ITEMS_LIMIT && (
                    <button
                      onClick={() => setShowAllProvinces(!showAllProvinces)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all cursor-pointer"
                    >
                      {showAllProvinces
                        ? isEn
                          ? "Show Less"
                          : "แสดงน้อยลง"
                        : isEn
                          ? `+${availableProvinces.length - ITEMS_LIMIT} More`
                          : `+${availableProvinces.length - ITEMS_LIMIT} เพิ่มเติม`}
                    </button>
                  )}
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Popular Area / Zone" : "ย่าน / ทำเลยอดนิยม"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({
                        ...prev,
                        popular_area: "",
                      }))
                    }
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                      !filters.popular_area
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isEn ? "All Areas" : "ทุกย่านทำเล"}</span>
                  </button>
                  {availableAreas
                    .slice(0, showAllAreas ? undefined : ITEMS_LIMIT)
                    .map((a) => {
                      const isActive = filters.popular_area === a.name;
                      const isDisabled = a.count === 0 && !isActive;
                      return (
                        <button
                          key={a.name}
                          disabled={isDisabled}
                          onClick={() =>
                            !isDisabled &&
                            setFilters((prev: any) => ({
                              ...prev,
                              popular_area: isActive ? "" : a.name,
                            }))
                          }
                          className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                              : isDisabled
                                ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <span className="mr-1.5">
                            {getDistrictName(a.name, isEn ? "en" : "th")}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : isDisabled
                                  ? "bg-slate-200/60 text-slate-400"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {a.count}
                          </span>
                        </button>
                      );
                    })}
                  {availableAreas.length > ITEMS_LIMIT && (
                    <button
                      onClick={() => setShowAllAreas(!showAllAreas)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all cursor-pointer"
                    >
                      {showAllAreas
                        ? isEn
                          ? "Show Less"
                          : "แสดงน้อยลง"
                        : isEn
                          ? `+${availableAreas.length - ITEMS_LIMIT} More`
                          : `+${availableAreas.length - ITEMS_LIMIT} เพิ่มเติม`}
                    </button>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 7. สถานะประกาศ (Listing Status) */}
          <AccordionItem
            id="tour-filter-status"
            value="status"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Listing Status" : "สถานะประกาศ"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() =>
                    setFilters((prev: any) => ({ ...prev, status: "ALL" }))
                  }
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                    filters.status === "ALL"
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{isEn ? "All Statuses" : "ทั้งหมดสถานะ"}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      filters.status === "ALL"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {filterMetadata.length}
                  </span>
                </button>
                {PROPERTY_STATUS_ORDER.map((s) => {
                  const count = statusCounts[s] || 0;
                  const isActive = filters.status === s;
                  const isDisabled = count === 0 && !isActive;
                  return (
                    <button
                      key={s}
                      disabled={isDisabled}
                      onClick={() =>
                        !isDisabled &&
                        setFilters((prev: any) => ({
                          ...prev,
                          status: isActive ? "ALL" : s,
                        }))
                      }
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all font-bold text-xs ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer"
                          : isDisabled
                            ? "bg-slate-100/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <span className="truncate mr-1">
                        {isEn
                          ? PROPERTY_STATUS_LABELS[s].en
                          : PROPERTY_STATUS_LABELS[s].th}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {count > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isDisabled
                                ? "bg-slate-200/60 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 8. การเรียงลำดับ (Sort Order) */}
          <AccordionItem
            id="tour-filter-sort"
            value="sort"
            className="border-b-0 bg-white rounded-2xl shadow-xs border border-slate-200/90 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-3.5 text-slate-900">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-blue-600" />
                <span>{isEn ? "Sort By" : "เรียงตาม"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "created_at-desc",
                    label: isEn ? "Newest First" : "ใหม่ล่าสุด",
                  },
                  {
                    id: "created_at-asc",
                    label: isEn ? "Oldest First" : "เก่าสุด",
                  },
                  {
                    id: "price-desc",
                    label: isEn ? "Price: High to Low" : "ราคาสูงสุด",
                  },
                  {
                    id: "price-asc",
                    label: isEn ? "Price: Low to High" : "ราคาต่ำสุด",
                  },
                ].map((opt) => {
                  const isActive =
                    `${filters.sortBy}-${filters.sortOrder}` === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const [sortBy, sortOrder] = opt.id.split("-");
                        setFilters((prev: any) => ({
                          ...prev,
                          sortBy,
                          sortOrder,
                        }));
                      }}
                      className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ResponsiveDialog>
  );
}
