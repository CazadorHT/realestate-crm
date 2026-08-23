/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Search, Train, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MasterDataTransitStation } from "@/features/properties/actions/fetch-master-data";
import { useLanguage } from "@/lib/i18n/language-context";

function getTransitLogoInfo(code: string, transitType?: string) {
  const c = code.toUpperCase();
  const t = (transitType || "").toUpperCase();
  
  if (c.startsWith("BTS") || t === "BTS") {
    return {
      logo: "/images/transit/BTS-Logo.svg",
      bg: "bg-emerald-50/40 border-emerald-200 text-emerald-800",
    };
  }
  if (c.startsWith("ARL") || t === "ARL") {
    return {
      logo: "/images/transit/ARLbangkok.svg",
      bg: "bg-red-50/40 border-red-200 text-red-800",
    };
  }
  if (c.startsWith("BRT") || t === "BRT") {
    return {
      logo: "/images/transit/Bangkok_BRT_logo.svg",
      bg: "bg-green-50/40 border-green-200 text-green-800",
    };
  }
  if (c.includes("YELLOW") || t === "MRT_YELLOW" || t === "YELLOW") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
      bg: "bg-amber-50/40 border-amber-200 text-amber-800",
    };
  }
  if (c.includes("PINK") || t === "MRT_PINK" || t === "PINK") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
      bg: "bg-pink-50/40 border-pink-200 text-pink-800",
    };
  }
  if (c.includes("PURPLE") || t === "MRT_PURPLE" || t === "PURPLE") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
      bg: "bg-purple-50/40 border-purple-200 text-purple-800",
    };
  }
  if (c.includes("ORANGE") || t === "MRT_ORANGE" || t === "ORANGE") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
      bg: "bg-orange-50/40 border-orange-200 text-orange-800",
    };
  }
  if (c.startsWith("MRT") || t === "MRT" || t === "MRT_BLUE") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_logo.svg",
      bg: "bg-blue-50/40 border-blue-200 text-blue-800",
    };
  }
  if (c.startsWith("SRT") || t === "SRT" || t === "SRT_RED") {
    return {
      logo: "/images/transit/SRT_Red_Lines_icon.svg",
      bg: "bg-rose-50/40 border-rose-200 text-rose-800",
    };
  }
  
  return {
    logo: null,
    bg: "bg-slate-50 border-slate-200 text-slate-700",
  };
}

interface TransitStationSelectorProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  selectedStationCodes: string[];
  setSelectedStationCodes: (codes: string[]) => void;
  stations: MasterDataTransitStation[];
  setIsFormDirty: (dirty: boolean) => void;
}

export function TransitStationSelector({
  isOpen,
  onClose,
  selectedStationCodes,
  setSelectedStationCodes,
  stations,
  setIsFormDirty,
}: TransitStationSelectorProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [stationSearchQuery, setStationSearchQuery] = React.useState("");
  const [stationLineFilter, setStationLineFilter] = React.useState("ALL");
  const [tempSelectedStations, setTempSelectedStations] = React.useState<string[]>([]);

  // Sync selection when opened
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedStations([...selectedStationCodes]);
      setStationSearchQuery("");
      setStationLineFilter("ALL");
    }
  }, [isOpen, selectedStationCodes]);

  const filteredStations = React.useMemo(() => {
    return stations.filter((stat) => {
      const matchesSearch = 
        stat.label?.th?.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
        stat.label?.en?.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
        stat.code.toLowerCase().includes(stationSearchQuery.toLowerCase());
      
      const transitType = stat.metadata?.transit_type || "BTS";
      const matchesLine = stationLineFilter === "ALL" || transitType === stationLineFilter;
      
      return matchesSearch && matchesLine;
    });
  }, [stations, stationSearchQuery, stationLineFilter]);

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-slate-900">
          <Train className="h-5.5 w-5.5 text-indigo-600 animate-pulse" />
          {isEn ? "Select Nearby Transit Stations" : "เลือกสถานีรถไฟฟ้าใกล้เคียง"}
        </span>
      }
      description={
        isEn
          ? "Search and select transit stations near the project. You can select multiple stations."
          : "ค้นหาและเลือกสถานีรถไฟฟ้าที่ใกล้กับโครงการ สามารถเลือกได้มากกว่า 1 สถานี"
      }
      className="sm:max-w-2xl"
      footer={
        <div className="flex justify-end gap-3 w-full px-6 sm:px-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            className="h-10.5 rounded-xl border-slate-200 text-slate-650 cursor-pointer"
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setSelectedStationCodes(tempSelectedStations);
              setIsFormDirty(true);
              onClose(false);
            }}
            className="h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-md shadow-indigo-500/20"
          >
            {isEn
              ? `Confirm (${tempSelectedStations.length} Stations)`
              : `ตกลง (${tempSelectedStations.length} สถานี)`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isEn ? "Search station name (Thai or English)..." : "ค้นหาชื่อสถานี (ภาษาไทย หรือ อังกฤษ)..."}
              value={stationSearchQuery}
              onChange={(e) => setStationSearchQuery(e.target.value)}
              className="pl-10 h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select value={stationLineFilter} onValueChange={setStationLineFilter}>
              <SelectTrigger className="h-10.5 rounded-xl border-slate-200">
                <SelectValue placeholder={isEn ? "All Transit Lines" : "ทุกสายรถไฟฟ้า"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{isEn ? "All Transit Lines" : "ทุกสายรถไฟฟ้า"}</SelectItem>
                <SelectItem value="BTS">BTS (Green Line)</SelectItem>
                <SelectItem value="MRT">MRT (Blue Line)</SelectItem>
                <SelectItem value="MRT_PURPLE">MRT (Purple Line)</SelectItem>
                <SelectItem value="MRT_YELLOW">MRT (Yellow Line)</SelectItem>
                <SelectItem value="MRT_PINK">MRT (Pink Line)</SelectItem>
                <SelectItem value="MRT_ORANGE">MRT (Orange Line)</SelectItem>
                <SelectItem value="ARL">ARL (Airport Link)</SelectItem>
                <SelectItem value="SRT_RED">SRT (Red Line)</SelectItem>
                <SelectItem value="GOLD">{isEn ? "Gold Line" : "สายสีทอง"}</SelectItem>
                <SelectItem value="BRT">BRT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl max-h-[40vh] overflow-y-auto p-4 bg-slate-50/50">
          {filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-10 w-10 text-slate-355 mx-auto mb-2" />
              <span className="text-xs text-slate-400 font-medium">
                {isEn ? "No transit stations found" : "ไม่พบสถานีรถไฟฟ้าที่ค้นหา"}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStations.map((stat) => {
                const isChecked = tempSelectedStations.includes(stat.code);
                const transitType = stat.metadata?.transit_type || "BTS";
                const logoInfo = getTransitLogoInfo(stat.code, transitType);

                return (
                  <label
                    key={stat.code}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none",
                      isChecked
                        ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                        : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setTempSelectedStations((prev) =>
                          prev.includes(stat.code)
                            ? prev.filter((c) => c !== stat.code)
                            : [...prev, stat.code]
                        );
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-900 font-bold leading-none mb-1">
                        {isEn ? (stat.label.en || stat.label.th) : stat.label.th}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-none">
                        {isEn ? stat.label.th : stat.label.en} ({stat.code})
                      </span>
                    </div>
                    <div className={cn("ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider", logoInfo.bg)}>
                      {logoInfo.logo ? (
                        <img src={logoInfo.logo} alt={transitType} className="h-4.5 w-auto object-contain shrink-0" />
                      ) : (
                        <span>{transitType}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}

