"use client";

import * as React from "react";
import { 
  Search, Edit2, Loader2, AlertCircle, ExternalLink, Plus, ArrowUpDown, RotateCcw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getTransitStationsWithCountsAction, 
} from "@/features/properties/actions/fetch-master-data";
import { StationEditDialog } from "./components/StationEditDialog";
import { LOGO_PATHS } from "@/components/public/near-station/helpers/station-selector-helpers";
import { useLanguage } from "@/lib/i18n/language-context";

interface StationItem {
  id?: string;
  type: string; // TRANSIT_STATION
  code: string;
  label: { th: string; en: string; cn?: string; ru?: string };
  metadata?: {
    transit_type?: string;
    line_name?: string;
    line_color?: string;
    slug?: string;
    seo_title?: string;
    seo_description?: string;
    description?: { th?: string; en?: string; cn?: string; ru?: string };
    latitude?: number;
    longitude?: number;
    [key: string]: any;
  };
  sort_order: number;
  is_active: boolean;
  property_count?: number;
}

const LINE_LABELS: Record<string, string> = {
  BTS: "BTS Skytrain",
  MRT: "MRT Blue Line",
  MRT_PURPLE: "MRT Purple Line",
  MRT_YELLOW: "MRT Yellow Line",
  MRT_PINK: "MRT Pink Line",
  MRT_ORANGE: "MRT Orange Line",
  ARL: "Airport Rail Link",
  SRT_RED: "SRT Red Line",
  GOLD: "Gold Line",
  BRT: "BRT",
};

const LINE_COLORS: Record<string, string> = {
  BTS: "#7BC542",
  MRT: "#1E3A8A",
  MRT_PURPLE: "#7C3AED",
  MRT_YELLOW: "#F59E0B",
  MRT_PINK: "#EC4899",
  MRT_ORANGE: "#F97316",
  ARL: "#DC2626",
  SRT_RED: "#EF4444",
  GOLD: "#D97706",
  BRT: "#059669",
};

export default function TransitStationsAdminPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [stations, setStations] = React.useState<StationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lineFilter, setLineFilter] = React.useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<string>("DEFAULT");

  // Calculate counts for filters
  const { lineCounts, propertyCounts } = React.useMemo(() => {
    const lCounts: Record<string, number> = { ALL: stations.length };
    let hasProps = 0;
    let noProps = 0;

    for (const st of stations) {
      const line = st.metadata?.transit_type || "OTHER";
      lCounts[line] = (lCounts[line] || 0) + 1;

      const cnt = st.property_count || 0;
      if (cnt > 0) {
        hasProps++;
      } else {
        noProps++;
      }
    }

    return {
      lineCounts: lCounts,
      propertyCounts: {
        ALL: stations.length,
        HAS_PROPERTIES: hasProps,
        NO_PROPERTIES: noProps,
      },
    };
  }, [stations]);

  // Modal / Edit state
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"add" | "edit">("edit");
  const [currentStation, setCurrentStation] = React.useState<StationItem | null>(null);

  const loadStations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTransitStationsWithCountsAction();
      setStations(data as StationItem[]);
    } catch {
      toast.error(isEn ? "Failed to load station data" : "ไม่สามารถโหลดข้อมูลสถานีได้");
    } finally {
      setIsLoading(false);
    }
  }, [isEn]);

  React.useEffect(() => {
    loadStations();
  }, [loadStations]);

  const handleOpenAdd = () => {
    setDialogMode("add");
    setCurrentStation({
      type: "TRANSIT_STATION",
      code: "",
      label: { th: "", en: "", cn: "", ru: "" },
      metadata: {
        transit_type: "BTS",
        slug: "",
        seo_title: "",
        seo_description: "",
        description: { th: "", en: "", cn: "", ru: "" },
        latitude: undefined,
        longitude: undefined,
      },
      sort_order: stations.length * 10,
      is_active: true,
    });
    setIsEditOpen(true);
  };

  const handleOpenEdit = (station: StationItem) => {
    setDialogMode("edit");
    setCurrentStation(station);
    setIsEditOpen(true);
  };

  const filteredStations = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const result = stations.filter((station) => {
      // 1. Search filter
      const matchesSearch = 
        !q ||
        station.code.toLowerCase().includes(q) ||
        station.label.th.toLowerCase().includes(q) ||
        station.label.en.toLowerCase().includes(q);

      // 2. Line filter
      const transitType = station.metadata?.transit_type || "OTHER";
      const matchesLine = lineFilter === "ALL" || transitType === lineFilter;

      // 3. Property count filter
      const count = station.property_count || 0;
      let matchesProperty = true;
      if (propertyFilter === "HAS_PROPERTIES") {
        matchesProperty = count > 0;
      } else if (propertyFilter === "NO_PROPERTIES") {
        matchesProperty = count === 0;
      }

      return matchesSearch && matchesLine && matchesProperty;
    });

    // 4. Sorting logic
    result.sort((a, b) => {
      if (sortBy === "HAS_PROPERTIES_FIRST") {
        const hasA = (a.property_count || 0) > 0 ? 1 : 0;
        const hasB = (b.property_count || 0) > 0 ? 1 : 0;
        if (hasB !== hasA) return hasB - hasA;
        const countDiff = (b.property_count || 0) - (a.property_count || 0);
        if (countDiff !== 0) return countDiff;
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      if (sortBy === "NO_PROPERTIES_FIRST") {
        const hasA = (a.property_count || 0) === 0 ? 1 : 0;
        const hasB = (b.property_count || 0) === 0 ? 1 : 0;
        if (hasB !== hasA) return hasB - hasA;
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      if (sortBy === "PROPERTIES_DESC") {
        const countDiff = (b.property_count || 0) - (a.property_count || 0);
        if (countDiff !== 0) return countDiff;
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      if (sortBy === "PROPERTIES_ASC") {
        const countDiff = (a.property_count || 0) - (b.property_count || 0);
        if (countDiff !== 0) return countDiff;
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      if (sortBy === "NAME_ASC") {
        const nameA = isEn ? (a.label.en || a.label.th) : (a.label.th || a.label.en);
        const nameB = isEn ? (b.label.en || b.label.th) : (b.label.th || b.label.en);
        return nameA.localeCompare(nameB, isEn ? "en" : "th");
      }
      if (sortBy === "NAME_DESC") {
        const nameA = isEn ? (a.label.en || a.label.th) : (a.label.th || a.label.en);
        const nameB = isEn ? (b.label.en || b.label.th) : (b.label.th || b.label.en);
        return nameB.localeCompare(nameA, isEn ? "en" : "th");
      }
      if (sortBy === "CODE_ASC") {
        return a.code.localeCompare(b.code);
      }
      if (sortBy === "CODE_DESC") {
        return b.code.localeCompare(a.code);
      }
      // DEFAULT: sort_order
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    return result;
  }, [stations, searchQuery, lineFilter, propertyFilter, sortBy, isEn]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-950 to-blue-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {isEn ? "Transit Stations & SEO Directory" : "จัดการ SEO สถานีรถไฟฟ้า"}
            </h1>
            <p className="text-sm text-indigo-200/80 max-w-xl font-medium">
              {isEn
                ? "Manage station search keywords, SEO Title/Description, location content, and listings near transit stations."
                : "จัดการข้อมูลคำค้นหา คีย์เวิร์ด ชื่อหัวข้อ SEO และรายละเอียดทำเลของสถานีรถไฟฟ้าสำหรับหน้าค้นหาหลัก"}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleOpenAdd}
            className="h-12 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2 self-start md:self-auto shrink-0 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            {isEn ? "Add New Station" : "เพิ่มสถานีรถไฟฟ้าใหม่"}
          </Button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        {/* Row 1: Search bar & Counter summary */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 sm:max-w-xl">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder={isEn ? "Search by code or station name (Thai/English)..." : "ค้นหาตามรหัส หรือชื่อสถานี (ไทย/อังกฤษ)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 bg-slate-50/40 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                title={isEn ? "Clear search" : "ล้างคำค้นหา"}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-between sm:justify-end">
            <span className="text-xs font-bold text-slate-600 bg-slate-100/80 border border-slate-200/60 px-3.5 py-2 rounded-xl whitespace-nowrap">
              {isEn
                ? `Showing ${filteredStations.length} of ${stations.length} stations`
                : `แสดง ${filteredStations.length} จาก ${stations.length} สถานี`}
            </span>

            {(searchQuery || lineFilter !== "ALL" || propertyFilter !== "ALL" || sortBy !== "DEFAULT") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setLineFilter("ALL");
                  setPropertyFilter("ALL");
                  setSortBy("DEFAULT");
                }}
                className="h-9 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer font-bold flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {isEn ? "Reset" : "ล้างตัวกรอง"}
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Filter dropdowns & Quick sort controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100/80">
          {/* Left: Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-500 shrink-0">
                {isEn ? "Line:" : "สายรถไฟฟ้า:"}
              </Label>
              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger className="w-48 h-9.5 rounded-xl border-slate-200 bg-slate-50/60 text-xs font-semibold">
                  <SelectValue placeholder={isEn ? "All Transit Lines" : "เลือกสายทั้งหมด"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{isEn ? `All Lines (${lineCounts.ALL || 0})` : `ทุกสาย (${lineCounts.ALL || 0})`}</SelectItem>
                  {Object.entries(LINE_LABELS).map(([key, label]) => {
                    const count = lineCounts[key] || 0;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {LOGO_PATHS[key] ? (
                            <img src={LOGO_PATHS[key]} alt={key} className="h-4 w-auto object-contain shrink-0" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: LINE_COLORS[key] || "#6b7280" }} />
                          )}
                          <span>{label} ({count})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-500 shrink-0">
                {isEn ? "Listings:" : "จำนวนทรัพย์:"}
              </Label>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-44 h-9.5 rounded-xl border-slate-200 bg-slate-50/60 text-xs font-semibold">
                  <SelectValue placeholder={isEn ? "All" : "ทั้งหมด"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{isEn ? `All (${propertyCounts.ALL || 0})` : `ทั้งหมด (${propertyCounts.ALL || 0})`}</SelectItem>
                  <SelectItem value="HAS_PROPERTIES">{isEn ? `With Listings (${propertyCounts.HAS_PROPERTIES || 0})` : `มีทรัพย์ (${propertyCounts.HAS_PROPERTIES || 0})`}</SelectItem>
                  <SelectItem value="NO_PROPERTIES">{isEn ? `No Listings (${propertyCounts.NO_PROPERTIES || 0})` : `ไม่มีทรัพย์ (${propertyCounts.NO_PROPERTIES || 0})`}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Sorting dropdown & Quick toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-500 shrink-0">
                {isEn ? "Sort:" : "การเรียง:"}
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-56 h-9.5 rounded-xl border-slate-200 bg-slate-50/60 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">
                    {isEn ? "Default Order" : "ตามลำดับตั้งต้น"}
                  </SelectItem>
                  <SelectItem value="HAS_PROPERTIES_FIRST">
                    {isEn ? "Has Listings First (≥1 then 0)" : "สถานีที่มี Listing ขึ้นก่อน"}
                  </SelectItem>
                  <SelectItem value="PROPERTIES_DESC">
                    {isEn ? "Most Listings (High → Low)" : "จำนวน Listing มากสุด (มาก → น้อย)"}
                  </SelectItem>
                  <SelectItem value="PROPERTIES_ASC">
                    {isEn ? "Least Listings (Low → High)" : "จำนวน Listing น้อยสุด (น้อย → มาก)"}
                  </SelectItem>
                  <SelectItem value="NO_PROPERTIES_FIRST">
                    {isEn ? "No Listings First (0 then ≥1)" : "สถานีที่ยังไม่มี Listing ขึ้นก่อน"}
                  </SelectItem>
                  <SelectItem value="NAME_ASC">
                    {isEn ? "Station Name (A → Z)" : "ชื่อสถานี (ก → ฮ / A → Z)"}
                  </SelectItem>
                  <SelectItem value="NAME_DESC">
                    {isEn ? "Station Name (Z → A)" : "ชื่อสถานี (ฮ → ก / Z → A)"}
                  </SelectItem>
                  <SelectItem value="CODE_ASC">
                    {isEn ? "Station Code (A → Z)" : "รหัสสถานี (A → Z)"}
                  </SelectItem>
                  <SelectItem value="CODE_DESC">
                    {isEn ? "Station Code (Z → A)" : "รหัสสถานี (Z → A)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortBy(prev => prev === "HAS_PROPERTIES_FIRST" ? "PROPERTIES_DESC" : prev === "PROPERTIES_DESC" ? "DEFAULT" : "HAS_PROPERTIES_FIRST")}
              className={`h-9.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                sortBy === "HAS_PROPERTIES_FIRST" || sortBy === "PROPERTIES_DESC"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-indigo-50"
              }`}
              title={isEn ? "Sort stations with active listings first" : "จัดเรียงให้สถานีที่มีจำนวนทรัพย์สินอยู่ขึ้นก่อน"}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
              {isEn ? (sortBy === "PROPERTIES_DESC" ? "Most Listings" : "Listings First") : (sortBy === "PROPERTIES_DESC" ? "Listing มากสุด" : "มี Listing ขึ้นก่อน")}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortBy(prev => prev === "NAME_ASC" ? "NAME_DESC" : "NAME_ASC")}
              className={`h-9.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                sortBy === "NAME_ASC" || sortBy === "NAME_DESC"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-indigo-50"
              }`}
              title={isEn ? "Sort by station name alphabetically" : "จัดเรียงตามชื่อสถานีตามตัวอักษร"}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
              {isEn ? (sortBy === "NAME_DESC" ? "Name (Z-A)" : "Name (A-Z)") : (sortBy === "NAME_DESC" ? "ชื่อ (ฮ-ก)" : "ชื่อ (ก-ฮ)")}
            </Button>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-medium animate-pulse">
              {isEn ? "Loading station data..." : "กำลังโหลดข้อมูลสถานี..."}
            </span>
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">
              {isEn ? "No stations found matching criteria" : "ไม่พบสถานีตามเงื่อนไข"}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isEn ? "Try adjusting search query or transit line filter" : "ลองเปลี่ยนคำค้นหาหรือสายรถไฟฟ้าอื่น"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th 
                    className="px-6 py-4 cursor-pointer select-none hover:text-indigo-600 transition-colors"
                    onClick={() => setSortBy(prev => prev === "NAME_ASC" ? "NAME_DESC" : "NAME_ASC")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isEn ? "Station Name" : "ชื่อสถานี"}</span>
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="px-6 py-4">{isEn ? "Transit Line" : "สายรถไฟฟ้า"}</th>
                  <th 
                    className="px-6 py-4 cursor-pointer select-none hover:text-indigo-600 transition-colors"
                    onClick={() => setSortBy(prev => prev === "PROPERTIES_DESC" ? "PROPERTIES_ASC" : "PROPERTIES_DESC")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isEn ? "Properties" : "จำนวนทรัพย์"}</span>
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4">{isEn ? "SEO Status" : "สถานะ SEO"}</th>
                  <th className="px-6 py-4 text-center">{isEn ? "Actions" : "จัดการ"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStations.map((station) => {
                  const meta = station.metadata || {};
                  const transitType = meta.transit_type || "OTHER";
                  const lineColor = meta.line_color || LINE_COLORS[transitType] || "#6b7280";
                  const lineName = LINE_LABELS[transitType] || transitType;
                  
                  const hasSeoTitle = !!meta.seo_title;
                  const hasSeoDesc = !!meta.seo_description;
                  const hasDescription = !!meta.description?.th || !!meta.description?.en;
                  const slug = meta.slug || "-";

                  return (
                    <tr key={station.code} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {isEn ? (station.label.en || station.label.th) : (station.label.en || station.label.th)}
                          </span>
                          {!isEn && station.label.th && station.label.en && station.label.th !== station.label.en && (
                            <span className="text-xs text-slate-400 block">
                              {station.label.th}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {LOGO_PATHS[transitType] ? (
                            <img src={LOGO_PATHS[transitType]} alt={transitType} className="h-5 w-auto object-contain shrink-0" />
                          ) : (
                            <span 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: lineColor }}
                            />
                          )}
                          <span className="font-medium text-slate-600">{lineName}</span>
                        </div>
                      </td>
                      {/* Property Count Column */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          (station.property_count || 0) > 0 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}>
                          {station.property_count || 0} {isEn ? "Listings" : "รายการ"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-mono">
                          {slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {hasSeoTitle ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Title
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                              No Title
                            </span>
                          )}
                          {hasSeoDesc ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Meta Desc
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                              No Meta Desc
                            </span>
                          )}
                          {hasDescription ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Content
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                              No Content
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(station)}
                            className="h-8.5 rounded-lg border-slate-200 text-slate-700  hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            {isEn ? "Edit SEO" : "แก้ไข SEO"}
                          </Button>
                          {meta.slug && (
                            <a
                              href={`/near-station/${meta.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-slate-50 transition-colors"
                              title={isEn ? "View live public station page" : "เปิดดูหน้าร้านค้า"}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StationEditDialog
        isOpen={isEditOpen}
        onClose={setIsEditOpen}
        station={currentStation}
        mode={dialogMode}
        onSaveSuccess={loadStations}
      />
    </div>
  );
}

