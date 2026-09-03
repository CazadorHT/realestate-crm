"use client";
import { useState, useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Minimize2,
  Maximize2,
  CircleDollarSign,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MobileFilterSheet } from "./MobileFilterSheet";
import { MagicAiSearch } from "./MagicAiSearch";
import { formatStationLabel } from "@/lib/property-utils";
import { buildAreaHierarchy } from "@/lib/utils/area-hierarchy";

import {
  MdManageSearch,
  MdOutlinePets as PetIcon,
  MdWork as WorkIcon,
} from "react-icons/md";
import {
  FaFire as FireIcon,
  FaTrainSubway as TrainIcon,
  FaAirbnb,
  FaCity as CityIcon,
} from "react-icons/fa6";
import { GiEarthAmerica as EarthIcon } from "react-icons/gi";
import { RiArmchairFill as ArmchairIcon } from "react-icons/ri";
import {
  MdOutlineApartment,
  MdOutlineHouse,
  MdOutlineWarehouse,
  MdOutlineStorefront,
  MdOutlinePool,
  MdOutlineLandscape,
  MdOutlineHolidayVillage,
} from "react-icons/md";
import {
  HiOutlineBuildingOffice2,
  HiOutlineHomeModern,
  HiOutlineSquares2X2,
} from "react-icons/hi2";

const LOGO_PATHS: Record<string, string> = {
  BTS: "/images/transit/BTS-Logo.svg",
  GOLD: "/images/transit/BTS-Logo.svg",
  MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
  MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
  MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
  MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_logo.svg",
  MRT_ORANGE: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
  ARL: "/images/transit/ARL_(Bangkok)_logo.svg",
  SRT_RED: "/images/transit/SRT_(Bangkok)_Red_logo.svg",
  SRT: "/images/transit/SRT_(Bangkok)_Red_logo.svg",
  BRT: "/images/transit/BRT_(Bangkok)_logo.svg",
};

interface MobileFiltersProps {
  keyword: string;
  setKeyword: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
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
  cbd?: boolean;
  setCbd?: (v: boolean) => void;
  type: string;
  setType: (v: string) => void;
  listingType: string;
  setListingType: (v: string) => void;
  priceType?: string;
  setPriceType?: (v: string) => void;
  currentPriceOption: any;
  flatPriceOptions: any[];
  priceOptions: any[];
  priceCounts: Map<string, number>;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  currentSizeOption: any;
  sizeOptions: any[];
  sizeCounts: Map<string, number>;
  setMinSize: (v: string) => void;
  setMaxSize: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  availableProvinces: { name: string; count: number }[];
  availableAreas: any[];
  availableTypes: Record<string, number>;
  availableListingTypes: Record<string, number>;
  filteredLength: number;
  showAllProvincesMobile: boolean;
  setShowAllProvincesMobile: (v: boolean) => void;
  showAllAreasMobile: boolean;
  setShowAllAreasMobile: (v: boolean) => void;
  sort: string;
  setSort: (v: string) => void;
  t: (key: string) => string;
  language: string;
  PROPERTY_TYPES: { value: string; label: string }[];
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
  getProvinceName: (name: string, lang: string) => string;
  getLocaleValue: (item: any, field: string, lang: string) => string;
  MOBILE_ITEMS_LIMIT: number;
  pushToDataLayer: (event: string, params: any) => void;
  GTM_EVENTS: any;
  setBulkFilters: (updates: any) => void;
  transitStation: string;
  setTransitStation: (v: string) => void;
  allStations?: {
    name: string;
    type: string;
    name_en?: string | null;
    name_cn?: string | null;
    name_ru?: string | null;
  }[];
}

export function MobileFilters({
  keyword,
  setKeyword,
  province,
  setProvince,
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
  cbd,
  setCbd,
  type,
  setType,
  listingType,
  setListingType,
  priceType,
  setPriceType,
  currentPriceOption,
  flatPriceOptions,
  priceOptions,
  priceCounts,
  setMinPrice,
  setMaxPrice,
  currentSizeOption,
  sizeOptions,
  sizeCounts,
  setMinSize,
  setMaxSize,
  bedrooms,
  setBedrooms,
  availableProvinces,
  availableAreas,
  availableTypes,
  availableListingTypes,
  availableQuickFilters,
  availableBedrooms,
  availableStations,
  filteredLength,
  showAllProvincesMobile,
  setShowAllProvincesMobile,
  showAllAreasMobile,
  setShowAllAreasMobile,
  sort,
  setSort,
  t,
  language,
  PROPERTY_TYPES,
  getProvinceName,
  getLocaleValue,
  MOBILE_ITEMS_LIMIT,
  pushToDataLayer,
  GTM_EVENTS,
  setBulkFilters,
  transitStation,
  setTransitStation,
  allStations,
}: MobileFiltersProps) {
  const [trainTypeFilter, setTrainTypeFilter] = useState<string>("ALL");

  const sortedAvailableAreas = useMemo(() => {
    return buildAreaHierarchy(availableAreas, language, getLocaleValue);
  }, [availableAreas, language, getLocaleValue]);

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

  const getNormalizedType = (type: string): string => {
    const t = type.toUpperCase();
    if (t === "BTS" || t === "GOLD") return "BTS";
    if (t.startsWith("MRT")) return "MRT";
    if (t === "ARL") return "ARL";
    if (t === "SRT_RED" || t === "SRT") return "SRT";
    if (t === "BRT") return "BRT";
    return t;
  };

  const getTypeBadgeClass = (type: string): string => {
    const norm = getNormalizedType(type);
    switch (norm) {
      case "BTS":
        return "bg-emerald-600";
      case "MRT":
        return "bg-blue-800";
      case "ARL":
        return "bg-rose-600";
      case "SRT":
        return "bg-red-700";
      case "BRT":
        return "bg-teal-600";
      default:
        return "bg-slate-500";
    }
  };

  const getTypeTabClass = (type: string, isActive: boolean): string => {
    if (!isActive)
      return "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";
    const norm = getNormalizedType(type);
    switch (norm) {
      case "BTS":
        return "bg-emerald-600 text-white border-emerald-600 shadow-xs";
      case "MRT":
        return "bg-blue-800 text-white border-blue-800 shadow-xs";
      case "ARL":
        return "bg-rose-600 text-white border-rose-600 shadow-xs";
      case "SRT":
        return "bg-red-700 text-white border-red-700 shadow-xs";
      case "BRT":
        return "bg-teal-600 text-white border-teal-600 shadow-xs";
      default:
        return "bg-slate-700 text-white border-slate-700 shadow-xs";
    }
  };

  const trainTypes = useMemo(() => {
    const list =
      allStations && allStations.length > 0 ? allStations : availableStations;
    const types = new Set(
      list
        .filter((s) => s.type !== "EXPRESSWAY" && s.type !== "MAIN_ROAD")
        .map((s) => getNormalizedType(s.type)),
    );
    return Array.from(types).filter(Boolean).sort();
  }, [availableStations, allStations]);

  const mergedStations = useMemo(() => {
    const list =
      allStations && allStations.length > 0 ? allStations : availableStations;
    const filteredList = list.filter(
      (s) => s.type !== "EXPRESSWAY" && s.type !== "MAIN_ROAD",
    );
    const countsMap = new Map(availableStations.map((s) => [s.name, s.count]));

    return filteredList
      .map((s) => ({
        ...s,
        count: countsMap.get(s.name) || 0,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [availableStations, allStations]);

  const filteredStations = useMemo(() => {
    return mergedStations.filter((station) => {
      if (
        trainTypeFilter !== "ALL" &&
        getNormalizedType(station.type) !== trainTypeFilter
      ) {
        return false;
      }
      return true;
    });
  }, [mergedStations, trainTypeFilter]);

  const getPropertyIcon = (val: string, isActive: boolean) => {
    const iconClass = "w-4 h-4 transition-colors";
    switch (val) {
      case "ALL":
        return (
          <HiOutlineSquares2X2
            className={cn(
              iconClass,
              isActive ? "text-white" : "text-slate-400",
            )}
          />
        );
      case "HOUSE":
        return (
          <MdOutlineHouse
            className={cn(
              iconClass,
              isActive ? "text-white" : "text-orange-500",
            )}
          />
        );
      case "CONDO":
        return (
          <MdOutlineApartment
            className={cn(iconClass, isActive ? "text-white" : "text-blue-500")}
          />
        );
      case "OFFICE_BUILDING":
        return (
          <HiOutlineBuildingOffice2
            className={cn(
              iconClass,
              isActive ? "text-white" : "text-slate-600",
            )}
          />
        );
      case "VILLA":
        return (
          <HiOutlineHomeModern
            className={cn(
              iconClass,
              isActive ? "text-white" : "text-amber-600",
            )}
          />
        );
      case "POOL_VILLA":
        return (
          <MdOutlinePool
            className={cn(iconClass, isActive ? "text-white" : "text-cyan-500")}
          />
        );
      case "TOWNHOME":
        return (
          <MdOutlineHolidayVillage
            className={cn(
              iconClass,
              isActive ? "text-white" : "text-emerald-600",
            )}
          />
        );
      case "LAND":
        return (
          <MdOutlineLandscape
            className={cn(
              iconClass,
              isActive ? "text-white" : "text-stone-500",
            )}
          />
        );
      case "COMMERCIAL_BUILDING":
        return (
          <MdOutlineStorefront
            className={cn(iconClass, isActive ? "text-white" : "text-rose-500")}
          />
        );
      case "WAREHOUSE":
        return (
          <MdOutlineWarehouse
            className={cn(
              iconClass,
              isActive ? "text-white" : "text-indigo-600",
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="xl:hidden flex gap-3 my-4">
        <div className="flex-1">
          <MagicAiSearch keyword={keyword} setKeyword={setKeyword} />
        </div>
        {/* Sort by */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-12 w-12 p-0 rounded-xl border-slate-200 bg-white shadow-sm shrink-0"
            >
              <ArrowUpNarrowWide className="h-5 w-5 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-auto rounded-t-2xl flex flex-col p-0 bg-slate-50 overflow-hidden"
          >
            <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white text-slate-900">
              <SheetTitle>{t("search.sort_by")}</SheetTitle>
            </SheetHeader>
            <div className="p-4 pb-12 space-y-2">
              {[
                {
                  value: "NEWEST",
                  label: t("search.sort_newest"),
                  icon: Sparkles,
                  color: "text-amber-500",
                },
                {
                  value: "PRICE_ASC",
                  label: t("search.sort_price_asc"),
                  icon: ArrowUpNarrowWide,
                  color: "text-emerald-500",
                },
                {
                  value: "PRICE_DESC",
                  label: t("search.sort_price_desc"),
                  icon: ArrowDownWideNarrow,
                  color: "text-rose-500",
                },
                {
                  value: "AREA_ASC",
                  label: t("search.sort_area_asc"),
                  icon: Minimize2,
                  color: "text-blue-500",
                },
                {
                  value: "AREA_DESC",
                  label: t("search.sort_area_desc"),
                  icon: Maximize2,
                  color: "text-indigo-500",
                },
              ].map((opt) => (
                <SheetClose asChild key={opt.value}>
                  <button
                    onClick={() => setSort(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                      sort === opt.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-300",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <opt.icon
                        className={cn(
                          "h-5 w-5",
                          sort === opt.value ? "text-white" : opt.color,
                        )}
                      />
                      <span className="font-medium text-sm">{opt.label}</span>
                    </div>
                    {sort === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                    )}
                  </button>
                </SheetClose>
              ))}
            </div>
            <div className="h-4 bg-slate-50" />
          </SheetContent>
        </Sheet>
        {/* Filter */}
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
            className="h-[75vh] rounded-t-2xl flex flex-col p-0 bg-slate-50 "
          >
            <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white text-slate-900 rounded-t-4xl">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded-2xl">
                  <MdManageSearch className="h-6 w-6 text-blue-600" />
                </div>
                <SheetTitle className="text-xl font-medium text-slate-900">
                  {t("search.filter_title")}
                </SheetTitle>
              </div>
            </SheetHeader>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Quick Filters Zone */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  {t("search.quick_filters")}
                </span>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                  {[
                    {
                      key: "nearTrain",
                      state: nearTrain,
                      setState: setNearTrain,
                      icon: TrainIcon,
                      label: "near_train",
                      color: "blue",
                      size: "h-5 w-5",
                    },
                    {
                      key: "petFriendly",
                      state: petFriendly,
                      setState: setPetFriendly,
                      icon: PetIcon,
                      label: "pet_allowed",
                      color: "orange",
                      size: "h-6 w-6",
                    },
                    ...(setCbd ? [{
                      key: "cbd",
                      state: !!cbd,
                      setState: setCbd,
                      icon: CityIcon,
                      label: "cbd_location",
                      color: "emerald",
                      size: "h-5 w-5",
                    }] : []),
                    {
                      key: "fullyFurnished",
                      state: fullyFurnished,
                      setState: setFullyFurnished,
                      icon: ArmchairIcon,
                      label: "fully_furnished",
                      color: "emerald",
                      size: "h-6 w-6",
                    },
                    {
                      key: "isForeigner",
                      state: isForeigner,
                      setState: setIsForeigner,
                      icon: EarthIcon,
                      label: "foreigner",
                      color: "purple",
                      size: "h-6 w-6",
                    },
                    {
                      key: "companyRegistered",
                      state: companyRegistered,
                      setState: setCompanyRegistered,
                      icon: WorkIcon,
                      label: "company_registered",
                      color: "indigo",
                      size: "h-6 w-6",
                    },
                    {
                      key: "isHotDeal",
                      state: isHotDeal,
                      setState: setIsHotDeal,
                      icon: FireIcon,
                      label: "hot_deal",
                      color: "rose",
                      size: "h-[22px] w-[22px]",
                    },
                    {
                      key: "allowAirbnb",
                      state: allowAirbnb,
                      setState: setAllowAirbnb,
                      icon: FaAirbnb,
                      label: "allow_airbnb",
                      color: "pink",
                      size: "h-[22px] w-[22px]",
                    },
                  ].map((f) => {
                    const qCount = availableQuickFilters[f.key] || 0;
                    const isDisabled = !f.state && qCount === 0;

                    return (
                      <div
                        key={f.label}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-2xl border-2 transition-colors duration-200 cursor-pointer relative",
                          f.state
                            ? f.color === "pink"
                              ? "bg-[#FF5A5F] border-[#FF5A5F] text-white shadow-md shadow-pink-500/20"
                              : `bg-${f.color}-600 border-${f.color}-600 text-white shadow-md shadow-${f.color}-500/20`
                            : isDisabled
                              ? "bg-slate-100 border-transparent text-slate-300 pointer-events-none"
                              : "bg-slate-50 border-transparent text-slate-600 hover:border-slate-200",
                        )}
                        onClick={() => !isDisabled && f.setState(!f.state)}
                      >
                        {qCount > 0 && (
                          <span
                            className={cn(
                              "absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10",
                              f.state
                                ? "bg-white text-blue-600"
                                : "bg-emerald-500 text-white",
                            )}
                          >
                            {qCount}
                          </span>
                        )}
                        <f.icon
                          className={cn(
                            f.size,
                            f.state
                              ? "text-white"
                              : isDisabled
                                ? "text-slate-200"
                                : f.color === "pink"
                                  ? "text-[#FF5A5F]"
                                  : `text-${f.color}-500`,
                          )}
                        />
                        <span className="text-[10px] font-medium text-center leading-tight">
                          {t(`search.${f.label}`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Filters (Mobile) */}
              {transitStation && (
                <div className="flex flex-col gap-2 mb-4 animate-in fade-in slide-in-from-top-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                    {t("search.active_filters")}:
                  </span>
                  <div className="flex">
                    {(() => {
                      const found = (allStations || availableStations).find(
                        (s) => s.name === transitStation,
                      );
                      const t = found?.type.toUpperCase();
                      let themeClass = "bg-blue-50 border-blue-100 text-blue-700";
                      let logoIcon = <TrainIcon className="w-3.5 h-3.5 text-blue-500" />;
                      let clearBtnClass = "bg-blue-200/50 text-blue-600";
                      
                      if (found) {
                        const logoPath = LOGO_PATHS[t || ""];
                        if (logoPath) {
                          logoIcon = (
                            <div className="w-5 h-5 shrink-0 flex items-center justify-center bg-white rounded-md p-0.5 border border-slate-200/50 mr-0.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={logoPath} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                          );
                        }
                        
                        if (t === "BTS") {
                          themeClass = "bg-emerald-50 border-emerald-100 text-emerald-700";
                          clearBtnClass = "bg-emerald-200/50 text-emerald-600";
                        } else if (t === "GOLD" || t === "MRT_YELLOW") {
                          themeClass = "bg-slate-50 border-slate-200 text-slate-700";
                          clearBtnClass = "bg-slate-200/50 text-slate-500";
                        } else if (t === "MRT_PURPLE") {
                          themeClass = "bg-purple-50 border-purple-100 text-purple-700";
                          clearBtnClass = "bg-purple-200/50 text-purple-600";
                        } else if (t === "MRT_PINK" || t === "ARL") {
                          themeClass = "bg-rose-50 border-rose-100 text-rose-700";
                          clearBtnClass = "bg-rose-200/50 text-rose-600";
                        } else if (t === "SRT" || t === "SRT_RED") {
                          themeClass = "bg-red-50 border-red-100 text-red-700";
                          clearBtnClass = "bg-red-200/50 text-red-600";
                        } else if (t === "BRT") {
                          themeClass = "bg-teal-50 border-teal-100 text-teal-700";
                          clearBtnClass = "bg-teal-200/50 text-teal-600";
                        }
                      }
                      
                      const cleanName = transitStation.split("|")[0].replace("_", " ");
                      const label = found
                        ? formatStationLabel(found.type, cleanName, language)
                        : cleanName;
                        
                      return (
                        <div className={cn("flex items-center gap-1.5 px-3 py-2 border rounded-2xl text-xs font-bold shadow-xs", themeClass)}>
                          {logoIcon}
                          <span>{label}</span>
                          <button
                            onClick={() => setTransitStation("")}
                            className={cn("ml-1 p-0.5 rounded-full", clearBtnClass)}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Transit Stations (Mobile) */}
              {nearTrain && availableStations.length > 0 && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-tight flex items-center gap-2">
                      <TrainIcon className="w-3.5 h-3.5" />
                      {t("search.select_station")}
                    </span>
                    {transitStation && (
                      <button
                        onClick={() => setTransitStation("")}
                        className="text-[10px] font-medium text-blue-500 hover:text-blue-700 underline"
                      >
                        {t("search.clear")}
                      </button>
                    )}
                  </div>

                  {/* Train Type Tabs */}
                  <div className="flex flex-nowrap overflow-x-auto gap-1 pb-1 -mx-1 px-1 scrollbar-hide">
                    <button
                      onClick={() => setTrainTypeFilter("ALL")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border shrink-0",
                        trainTypeFilter === "ALL"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      {t("search.all")}
                    </button>
                    {trainTypes.map((type: string) => {
                      const logoPath = LOGO_PATHS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setTrainTypeFilter(type)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-[10px] font-bold transition-all border shrink-0 flex items-center gap-1.5",
                            getTypeTabClass(type, trainTypeFilter === type),
                          )}
                        >
                          {logoPath && (
                            <div className="w-6 h-6 rounded-md bg-white border border-slate-200/50 flex items-center justify-center p-0.5 shrink-0 shadow-3xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={logoPath}
                                alt={type}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-rows-3 grid-flow-col overflow-x-auto gap-2 pb-1 -mx-1 px-1 scrollbar-hide">
                    {filteredStations.map((s: any) => (
                      <button
                        key={s.name}
                        onClick={() =>
                          setTransitStation(
                            transitStation === s.name ? "" : s.name,
                          )
                        }
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shadow-xs",
                          transitStation === s.name
                            ? "bg-blue-600 border-blue-600 text-white shadow-blue-200"
                            : "bg-white border-slate-100 text-slate-600",
                        )}
                      >
                        {transitStation === s.name && (
                          <svg
                            className="w-3.5 h-3.5 animate-in zoom-in-50 text-white shrink-0"
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
                        {(() => {
                          const logoPath = LOGO_PATHS[s.type.toUpperCase()];
                          if (logoPath) {
                            return (
                              <div className="w-7 h-7 rounded-md bg-white border border-slate-200/50 flex items-center justify-center p-0.5 shrink-0 shadow-xs">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={logoPath}
                                  alt={s.type}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            );
                          }
                          return (
                            <span
                              className={cn(
                                "text-[8px] font-extrabold px-1.5 py-0.5 rounded-md leading-none text-white shrink-0",
                                getTypeBadgeClass(s.type),
                              )}
                            >
                              {getNormalizedType(s.type)}
                            </span>
                          );
                        })()}
                        {getLocaleValue(
                          {
                            name: s.name.split("|")[0],
                            name_en: s.name_en,
                            name_cn: s.name_cn,
                            name_ru: s.name_ru,
                          },
                          "name",
                          language,
                        ).replace("_", " ")}
                        <span
                          className={cn(
                            "text-[10px]",
                            transitStation === s.name
                              ? "text-blue-100"
                              : "text-blue-600",
                          )}
                        >
                          ({s.count})
                        </span>
                      </button>
                    ))}
                    {filteredStations.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic py-2 px-2">
                        {t("search.no_stations_type")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Location Zone */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="location"
                  className="w-full"
                >
                  <AccordionItem value="location" className="border-0">
                    <AccordionTrigger className="hover:no-underline py-0">
                      <div className="flex items-center justify-between w-full pr-6">
                        <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                          {t("search.province")} & {t("search.location")}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-xl border border-blue-100/50 truncate max-w-[150px]">
                          {province === "ALL" && area === "ALL"
                            ? t("common.all")
                            : `${province !== "ALL" ? getProvinceName(province, language) : ""}${area !== "ALL" && province !== "ALL" ? `, ${area}` : area !== "ALL" ? area : ""}`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-6 px-1">
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
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2",
                              province === "ALL"
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300",
                            )}
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
                                className={cn(
                                  "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2",
                                  province === p.name
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300",
                                )}
                              >
                                <span>{getProvinceName(p.name, language)}</span>
                                <span
                                  className={cn(
                                    "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                                    province === p.name
                                      ? "bg-white/20 text-white"
                                      : "bg-emerald-50 text-emerald-600",
                                  )}
                                >
                                  {p.count}
                                </span>
                              </button>
                            ))}
                          {availableProvinces.length > MOBILE_ITEMS_LIMIT && (
                            <button
                              onClick={() =>
                                setShowAllProvincesMobile(
                                  !showAllProvincesMobile,
                                )
                              }
                              className="px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-all border border-blue-100 flex items-center gap-1"
                            >
                              {showAllProvincesMobile
                                ? t("search.show_less") || "แสดงน้อยลง"
                                : `+${availableProvinces.length - MOBILE_ITEMS_LIMIT} ${t("search.show_more") || "แสดงเพิ่มเติม"}`}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                          {t("search.location")}
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          <button
                            onClick={() => setArea("ALL")}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2",
                              area === "ALL" || selectedAreaList.length === 0
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300",
                            )}
                          >
                            {t("search.all_locations")}
                          </button>
                          {sortedAvailableAreas
                            .slice(
                              0,
                              showAllAreasMobile
                                ? undefined
                                : MOBILE_ITEMS_LIMIT,
                            )
                            .map((a) => {
                              const hasChildren = a.children && a.children.length > 0;
                              const isSelected = selectedAreaList.includes(a.name);
                              const selectedChildrenCount = hasChildren
                                ? a.children.filter((c: any) => selectedAreaList.includes(c.name)).length
                                : 0;
                              const isAnySelected = isSelected || selectedChildrenCount > 0;

                              return (
                                <div
                                  key={a.name}
                                  className={cn(
                                    "flex flex-wrap items-center gap-1.5 p-1 rounded-2xl transition-all",
                                    hasChildren && isAnySelected ? "bg-blue-50/40 border border-blue-100/60" : ""
                                  )}
                                >
                                  {/* Main Zone Button */}
                                  <button
                                    onClick={() => handleToggleArea(a.name)}
                                    className={cn(
                                      "px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2",
                                      isSelected
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : selectedChildrenCount > 0
                                          ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                                          : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300",
                                    )}
                                  >
                                    {isSelected && (
                                      <svg
                                        className="w-3.5 h-3.5 animate-in zoom-in-50 text-white"
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
                                    {selectedChildrenCount > 0 && !isSelected ? (
                                      <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white leading-none shadow-2xs"
                                        title={`${selectedChildrenCount} sub-areas selected`}
                                      >
                                        {selectedChildrenCount}
                                      </span>
                                    ) : (
                                      <span
                                        className={cn(
                                          "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                                          isSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-emerald-50 text-emerald-600",
                                        )}
                                      >
                                        {a.totalCount}
                                      </span>
                                    )}
                                  </button>

                                  {/* Render child chips if parent has children */}
                                  {hasChildren && a.children.map((c: any) => {
                                    const isChildSelected = selectedAreaList.includes(c.name);
                                    return (
                                      <button
                                        key={c.name}
                                        onClick={() => handleToggleArea(c.name)}
                                        className={cn(
                                          "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5",
                                          isChildSelected
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs font-semibold"
                                            : "bg-slate-100/70 text-slate-500 border-slate-200 hover:border-blue-300",
                                        )}
                                      >
                                        {isChildSelected && (
                                          <svg
                                            className="w-3 h-3 text-white"
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
                                        <span>{c.localizedName}</span>
                                        <span className={isChildSelected ? "text-[10px] text-white/80" : "text-[10px] opacity-75"}>
                                          ({c.count})
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          {sortedAvailableAreas.length > MOBILE_ITEMS_LIMIT && (
                            <button
                              onClick={() =>
                                setShowAllAreasMobile(!showAllAreasMobile)
                              }
                              className="px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-all border border-blue-100 flex items-center gap-1"
                            >
                              {showAllAreasMobile
                                ? t("search.show_less") || "แสดงน้อยลง"
                                : `+${sortedAvailableAreas.length - MOBILE_ITEMS_LIMIT} ${t("search.show_more") || "แสดงเพิ่มเติม"}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Property Detail Zone */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="details"
                  className="w-full"
                >
                  <AccordionItem value="details" className="border-0">
                    <AccordionTrigger className="hover:no-underline py-0">
                      <div className="flex items-center justify-between w-full pr-6 uppercase tracking-wider">
                        <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                          {t("search.property_details")}
                        </span>
                        <span className="text-[11px] font-bold text-purple-600 bg-purple-50/50 px-2.5 py-1 rounded-xl border border-purple-100/50 truncate max-w-[140px]">
                          {type === "ALL" && listingType === "ALL"
                            ? t("common.all")
                            : `${type !== "ALL" ? PROPERTY_TYPES.find((pt) => pt.value === type)?.label : ""}${listingType !== "ALL" && type !== "ALL" ? ` • ${t(`common.${listingType.toLowerCase()}`)}` : listingType !== "ALL" ? t(`common.${listingType.toLowerCase()}`) : ""}`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-6 px-1">
                      <div className="space-y-3">
                        <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                          {t("search.property_type")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {PROPERTY_TYPES.map((pt) => {
                            const count = pt.value.includes(",")
                              ? pt.value.split(",").reduce((sum, val) => sum + (availableTypes[val] || 0), 0)
                              : (availableTypes[pt.value] || 0);
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
                                {getPropertyIcon(pt.value, isActive)}
                                <span>{pt.label}</span>
                                {count > 0 && pt.value !== "ALL" && (
                                  <span
                                    className={cn(
                                      "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                                      isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-emerald-50 text-emerald-600",
                                    )}
                                  >
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Needs Zone */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-900">
                          {t("search.needs")}
                        </label>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                          {[
                            { val: "ALL", label: t("common.all") },
                            { val: "SALE", label: t("search.buy") },
                            { val: "RENT", label: t("search.rent") },
                            {
                              val: "SALE_AND_RENT",
                              label: t("search.rent_buy"),
                            },
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
                                  listing_type: opt.val,
                                });
                              }}
                              className={cn(
                                "py-1 h-11 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                                opt.val === "SALE_AND_RENT"
                                  ? "flex-[1.4]"
                                  : "flex-1",
                                listingType === opt.val
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-50/50"
                                  : "text-slate-500 hover:text-slate-900",
                              )}
                            >
                              <span>{opt.label}</span>
                              {availableListingTypes[opt.val] > 0 && (
                                <span
                                  className={cn(
                                    "mtext-[11px] font-semibold px-1 py-0.5 rounded-full transition-all",
                                    listingType === opt.val
                                      ? "bg-white/20 text-white"
                                      : "bg-emerald-50 text-emerald-600",
                                  )}
                                >
                                  {availableListingTypes[opt.val]}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-900 ">
                          {t("search.price_range")}
                        </label>
                        <MobileFilterSheet
                          title={t("search.price_range")}
                          placeholder={t("search.price_range")}
                          icon={CircleDollarSign}
                          iconColor="text-emerald-500"
                          value={`${currentPriceOption.min}-${currentPriceOption.max}-${currentPriceOption.type || "ALL"}`}
                          options={priceOptions.map((opt) => {
                            if (opt.isGroup) {
                              return {
                                label: opt.label,
                                isGroup: true,
                                options: opt.options.map((subOpt: any) => ({
                                  id: `${subOpt.min}-${subOpt.max}-${subOpt.type || "ALL"}`,
                                  label: subOpt.label,
                                  count:
                                    priceCounts.get(
                                      `${subOpt.min}-${subOpt.max}-${subOpt.type || "ALL"}`,
                                    ) || 0,
                                })),
                              };
                            }
                            const id = `${opt.min}-${opt.max}-${opt.type || "ALL"}`;
                            return {
                              id,
                              label: opt.label,
                              count:
                                opt.min || opt.max
                                  ? priceCounts.get(id) || 0
                                  : null,
                            };
                          })}
                          selectedLabel={currentPriceOption.label}
                          onSelect={(val) => {
                            const [min, max, type] = val.split("-");
                            setMinPrice(min);
                            setMaxPrice(max);
                            if (setPriceType)
                              setPriceType(type && type !== "ALL" ? type : "");
                          }}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-900">
                          {t("search.area_size")}
                        </label>
                        <MobileFilterSheet
                          title={t("search.area_size")}
                          placeholder={t("search.area_size") || "ขนาดพื้นที่"}
                          icon={Maximize2}
                          iconColor="text-blue-500"
                          value={`${currentSizeOption.min}-${currentSizeOption.max}`}
                          options={sizeOptions.map((opt) => {
                            const id = `${opt.min}-${opt.max}`;
                            return {
                              id,
                              label: opt.label,
                              count:
                                opt.min || opt.max
                                  ? sizeCounts.get(id) || 0
                                  : null,
                            };
                          })}
                          selectedLabel={currentSizeOption.label}
                          onSelect={(val) => {
                            const [min, max] = val.split("-");
                            setMinSize(min);
                            setMaxSize(max);
                          }}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3 ">
                        <label className="text-sm font-medium text-slate-900 ">
                          {t("search.bedrooms")}
                        </label>
                        <div className="flex gap-2 overflow-x-auto pt-2 no-scrollbar ">
                          {["ALL", "1", "2", "3", "4+"].map((bed) => {
                            const count = availableBedrooms[bed] || 0;
                            const isSelected = bedrooms === bed;
                            const isDisabled = !isSelected && count === 0;

                            return (
                              <button
                                key={bed}
                                disabled={isDisabled}
                                onClick={() => setBedrooms(bed)}
                                className={cn(
                                  "h-11 min-w-14 px-4 rounded-xl border transition-all font-medium text-xs shrink-0 flex items-center justify-center relative",
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                                    : isDisabled
                                      ? "bg-slate-50 text-slate-300 border-slate-100 opacity-60 cursor-not-allowed"
                                      : "bg-white text-slate-700 border-slate-200",
                                )}
                              >
                                <span>
                                  {bed === "ALL" ? t("common.all") : bed}
                                </span>
                                {count > 0 && (
                                  <span
                                    className={cn(
                                      "absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border",
                                      isSelected
                                        ? "bg-white text-indigo-600 border-white"
                                        : "bg-emerald-50 text-emerald-600 border-emerald-100",
                                    )}
                                  >
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            <SheetFooter className="p-6 border-t border-slate-100 bg-white pb-10">
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
    </>
  );
}
