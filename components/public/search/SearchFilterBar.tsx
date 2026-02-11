"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Armchair,
} from "lucide-react";
import { MdOutlinePets } from "react-icons/md";
import { FaTrainSubway } from "react-icons/fa6";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { FilterBarSkeleton } from "../FilterBarSkeleton";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { RiArmchairFill } from "react-icons/ri";

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
  bedrooms: string;
  setBedrooms: (v: string) => void;
  filteredLength: number;
  availableAreas: {
    name: string;
    count: number;
    name_en?: string | null;
    name_cn?: string | null;
  }[];
  province: string;
  setProvince: (v: string) => void;
  availableProvinces: string[];
  availableTypes: Record<string, number>;
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
  bedrooms,
  setBedrooms,
  filteredLength,
  availableAreas,
  province,
  setProvince,
  availableProvinces,
  availableTypes,
}: SearchFilterBarProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAreaSection, setShowAreaSection] = useState(true);
  const [showAllProvincesMobile, setShowAllProvincesMobile] = useState(false);
  const [showAllAreasMobile, setShowAllAreasMobile] = useState(false);

  const MOBILE_ITEMS_LIMIT = 9;

  if (isLoading) return <FilterBarSkeleton />;

  const PROPERTY_TYPES = [
    { value: "ALL", label: t("common.all") },
    { value: "HOUSE", label: t("home.property_types.house") },
    { value: "CONDO", label: t("home.property_types.condo") },
    { value: "OFFICE_BUILDING", label: t("home.property_types.office_building") },
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
    setSort("NEWEST");
    setArea("ALL");
    setProvince("ALL");
    setNearTrain(false);
    setPetFriendly(false);
    setFullyFurnished(false);
    setBedrooms("ALL");
  };

  return (
    <div className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile View: Search + Filter Sheet */}
        <div className="lg:hidden flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder={t("search.keyword_placeholder")}
              className="pl-12 h-12 text-base rounded-xl border-slate-200 bg-white shadow-sm"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-12 w-12 p-0 rounded-xl border-slate-200 bg-white shadow-sm shrink-0"
              >
                <SlidersHorizontal className="h-5 w-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[90vh] rounded-t-2xl flex flex-col p-0 bg-slate-50"
            >
              <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white text-slate-900 rounded-t-4xl">
                <SheetTitle>{t("search.filter_title")}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="location" className="border-0">
                    <AccordionTrigger className="hover:no-underline py-2">
                      <span className="text-sm font-medium text-slate-900">
                        {t("search.province")} & {t("search.location")}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2 px-1">
                      {/* Province (Mobile) */}
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-medium block">
                          {t("search.province")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setProvince("ALL");
                              setArea("ALL");
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              province === "ALL"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            {t("search.all_provinces")}
                          </button>
                          {availableProvinces
                            .slice(
                              0,
                              showAllProvincesMobile
                                ? undefined
                                : MOBILE_ITEMS_LIMIT,
                            )
                            .map((p) => (
                              <button
                                key={p}
                                onClick={() => {
                                  setProvince(p);
                                  setArea("ALL");
                                }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                  province === p
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                }`}
                              >
                                {getProvinceName(p, language)}
                              </button>
                            ))}
                          {availableProvinces.length > MOBILE_ITEMS_LIMIT && (
                            <button
                              onClick={() =>
                                setShowAllProvincesMobile(
                                  !showAllProvincesMobile,
                                )
                              }
                              className="px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400"
                            >
                              {showAllProvincesMobile
                                ? t("search.show_less")
                                : `+${availableProvinces.length - MOBILE_ITEMS_LIMIT} ${t("common.more")}`}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-medium block">
                          {t("search.location")}
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                          <button
                            onClick={() => setArea("ALL")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              area === "ALL"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            {t("search.all_locations")}
                          </button>
                          {availableAreas
                            .slice(
                              0,
                              showAllAreasMobile
                                ? undefined
                                : MOBILE_ITEMS_LIMIT,
                            )
                            .map((a) => (
                              <button
                                key={a.name}
                                onClick={() => setArea(a.name)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                  area === a.name
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                }`}
                              >
                                {getLocaleValue(
                                  {
                                    name: a.name,
                                    name_en: a.name_en,
                                    name_cn: a.name_cn,
                                  },
                                  "name",
                                  language,
                                )}{" "}
                                {/* <span className="opacity-70 text-xs ml-1">({a.count})</span> */}
                              </button>
                            ))}
                          {availableAreas.length > MOBILE_ITEMS_LIMIT && (
                            <button
                              onClick={() =>
                                setShowAllAreasMobile(!showAllAreasMobile)
                              }
                              className="px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400"
                            >
                              {showAllAreasMobile
                                ? t("search.show_less")
                                : `+${availableAreas.length - MOBILE_ITEMS_LIMIT} ${t("common.more")}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Toggles */}
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      nearTrain
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-200"
                    }`}
                    onClick={() => setNearTrain(!nearTrain)}
                  >
                    <FaTrainSubway
                      className={`h-4 w-4 ${nearTrain ? "text-white" : "text-blue-500"}`}
                    />
                    <span className="text-[11px] font-semibold">
                      {t("search.near_train")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      petFriendly
                        ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-orange-200"
                    }`}
                    onClick={() => setPetFriendly(!petFriendly)}
                  >
                    <MdOutlinePets
                      className={`h-5 w-5 ${petFriendly ? "text-white" : "text-orange-500"}`}
                    />
                    <span className="text-[11px] font-semibold">
                      {t("search.pet_allowed")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      fullyFurnished
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200"
                    }`}
                    onClick={() => setFullyFurnished(!fullyFurnished)}
                  >
                    <RiArmchairFill
                      className={`h-5 w-5 ${fullyFurnished ? "text-white" : "text-emerald-500"}`}
                    />
                    <span className="text-[11px] font-semibold">
                      {t("search.fully_furnished")}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    {t("search.property_type")}
                  </label>
                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="w-full flex items-center justify-between px-4 h-12 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300 transition-all shadow-sm">
                        <span className="flex items-center gap-2">
                          {type === "ALL" ? (
                            t("common.all")
                          ) : (
                            <>
                              {
                                PROPERTY_TYPES.find((pt) => pt.value === type)
                                  ?.label
                              }
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </>
                          )}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="h-[60vh] rounded-t-lg p-0 flex flex-col bg-white"
                    >
                      <SheetHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
                        <SheetTitle className="text-left font-semibold text-lg">
                          {t("search.property_type")}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {PROPERTY_TYPES.map((pt) => {
                          const count = availableTypes[pt.value] || 0;
                          const hasItems = pt.value === "ALL" || count > 0;
                          const isActive = type === pt.value;

                          return (
                            <SheetClose asChild key={pt.value}>
                              <button
                                disabled={!hasItems}
                                onClick={() => setType(pt.value)}
                                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-sm font-medium border transition-all ${
                                  isActive
                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                    : hasItems
                                      ? "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                                      : "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`h-2 w-2 rounded-full transition-all ${
                                      isActive
                                        ? "bg-blue-600"
                                        : hasItems
                                          ? "bg-emerald-500"
                                          : "bg-slate-200"
                                    }`}
                                  />
                                  <span>{pt.label}</span>
                                </div>
                                {count > 0 && pt.value !== "ALL" && (
                                  <span className="text-xs font-normal text-slate-400">
                                    {count} {t("search.items")}
                                  </span>
                                )}
                              </button>
                            </SheetClose>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Listing Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    {t("search.needs")}
                  </label>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {[
                      { val: "ALL", label: t("common.all") },
                      { val: "SALE", label: t("search.buy") },
                      { val: "RENT", label: t("search.rent") },
                      { val: "SALE_AND_RENT", label: t("search.rent_buy") },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setListingType(opt.val)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                          listingType === opt.val
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    {t("search.price_range")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { min: "0", max: "15000", key: "range_1" },
                      { min: "15000", max: "50000", key: "range_2" },
                      { min: "50000", max: "150000", key: "range_3" },
                      { min: "150000", max: "", key: "range_4" },
                    ].map((preset) => (
                      <button
                        key={preset.key}
                        onClick={() => {
                          if (
                            minPrice === preset.min &&
                            maxPrice === preset.max
                          ) {
                            setMinPrice("");
                            setMaxPrice("");
                          } else {
                            setMinPrice(preset.min);
                            setMaxPrice(preset.max);
                          }
                        }}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          minPrice === preset.min && maxPrice === preset.max
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {t(`search.price_presets.${preset.key}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bedroom */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    {t("search.bedrooms")}
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {["ALL", "1", "2", "3", "4+"].map((bed) => (
                      <button
                        key={bed}
                        onClick={() => setBedrooms(bed)}
                        className={`h-10 min-w-12 px-3 rounded-xl border transition-all font-medium text-sm shrink-0 ${
                          bedrooms === bed
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        {bed === "ALL" ? t("common.all") : bed}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <SheetFooter className="p-6 border-t border-slate-100 bg-white pb-8">
                <SheetClose asChild>
                  <Button className="w-full h-12 text-lg rounded-xl bg-linear-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-200/50">
                    {t("search.view_results")} ({filteredLength}{" "}
                    {t("search.items")})
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        {/* ********************************************************************* */}
        {/* Desktop View (Hidden on Mobile) */}
        <div className="hidden lg:block">
          {/* Row 1: Search + Core Filters */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            <div className="col-span-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder={t("search.keyword_placeholder")}
                  className="pl-12 h-12 text-base rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>

            <div className="col-span-2">
              <Select
                value={province}
                onValueChange={(val) => {
                  setProvince(val);
                  setArea("ALL");
                }}
              >
                <SelectTrigger className="h-12 py-[23px] w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder={t("search.province")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("search.all_provinces")}
                  </SelectItem>
                  {availableProvinces.map((p) => (
                    <SelectItem key={p} value={p}>
                      {getProvinceName(p, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 py-[23px] w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder={t("search.property_type")} />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((pt) => {
                    const count = availableTypes[pt.value] || 0;
                    const hasItems = pt.value === "ALL" || count > 0;

                    return (
                      <SelectItem
                        key={pt.value}
                        value={pt.value}
                        disabled={!hasItems}
                        className={!hasItems ? "opacity-50" : ""}
                      >
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{pt.label}</span>
                          {pt.value !== "ALL" && count > 0 && (
                            <span className="flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-emerald-500" />
                              <span className="text-[10px] text-slate-400 font-normal">
                                {count}
                              </span>
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <div className="grid grid-cols-4 gap-1.5 h-12">
                <button
                  onClick={() => setListingType("ALL")}
                  className={`rounded-lg border-2 transition-colors duration-200 font-medium text-xs ${
                    listingType === "ALL"
                      ? "bg-slate-600 border-slate-600 text-white shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {t("common.all")}
                </button>
                <button
                  onClick={() => setListingType("SALE")}
                  className={`rounded-lg border-2 transition-colors duration-200 font-medium text-xs ${
                    listingType === "SALE"
                      ? "bg-green-600 border-green-600 text-white shadow-md"
                      : "bg-white border-slate-200 hover:border-green-400 hover:bg-green-50 text-slate-700"
                  }`}
                >
                  {t("search.buy")}
                </button>
                <button
                  onClick={() => setListingType("RENT")}
                  className={`rounded-lg border-2 transition-colors duration-200 font-medium text-xs ${
                    listingType === "RENT"
                      ? "bg-orange-600 border-orange-600 text-white shadow-md"
                      : "bg-white border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-slate-700"
                  }`}
                >
                  {t("search.rent")}
                </button>
                <button
                  onClick={() => setListingType("SALE_AND_RENT")}
                  className={`rounded-lg border-2 transition-colors duration-200 font-medium text-xs ${
                    listingType === "SALE_AND_RENT"
                      ? "bg-blue-600 border-blue-600 text-white shadow-md"
                      : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700"
                  }`}
                >
                  {t("search.rent_buy")}
                </button>
              </div>
            </div>

            <div className="col-span-2 ">
              <div className="flex items-center gap-2 h-12 bg-white rounded-xl">
                <Input
                  type="number"
                  placeholder={t("search.min_budget")}
                  className="h-full w-full p-0 text-sm focus-visible:ring-0 bg-white shadow-sm text-slate-700 border-slate-200 border px-2"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-slate-400">—</span>
                <Input
                  type="number"
                  placeholder={t("search.max_budget")}
                  className="  h-full w-full p-0 text-sm focus-visible:ring-0 bg-white shadow-sm text-slate-700 border-slate-200 border px-2"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Filters + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {availableAreas.length > 0 && (
              <button
                onClick={() => setShowAreaSection(!showAreaSection)}
                className={`flex items-center justify-between gap-2 px-4 h-12 rounded-xl border-2 transition-all font-medium text-sm ${
                  showAreaSection
                    ? "bg-slate-100 border-slate-200 text-slate-900"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700"
                }`}
              >
                {t("search.popular_locations")}
                {showAreaSection ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl h-12">
              <span className="text-sm text-slate-600 font-medium px-2">
                {t("search.bedrooms")}:
              </span>
              {["ALL", "1", "2", "3", "4+"].map((bed) => (
                <button
                  key={bed}
                  onClick={() => setBedrooms(bed)}
                  className={`h-9 px-3 rounded-lg transition-all font-medium text-sm ${
                    bedrooms === bed
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {bed === "ALL" ? t("common.all") : bed}
                </button>
              ))}
            </div>

            <div
              className={`flex items-center justify-center gap-2 px-4 h-12 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                nearTrain
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700"
              }`}
              onClick={() => setNearTrain(!nearTrain)}
            >
              <FaTrainSubway
                className={`h-4 w-4 ${
                  nearTrain ? "text-white" : "text-blue-600"
                }`}
              />
              <span className="text-sm font-medium select-none">
                {t("search.near_train")}
              </span>
            </div>

            <div
              className={`flex items-center justify-center gap-2 px-4 h-12 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                petFriendly
                  ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/30"
                  : "bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-700 hover:text-orange-700"
              }`}
              onClick={() => setPetFriendly(!petFriendly)}
            >
              <MdOutlinePets
                className={`h-5 w-5 ${
                  petFriendly ? "text-white" : "text-orange-600"
                }`}
              />
              <span className="text-sm font-medium select-none">
                {t("search.pet_allowed")}
              </span>
            </div>

            <div
              className={`flex items-center justify-center gap-2 px-4 h-12 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                fullyFurnished
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/30"
                  : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
              }`}
              onClick={() => setFullyFurnished(!fullyFurnished)}
            >
              <RiArmchairFill
                className={`h-5 w-5 ${
                  fullyFurnished ? "text-white" : "text-emerald-600"
                }`}
              />
              <span className="text-sm font-medium select-none">
                {t("search.fully_furnished")}
              </span>
            </div>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[210px] h-12 py-[23px] rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder={t("search.sort_by")} />
              </SelectTrigger>
              <SelectContent className="min-w-[210px]">
                <SelectItem value="NEWEST">
                  {t("search.sort_newest")}
                </SelectItem>
                <SelectItem value="PRICE_ASC">
                  {t("search.sort_price_asc")}
                </SelectItem>
                <SelectItem value="PRICE_DESC">
                  {t("search.sort_price_desc")}
                </SelectItem>
                <SelectItem value="AREA_ASC">
                  {t("search.sort_area_asc")}
                </SelectItem>
                <SelectItem value="AREA_DESC">
                  {t("search.sort_area_desc")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="ml-auto h-12 px-5 rounded-xl border-2 border-slate-200 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium shadow-sm bg-white"
            >
              <SlidersHorizontal className={`h-4 w-4 mr-2 text-rose-500 `} />
              {t("search.clear_filters")}
            </Button>
          </div>

          {/* Popular Areas List */}
          {availableAreas.length > 0 && (
            <div className="mt-4 pt-4  border-t border-slate-100 transition-all duration-300">
              {showAreaSection && (
                <div className="flex flex-wrap gap-x-2 gap-y-2 px-2 animate-in fade-in slide-in-from-top-1 transition-all duration-300">
                  <button
                    onClick={() => setArea("ALL")}
                    className={`text-md transition-colors ${
                      area === "ALL"
                        ? "font-semibold text-blue-600"
                        : "text-slate-500 hover:text-blue-600"
                    }`}
                  >
                    {t("search.all_locations")}
                  </button>
                  {availableAreas
                    .slice(0, isExpanded ? undefined : 15) // Show top 15 initially
                    .map((a) => (
                      <button
                        key={a.name}
                        onClick={() => setArea(a.name)}
                        className={`text-md transition-colors flex items-center gap-2  px-3 py-1  hover:bg-sky-50 rounded-lg ${
                          area === a.name
                            ? "font-semibold text-blue-600"
                            : "text-slate-500 hover:text-blue-600"
                        }`}
                      >
                        {getLocaleValue(
                          {
                            name: a.name,
                            name_en: a.name_en,
                            name_cn: a.name_cn,
                          },
                          "name",
                          language,
                        )}
                        <span className="text-md text-slate-400 font-light">
                          ({a.count})
                        </span>
                      </button>
                    ))}

                  {availableAreas.length > 15 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-md font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          {t("search.show_less")}{" "}
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          {t("search.show_more")} ({availableAreas.length - 15}){" "}
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
