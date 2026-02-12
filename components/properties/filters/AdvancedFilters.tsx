import { useState, useMemo } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
}

interface AdvancedFiltersProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  filters: Filters;
  setFilters: (filters: any) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filterMetadata?: any[];
}

export function AdvancedFilters({
  open,
  setOpen,
  filters,
  setFilters,
  applyFilters,
  clearFilters,
  hasActiveFilters,
  totalCount,
  filterMetadata = [],
}: AdvancedFiltersProps) {
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

    // Price Preset Definitions
    const salePresets = [
      { min: 0, max: 3000000 },
      { min: 3000000, max: 7000000 },
      { min: 7000000, max: 15000000 },
      { min: 15000000, max: Infinity },
    ];
    const rentPresets = [
      { min: 0, max: 15000 },
      { min: 15000, max: 50000 },
      { min: 50000, max: 150000 },
      { min: 150000, max: Infinity },
    ];

    const salePriceCounts = salePresets.map(() => 0);
    const rentPriceCounts = rentPresets.map(() => 0);

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
    };

    filterMetadata.forEach((p) => {
      // Type & Status Counts
      const type = p.property_type;
      const status = p.status;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Listing Type Logic
      if (p.listing_type === "SALE_AND_RENT") listingCounts.SALE_AND_RENT++;
      else if (p.listing_type === "SALE") listingCounts.SALE++;
      else if (p.listing_type === "RENT") listingCounts.RENT++;

      // Price Presets Counts
      const isSaleProp =
        p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT";
      const isRentProp =
        p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT";

      if (isSaleProp) {
        const activeSalePrice = p.price ?? p.original_price;
        if (activeSalePrice !== null && activeSalePrice !== undefined) {
          salePresets.forEach((preset, idx) => {
            if (activeSalePrice >= preset.min && activeSalePrice < preset.max) {
              salePriceCounts[idx]++;
            }
          });
        }
      }
      if (isRentProp) {
        const activeRentPrice = p.rental_price ?? p.original_rental_price;
        if (activeRentPrice !== null && activeRentPrice !== undefined) {
          rentPresets.forEach((preset, idx) => {
            if (activeRentPrice >= preset.min && activeRentPrice < preset.max) {
              rentPriceCounts[idx]++;
            }
          });
        }
      }

      // Bedroom & Bathroom Counts
      if (p.bedrooms !== null) {
        const bKey = p.bedrooms >= 4 ? "4" : String(Math.floor(p.bedrooms));
        if (bedroomCounts[bKey] !== undefined) bedroomCounts[bKey]++;
      }
      if (p.bathrooms !== null) {
        const baKey = p.bathrooms >= 4 ? "4" : String(Math.floor(p.bathrooms));
        if (bathroomCounts[baKey] !== undefined) bathroomCounts[baKey]++;
      }

      // Amenities Counts
      if (p.near_transit) amenityCounts.nearTransit++;
      if (p.is_pet_friendly) amenityCounts.petFriendly++;
      if (p.is_fully_furnished) amenityCounts.fullyFurnished++;

      // Location Counts
      if (p.province) {
        provincesMap.set(p.province, (provincesMap.get(p.province) || 0) + 1);
      }
      if (p.popular_area) {
        areasMap.set(p.popular_area, (areasMap.get(p.popular_area) || 0) + 1);
      }
    });

    return {
      typeCounts,
      statusCounts,
      listingCounts,
      salePriceCounts,
      rentPriceCounts,
      bedroomCounts,
      bathroomCounts,
      amenityCounts,
      availableProvinces: Array.from(provincesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      availableAreas: Array.from(areasMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [filterMetadata]);

  const liveFilteredCount = useMemo(() => {
    if (!filterMetadata) return 0;
    return filterMetadata.filter((p) => {
      // Status
      if (
        filters.status &&
        filters.status !== "ALL" &&
        p.status !== filters.status
      )
        return false;
      // Type
      if (
        filters.type &&
        filters.type !== "ALL" &&
        p.property_type !== filters.type
      )
        return false;
      // Listing
      if (filters.listing && filters.listing !== "ALL") {
        const isMatch =
          p.listing_type === filters.listing ||
          p.listing_type === "SALE_AND_RENT";
        if (!isMatch) return false;
      }

      // Price
      const min = filters.minPrice ? Number(filters.minPrice) : 0;
      const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      const price =
        filters.listing === "RENT"
          ? (p.rental_price ?? p.original_rental_price)
          : (p.price ?? p.original_price);

      if (price !== null && price !== undefined) {
        if (price < min || (max !== Infinity && price > max)) return false;
      } else if (filters.minPrice || filters.maxPrice) {
        return false;
      }

      // Bedrooms
      if (filters.bedrooms) {
        const b = Number(filters.bedrooms);
        if (b >= 4) {
          if ((p.bedrooms ?? 0) < 4) return false;
        } else if (p.bedrooms !== b) {
          return false;
        }
      }
      // Bathrooms
      if (filters.bathrooms) {
        const b = Number(filters.bathrooms);
        if (b >= 4) {
          if ((p.bathrooms ?? 0) < 4) return false;
        } else if (p.bathrooms !== b) {
          return false;
        }
      }

      // Provinces
      if (filters.province && p.province !== filters.province) return false;
      // Area
      if (filters.popular_area && p.popular_area !== filters.popular_area)
        return false;

      // Amenities
      if (filters.nearTransit === "true" && !p.near_transit) return false;
      if (filters.petFriendly === "true" && !p.is_pet_friendly) return false;
      if (filters.fullyFurnished === "true" && !p.is_fully_furnished)
        return false;

      return true;
    }).length;
  }, [filterMetadata, filters]);

  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const ITEMS_LIMIT = 8;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={hasActiveFilters ? "default" : "outline"}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          ตัวกรอง
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary-foreground text-primary rounded-full text-xs font-bold leading-none min-w-5 h-5 flex items-center justify-center">
              •
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-slate-50 border-white/20 backdrop-blur-xl"
      >
        <SheetHeader className="px-6 py-6 border-b border-slate-200 bg-white">
          <SheetTitle className="text-xl font-bold text-slate-900">
            ตัวกรองขั้นสูง
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            ปรับแต่งการค้นหาตามความต้องการของคุณ
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
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
              value="sort"
              className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
            >
              <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                  <span>เรียงตาม</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "created_at-desc", label: "ใหม่ล่าสุด" },
                    { id: "created_at-asc", label: "เก่าสุด" },
                    { id: "price-desc", label: "ราคาสูงสุด" },
                    { id: "price-asc", label: "ราคาต่ำสุด" },
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
                        className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
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
              value="status"
              className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
            >
              <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
                สถานะประกาศ
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({ ...prev, status: "ALL" }))
                    }
                    className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                      filters.status === "ALL"
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>ทั้งหมดสถานะ</span>
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
                              ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                              : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                      >
                        <span className="truncate mr-1">
                          {PROPERTY_STATUS_LABELS[s]}
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
                ประเภททรัพย์
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({ ...prev, type: "ALL" }))
                    }
                    className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-medium text-xs ${
                      filters.type === "ALL"
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>ทั้งหมด</span>
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
                        className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : isAvailable
                              ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                              : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                      >
                        <span className="truncate mr-1">
                          {PROPERTY_TYPE_LABELS[t]}
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
                รูปแบบรายการ
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setFilters((prev: any) => ({ ...prev, listing: "ALL" }))
                    }
                    className={`flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                      filters.listing === "ALL"
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>ทั้งหมดรายการ</span>
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
                              ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                              : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                      >
                        <span className="truncate mr-1">
                          {LISTING_TYPE_LABELS[t]}
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
              value="amenities"
              className="border-b-0 bg-white rounded-2xl shadow-sm border border-slate-200 px-4"
            >
              <AccordionTrigger className="hover:no-underline font-bold py-4 text-slate-900">
                ราคา & ขนาด
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-6">
                <div className="space-y-6">
                  {/* Sale Price Section */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      ช่วงราคาขาย (บาท)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { min: "0", max: "3000000", label: "< 3 ล้าน" },
                        { min: "3000000", max: "7000000", label: "3 - 7 ล้าน" },
                        {
                          min: "7000000",
                          max: "15000000",
                          label: "7 - 15 ล้าน",
                        },
                        { min: "15000000", max: "", label: "> 15 ล้าน" },
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
                                  ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                                  : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            <span className="truncate mr-1">
                              {preset.label}
                            </span>
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
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      ช่วงราคาเช่า (บาท / เดือน)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { min: "0", max: "15000", label: "< 15,000" },
                        {
                          min: "15000",
                          max: "50000",
                          label: "1.5 - 5 หมื่น",
                        },
                        {
                          min: "50000",
                          max: "150000",
                          label: "5 หมื่น - 1.5 แสน",
                        },
                        { min: "150000", max: "", label: "> 1.5 แสน" },
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
                                  ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                                  : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            <span className="truncate mr-1">
                              {preset.label}
                            </span>
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
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      ห้องนอน
                    </Label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() =>
                          setFilters((prev: any) => ({
                            ...prev,
                            bedrooms: "",
                          }))
                        }
                        className={`flex items-center justify-between h-10 min-w-24 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 ${
                          !filters.bedrooms
                            ? "bg-slate-900 border-slate-900 text-white shadow-md"
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="mr-2">ทั้งหมด</span>
                        {filterMetadata.length > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                                !filters.bedrooms
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
                                  ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
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
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      ห้องน้ำ
                    </Label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() =>
                          setFilters((prev: any) => ({
                            ...prev,
                            bathrooms: "",
                          }))
                        }
                        className={`flex items-center justify-between h-10 min-w-24 px-3 rounded-xl border-2 transition-all font-bold text-xs shrink-0 ${
                          !filters.bathrooms
                            ? "bg-slate-900 border-slate-900 text-white shadow-md"
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="mr-2">ทั้งหมด</span>
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
                                  ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
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
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      ความต้องการพิเศษ
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          id: "nearTransit",
                          label: "ใกล้รถไฟฟ้า",
                          icon: "🚈",
                        },
                        {
                          id: "petFriendly",
                          label: "เลี้ยงสัตว์ได้",
                          icon: "🐾",
                        },
                        {
                          id: "fullyFurnished",
                          label: "ตกแต่งครบ",
                          icon: "🛋️",
                        },
                      ].map((item) => {
                        const isActive =
                          filters[item.id as keyof Filters] === "true";
                        const count =
                          amenityCounts[
                            item.id as keyof typeof amenityCounts
                          ] || 0;
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
                                  ? "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
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
                  <span className="text-slate-900">จังหวัด & ทำเล</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-6">
                {/* Provinces */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    จังหวัด
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setFilters((prev: any) => ({
                          ...prev,
                          province: "",
                          popular_area: "",
                        }))
                      }
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all min-w-[140px] ${
                        !filters.province
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>ทุกจังหวัด</span>
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
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-w-[140px] ${
                              isActive
                                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate mr-2">{p.name}</span>
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
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all"
                      >
                        {showAllProvinces
                          ? "แสดงน้อยลง"
                          : `+${availableProvinces.length - ITEMS_LIMIT} เพิ่มเติม`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Areas (Districts) */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    ทำเล
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setFilters((prev: any) => ({
                          ...prev,
                          popular_area: "",
                        }))
                      }
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all min-w-[140px] ${
                        !filters.popular_area
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>ทุกย่านทำเล</span>
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
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-w-[140px] ${
                              isActive
                                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate mr-2">{a.name}</span>
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
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all"
                      >
                        {showAllAreas
                          ? "แสดงน้อยลง"
                          : `+${availableAreas.length - ITEMS_LIMIT} เพิ่มเติม`}
                      </button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="p-6 border-t border-slate-200 bg-white flex-col gap-3 sm:flex-col shrink-0">
          <div className="flex gap-3 w-full">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
            >
              <X className="h-4 w-4 mr-2" />
              ล้างทั้งหมด
            </Button>
            <SheetClose asChild>
              <Button
                onClick={applyFilters}
                className="flex-2 h-12 rounded-xl bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold shadow-lg shadow-blue-200"
              >
                ดูทรัพย์ ({liveFilteredCount}) รายการ
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
