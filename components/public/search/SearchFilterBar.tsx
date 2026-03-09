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
import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Armchair,
  Flame,
} from "lucide-react";
import { MdOutlinePets,MdWork } from "react-icons/md";
import { FaFire, FaTrainSubway } from "react-icons/fa6";
import { GiEarthAmerica } from "react-icons/gi";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { RiArmchairFill } from "react-icons/ri";
import { MdOutlinePerson, MdOutlineBusinessCenter } from "react-icons/md";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

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
  isForeigner: boolean;
  setIsForeigner: (v: boolean) => void;
  companyRegistered: boolean;
  setCompanyRegistered: (v: boolean) => void;
  isHotDeal: boolean;
  setIsHotDeal: (v: boolean) => void;
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
  availableProvinces: { name: string; count: number }[];
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
  isForeigner,
  setIsForeigner,
  companyRegistered,
  setCompanyRegistered,
  isHotDeal,
  setIsHotDeal,
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
    { value: "ALL", label: t("common.all") },
    { value: "HOUSE", label: t("home.property_types.house") },
    { value: "CONDO", label: t("home.property_types.condo") },
    {
      value: "OFFICE_BUILDING",
      label: t("home.property_types.office_building"),
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
    setSort("NEWEST");
    setArea("ALL");
    setProvince("ALL");
    setNearTrain(false);
    setPetFriendly(false);
    setFullyFurnished(false);
    setIsForeigner(false);
    setCompanyRegistered(false);
    setBedrooms("ALL");
  };

  return (
    <div className="bg-white border-b border-slate-100 sticky top-(--nav-offset,64px) z-30 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-[top] duration-500 ease-in-out">
      <div className="max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile View: Search + Filter Sheet */}
        <div className="xl:hidden flex gap-3 mb-4">
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
              className="h-[80vh] rounded-t-2xl flex flex-col p-0 bg-slate-50 "
            >
           
              <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white text-slate-900 rounded-t-4xl">
                <SheetTitle>{t("search.filter_title")}</SheetTitle>
              </SheetHeader>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* Location Zone */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <Accordion type="single" collapsible defaultValue="location" className="w-full">
                    <AccordionItem value="location" className="border-0">
                      <AccordionTrigger className="hover:no-underline py-0">
                        <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                          {t("search.province")} & {t("search.location")}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-6 px-1">
                        {/* Province (Mobile) */}
                        <div className="space-y-3">
                          <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                            {t("search.province")}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setProvince("ALL");
                                setArea("ALL");
                              }}
                              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                province === "ALL"
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
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
                                  key={p.name}
                                  onClick={() => {
                                    setProvince(p.name);
                                    setArea("ALL");
                                  }}
                                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-between gap-3 ${
                                    province === p.name
                                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                      : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                                  }`}
                                >
                                  <span>{getProvinceName(p.name, language)}</span>
                                  <span className={`text-[10px] opacity-70 ${province === p.name ? "text-white" : "text-slate-400"}`}>
                                    {p.count}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-3">
                          <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                            {t("search.location")}
                          </label>
                          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <button
                              onClick={() => setArea("ALL")}
                              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                area === "ALL"
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                              }`}
                            >
                              {t("search.all_locations")}
                            </button>
                            {availableAreas
                              .slice(0, showAllAreasMobile ? undefined : MOBILE_ITEMS_LIMIT)
                              .map((a) => (
                                <button
                                  key={a.name}
                                  onClick={() => setArea(a.name)}
                                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                    area === a.name
                                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                      : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                                  }`}
                                >
                                  {getLocaleValue({ name: a.name, name_en: a.name_en, name_cn: a.name_cn }, "name", language)}
                                </button>
                              ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Quick Filters Zone */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    {t("search.quick_filters")}
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {[
                      { state: nearTrain, setState: setNearTrain, icon: FaTrainSubway, label: "near_train", color: "blue", size: "h-5 w-5" },
                      { state: petFriendly, setState: setPetFriendly, icon: MdOutlinePets, label: "pet_allowed", color: "orange", size: "h-6 w-6" },
                      { state: fullyFurnished, setState: setFullyFurnished, icon: RiArmchairFill, label: "fully_furnished", color: "emerald", size: "h-6 w-6" },
                      { state: isForeigner, setState: setIsForeigner, icon: GiEarthAmerica, label: "foreigner", color: "purple", size: "h-6 w-6" },
                      { state: companyRegistered, setState: setCompanyRegistered, icon: MdWork, label: "company_registered", color: "indigo", size: "h-6 w-6" },
                      { state: isHotDeal, setState: setIsHotDeal, icon: FaFire, label: "hot_deal", color: "rose", size: "h-[22px] w-[22px]" },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-2xl border-2 transition-colors duration-200 cursor-pointer",
                          f.state
                            ? `bg-${f.color}-600 border-${f.color}-600 text-white shadow-md shadow-${f.color}-500/20`
                            : "bg-slate-50 border-transparent text-slate-600 hover:border-slate-200"
                        )}
                        onClick={() => f.setState(!f.state)}
                      >
                        <f.icon className={cn(f.size, f.state ? "text-white" : `text-${f.color}-500`)} />
                        <span className="text-[10px] font-medium text-center leading-tight">
                          {t(`search.${f.label}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property Detail Zone */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                    {t("search.property_details")}
                  </span>
                  
                  {/* Property Type */}
                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                      {t("search.property_type")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPES.map((pt) => {
                        const count = availableTypes[pt.value] || 0;
                        const hasItems = pt.value === "ALL" || count > 0;
                        const isActive = type === pt.value;

                        return (
                          <button
                            key={pt.value}
                            disabled={!hasItems}
                            onClick={() => {
                              setType(pt.value);
                              pushToDataLayer(GTM_EVENTS.SEARCH_FILTER, {
                                filter_type: "property_type",
                                filter_value: pt.value,
                                province,
                                popular_area: area,
                                item_category: pt.value,
                                listing_type: listingType,
                              });
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-3 ${
                              isActive
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : hasItems
                                  ? "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                                  : "bg-slate-50 text-slate-300 border-transparent opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <span>{pt.label}</span>
                            {count > 0 && pt.value !== "ALL" && (
                              <span
                                className={`text-[10px] opacity-70 ${isActive ? "text-white" : "text-emerald-500"}`}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
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
                          onClick={() => {
                            setListingType(opt.val);
                            pushToDataLayer(GTM_EVENTS.SEARCH_FILTER, {
                              filter_type: "listing_type",
                              filter_value: opt.val,
                              province,
                              popular_area: area,
                              item_category: type,
                              listing_type: opt.val
                            });
                          }}
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

                  {/* Price Range RENT */}
                  {(listingType === "RENT" ||
                    listingType === "ALL" ||
                    listingType === "SALE_AND_RENT") && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-900">
                        {t("search.price_range")}{" "}
                        {(listingType === "ALL" ||
                          listingType === "SALE_AND_RENT") &&
                          `(${t("search.rent")})`}
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
                            {t(`search.price_presets.rent.${preset.key}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range SALE */}
                  {(listingType === "SALE" ||
                    listingType === "ALL" ||
                    listingType === "SALE_AND_RENT") && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-900">
                        {t("search.price_range")}{" "}
                        {(listingType === "ALL" ||
                          listingType === "SALE_AND_RENT") &&
                          `(${t("search.buy")})`}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { min: "0", max: "3000000", key: "range_1" },
                          { min: "3000000", max: "7000000", key: "range_2" },
                          { min: "7000000", max: "15000000", key: "range_3" },
                          { min: "15000000", max: "", key: "range_4" },
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
                            {t(`search.price_presets.sale.${preset.key}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
        <div className="hidden xl:block">
          {/* Row 1: Core Search (Search, Province, Type, Listing Type, Price) */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            <div className="col-span-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder={t("search.keyword_placeholder")}
                  className="pl-12 h-12! text-sm rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all"
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
                <SelectTrigger className="h-12! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder={t("search.province")} />
                </SelectTrigger>
                <SelectContent >
                  <SelectItem value="ALL">{t("search.all_provinces")}</SelectItem>
                  {availableProvinces.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      <div className="flex items-center justify-between w-full gap-4 ">
                        <span>{getProvinceName(p.name, language)}</span>
                        <span className="text-[10px] text-slate-400">{p.count}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder={t("search.property_type")} />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((pt) => {
                    const count = availableTypes[pt.value] || 0;
                    return (
                      <SelectItem key={pt.value} value={pt.value} disabled={pt.value !== "ALL" && count === 0}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{pt.label}</span>
                          {pt.value !== "ALL" && count > 0 && <span className="text-[10px] text-slate-400">{count}</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <div className="grid grid-cols-4 gap-1 h-12! bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {[
                  { val: "ALL", label: t("common.all"), active: "bg-slate-600 border-slate-600" },
                  { val: "SALE", label: t("search.buy"), active: "bg-green-600 border-green-600" },
                  { val: "RENT", label: t("search.rent"), active: "bg-orange-600 border-orange-600" },
                  { val: "SALE_AND_RENT", label: t("search.rent_buy"), active: "bg-blue-600 border-blue-600" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setListingType(opt.val)}
                    className={`rounded-lg transition-all font-medium text-xs ${
                      listingType === opt.val ? `${opt.active} text-white shadow-sm` : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-1.5 h-12! bg-white rounded-xl border border-slate-200 shadow-sm px-2">
                <Input
                  type="number"
                  placeholder={t("search.min_budget")}
                  className="h-full w-full border-0 focus-visible:ring-0 text-sm p-0 bg-transparent shadow-none"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-slate-200 text-xs font-light">|</span>
                <Input
                  type="number"
                  placeholder={t("search.max_budget")}
                  className="h-full w-full border-0 focus-visible:ring-0 text-sm p-0 bg-transparent shadow-none"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Filters & Features */}
          <div className="flex items-center gap-3 mb-4">
            {/* Bedrooms */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm h-12">
              <span className="text-xs text-slate-500 font-medium px-2">{t("search.bedrooms")}</span>
              {["ALL", "1", "2", "3", "4+"].map((bed) => (
                <button
                  key={bed}
                  onClick={() => setBedrooms(bed)}
                  className={`h-9 px-3 rounded-lg transition-all font-medium text-sm ${
                    bedrooms === bed ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-indigo-50"
                  }`}
                >
                  {bed === "ALL" ? t("common.all") : bed}
                </button>
              ))}
            </div>

            {/* Features Grid */}
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={100}>
                {[
                  { state: nearTrain, setState: setNearTrain, icon: FaTrainSubway, label: "near_train", color: "blue" },
                  { state: petFriendly, setState: setPetFriendly, icon: MdOutlinePets, label: "pet_allowed", color: "orange" },
                  { state: fullyFurnished, setState: setFullyFurnished, icon: RiArmchairFill, label: "fully_furnished", color: "emerald" },
                  { state: isForeigner, setState: setIsForeigner, icon: GiEarthAmerica, label: "foreigner", color: "purple" },
                  { state: companyRegistered, setState: setCompanyRegistered, icon: MdWork, label: "company_registered", color: "indigo" },
                  { state: isHotDeal, setState: setIsHotDeal, icon: FaFire, label: "hot_deal", color: "rose" },
                ].map((f) => (
                  <Tooltip key={f.label}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => f.setState(!f.state)}
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-200 font-medium text-sm",
                          f.state
                            ? `bg-${f.color}-600 border-${f.color}-600 text-white shadow-md shadow-${f.color}-500/20`
                            : `bg-white border-slate-100 text-slate-400 hover:border-${f.color}-200 hover:text-${f.color}-600`
                        )}
                      >
                        <f.icon 
                          className={cn(
                            "transition-transform",
                            f.label === "near_train" ? "h-5 w-5" : 
                            f.label === "hot_deal" ? "h-[22px] w-[22px]" :
                            f.label === "fully_furnished" ? "h-6 w-6" :
                            "h-[22px] w-[22px]" // Default for Gi, Md icons
                          )} 
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      className={f.state 
                        ? `bg-${f.color}-600 border-${f.color}-600 text-white` 
                        : `bg-${f.color}-50 border-${f.color}-200 text-${f.color}-700`}
                    >
                      {t(`search.${f.label}`)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>

            {/* Sort & Clear */}
            <div className="ml-auto flex items-center gap-3">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] h-12! rounded-xl border-slate-200 bg-white ">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder={t("search.sort_by")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEWEST">{t("search.sort_newest")}</SelectItem>
                  <SelectItem value="PRICE_ASC">{t("search.sort_price_asc")}</SelectItem>
                  <SelectItem value="PRICE_DESC">{t("search.sort_price_desc")}</SelectItem>
                  <SelectItem value="AREA_ASC">{t("search.sort_area_asc")}</SelectItem>
                  <SelectItem value="AREA_DESC">{t("search.sort_area_desc")}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-12 px-5 rounded-xl border-2 border-slate-100 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 font-medium transition-all"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2 text-rose-500" />
                {t("search.clear_filters")}
              </Button>
            </div>
          </div>

          {/* Row 3: Popular Areas */}
          {availableAreas.length > 0 && (
            <div className="flex items-center gap-3 py-3 border-t border-slate-100">
               <button
                onClick={() => setShowAreaSection(!showAreaSection)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-all"
              >
                {t("search.popular_locations")}
                {showAreaSection ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showAreaSection && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={() => setArea("ALL")}
                    className={`text-sm transition-colors ${area === "ALL" ? "font-semibold text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
                  >
                    {t("search.all_locations")}
                  </button>
                  {availableAreas.slice(0, isExpanded ? undefined : 12).map((a) => (
                    <button
                      key={a.name}
                      onClick={() => setArea(a.name)}
                      className={`text-sm transition-colors flex items-center gap-1.5 ${
                        area === a.name ? "font-bold text-blue-600" : "text-slate-400 hover:text-blue-600"
                      }`}
                    >
                      {getLocaleValue({ name: a.name, name_en: a.name_en, name_cn: a.name_cn }, "name", language)}
                      <span className="text-sm opacity-60 text-blue-600">({a.count})</span>
                    </button>
                  ))}
                  {availableAreas.length > 12 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-sm font-bold text-slate-300 hover:text-slate-500"
                    >
                      {isExpanded ? t("search.show_less") : `+${availableAreas.length - 12} ${t("search.show_more")}`}
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
