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
  DrawerClose,
} from "@/components/ui/responsive-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X, ArrowUpDown, ChevronDown } from "lucide-react";
import {
  LISTING_TYPE_ORDER,
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_ORDER,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_ORDER,
  PROPERTY_TYPE_LABELS,
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

    filterMetadata.forEach((p) => {
      if (p.type) typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
      if (p.status) statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      if (p.listing_type && listingCounts[p.listing_type] !== undefined) {
        listingCounts[p.listing_type]++;
      }
      if (p.province) {
        provincesMap.set(p.province, (provincesMap.get(p.province) || 0) + 1);
      }
      if (p.popular_area) {
        areasMap.set(
          p.popular_area,
          (areasMap.get(p.popular_area) || 0) + 1,
        );
      }
      if (p.price) {
        const price = Number(p.price);
        if (price > 0 && price <= 3000000) salePriceCounts[0]++;
        else if (price > 3000000 && price <= 7000000) salePriceCounts[1]++;
        else if (price > 7000000 && price <= 15000000) salePriceCounts[2]++;
        else if (price > 15000000) salePriceCounts[3]++;
      }
      if (p.rental_price) {
        const rPrice = Number(p.rental_price);
        if (rPrice > 0 && rPrice <= 15000) rentPriceCounts[0]++;
        else if (rPrice > 15000 && rPrice <= 50000) rentPriceCounts[1]++;
        else if (rPrice > 50000 && rPrice <= 150000) rentPriceCounts[2]++;
        else if (rPrice > 150000) rentPriceCounts[3]++;
      }
      if (p.bedrooms) {
        const b = Number(p.bedrooms);
        if (b >= 4) bedroomCounts["4"]++;
        else if (b > 0) bedroomCounts[String(b)]++;
      }
      if (p.bathrooms) {
        const b = Number(p.bathrooms);
        if (b >= 4) bathroomCounts["4"]++;
        else if (b > 0) bathroomCounts[String(b)]++;
      }
      if (p.is_pet_friendly) amenityCounts.petFriendly++;
      if (p.is_fully_furnished) amenityCounts.fullyFurnished++;
      if (p.transit_station_name) amenityCounts.nearTransit++;
      if (p.needs_ai_review) amenityCounts.needsAiReview++;
    });

    return {
      typeCounts,
      statusCounts,
      listingCounts,
      availableProvinces: Array.from(provincesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      availableAreas: Array.from(areasMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      salePriceCounts,
      rentPriceCounts,
      bedroomCounts,
      bathroomCounts,
      amenityCounts,
    };
  }, [filterMetadata]);

  const liveFilteredCount = useMemo(() => {
    if (!filterMetadata || filterMetadata.length === 0) return 0;
    return filterMetadata.filter((p) => {
      if (filters.status !== "ALL" && p.status !== filters.status) return false;
      if (filters.type !== "ALL" && p.type !== filters.type) return false;
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
      if (filters.province && p.province !== filters.province) return false;
      if (filters.district && p.district !== filters.district) return false;
      if (filters.popular_area && p.popular_area !== filters.popular_area)
        return false;
      if (filters.bedrooms) {
        const reqB = filters.bedrooms;
        const b = Number(p.bedrooms || 0);
        if (reqB === "4+" && b < 4) return false;
        else if (reqB !== "4+" && b !== Number(reqB)) return false;
      }
      if (filters.bathrooms) {
        const reqB = filters.bathrooms;
        const b = Number(p.bathrooms || 0);
        if (reqB === "4+" && b < 4) return false;
        else if (reqB !== "4+" && b !== Number(reqB)) return false;
      }
      if (filters.petFriendly === "true" && !p.is_pet_friendly) return false;
      if (filters.fullyFurnished === "true" && !p.is_fully_furnished)
        return false;
      if (filters.nearTransit === "true" && !p.transit_station_name)
        return false;
      if (filters.needsAiReview === "true" && !p.needs_ai_review) return false;
      if (filters.minPrice) {
        const min = Number(filters.minPrice);
        const checkPrice =
          filters.listing === "RENT" ? p.rental_price : p.price;
        if (!checkPrice || Number(checkPrice) < min) return false;
      }
      if (filters.maxPrice) {
        const max = Number(filters.maxPrice);
        const checkPrice =
          filters.listing === "RENT" ? p.rental_price : p.price;
        if (!checkPrice || Number(checkPrice) > max) return false;
      }
      return true;
    }).length;
  }, [filterMetadata, filters]);

  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const ITEMS_LIMIT = 8;
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEn ? "Advanced Filters" : "ตัวกรองขั้นสูง"}
      description={isEn ? "Customize your property search criteria" : "ปรับแต่งการค้นหาตามความต้องการของคุณ"}
      trigger={
        <Button
          id={id}
          variant={activeFilterCount > 0 ? "default" : "outline"}
          className="hover:bg-blue-500! hover:text-white cursor-pointer"
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
              className="h-12 rounded-xl font-bold border-slate-200 cursor-pointer"
              onClick={clearFilters}
            >
              {isEn ? "Clear All" : "ล้างทั้งหมด"}
            </Button>
          </DialogClose>
          <Button
            className="h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 cursor-pointer"
            onClick={applyFilters}
          >
            {isEn ? `Show ${liveFilteredCount} Listings` : `แสดง ${liveFilteredCount} รายการ`}
          </Button>
        </div>
      }
    >
      <div className="flex-1 h-[calc(80vh-200px)] overflow-y-auto px-0 py-0 space-y-8">
        <Accordion
          type="multiple"
          defaultValue={[
            "sort",
            "status",
            "type",
            "listing",
            "amenities",
            "location",
          ]}
          className="w-full space-y-4"
        >
          {/* Sort By Accordion */}
          <AccordionItem
            id="tour-filter-sort"
            value="sort"
            className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-500" />
                <span>{isEn ? "Sort By" : "เรียงตาม"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "created_at-desc", label: isEn ? "Newest First" : "ใหม่ล่าสุด" },
                  { id: "created_at-asc", label: isEn ? "Oldest First" : "เก่าสุด" },
                  { id: "price-desc", label: isEn ? "Price: High to Low" : "ราคาสูงสุด" },
                  { id: "price-asc", label: isEn ? "Price: Low to High" : "ราคาต่ำสุด" },
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
                      className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* Property Status Accordion */}
          <AccordionItem
            id="tour-filter-status"
            value="status"
            className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
              {isEn ? "Listing Status" : "สถานะประกาศ"}
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setFilters((prev: any) => ({ ...prev, status: "ALL" }))
                  }
                  className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                    filters.status === "ALL"
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{isEn ? "All Statuses" : "ทั้งหมดสถานะ"}</span>
                  {filterMetadata.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          filters.status === "ALL"
                            ? "bg-white/20"
                            : "bg-slate-100"
                        }`}
                      >
                        {filterMetadata.length}
                      </span>
                    </div>
                  )}
                </button>
                {PROPERTY_STATUS_ORDER.map((s) => {
                  const count = statusCounts[s] || 0;
                  const isActive = filters.status === s;
                  const isAvailable = count > 0;
                  return (
                    <button
                      key={s}
                      disabled={!isAvailable}
                      onClick={() =>
                        setFilters((prev: any) => ({ ...prev, status: s }))
                      }
                      className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-md"
                          : isAvailable
                            ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                            : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      <span className="truncate mr-1">
                        {isEn ? PROPERTY_STATUS_LABELS[s].en : PROPERTY_STATUS_LABELS[s].th}
                      </span>
                      {isAvailable && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isActive ? "bg-white/20" : "bg-slate-100"
                            }`}
                          >
                            {count}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* Property Type Accordion */}
          <AccordionItem
            value="type"
            className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
              {isEn ? "Property Type" : "ประเภททรัพย์"}
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setFilters((prev: any) => ({ ...prev, type: "ALL" }))
                  }
                  className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-medium text-xs cursor-pointer ${
                    filters.type === "ALL"
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{isEn ? "All Types" : "ทั้งหมด"}</span>
                  {filterMetadata.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          filters.type === "ALL"
                            ? "bg-white/20"
                            : "bg-slate-100"
                        }`}
                      >
                        {filterMetadata.length}
                      </span>
                    </div>
                  )}
                </button>
                {PROPERTY_TYPE_ORDER.map((t) => {
                  const count = typeCounts[t] || 0;
                  const isActive = filters.type === t;
                  const isAvailable = count > 0;
                  return (
                    <button
                      key={t}
                      disabled={!isAvailable}
                      onClick={() =>
                        setFilters((prev: any) => ({ ...prev, type: t }))
                      }
                      className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-medium text-xs ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-md font-bold"
                          : isAvailable
                            ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                            : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      <span className="truncate mr-1">
                        {isEn ? PROPERTY_TYPE_LABELS[t].en : PROPERTY_TYPE_LABELS[t].th}
                      </span>
                      {isAvailable && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isActive ? "bg-white/20" : "bg-slate-100"
                            }`}
                          >
                            {count}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Listing Type Accordion */}
          <AccordionItem
            value="listing"
            className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
              {isEn ? "Listing Type" : "รูปแบบรายการ"}
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setFilters((prev: any) => ({ ...prev, listing: "ALL" }))
                  }
                  className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                    filters.listing === "ALL"
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{isEn ? "All Listing Types" : "ทั้งหมดรายการ"}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        filters.listing === "ALL"
                          ? "bg-white/20"
                          : "bg-slate-100"
                      }`}
                    >
                      {filterMetadata.length}
                    </span>
                  </div>
                </button>
                {LISTING_TYPE_ORDER.slice(0, 3).map((t) => {
                  const count =
                    t === "SALE"
                      ? listingCounts.SALE + listingCounts.SALE_AND_RENT
                      : t === "RENT"
                        ? listingCounts.RENT + listingCounts.SALE_AND_RENT
                        : listingCounts[t];
                  const isActive = filters.listing === t;
                  const isAvailable = count > 0;
                  return (
                    <button
                      key={t}
                      disabled={!isAvailable}
                      onClick={() =>
                        setFilters((prev: any) => ({ ...prev, listing: t }))
                      }
                      className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-md"
                          : isAvailable
                            ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                            : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      <span className="truncate mr-1">
                        {isEn ? LISTING_TYPE_LABELS[t].en : LISTING_TYPE_LABELS[t].th}
                      </span>
                      {isAvailable && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isActive ? "bg-white/20" : "bg-slate-100"
                            }`}
                          >
                            {count}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price & Rooms Accordion */}
          <AccordionItem
            id="tour-filter-price"
            value="amenities"
            className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
              {isEn ? "Price & Rooms" : "ราคา & ขนาด"}
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-6">
              <div className="space-y-6">
                {/* Sale Price Section */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {isEn ? "Sale Price Range (THB)" : "ช่วงราคาขาย (บาท)"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { min: "0", max: "3000000", label: isEn ? "< 3M" : "< 3 ล้าน" },
                      { min: "3000000", max: "7000000", label: isEn ? "3 - 7M" : "3 - 7 ล้าน" },
                      {
                        min: "7000000",
                        max: "15000000",
                        label: isEn ? "7 - 15M" : "7 - 15 ล้าน",
                      },
                      { min: "15000000", max: "", label: isEn ? "> 15M" : "> 15 ล้าน" },
                    ].map((preset, idx) => {
                      const count = salePriceCounts[idx] || 0;
                      const isActive =
                        filters.listing !== "RENT" &&
                        filters.minPrice === preset.min &&
                        filters.maxPrice === preset.max;
                      const isAvailable = count > 0;

                      return (
                        <button
                          key={preset.label}
                          disabled={!isAvailable}
                          onClick={() => {
                            if (isActive) {
                              setFilters((prev: any) => ({
                                ...prev,
                                minPrice: "",
                                maxPrice: "",
                              }));
                            } else {
                              setFilters((prev: any) => ({
                                ...prev,
                                listing: "SALE",
                                minPrice: preset.min,
                                maxPrice: preset.max,
                              }));
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md"
                              : isAvailable
                                ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                                : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          <span className="truncate mr-1">{preset.label}</span>
                          {isAvailable && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                                  isActive ? "bg-white/20" : "bg-slate-100"
                                }`}
                              >
                                {count}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rent Price Section */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {isEn ? "Rent Price Range (THB / mo)" : "ช่วงราคาเช่า (บาท / เดือน)"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
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
                      { min: "150000", max: "", label: isEn ? "> 150K" : "> 1.5 แสน" },
                    ].map((preset, idx) => {
                      const count = rentPriceCounts[idx] || 0;
                      const isActive =
                        filters.listing === "RENT" &&
                        filters.minPrice === preset.min &&
                        filters.maxPrice === preset.max;
                      const isAvailable = count > 0;

                      return (
                        <button
                          key={preset.label}
                          disabled={!isAvailable}
                          onClick={() => {
                            if (isActive) {
                              setFilters((prev: any) => ({
                                ...prev,
                                minPrice: "",
                                maxPrice: "",
                              }));
                            } else {
                              setFilters((prev: any) => ({
                                ...prev,
                                listing: "RENT",
                                minPrice: preset.min,
                                maxPrice: preset.max,
                              }));
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md"
                              : isAvailable
                                ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                                : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          <span className="truncate mr-1">{preset.label}</span>
                          {isAvailable && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                                  isActive ? "bg-white/20" : "bg-slate-100"
                                }`}
                              >
                                {count}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                      className={`flex items-center justify-between h-10 min-w-24 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 cursor-pointer ${
                        !filters.bedrooms
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="mr-2">{isEn ? "All" : "ทั้งหมด"}</span>
                      {filterMetadata.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                              !filters.bedrooms ? "bg-white/20" : "bg-slate-100"
                            }`}
                          >
                            {filterMetadata.length}
                          </span>
                        </div>
                      )}
                    </button>
                    {["1", "2", "3", "4+"].map((val) => {
                      const countKey = val === "4+" ? "4" : val;
                      const count = bedroomCounts[countKey] || 0;
                      const isActive = filters.bedrooms === val;
                      const isAvailable = count > 0;
                      return (
                        <button
                          key={val}
                          disabled={!isAvailable}
                          onClick={() =>
                            setFilters((prev: any) => ({
                              ...prev,
                              bedrooms: val,
                            }))
                          }
                          className={`flex items-center justify-between h-10 min-w-16 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md font-bold"
                              : isAvailable
                                ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                                : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          <span className="mr-2">{val}</span>
                          {isAvailable && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span
                                className={`text-[8px] px-1 py-0.5 rounded-md ${
                                  isActive ? "bg-white/20" : "bg-slate-100"
                                }`}
                              >
                                {count}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                      className={`flex items-center justify-between h-10 min-w-24 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 cursor-pointer ${
                        !filters.bathrooms
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="mr-2">{isEn ? "All" : "ทั้งหมด"}</span>
                      {filterMetadata.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                              !filters.bathrooms
                                ? "bg-white/20"
                                : "bg-slate-100"
                            }`}
                          >
                            {filterMetadata.length}
                          </span>
                        </div>
                      )}
                    </button>
                    {["1", "2", "3", "4+"].map((val) => {
                      const countKey = val === "4+" ? "4" : val;
                      const count = bathroomCounts[countKey] || 0;
                      const isActive = filters.bathrooms === val;
                      const isAvailable = count > 0;
                      return (
                        <button
                          key={val}
                          disabled={!isAvailable}
                          onClick={() =>
                            setFilters((prev: any) => ({
                              ...prev,
                              bathrooms: val,
                            }))
                          }
                          className={`flex items-center justify-between h-10 min-w-16 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md font-bold"
                              : isAvailable
                                ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                                : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          <span className="mr-2">{val}</span>
                          {isAvailable && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span
                                className={`text-[8px] px-1 py-0.5 rounded-md ${
                                  isActive ? "bg-white/20" : "bg-slate-100"
                                }`}
                              >
                                {count}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {isEn ? "Special Features" : "ความต้องการพิเศษ"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        id: "nearTransit",
                        label: isEn ? "Near SkyTrain/MRT" : "ใกล้รถไฟฟ้า",
                        icon: "🚈",
                      },
                      {
                        id: "petFriendly",
                        label: isEn ? "Pet Friendly" : "เลี้ยงสัตว์ได้",
                        icon: "🐾",
                      },
                      {
                        id: "fullyFurnished",
                        label: isEn ? "Fully Furnished" : "ตกแต่งครบ",
                        icon: "🛋️",
                      },
                    ].map((item) => {
                      const isActive =
                        filters[item.id as keyof Filters] === "true";
                      const count =
                        amenityCounts[item.id as keyof typeof amenityCounts] ||
                        0;
                      const isAvailable = count > 0;

                      return (
                        <button
                          key={item.id}
                          disabled={!isAvailable}
                          onClick={() =>
                            setFilters((prev: any) => ({
                              ...prev,
                              [item.id]: isActive ? "" : "true",
                            }))
                          }
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all font-bold text-xs min-w-[140px] ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md"
                              : isAvailable
                                ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer"
                                : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isAvailable && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                  isActive ? "bg-white/20" : "bg-slate-100"
                                }`}
                              >
                                {count}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Location Accordion */}
          <AccordionItem
            value="location"
            className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
          >
            <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-slate-900">{isEn ? "Province & Area" : "จังหวัด & ทำเล"}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-6">
              {/* Provinces */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all min-w-[140px] cursor-pointer ${
                      !filters.province
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isEn ? "All Provinces" : "ทุกจังหวัด"}</span>
                    {filterMetadata.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            !filters.province
                              ? "bg-white/20"
                              : "bg-slate-100/80"
                          }`}
                        >
                          {filterMetadata.length}
                        </span>
                      </div>
                    )}
                  </button>
                  {availableProvinces
                    .slice(0, showAllProvinces ? undefined : ITEMS_LIMIT)
                    .map((p) => {
                      const isActive = filters.province === p.name;
                      return (
                        <button
                          key={p.name}
                          onClick={() =>
                            setFilters((prev: any) => ({
                              ...prev,
                              province: p.name,
                              popular_area: "",
                            }))
                          }
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-w-[140px] cursor-pointer ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md"
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate mr-2">
                            {getProvinceName(p.name, isEn ? "en" : "th")}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                isActive ? "bg-white/20" : "bg-slate-100/80"
                              }`}
                            >
                              {p.count}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  {availableProvinces.length > ITEMS_LIMIT && (
                    <button
                      onClick={() => setShowAllProvinces(!showAllProvinces)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all cursor-pointer"
                    >
                      {showAllProvinces
                        ? (isEn ? "Show Less" : "แสดงน้อยลง")
                        : (isEn ? `+${availableProvinces.length - ITEMS_LIMIT} More` : `+${availableProvinces.length - ITEMS_LIMIT} เพิ่มเติม`)}
                    </button>
                  )}
                </div>
              </div>

              {/* Areas (Districts) */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {isEn ? "Area / Zone" : "ทำเล"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({
                        ...prev,
                        popular_area: "",
                      }))
                    }
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all min-w-[140px] cursor-pointer ${
                      !filters.popular_area
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isEn ? "All Areas" : "ทุกย่านทำเล"}</span>
                    {filterMetadata.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            !filters.popular_area
                              ? "bg-white/20"
                              : "bg-slate-100/80"
                          }`}
                        >
                          {filterMetadata.length}
                        </span>
                      </div>
                    )}
                  </button>
                  {availableAreas
                    .slice(0, showAllAreas ? undefined : ITEMS_LIMIT)
                    .map((a) => {
                      const isActive = filters.popular_area === a.name;
                      return (
                        <button
                          key={a.name}
                          onClick={() =>
                            setFilters((prev: any) => ({
                              ...prev,
                              popular_area: a.name,
                            }))
                          }
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-w-[140px] cursor-pointer ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md"
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate mr-2">
                            {getDistrictName(a.name, isEn ? "en" : "th")}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                isActive ? "bg-white/20" : "bg-slate-100/80"
                              }`}
                            >
                              {a.count}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  {availableAreas.length > ITEMS_LIMIT && (
                    <button
                      onClick={() => setShowAllAreas(!showAllAreas)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all cursor-pointer"
                    >
                      {showAllAreas
                        ? (isEn ? "Show Less" : "แสดงน้อยลง")
                        : (isEn ? `+${availableAreas.length - ITEMS_LIMIT} More` : `+${availableAreas.length - ITEMS_LIMIT} เพิ่มเติม`)}
                    </button>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ✨ Sentinel AI Verification Section */}
        <div className="pt-2 px-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">
            Sentinel AI Status
          </label>
          <button
            onClick={() =>
              setFilters((prev: any) => ({
                ...prev,
                needsAiReview: prev.needsAiReview === "true" ? "" : "true",
              }))
            }
            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group cursor-pointer ${
              filters.needsAiReview === "true"
                ? "bg-indigo-50 border-indigo-200 shadow-sm"
                : "bg-white border-slate-100 hover:border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  filters.needsAiReview === "true"
                    ? "bg-indigo-600 text-white rotate-12 scale-110 shadow-lg shadow-indigo-200"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p
                  className={`text-sm font-bold ${
                    filters.needsAiReview === "true"
                      ? "text-indigo-900"
                      : "text-slate-700"
                  }`}
                >
                  {isEn ? "✨ AI Review Drafts" : "✨ ตรวจร่าง AI"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                  {isEn ? "Show only listings auto-drafted by AI awaiting your review" : "แสดงเฉพาะรายการที่ AI ช่วยสรุปเนื้อหาให้ (รอคุณตรวจสอบ)"}
                </p>
              </div>
            </div>
            {amenityCounts.needsAiReview > 0 && (
              <span
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filters.needsAiReview === "true"
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {amenityCounts.needsAiReview}
              </span>
            )}
          </button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
