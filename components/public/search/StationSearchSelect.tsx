"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { formatStationLabel } from "@/lib/property-utils";

interface StationSearchSelectProps {
  transitStation: string;
  setTransitStation: (v: string) => void;
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
  t: (key: string) => string;
  language: string;
  getLocaleValue: (obj: any, field: string, lang: string) => string;
  className?: string;
  align?: "start" | "end" | "left" | "right";
}

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
  if (!isActive) return "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";
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

export function StationSearchSelect({
  transitStation,
  setTransitStation,
  availableStations,
  allStations = [],
  t,
  language,
  getLocaleValue,
  className,
  align = "start",
}: StationSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [trainTypeFilter, setTrainTypeFilter] = React.useState("ALL");
  const [subLineFilter, setSubLineFilter] = React.useState("ALL");

  const isRightAligned = align === "end" || align === "right";

  const handleTrainTypeFilterChange = (newType: string) => {
    setTrainTypeFilter(newType);
    setSubLineFilter("ALL");
  };

  // Get unique train types from all stations to build type filter tabs (Normalized)
  const trainTypes = React.useMemo(() => {
    const list = allStations.length > 0 ? allStations : availableStations;
    const types = new Set(
      list
        .filter((s) => s.type !== "EXPRESSWAY" && s.type !== "MAIN_ROAD")
        .map((s) => getNormalizedType(s.type))
    );
    return Array.from(types).filter(Boolean).sort();
  }, [availableStations, allStations]);

  // Merge counts from availableStations into the complete allStations list
  const mergedStations = React.useMemo(() => {
    const list = allStations.length > 0 ? allStations : availableStations;
    const filteredList = list.filter((s) => s.type !== "EXPRESSWAY" && s.type !== "MAIN_ROAD");
    const countsMap = new Map(availableStations.map((s) => [s.name, s.count]));

    return filteredList.map((s) => ({
      ...s,
      count: countsMap.get(s.name) || 0,
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [availableStations, allStations]);

  // Filter stations by train type tab and text query
  const filteredStations = React.useMemo(() => {
    return mergedStations.filter((station) => {
      // 1. Filter by train type tab (using normalized type)
      if (trainTypeFilter !== "ALL") {
        if (getNormalizedType(station.type) !== trainTypeFilter) {
          return false;
        }
        // 2. Filter by sub-line if selected
        if (subLineFilter !== "ALL" && station.type !== subLineFilter) {
          return false;
        }
      }

      // 3. Filter by search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const localizedName = getLocaleValue(
        {
          name: station.name.split("|")[0],
          name_en: station.name_en,
          name_cn: station.name_cn,
          name_ru: station.name_ru,
        },
        "name",
        language
      );
      return (
        localizedName.toLowerCase().includes(q) ||
        (station.name_en && station.name_en.toLowerCase().includes(q))
      );
    });
  }, [mergedStations, trainTypeFilter, subLineFilter, searchQuery, language, getLocaleValue]);

  const selectedStationObj = React.useMemo(() => {
    return (allStations.length > 0 ? allStations : availableStations).find(
      (s) => s.name === transitStation
    ) || null;
  }, [allStations, availableStations, transitStation]);

  const displayLabel = React.useMemo(() => {
    if (!transitStation) return t("search.all_stations") || "รถไฟฟ้าทุกสาย";
    if (!selectedStationObj) return transitStation.split("|")[0].replace("_", " ");

    const localized = getLocaleValue(
      {
        name: selectedStationObj.name.split("|")[0],
        name_en: selectedStationObj.name_en,
        name_cn: selectedStationObj.name_cn,
        name_ru: selectedStationObj.name_ru,
      },
      "name",
      language
    ).replace("_", " ");

    return selectedStationObj.type ? formatStationLabel(selectedStationObj.type, localized, language) : localized;
  }, [transitStation, selectedStationObj, language, getLocaleValue, t]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside or Escape key
  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block", open ? "z-50" : "z-0")} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          "h-10 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-all text-xs font-medium text-slate-700 flex items-center justify-between px-3 cursor-pointer select-none",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedStationObj ? (
            (() => {
              const logoPath = LOGO_PATHS[selectedStationObj.type.toUpperCase()];
              return logoPath ? (
                <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPath} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <TrainFront className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              );
            })()
          ) : (
            <TrainFront className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          )}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1.5 w-[330px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col",
            isRightAligned ? "right-0" : "left-0"
          )}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-100 px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสถานี..."
              className="h-8 w-full border-0 bg-transparent p-2 placeholder:text-xs text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

        {/* Train Line Tabs */}
        {trainTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 bg-slate-50/50 border-b border-slate-100">
            <button
              type="button"
              onClick={() => handleTrainTypeFilterChange("ALL")}
              className={cn(
                "px-2 py-1 rounded-lg text-[12px] font-bold transition-all border cursor-pointer",
                trainTypeFilter === "ALL"
                  ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {t("common.all") || "ทั้งหมด"}
            </button>
            {trainTypes.map((type) => {
              const logoPath = LOGO_PATHS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTrainTypeFilterChange(type)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
                    getTypeTabClass(type, trainTypeFilter === type)
                  )}
                >
                  {logoPath && (
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200/50 flex items-center justify-center p-0.5 shrink-0 shadow-3xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPath} alt={type} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <span>{type}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-line Tabs (specific colors) */}
        {(trainTypeFilter === "MRT" || trainTypeFilter === "BTS") && (
          <div className="flex flex-wrap gap-1 p-2 bg-slate-50/20 border-b border-slate-100/80 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* "All" option for sub-line */}
            <button
              type="button"
              onClick={() => setSubLineFilter("ALL")}
              className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer",
                subLineFilter === "ALL"
                  ? "bg-slate-500 text-white border-slate-500 shadow-3xs"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
            >
              {language === "th" ? "ทุกสาย" : language === "cn" ? "所有线路" : language === "ru" ? "Все линии" : "All Lines"}
            </button>

            {/* MRT Sub-lines */}
            {trainTypeFilter === "MRT" && [
              { type: "MRT", label: { th: "สายสีน้ำเงิน", en: "Blue Line", cn: "蓝线", ru: "Синяя" }, colorClass: "bg-blue-800 text-white border-blue-900" },
              { type: "MRT_PURPLE", label: { th: "สายสีม่วง", en: "Purple Line", cn: "紫线", ru: "Фиолетовая" }, colorClass: "bg-purple-600 text-white border-purple-700" },
              { type: "MRT_YELLOW", label: { th: "สายสีเหลือง", en: "Yellow Line", cn: "黄线", ru: "Жёлтая" }, colorClass: "bg-amber-400 text-slate-900 border-amber-500" },
              { type: "MRT_PINK", label: { th: "สายสีชมพู", en: "Pink Line", cn: "粉线", ru: "Розовая" }, colorClass: "bg-pink-500 text-white border-pink-600" },
              { type: "MRT_ORANGE", label: { th: "สายสีส้ม", en: "Orange Line", cn: "橙线", ru: "Оранжевая" }, colorClass: "bg-orange-500 text-white border-orange-600" },
            ].map((sub) => (
              <button
                key={sub.type}
                type="button"
                onClick={() => setSubLineFilter(sub.type)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer",
                  subLineFilter === sub.type
                    ? `${sub.colorClass} shadow-3xs`
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {sub.label[language as "th" | "en" | "cn" | "ru"] || sub.label.th}
              </button>
            ))}

            {/* BTS Sub-lines */}
            {trainTypeFilter === "BTS" && [
              { type: "BTS", label: { th: "BTS สกายเทรน", en: "BTS Skytrain", cn: "BTS 轻轨", ru: "BTS" }, colorClass: "bg-emerald-600 text-white border-emerald-700" },
              { type: "GOLD", label: { th: "สายสีทอง", en: "Gold Line", cn: "金线", ru: "Золотая" }, colorClass: "bg-amber-600 text-white border-amber-700" },
            ].map((sub) => (
              <button
                key={sub.type}
                type="button"
                onClick={() => setSubLineFilter(sub.type)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer",
                  subLineFilter === sub.type
                    ? `${sub.colorClass} shadow-3xs`
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {sub.label[language as "th" | "en" | "cn" | "ru"] || sub.label.th}
              </button>
            ))}
          </div>
        )}

        {/* Station List */}
        <div className="max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
          {/* Reset / All option */}
          {!searchQuery && trainTypeFilter === "ALL" && (
            <button
              type="button"
              onClick={() => {
                setTransitStation("");
                setOpen(false);
              }}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-2.5 text-xs text-left transition-colors",
                !transitStation
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className="flex-1">{t("search.all_stations") || "ทุกสถานี"}</span>
              {!transitStation && <Check className="h-3.5 w-3.5 text-blue-600 ml-auto" />}
            </button>
          )}

          {filteredStations.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              ไม่พบสถานีที่สอดคล้อง
            </div>
          ) : (
            filteredStations.map((station, idx) => {
              const isSelected = transitStation === station.name;
              const localizedName = getLocaleValue(
                {
                  name: station.name.split("|")[0],
                  name_en: station.name_en,
                  name_cn: station.name_cn,
                  name_ru: station.name_ru,
                },
                "name",
                language
              );

              const normType = getNormalizedType(station.type);

              return (
                <button
                  key={`${station.name}-${station.type}-${idx}`}
                  type="button"
                  onClick={() => {
                    setTransitStation(isSelected ? "" : station.name);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-2.5 text-xs text-left transition-colors",
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    {(() => {
                      const logoPath = LOGO_PATHS[station.type.toUpperCase()];
                      if (logoPath) {
                        return (
                          <div className="w-7 h-7 rounded-md bg-white border border-slate-200/50 flex items-center justify-center p-0.5 shrink-0 shadow-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logoPath} alt={station.type} className="w-full h-full object-contain" />
                          </div>
                        );
                      }
                      return (
                        <span
                          className={cn(
                            "text-[8px] font-extrabold px-1.5 py-0.5 rounded-md leading-none text-white shrink-0",
                            getTypeBadgeClass(station.type)
                          )}
                        >
                          {normType}
                        </span>
                      );
                    })()}
                    <div className="flex-1 truncate">
                      <span className="block truncate">{localizedName}</span>
                      {station.name_en && station.name_en !== localizedName && (
                        <span className="block text-[10px] text-slate-400 truncate">
                          {station.name_en}
                        </span>
                      )}
                    </div>
                    {/* Count indicator */}
                    {station.count > 0 && (
                      <span className="text-[10px] text-blue-500 bg-blue-50/50 px-1.5 py-0.5 rounded-md font-medium shrink-0 mr-1">
                        {station.count}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0 ml-auto" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    )}
  </div>
  );
}
