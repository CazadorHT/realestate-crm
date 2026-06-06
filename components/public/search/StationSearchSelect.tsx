"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export function StationSearchSelect({
  transitStation,
  setTransitStation,
  availableStations,
  allStations = [],
  t,
  language,
  getLocaleValue,
  className,
}: StationSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [trainTypeFilter, setTrainTypeFilter] = React.useState("ALL");

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
      if (trainTypeFilter !== "ALL" && getNormalizedType(station.type) !== trainTypeFilter) {
        return false;
      }

      // 2. Filter by search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const localizedName = getLocaleValue(
        {
          name: station.name,
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
  }, [mergedStations, trainTypeFilter, searchQuery, language, getLocaleValue]);

  const selectedStationObj = React.useMemo(() => {
    return (allStations.length > 0 ? allStations : availableStations).find(
      (s) => s.name === transitStation
    ) || null;
  }, [allStations, availableStations, transitStation]);

  const displayLabel = React.useMemo(() => {
    if (!transitStation) return t("search.all_stations") || "รถไฟฟ้าทุกสาย";
    if (!selectedStationObj) return transitStation.replace("_", " ");

    const localized = getLocaleValue(
      {
        name: selectedStationObj.name,
        name_en: selectedStationObj.name_en,
        name_cn: selectedStationObj.name_cn,
        name_ru: selectedStationObj.name_ru,
      },
      "name",
      language
    ).replace("_", " ");

    return selectedStationObj.type ? formatStationLabel(selectedStationObj.type, localized, language) : localized;
  }, [transitStation, selectedStationObj, language, getLocaleValue, t]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-xs font-normal text-blue-500 justify-between px-3",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <TrainFront className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{displayLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-white rounded-xl shadow-lg border border-slate-100 z-50">
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-100 px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อสถานี..."
            className="h-8 w-full border-0 bg-transparent p-2 placeholder:text-xs text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Train Line Tabs */}
        {trainTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 bg-slate-50/50 border-b border-slate-100">
            <button
              onClick={() => setTrainTypeFilter("ALL")}
              className={cn(
                "px-2 py-1 rounded-lg text-[12px] font-bold transition-all border",
                trainTypeFilter === "ALL"
                  ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {t("common.all") || "ทั้งหมด"}
            </button>
            {trainTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTrainTypeFilter(type)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[12px] font-bold transition-all border",
                  getTypeTabClass(type, trainTypeFilter === type)
                )}
              >
                {type}
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
            filteredStations.map((station) => {
              const isSelected = transitStation === station.name;
              const localizedName = getLocaleValue(
                {
                  name: station.name,
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
                  key={station.name}
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
                    <span
                      className={cn(
                        "text-[8px] font-extrabold px-1.5 py-0.5 rounded-md leading-none text-white shrink-0",
                        getTypeBadgeClass(station.type)
                      )}
                    >
                      {normType}
                    </span>
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
      </PopoverContent>
    </Popover>
  );
}
