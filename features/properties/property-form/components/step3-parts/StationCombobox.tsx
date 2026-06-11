"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, TrainFront, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { upsertMasterDataAction } from "@/features/properties/actions/fetch-master-data";
import type { MasterDataTransitStation } from "@/features/properties/actions/fetch-master-data";
import { formatStationLabel } from "@/lib/property-utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

interface StationComboboxProps {
  value: string;
  onChange: (station: MasterDataTransitStation | null) => void;
  stations: MasterDataTransitStation[];
  transitType?: string;
  placeholder?: string;
  onRefreshStations?: () => void;
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

export function StationCombobox({
  value,
  onChange,
  stations,
  transitType,
  placeholder = "เลือกหรือค้นหาสถานี...",
  onRefreshStations,
}: StationComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isMobileOrTablet, React_useState] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState("ALL");

  // Add Station Dialog State
  const [isAddStationOpen, setIsAddStationOpen] = React.useState(false);
  const [newStationNameTh, setNewStationNameTh] = React.useState("");
  const [newStationNameEn, setNewStationNameEn] = React.useState("");
  const [newStationNameCn, setNewStationNameCn] = React.useState("");
  const [newStationNameRu, setNewStationNameRu] = React.useState("");
  const [isSavingStation, setIsSavingStation] = React.useState(false);

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationNameTh.trim()) {
      toast.error("กรุณากรอกชื่อสถานีภาษาไทย");
      return;
    }
    setIsSavingStation(true);
    try {
      const type = transitType || "OTHER";
      const cleanType = type.toUpperCase();
      const code = `STATION_${cleanType}_${Date.now()}`;
      
      const labelTh = newStationNameTh.trim();
      const labelEn = newStationNameEn.trim() || labelTh;
      const labelCn = newStationNameCn.trim() || labelTh;
      const labelRu = newStationNameRu.trim() || labelTh;

      const res = await upsertMasterDataAction({
        type: "TRANSIT_STATION",
        code,
        label: {
          th: labelTh,
          en: labelEn,
          cn: labelCn,
          ru: labelRu,
        },
        metadata: {
          transit_type: cleanType,
        },
        is_active: true,
      });

      if (res.success) {
        toast.success("เพิ่มสถานีใหม่สำเร็จ!");
        
        // Notify parent to refresh list
        if (onRefreshStations) {
          onRefreshStations();
        }

        // Set value
        onChange({
          code,
          label: {
            th: labelTh,
            en: labelEn,
            cn: labelCn,
            ru: labelRu,
          },
          metadata: {
            transit_type: cleanType,
          }
        });
        
        setIsAddStationOpen(false);
        setNewStationNameTh("");
        setNewStationNameEn("");
        setNewStationNameCn("");
        setNewStationNameRu("");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSavingStation(false);
    }
  };

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1535px)");
    const onChange = () => React_useState(mql.matches);
    mql.addEventListener("change", onChange);
    React_useState(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (transitType) {
      setActiveFilter(transitType);
    } else {
      setActiveFilter("ALL");
    }
  }, [transitType]);

  const FILTER_OPTIONS = ["ALL", "BTS", "MRT", "ARL", "SRT", "BRT"];

  // Filter stations based on selected transit type (BTS/MRT/ARL/SRT/BRT) and search query
  const filteredStations = React.useMemo(() => {
    return stations.filter((station) => {
      // 1. Filter by transit type if specified
      if (activeFilter && activeFilter !== "ALL" && activeFilter !== "OTHER") {
        const stationType = station.metadata?.transit_type || "";
        const normActive = activeFilter.toUpperCase();
        // Group GOLD and BTS together, MRT startsWith MRT, etc.
        if (normActive === "BTS") {
          if (stationType !== "BTS" && stationType !== "GOLD") return false;
        } else if (normActive === "MRT") {
          if (!stationType.toUpperCase().startsWith("MRT")) return false;
        } else if (normActive === "ARL") {
          if (stationType !== "ARL") return false;
        } else if (normActive === "SRT") {
          if (stationType !== "SRT" && stationType !== "SRT_RED") return false;
        } else if (normActive === "BRT") {
          if (stationType !== "BRT") return false;
        } else {
          if (stationType !== activeFilter) return false;
        }
      }

      // 2. Filter by search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        station.label.th.toLowerCase().includes(q) ||
        station.label.en.toLowerCase().includes(q) ||
        station.code.toLowerCase().includes(q)
      );
    });
  }, [stations, activeFilter, searchQuery]);

  const selectedStation = React.useMemo(() => {
    return stations.find(
      (s) =>
        s.label.th === value ||
        s.label.en === value ||
        s.code === value
    ) || null;
  }, [stations, value]);

  if (isMobileOrTablet) {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="เลือกหรือค้นหาสถานี"
        trigger={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 rounded-lg bg-white border-slate-200 px-4 text-xs font-normal text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <TrainFront className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="truncate text-slate-500!">
                {selectedStation
                  ? `${selectedStation.metadata?.transit_type ? `[${getNormalizedType(selectedStation.metadata.transit_type)}] ` : ""}${selectedStation.label.th}`
                  : value || placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      >
        <div className="flex flex-col h-full max-h-[80vh] bg-white">
          <div className="flex items-center border-b border-slate-100 px-4 py-3 shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสถานี (ไทย/อังกฤษ)..."
              className="h-10 w-full border-0 bg-transparent pr-2 placeholder:text-sm text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-slate-100 bg-white shrink-0 scrollbar-none">
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setActiveFilter(opt)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border",
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
            {searchQuery.trim() && !filteredStations.some(s => s.label.th.toLowerCase() === searchQuery.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  onChange({
                    code: `CUSTOM_${Date.now()}`,
                    label: { th: searchQuery.trim(), en: searchQuery.trim(), cn: searchQuery.trim(), ru: searchQuery.trim() },
                    metadata: { transit_type: transitType || "OTHER" }
                  } as any);
                  setOpen(false);
                  setSearchQuery("");
                }}
                className="flex w-full items-center justify-between p-3.5 rounded-xl border border-dashed border-blue-200 text-left bg-blue-50/50 text-blue-700 font-bold hover:bg-blue-50 transition-all active:scale-[0.98]"
              >
                <span>✨ ใช้ชื่อสถานีนี้: "{searchQuery.trim()}"</span>
              </button>
            )}
            {filteredStations.length === 0 && !searchQuery.trim() ? (
              <div className="py-12 text-center text-sm text-slate-400 font-medium bg-white rounded-xl border border-slate-100">
                ไม่พบสถานีที่คุณค้นหา
              </div>
            ) : filteredStations.length === 0 && searchQuery.trim() ? null : (
              filteredStations.map((station) => {
                const isSelected = selectedStation?.code === station.code;
                const type = station.metadata?.transit_type || "OTHER";

                return (
                  <button
                    key={station.code}
                    type="button"
                    onClick={() => {
                      onChange(station);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center rounded-xl p-3.5 border text-left bg-white transition-all active:scale-[0.98]",
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                        : "border-slate-100 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span
                        className={cn(
                          "text-[8px] font-extrabold px-1.5 py-1 rounded-md leading-none text-white shrink-0",
                          getTypeBadgeClass(type)
                        )}
                      >
                        {getNormalizedType(type)}
                      </span>
                      <div className="flex-1 truncate">
                        <span className="block text-sm font-bold truncate">{station.label.th}</span>
                        <span className="block text-xs text-slate-400 truncate">
                          {station.label.en}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="bg-blue-600 rounded-full p-1 text-white shrink-0 ml-auto">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
            <div className="pt-2 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setIsAddStationOpen(true);
                }}
                className="flex w-full items-center justify-center p-3.5 rounded-xl border border-dashed border-blue-200 text-blue-700 font-bold hover:bg-blue-50 transition-all active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>เพิ่มสถานีใหม่ (Add Station)</span>
              </button>
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 rounded-lg bg-white border-slate-200 px-4 text-xs font-normal text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <TrainFront className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="truncate text-slate-500!">
              {selectedStation
                ? `${selectedStation.metadata?.transit_type ? `[${getNormalizedType(selectedStation.metadata.transit_type)}] ` : ""}${selectedStation.label.th}`
                : value || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white rounded-xl shadow-lg border-slate-200 z-[150]">
        <div className="flex items-center border-b border-slate-100 px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อสถานี (ไทย/อังกฤษ)..."
            className="h-8 w-full border-0 bg-transparent pr-2 placeholder:text-xs text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        {/* Filter Bar */}
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 border-b border-slate-100 bg-white shrink-0 scrollbar-none">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setActiveFilter(opt)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 border",
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div className="max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
          {searchQuery.trim() && !filteredStations.some(s => s.label.th.toLowerCase() === searchQuery.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={() => {
                onChange({
                  code: `CUSTOM_${Date.now()}`,
                  label: { th: searchQuery.trim(), en: searchQuery.trim(), cn: searchQuery.trim(), ru: searchQuery.trim() },
                  metadata: { transit_type: transitType || "OTHER" }
                } as any);
                setOpen(false);
                setSearchQuery("");
              }}
              className="flex w-full items-center rounded-lg py-2 px-2.5 text-xs text-blue-600 font-semibold hover:bg-blue-50 border border-dashed border-blue-200/50 mb-1"
            >
              <span>✨ ใช้ชื่อสถานีนี้: "{searchQuery.trim()}"</span>
            </button>
          )}
          {filteredStations.length === 0 && !searchQuery.trim() ? (
            <div className="py-6 text-center text-xs text-slate-400">
              ไม่พบสถานีที่คุณค้นหา
            </div>
          ) : filteredStations.length === 0 && searchQuery.trim() ? null : (
            filteredStations.map((station) => {
              const isSelected = selectedStation?.code === station.code;
              const type = station.metadata?.transit_type || "OTHER";

              return (
                <button
                  key={station.code}
                  type="button"
                  onClick={() => {
                    onChange(station);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-2.5 text-xs outline-none transition-colors text-left",
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <span
                      className={cn(
                        "text-[8px] font-extrabold px-1.5 py-0.5 rounded-md leading-none text-white shrink-0",
                        getTypeBadgeClass(type)
                      )}
                    >
                      {getNormalizedType(type)}
                    </span>
                    <div className="flex-1 truncate">
                      <span className="block truncate">{station.label.th}</span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {station.label.en}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0 ml-auto" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="p-1 border-t border-slate-100 mt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setIsAddStationOpen(true);
            }}
            className="w-full justify-start text-xs text-blue-600 font-bold hover:bg-blue-50 py-1.5 h-auto cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            เพิ่มสถานีใหม่ (Add Station)
          </Button>
        </div>
      </PopoverContent>
      {/* Inline Add Station Dialog */}
      <Dialog open={isAddStationOpen} onOpenChange={setIsAddStationOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              เพิ่มสถานีรถไฟฟ้าใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              สถานีรถไฟฟ้าใหม่จะถูกบันทึกเข้าระบบ และพร้อมให้เลือกใช้งานทันที
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStation} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">ประเภทรถไฟฟ้า</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className={cn(
                  "text-[8px] font-extrabold px-1.5 py-1 rounded-md leading-none text-white shrink-0",
                  getTypeBadgeClass(transitType || "OTHER")
                )}>
                  {getNormalizedType(transitType || "OTHER")}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {transitType || "OTHER"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">ชื่อสถานี (ภาษาไทย) <span className="text-red-500">*</span></Label>
              <Input
                value={newStationNameTh}
                onChange={(e) => setNewStationNameTh(e.target.value)}
                placeholder="เช่น สยาม / ห้าแยกลาดพร้าว"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">ชื่อสถานี (ภาษาอังกฤษ - EN)</Label>
              <Input
                value={newStationNameEn}
                onChange={(e) => setNewStationNameEn(e.target.value)}
                placeholder="เช่น Siam / Ha Yaek Lat Phrao"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">ชื่อสถานี (ภาษาจีน - CN)</Label>
              <Input
                value={newStationNameCn}
                onChange={(e) => setNewStationNameCn(e.target.value)}
                placeholder="เช่น 暹罗 / 叻抛"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">ชื่อสถานี (ภาษารัสเซีย - RU)</Label>
              <Input
                value={newStationNameRu}
                onChange={(e) => setNewStationNameRu(e.target.value)}
                placeholder="เช่น Сиам / Лат Пхрао"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddStationOpen(false)}
                className="h-10 rounded-xl font-bold text-slate-600"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSavingStation}
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
              >
                {isSavingStation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                บันทึกสถานี
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}
