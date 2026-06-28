"use client";

import * as React from "react";
import { 
  Train, Search, Edit2, Loader2, AlertCircle, ExternalLink
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
  const [stations, setStations] = React.useState<StationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lineFilter, setLineFilter] = React.useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = React.useState<string>("ALL");

  // Modal / Edit state
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [currentStation, setCurrentStation] = React.useState<StationItem | null>(null);

  const loadStations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTransitStationsWithCountsAction();
      setStations(data as StationItem[]);
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลสถานีได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStations();
  }, [loadStations]);

  const handleOpenEdit = (station: StationItem) => {
    setCurrentStation(station);
    setIsEditOpen(true);
  };

  const filteredStations = stations.filter((station) => {
    // 1. Search filter
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-950 to-blue-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            จัดการ SEO สถานีรถไฟฟ้า
          </h1>
          <p className="text-sm text-indigo-200/80 max-w-xl font-medium">
            จัดการข้อมูลคำค้นหา คีย์เวิร์ด ชื่อหัวข้อ (SEO Title/Description) และรายละเอียดทำเลของสถานีรถไฟฟ้าสำหรับหน้าค้นหาหลัก
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            placeholder="ค้นหาตามรหัส หรือชื่อสถานี..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Line Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <Label className="text-sm font-semibold text-slate-650 shrink-0">สายรถไฟฟ้า:</Label>
            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger className="w-full sm:w-56 h-10.5 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="เลือกสายทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสาย</SelectItem>
                {Object.entries(LINE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {LOGO_PATHS[key] ? (
                        <img src={LOGO_PATHS[key]} alt={key} className="h-4 w-auto object-contain shrink-0" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: LINE_COLORS[key] || "#6b7280" }} />
                      )}
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Count Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <Label className="text-sm font-semibold text-slate-650 shrink-0">จำนวนทรัพย์สิน:</Label>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10.5 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="HAS_PROPERTIES">มีทรัพย์สิน (≥ 1)</SelectItem>
                <SelectItem value="NO_PROPERTIES">ไม่มีทรัพย์สิน (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลสถานี...</span>
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">ไม่พบสถานีตามเงื่อนไข</h3>
            <p className="text-sm text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือสายรถไฟฟ้าอื่น</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">สถานี (TH / EN)</th>
                  <th className="px-6 py-4">สายรถไฟฟ้า</th>
                  <th className="px-6 py-4">จำนวนทรัพย์</th>
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4">สถานะ SEO</th>
                  <th className="px-6 py-4 text-center">จัดการ</th>
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
                          <span className="font-semibold text-slate-900 block">{station.label.th}</span>
                          <span className="text-xs text-slate-400 block">{station.label.en}</span>
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
                          {station.property_count || 0} รายการ
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
                            className="h-8.5 rounded-lg border-slate-200 text-slate-700  hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            แก้ไข SEO
                          </Button>
                          {meta.slug && (
                            <a
                              href={`/near-station/${meta.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-slate-50 transition-colors"
                              title="เปิดดูหน้าร้านค้า"
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
        onSaveSuccess={loadStations}
      />
    </div>
  );
}
