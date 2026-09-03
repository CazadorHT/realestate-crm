"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagicAiSearch } from "./MagicAiSearch";
import { m, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Maximize2,
  Minimize2,
  DollarSign,
  Maximize,
} from "lucide-react";
import {
  FaFire as FireIcon,
  FaTrainSubway as TrainIcon,
  FaCity as CityIcon,
} from "react-icons/fa6";
import { PriceRangeSelect } from "./PriceRangeSelect";
import { AreaSizeSelect } from "./AreaSizeSelect";
import { QuickFeatureFilters } from "./QuickFeatureFilters";
import { StationSearchSelect } from "./StationSearchSelect";
import { cn } from "@/lib/utils";
import { formatStationLabel } from "@/lib/property-utils";
import { buildAreaHierarchy } from "@/lib/utils/area-hierarchy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const EXTRA_PANEL_STRINGS: Record<string, Record<string, string>> = {
  hide_extras: {
    th: "ยุบตัวกรอง/ทำเล",
    en: "Hide Tags & Areas",
    cn: "隐藏标签和区域",
    ru: "Скрыть теги и области"
  },
  show_extras: {
    th: "แสดงตัวกรอง/ทำเล",
    en: "Show Tags & Areas",
    cn: "显示标签和区域",
    ru: "Показать теги и области"
  }
};

const LOGO_PATHS: Record<string, string> = {
  BTS: "/images/transit/BTS-Logo.svg",
  GOLD: "/images/transit/BTS-Logo.svg",
  MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
  MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
  MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
  MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
  MRT_ORANGE: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
  ARL: "/images/transit/ARLbangkok.svg",
  SRT_RED: "/images/transit/SRT_Red_Lines_icon.svg",
  SRT: "/images/transit/SRT_Red_Lines_icon.svg",
  BRT: "/images/transit/Bangkok_BRT_logo.svg",
};

interface DesktopFiltersProps {
  keyword: string;
  setKeyword: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  listingType: string;
  setListingType: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  currentPriceOption: any;
  flatPriceOptions: any[];
  priceOptions: any[];
  priceCounts: Map<string, number>;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setPriceType?: (v: string) => void;
  currentSizeOption: any;
  sizeOptions: any[];
  sizeCounts: Map<string, number>;
  setMinSize: (v: string) => void;
  setMaxSize: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
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
  cbd?: boolean;
  setCbd?: (v: boolean) => void;
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
  availableProvinces: { name: string; count: number }[];
  availableTypes: Record<string, number>;
  availableListingTypes: Record<string, number>;
  availableQuickFilters: Record<string, number>;
  availableAreas: any[];
  area: string;
  setArea: (v: string) => void;
  showAreaSection: boolean;
  setShowAreaSection: (v: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  clearFilters: () => void;
  t: (key: string) => string;
  language: string;
  PROPERTY_TYPES: { value: string; label: string }[];
  getProvinceName: (name: string, lang: string) => string;
  getLocaleValue: (obj: any, field: string, lang: string) => string;
  transitStation: string;
  setTransitStation: (v: string) => void;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  setBulkFilters: (updates: any) => void;
}

const Badge = ({
  label,
  onClear,
  variant = "blue",
  icon,
}: {
  label: string;
  onClear: () => void;
  variant?: "blue" | "slate" | "emerald" | "purple" | "rose" | "red" | "teal";
  icon?: React.ReactNode;
}) => {
  const variants = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
    red: "bg-red-50 border-red-100 text-red-700",
    teal: "bg-teal-50 border-teal-100 text-teal-700",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-bold shadow-sm transition-all animate-in zoom-in-95",
        variants[variant],
      )}
    >
      {icon}
      <span>{label}</span>
      <button
        onClick={onClear}
        className="ml-1 p-0.5 rounded-full hover:bg-black/5 transition-colors"
      >
        <svg
          className="w-2.5 h-2.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export function DesktopFilters({
  keyword,
  setKeyword,
  province,
  setProvince,
  type,
  setType,
  listingType,
  setListingType,
  sort,
  setSort,
  currentPriceOption,
  flatPriceOptions,
  priceOptions,
  priceCounts,
  setMinPrice,
  setMaxPrice,
  setPriceType,
  currentSizeOption,
  sizeOptions,
  sizeCounts,
  setMinSize,
  setMaxSize,
  bedrooms,
  setBedrooms,
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
  cbd,
  setCbd,
  availableBedrooms,
  availableStations,
  allStations,
  availableProvinces,
  availableTypes,
  availableListingTypes,
  availableQuickFilters,
  availableAreas,
  area,
  setArea,
  showAreaSection,
  setShowAreaSection,
  isExpanded,
  setIsExpanded,
  clearFilters,
  t,
  language,
  PROPERTY_TYPES,
  getProvinceName,
  getLocaleValue,
  transitStation,
  setTransitStation,
  minPrice,
  maxPrice,
  minSize,
  maxSize,
  setBulkFilters,
}: DesktopFiltersProps) {
  const [showBottomPanel, setShowBottomPanel] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 2);
      setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 250;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    const timer = setTimeout(checkScroll, 150);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [availableAreas, showAreaSection, showBottomPanel]);

  const selectedAreaList = useMemo(() => {
    if (!area || area === "ALL") return [];
    return area.split(",").map((s) => s.trim()).filter(Boolean);
  }, [area]);

  const handleToggleArea = (areaName: string) => {
    if (selectedAreaList.includes(areaName)) {
      const remaining = selectedAreaList.filter((s) => s !== areaName);
      setArea(remaining.length > 0 ? remaining.join(",") : "ALL");
    } else {
      const next = [...selectedAreaList, areaName];
      setArea(next.join(","));
    }
  };

  const sortedAvailableAreas = useMemo(() => {
    return buildAreaHierarchy(availableAreas, language, getLocaleValue);
  }, [availableAreas, language, getLocaleValue]);

  const { row1Areas, row2Areas } = useMemo(() => {
    const r1: any[] = [];
    const r2: any[] = [];
    sortedAvailableAreas.forEach((item: any, idx: number) => {
      if (idx % 2 === 0) {
        r1.push(item);
      } else {
        r2.push(item);
      }
    });
    return { row1Areas: r1, row2Areas: r2 };
  }, [sortedAvailableAreas]);

  const renderAreaChip = (a: any) => {
    const hasChildren = a.children && a.children.length > 0;
    const isParentSelected = selectedAreaList.includes(a.name);
    const selectedChildrenCount = hasChildren
      ? a.children.filter((c: any) => selectedAreaList.includes(c.name)).length
      : 0;
    const isAnySelected = isParentSelected || selectedChildrenCount > 0;

    if (!hasChildren) {
      return (
        <button
          key={a.name}
          disabled={a.totalCount === 0}
          onClick={() => handleToggleArea(a.name)}
          className={`h-[30px] text-xs transition-colors flex items-center gap-1.5 px-3 py-1 shrink-0 rounded-lg whitespace-nowrap ${
            isParentSelected
              ? "font-bold text-blue-600 bg-blue-50/70"
              : a.totalCount === 0
                ? "text-slate-300 cursor-not-allowed opacity-60"
                : "text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50"
          }`}
        >
          {isParentSelected && (
            <svg
              className="w-3.5 h-3.5 animate-in zoom-in-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          <span>{a.localizedName}</span>
          <span
            className={`text-xs ${a.totalCount === 0 ? "opacity-30" : "opacity-60 text-blue-600"}`}
          >
            ({a.totalCount})
          </span>
        </button>
      );
    }

    // Compound chip with Dropdown for Parent Zone with children
    return (
      <div
        key={a.name}
        className={`h-[30px] inline-flex items-center rounded-lg border text-xs shrink-0 transition-all whitespace-nowrap ${
          isAnySelected
            ? "bg-blue-50/80 border-blue-200 text-blue-700 shadow-xs"
            : "bg-slate-50 border-slate-100/80 text-slate-600 hover:border-slate-200"
        }`}
      >
        {/* Main button (Select entire zone) */}
        <button
          type="button"
          onClick={() => handleToggleArea(a.name)}
          className="h-full flex items-center gap-1.5 px-2.5 py-1 hover:text-blue-600 transition-colors whitespace-nowrap"
          title={
            language === "en"
              ? `Select all ${a.localizedName} zone`
              : `เลือกโซน ${a.localizedName} ทั้งหมด`
          }
        >
          {isParentSelected && (
            <svg
              className="w-3.5 h-3.5 text-blue-600 animate-in zoom-in-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          <span className={isAnySelected ? "font-bold text-blue-700" : "text-slate-600"}>
            {a.localizedName}
          </span>
          {selectedChildrenCount > 0 && !isParentSelected ? (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full leading-none shadow-2xs"
              title={`${selectedChildrenCount} ${language === "en" ? "sub-areas selected" : "ทำเลย่อยที่เลือก"}`}
            >
              {selectedChildrenCount}
            </span>
          ) : (
            <span className="text-xs opacity-75 text-blue-600 font-semibold">
              ({a.totalCount})
            </span>
          )}
        </button>

        {/* Sub-zone Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`h-full px-1.5 border-l border-slate-200/60 hover:bg-black/5 rounded-r-lg transition-colors flex items-center justify-center ${
                selectedChildrenCount > 0 ? "text-blue-600 bg-blue-100/50" : "text-slate-400 hover:text-blue-600"
              }`}
              title={language === "en" ? "Select sub-areas" : "เลือกทำเลย่อย"}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 p-1.5 z-50 shadow-lg">
            <DropdownMenuLabel className="text-[11px] text-slate-400 font-medium uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>{language === "en" ? `Zone: ${a.localizedName}` : `โซน: ${a.localizedName}`}</span>
              {selectedChildrenCount > 0 && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {language === "en" ? `${selectedChildrenCount} selected` : `เลือกแล้ว ${selectedChildrenCount}`}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => handleToggleArea(a.name)}
              className={`flex items-center justify-between text-xs py-2 px-2 cursor-pointer font-semibold rounded-md transition-colors ${
                isParentSelected ? "bg-blue-50 text-blue-700" : "hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    isParentSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {isParentSelected && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {language === "en" ? `All ${a.localizedName}` : `ทั้งหมดใน ${a.localizedName}`}
              </span>
              <span className="text-xs font-semibold text-blue-600">({a.totalCount})</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {a.count > 0 && (
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() => handleToggleArea(a.name)}
                className={`flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-md transition-colors ${
                  isParentSelected ? "bg-blue-50/50 text-blue-700 font-medium" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isParentSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {isParentSelected && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span>
                    {a.localizedName} {language === "en" ? "(Original)" : language === "cn" ? "(原区)" : language === "ru" ? "(Основной)" : "(เดิม)"}
                  </span>
                </span>
                <span className="text-slate-400 text-[11px]">({a.count})</span>
              </DropdownMenuItem>
            )}
            {a.children.map((c: any) => {
              const isChildSelected = selectedAreaList.includes(c.name);
              return (
                <DropdownMenuItem
                  key={c.name}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => handleToggleArea(c.name)}
                  className={`flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-md transition-colors ${
                    isChildSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isChildSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChildSelected && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span>{c.localizedName}</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">({c.count})</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const hasActiveFilters = useMemo(() => {
    return (
      keyword !== "" ||
      province !== "ALL" ||
      type !== "ALL" ||
      listingType !== "ALL" ||
      area !== "ALL" ||
      transitStation !== "" ||
      minPrice !== "0" ||
      maxPrice !== "0" ||
      minSize !== "0" ||
      maxSize !== "0" ||
      bedrooms !== "ALL" ||
      petFriendly ||
      fullyFurnished ||
      isForeigner ||
      companyRegistered ||
      isHotDeal ||
      allowAirbnb ||
      !!cbd
    );
  }, [
    keyword,
    province,
    type,
    listingType,
    area,
    transitStation,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    bedrooms,
    petFriendly,
    fullyFurnished,
    isForeigner,
    companyRegistered,
    isHotDeal,
    allowAirbnb,
    cbd,
  ]);

  const hasBadges = useMemo(() => {
    return (
      province !== "ALL" ||
      type !== "ALL" ||
      listingType !== "ALL" ||
      area !== "ALL" ||
      transitStation !== "" ||
      minPrice !== "0" ||
      maxPrice !== "0" ||
      minSize !== "0" ||
      maxSize !== "0" ||
      bedrooms !== "ALL" ||
      petFriendly ||
      fullyFurnished ||
      isForeigner ||
      companyRegistered ||
      isHotDeal ||
      allowAirbnb ||
      !!cbd
    );
  }, [
    province,
    type,
    listingType,
    area,
    transitStation,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    bedrooms,
    petFriendly,
    fullyFurnished,
    isForeigner,
    companyRegistered,
    isHotDeal,
    allowAirbnb,
    cbd,
  ]);

  const formatPrice = (val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) return val;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    return num.toLocaleString();
  };

  return (
    <div className="hidden xl:block">
      {/* Row 1: Core Search */}
      <div className="grid grid-cols-12 gap-2 mb-3">
        <div className="col-span-3 ">
          <MagicAiSearch keyword={keyword} setKeyword={setKeyword} />
        </div>

        <div className="col-span-2">
          <Select
            value={province}
            onValueChange={(val) => {
              setProvince(val);
              setArea("ALL");
            }}
          >
            <SelectTrigger className="h-10! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-xs">
              <SelectValue placeholder={t("search.province")} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="ALL">{t("search.all_provinces")}</SelectItem>
              {availableProvinces.map((p) => (
                <SelectItem
                  key={p.name}
                  value={p.name}
                  disabled={p.count === 0}
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className={p.count === 0 ? "text-slate-400" : ""}>
                      {getProvinceName(p.name, language)}
                    </span>
                    <span
                      className={`text-xs ${p.count === 0 ? "text-slate-300" : "text-blue-500"}`}
                    >
                      ({p.count})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-10! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-xs">
              <SelectValue placeholder={t("search.property_type")} />
            </SelectTrigger>
            <SelectContent align="start">
              {PROPERTY_TYPES.map((pt) => {
                const count = pt.value.includes(",")
                  ? pt.value.split(",").reduce((sum, val) => sum + (availableTypes[val] || 0), 0)
                  : (availableTypes[pt.value] || 0);
                const isDisabled = count === 0 && pt.value !== "ALL";
                return (
                  <SelectItem
                    key={pt.value}
                    value={pt.value}
                    disabled={isDisabled}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span
                        className={
                          pt.value !== "ALL" && count === 0
                            ? "text-slate-400"
                            : ""
                        }
                      >
                        {pt.label}
                      </span>
                      {pt.value !== "ALL" && (
                        <span
                          className={`text-xs ${count === 0 ? "text-slate-300" : "text-blue-500"}`}
                        >
                          ({count})
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
          <div className="grid grid-cols-4 gap-1 h-10! bg-white  rounded-xl border border-slate-200 shadow-sm">
            {[
              {
                val: "ALL",
                label: t("common.all"),
                active: "bg-slate-600 border-slate-600",
              },
              {
                val: "SALE",
                label: t("search.buy"),
                active: "bg-green-600 border-green-600",
              },
              {
                val: "RENT",
                label: t("search.rent"),
                active: "bg-orange-600 border-orange-600",
              },
              {
                val: "SALE_AND_RENT",
                label: t("search.rent_buy"),
                active: "bg-blue-600 border-blue-600",
              },
            ].map((opt) => {
              const count = availableListingTypes[opt.val] || 0;
              const isDisabled = count === 0 && opt.val !== "ALL";
              return (
                <button
                  key={opt.val}
                  disabled={isDisabled}
                  onClick={() => setListingType(opt.val)}
                  className={`rounded-lg transition-all font-medium text-xs ${
                    listingType === opt.val
                      ? `${opt.active} text-white shadow-sm`
                      : isDisabled
                        ? "text-slate-300 bg-slate-50 cursor-not-allowed opacity-60"
                        : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full h-10! rounded-xl border-slate-200 bg-white text-xs">
              <SelectValue placeholder={t("search.sort_by")} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="NEWEST">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{t("search.sort_newest")}</span>
                </div>
              </SelectItem>
              <SelectItem value="PRICE_ASC">
                <div className="flex items-center gap-2">
                  <ArrowUpNarrowWide className="h-4 w-4 text-emerald-500" />
                  <span>{t("search.sort_price_asc")}</span>
                </div>
              </SelectItem>
              <SelectItem value="PRICE_DESC">
                <div className="flex items-center gap-2">
                  <ArrowDownWideNarrow className="h-4 w-4 text-rose-500" />
                  <span>{t("search.sort_price_desc")}</span>
                </div>
              </SelectItem>
              <SelectItem value="AREA_ASC">
                <div className="flex items-center gap-2">
                  <Minimize2 className="h-4 w-4 text-blue-500" />
                  <span>{t("search.sort_area_asc")}</span>
                </div>
              </SelectItem>
              <SelectItem value="AREA_DESC">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-indigo-500" />
                  <span>{t("search.sort_area_desc")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Secondary Filters */}
      <div className="flex items-center gap-2 mb-3">
        <PriceRangeSelect
          currentPriceOption={currentPriceOption}
          flatPriceOptions={flatPriceOptions}
          priceOptions={priceOptions}
          priceCounts={priceCounts}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          setPriceType={setPriceType}
          placeholder={t("search.price_range")}
          className="w-[180px]"
        />

        <AreaSizeSelect
          currentSizeOption={currentSizeOption}
          sizeOptions={sizeOptions}
          sizeCounts={sizeCounts}
          setMinSize={setMinSize}
          setMaxSize={setMaxSize}
          placeholder={t("search.area_size") || "ขนาดพื้นที่"}
          className="w-[170px]"
        />

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm h-10">
          <span className="text-xs text-slate-500 font-medium px-2">
            {t("search.bedrooms")}
          </span>
          {["ALL", "1", "2", "3", "4+"].map((bed) => {
            const count = availableBedrooms[bed] || 0;
            const isDisabled = count === 0 && bed !== "ALL";

            return (
              <button
                key={bed}
                disabled={isDisabled}
                onClick={() => setBedrooms(bed)}
                className={`h-8 px-3 rounded-lg transition-all font-medium text-xs flex items-center gap-1.5 ${
                  bedrooms === bed
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isDisabled
                      ? "text-slate-300 bg-slate-50 cursor-not-allowed opacity-60"
                      : "text-slate-600 hover:bg-indigo-50"
                }`}
              >
                <span>{bed === "ALL" ? t("common.all") : bed}</span>
              </button>
            );
          })}
        </div>

        <StationSearchSelect
          transitStation={transitStation}
          setTransitStation={setTransitStation}
          availableStations={availableStations}
          allStations={allStations}
          t={t}
          language={language}
          getLocaleValue={getLocaleValue}
          className="w-[180px]"
        />

        <QuickFeatureFilters
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
          cbd={cbd}
          setCbd={setCbd}
          availableQuickFilters={availableQuickFilters}
          t={t}
        />

        {/* Toggle Button for Bottom Panel (Active Filters & Popular Areas) */}
        <button
          onClick={() => setShowBottomPanel(!showBottomPanel)}
          className={cn(
            "ml-auto h-10 px-3.5 flex items-center gap-1.5 text-xs font-bold rounded-xl border transition-all duration-250 shadow-xs",
            showBottomPanel
              ? "bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200"
              : "bg-blue-50 hover:bg-blue-100/80 text-blue-600 border-blue-200"
          )}
          title={
            showBottomPanel
              ? EXTRA_PANEL_STRINGS.hide_extras[language] || EXTRA_PANEL_STRINGS.hide_extras.th
              : EXTRA_PANEL_STRINGS.show_extras[language] || EXTRA_PANEL_STRINGS.show_extras.th
          }
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>
            {showBottomPanel
              ? EXTRA_PANEL_STRINGS.hide_extras[language] || EXTRA_PANEL_STRINGS.hide_extras.th
              : EXTRA_PANEL_STRINGS.show_extras[language] || EXTRA_PANEL_STRINGS.show_extras.th}
          </span>
          {showBottomPanel ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Animated Bottom Panel (Active Filters & Popular Areas) */}
      <AnimatePresence initial={false}>
        {showBottomPanel && (hasActiveFilters || sortedAvailableAreas.length > 0) && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {/* Unified Active Filters Bar */}
              {hasActiveFilters && (
                <div className="flex items-start justify-between gap-4 mb-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-start gap-3 flex-1 flex-wrap">
                    <div className="h-[30px] flex items-center">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        {t("search.active_filters")}:
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {listingType !== "ALL" && (
                        <Badge
                          label={t(`search.listing_${listingType.toLowerCase()}`)}
                          onClear={() => setListingType("ALL")}
                          variant="blue"
                        />
                      )}
                      {type !== "ALL" && (
                        <Badge
                          label={
                            PROPERTY_TYPES.find((pt) => pt.value === type)?.label ||
                            type
                          }
                          onClear={() => setType("ALL")}
                          variant="blue"
                        />
                      )}
                      {province !== "ALL" && (
                        <Badge
                          label={getProvinceName(province, language)}
                          onClear={() => setProvince("ALL")}
                          variant="slate"
                        />
                      )}
                      {area !== "ALL" && (
                        selectedAreaList.map((selectedAreaName) => {
                          const found = availableAreas.find((a) => a.name === selectedAreaName);
                          const label = found
                            ? getLocaleValue(
                                {
                                  name: found.name,
                                  name_en: found.name_en,
                                  name_cn: found.name_cn,
                                  name_ru: found.name_ru,
                                },
                                "name",
                                language,
                              )
                            : selectedAreaName.replace("_", " ");
                          return (
                            <Badge
                              key={selectedAreaName}
                              label={label}
                              onClear={() => {
                                const remaining = selectedAreaList.filter((s) => s !== selectedAreaName);
                                setArea(remaining.length > 0 ? remaining.join(",") : "ALL");
                              }}
                              variant="slate"
                            />
                          );
                        })
                      )}
                      {transitStation && (
                        <Badge
                          label={(() => {
                            const found = (allStations || availableStations).find(
                              (s) => s.name === transitStation,
                            );
                            if (!found) return transitStation.split("|")[0].replace("_", " ");
                            const localized = getLocaleValue(
                              {
                                name: found.name.split("|")[0],
                                name_en: found.name_en,
                                name_cn: found.name_cn,
                                name_ru: found.name_ru,
                              },
                              "name",
                              language,
                            ).replace("_", " ");
                            return found.type ? formatStationLabel(found.type, localized, language) : localized;
                          })()}
                          onClear={() => setTransitStation("")}
                          variant={(() => {
                            const found = (allStations || availableStations).find(
                              (s) => s.name === transitStation,
                            );
                            if (!found) return "blue";
                            const t = found.type.toUpperCase();
                            if (t === "BTS") return "emerald";
                            if (t === "GOLD") return "slate";
                            if (t === "MRT_PURPLE") return "purple";
                            if (t === "MRT_YELLOW") return "slate";
                            if (t === "MRT_PINK" || t === "ARL") return "rose";
                            if (t === "SRT" || t === "SRT_RED") return "red";
                            if (t === "BRT") return "teal";
                            return "blue";
                          })()}
                          icon={(() => {
                            const found = (allStations || availableStations).find(
                              (s) => s.name === transitStation,
                            );
                            if (!found) return <TrainIcon className="w-3 h-3 text-blue-500" />;
                            const logoPath = LOGO_PATHS[found.type.toUpperCase()];
                            return logoPath ? (
                              <div className="w-4.5 h-4.5 shrink-0 flex items-center justify-center bg-white rounded-md p-0.5 border border-slate-200/50 mr-0.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={logoPath} alt="Logo" className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <TrainIcon className="w-3 h-3 text-blue-500" />
                            );
                          })()}
                        />
                      )}
                      {bedrooms !== "ALL" && (
                        <Badge
                          label={`${bedrooms} ${t("search.bedrooms")}`}
                          onClear={() => setBedrooms("ALL")}
                          variant="slate"
                        />
                      )}
                      {/* Price Badge */}
                      {((minPrice && minPrice !== "0") ||
                        (maxPrice && maxPrice !== "0")) && (
                        <Badge
                          label={
                            minPrice && minPrice !== "0" && maxPrice && maxPrice !== "0"
                              ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                              : minPrice && minPrice !== "0"
                                ? `> ${formatPrice(minPrice)}`
                                : `< ${formatPrice(maxPrice)}`
                          }
                          onClear={() => {
                            setMinPrice("0");
                            setMaxPrice("0");
                          }}
                          variant="emerald"
                          icon={<DollarSign className="w-3 h-3" />}
                        />
                      )}

                      {/* Size Badge */}
                      {((minSize && minSize !== "0") ||
                        (maxSize && maxSize !== "0")) && (
                        <Badge
                          label={
                            minSize && minSize !== "0" && maxSize && maxSize !== "0"
                              ? `${minSize} - ${maxSize} sqm`
                              : minSize && minSize !== "0"
                                ? `> ${minSize} sqm`
                                : `< ${maxSize} sqm`
                          }
                          onClear={() => {
                            setMinSize("0");
                            setMaxSize("0");
                          }}
                          variant="emerald"
                          icon={<Maximize className="w-3 h-3" />}
                        />
                      )}
                      {petFriendly && (
                        <Badge
                          label={t("search.pet_allowed")}
                          onClear={() => setPetFriendly(false)}
                          variant="purple"
                        />
                      )}
                      {cbd && (
                        <Badge
                          label={t("search.cbd_location") || "ย่าน CBD"}
                          onClear={() => setCbd?.(false)}
                          variant="emerald"
                          icon={<CityIcon className="w-3 h-3" />}
                        />
                      )}
                      {fullyFurnished && (
                        <Badge
                          label={t("search.fully_furnished")}
                          onClear={() => setFullyFurnished(false)}
                          variant="purple"
                        />
                      )}
                      {isForeigner && (
                        <Badge
                          label={t("search.foreigner")}
                          onClear={() => setIsForeigner(false)}
                          variant="purple"
                        />
                      )}
                      {companyRegistered && (
                        <Badge
                          label={t("search.company_registered")}
                          onClear={() => setCompanyRegistered(false)}
                          variant="purple"
                        />
                      )}
                      {isHotDeal && (
                        <Badge
                          label={t("search.hot_deal")}
                          onClear={() => setIsHotDeal(false)}
                          variant="rose"
                          icon={<FireIcon className="w-3 h-3" />}
                        />
                      )}
                      {allowAirbnb && (
                        <Badge
                          label={t("search.allow_airbnb")}
                          onClear={() => setAllowAirbnb(false)}
                          variant="rose"
                        />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {t("search.clear_all")}
                  </button>
                </div>
              )}

              {/* Row 3: Popular Areas */}
{sortedAvailableAreas.length > 0 && (
  <div className="flex items-start gap-3 border-t border-slate-100 py-3">
    {/* ปุ่มกดเปิด-ปิด สลับสถานะซ่อน/แสดงทำเลทั้งหมด */}
    <button
      onClick={() => setShowAreaSection(!showAreaSection)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-all shrink-0"
    >
      {t("search.popular_locations")}
      {showAreaSection ? (
        <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )}
    </button>

    {/* กล่องบรรจุรายการทำเลทั้งหมด: จะทำงานและแสดงผลก็ต่อเมื่อ showAreaSection เป็น true เท่านั้น */}
    {showAreaSection && (
      <div className="relative flex-1 overflow-hidden px-8 animate-in ease-in-out duration-500">
        {/* กล่องโครงสร้าง 2 แถว เลื่อนซ้าย-ขวา แบบอิสระ (ความกว้างของใครของมัน ไม่ยืด) */}
        <div
          ref={scrollRef}
          className="overflow-x-auto flex flex-col gap-1.5 py-1 scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {/* แถวที่ 1 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setArea("ALL")}
              className={`h-[30px] text-xs transition-colors shrink-0 px-3 py-1 flex items-center rounded-lg whitespace-nowrap ${
                area === "ALL" || selectedAreaList.length === 0
                  ? "font-semibold text-blue-600 bg-blue-50/70"
                  : "text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50"
              }`}
            >
              {t("search.all_locations")}
            </button>
            {row1Areas.map(renderAreaChip)}
          </div>

          {/* แถวที่ 2 */}
          {row2Areas.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {row2Areas.map(renderAreaChip)}
            </div>
          )}
        </div>

        {/* แถบ Gradient จางๆ ด้านซ้าย */}
        {showLeftArrow && (
          <div className="absolute left-8 top-0 bottom-0 w-12 bg-gradient-to-l from-transparent to-white pointer-events-none z-10 animate-in fade-in duration-200" />
        )}
        
        {/* แถบ Gradient จางๆ ด้านขวา */}
        {showRightArrow && (
          <div className="absolute right-8 top-0 bottom-0 w-12 bg-gradient-to-r from-transparent to-white pointer-events-none z-10 animate-in fade-in duration-200" />
        )}

        {/* ปุ่มลูกศรเลื่อนไปทางซ้าย */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all z-20 hover:scale-105 active:scale-95 duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* ปุ่มลูกศรเลื่อนไปทางขวา */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all z-20 hover:scale-105 active:scale-95 duration-150"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
  </div>
)}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
