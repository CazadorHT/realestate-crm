"use client";

import { 
  Filter, X, Search, Briefcase, Activity, Building, RotateCcw, 
  SlidersHorizontal, ArrowUpDown, Clock, DollarSign, Calendar, 
  ChevronDown, Key, Tag, MessageSquare, FileCheck, CheckCircle2, 
  XCircle, Trash2, Home, Map, Building2, Layout, Warehouse, Store, Palmtree, Waves, HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DealStats, DealStatus, DealType } from "../types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface DealsFiltersProps {
  q: string;
  setQ: (v: string) => void;
  dealType?: DealType;
  setDealType: (v?: DealType) => void;
  dealStatus?: DealStatus;
  setDealStatus: (v?: DealStatus) => void;
  propertyType?: string;
  setPropertyType: (v?: string) => void;
  hasActiveFilters: boolean;
  onFilterChange: () => void;
  onClearAll?: () => void;
  totalCount?: number;
  stats?: DealStats | null;
  orderBy?: string;
  setOrderBy: (v: string) => void;
  orderDirection?: boolean;
  setOrderDirection: (v: boolean) => void;
}

export function DealsFilters({
  q,
  setQ,
  dealType,
  setDealType,
  dealStatus,
  setDealStatus,
  propertyType,
  setPropertyType,
  hasActiveFilters,
  onFilterChange,
  onClearAll,
  totalCount,
  stats,
  orderBy,
  setOrderBy,
  orderDirection,
  setOrderDirection,
}: DealsFiltersProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const isEn = language === "en";
  
  const activeCount = [
    dealType, 
    dealStatus, 
    propertyType, 
  ].filter(Boolean).length;

  const propertyTypeLabelMap: Record<string, string> = {
    CONDO: isEn ? "Condo" : "คอนโด",
    HOUSE: isEn ? "Detached House" : "บ้านเดี่ยว",
    TOWNHOME: isEn ? "Townhome / Office" : "ทาวน์โฮม/โฮมออฟฟิศ",
    VILLA: isEn ? "Villa" : "วิลล่า",
    POOL_VILLA: isEn ? "Pool Villa" : "พูลวิลล่า",
    COMMERCIAL_BUILDING: isEn ? "Commercial Building" : "อาคารพาณิชย์",
    WAREHOUSE: isEn ? "Warehouse / Factory" : "โกดัง/โรงงาน",
    LAND: isEn ? "Land" : "ที่ดิน",
    OFFICE_BUILDING: isEn ? "Office Building" : "สำนักงาน",
    OTHER: isEn ? "Other" : "อื่นๆ",
  };

  const FilterInputs = (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Deal Type */}
      <div className="space-y-1.5 focus-within:z-20">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <Briefcase className="h-3 w-3" /> {isEn ? "Deal Type" : "ประเภทดีล"}
        </span>
        <ResponsiveDialog
          title={isEn ? "Select Deal Type" : "เลือกประเภทดีล"}
          trigger={
            <Button
              variant="outline"
              className="w-full h-10 bg-slate-50/50 border-slate-100 rounded-xl text-xs font-semibold justify-between px-3 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all text-slate-700 shadow-none outline-none cursor-pointer"
            >
              <span className="truncate">
                {dealType === "RENT" ? (isEn ? "Rent (RENT)" : "เช่า (RENT)") : dealType === "SALE" ? (isEn ? "Sale (SALE)" : "ขาย (SALE)") : (isEn ? "All Types" : "ทุกประเภท")}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          }
        >
          <div className="p-4 flex flex-col gap-2">
            {[
              { label: isEn ? "All Types" : "ทุกประเภท", value: undefined, icon: Briefcase, color: "text-slate-500", bg: "bg-slate-50", count: stats?.total },
              { label: isEn ? "Rent (RENT)" : "เช่า (RENT)", value: "RENT", icon: Key, color: "text-orange-600", bg: "bg-orange-50", count: stats?.deal_type?.RENT },
              { label: isEn ? "Sale (SALE)" : "ขาย (SALE)", value: "SALE", icon: Tag, color: "text-blue-600", bg: "bg-blue-50", count: stats?.deal_type?.SALE },
            ].map((opt) => (
              <Button
                key={opt.label}
                variant={dealType === opt.value ? "default" : "ghost"}
                className={cn(
                  "justify-between h-14 rounded-xl text-sm font-semibold px-4 cursor-pointer",
                  dealType === opt.value ? "bg-blue-600" : "text-slate-600 hover:bg-slate-50"
                )}
                onClick={() => {
                  setDealType(opt.value as DealType);
                  onFilterChange();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", dealType === opt.value ? "bg-white/20" : opt.bg)}>
                    <opt.icon className={cn("h-4 w-4", dealType === opt.value ? "text-white" : opt.color)} />
                  </div>
                  <span>{opt.label}</span>
                </div>
                {opt.count !== undefined && (
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", dealType === opt.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                    {opt.count}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </ResponsiveDialog>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <Activity className="h-3 w-3" /> {isEn ? "Deal Status" : "สถานะดีล"}
        </span>
        <ResponsiveDialog
          title={isEn ? "Select Deal Status" : "เลือกสถานะดีล"}
          trigger={
            <Button
              variant="outline"
              className="w-full h-10 bg-slate-50/50 border-slate-100 rounded-xl text-xs font-semibold justify-between px-3 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all text-slate-700 shadow-none outline-none cursor-pointer"
            >
              <span className="truncate">
                {dealStatus === "NEGOTIATING" ? (isEn ? "Negotiating" : "กำลังต่อรอง") : 
                 dealStatus === "SIGNED" ? (isEn ? "Signed" : "เซ็นสัญญา") : 
                 dealStatus === "CLOSED_WIN" ? (isEn ? "Closed Won" : "จบดีลแล้ว") : 
                 dealStatus === "CLOSED_LOSS" ? (isEn ? "Closed Lost" : "พลาดดีล") : 
                 dealStatus === "CANCELLED" ? (isEn ? "Cancelled" : "ยกเลิก") : (isEn ? "All Statuses" : "ทุกสถานะ")}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          }
        >
          <div className="p-4 flex flex-col gap-2 max-h-[70vh] overflow-y-auto no-scrollbar">
            {[
              { label: isEn ? "All Statuses" : "ทุกสถานะ", value: undefined, icon: Activity, color: "text-slate-500", bg: "bg-slate-50", count: stats?.total },
              { label: isEn ? "Negotiating" : "กำลังต่อรอง", value: "NEGOTIATING", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", count: stats?.status?.NEGOTIATING },
              { label: isEn ? "Signed" : "เซ็นสัญญา", value: "SIGNED", icon: FileCheck, color: "text-indigo-600", bg: "bg-indigo-50", count: stats?.status?.SIGNED },
              { label: isEn ? "Closed Won" : "จบดีลแล้ว", value: "CLOSED_WIN", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", count: stats?.status?.CLOSED_WIN },
              { label: isEn ? "Closed Lost" : "พลาดดีล", value: "CLOSED_LOSS", icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", count: stats?.status?.CLOSED_LOSS },
              { label: isEn ? "Cancelled" : "ยกเลิก", value: "CANCELLED", icon: Trash2, color: "text-slate-400", bg: "bg-slate-100", count: stats?.status?.CANCELLED },
            ].map((opt) => (
              <Button
                key={opt.label}
                variant={dealStatus === opt.value ? "default" : "ghost"}
                className={cn(
                  "justify-between h-14 rounded-xl text-sm font-semibold px-4 cursor-pointer",
                  dealStatus === opt.value ? "bg-blue-600" : "text-slate-600 hover:bg-slate-50"
                )}
                onClick={() => {
                  setDealStatus(opt.value as DealStatus);
                  onFilterChange();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", dealStatus === opt.value ? "bg-white/20" : opt.bg)}>
                    <opt.icon className={cn("h-4 w-4", dealStatus === opt.value ? "text-white" : opt.color)} />
                  </div>
                  <span>{opt.label}</span>
                </div>
                {opt.count !== undefined && (
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", dealStatus === opt.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                    {opt.count}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </ResponsiveDialog>
      </div>

      {/* Property Type */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <Building className="h-3 w-3" /> {isEn ? "Property Type" : "ประเภทอสังหาฯ"}
        </span>
        <ResponsiveDialog
          title={isEn ? "Select Property Type" : "เลือกประเภทอสังหาริมทรัพย์"}
          trigger={
            <Button
              variant="outline"
              className="w-full h-10 bg-slate-50/50 border-slate-100 rounded-xl text-xs font-semibold justify-between px-3 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all text-slate-700 shadow-none outline-none cursor-pointer"
            >
              <span className="truncate">
                {propertyType ? (propertyTypeLabelMap[propertyType] || propertyType) : (isEn ? "All Property Types" : "ทุกประเภท")}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          }
        >
          <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
            {[
              { label: isEn ? "All Property Types" : "ทุกประเภท", value: undefined, icon: Building, color: "text-slate-500", bg: "bg-slate-50", count: stats?.total },
              { label: isEn ? "Condo" : "คอนโด", value: "CONDO", icon: Building2, color: "text-sky-600", bg: "bg-sky-50", count: stats?.property_type?.CONDO },
              { label: isEn ? "Detached House" : "บ้านเดี่ยว", value: "HOUSE", icon: Home, color: "text-emerald-600", bg: "bg-emerald-50", count: stats?.property_type?.HOUSE },
              { label: isEn ? "Townhome / Office" : "ทาวน์โฮม/โฮมออฟฟิศ", value: "TOWNHOME", icon: Layout, color: "text-amber-600", bg: "bg-amber-50", count: stats?.property_type?.TOWNHOME },
              { label: isEn ? "Villa" : "วิลล่า", value: "VILLA", icon: Palmtree, color: "text-teal-600", bg: "bg-teal-50", count: stats?.property_type?.VILLA },
              { label: isEn ? "Pool Villa" : "พูลวิลล่า", value: "POOL_VILLA", icon: Waves, color: "text-blue-500", bg: "bg-blue-50", count: stats?.property_type?.POOL_VILLA },
              { label: isEn ? "Commercial Building" : "อาคารพาณิชย์", value: "COMMERCIAL_BUILDING", icon: Store, color: "text-indigo-600", bg: "bg-indigo-50", count: stats?.property_type?.COMMERCIAL_BUILDING },
              { label: isEn ? "Warehouse / Factory" : "โกดัง/โรงงาน", value: "WAREHOUSE", icon: Warehouse, color: "text-slate-600", bg: "bg-slate-100", count: stats?.property_type?.WAREHOUSE },
              { label: isEn ? "Land" : "ที่ดิน", value: "LAND", icon: Map, color: "text-orange-600", bg: "bg-orange-50", count: stats?.property_type?.LAND },
              { label: isEn ? "Office Building" : "สำนักงาน", value: "OFFICE_BUILDING", icon: Building, color: "text-slate-600", bg: "bg-slate-100", count: stats?.property_type?.OFFICE_BUILDING },
              { label: isEn ? "Other" : "อื่นๆ", value: "OTHER", icon: HelpCircle, color: "text-slate-400", bg: "bg-slate-50", count: stats?.property_type?.OTHER },
            ]
            .filter((opt) => opt.value === undefined || (opt.count && opt.count > 0))
            .map((opt) => (
              <Button
                key={opt.label}
                variant={propertyType === opt.value ? "default" : "ghost"}
                className={cn(
                  "justify-between h-14 rounded-xl text-sm font-semibold px-4 cursor-pointer",
                  propertyType === opt.value ? "bg-blue-600" : "text-slate-600 hover:bg-slate-50"
                )}
                onClick={() => {
                  setPropertyType(opt.value);
                  onFilterChange();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", propertyType === opt.value ? "bg-white/20" : opt.bg)}>
                    <opt.icon className={cn("h-4 w-4", propertyType === opt.value ? "text-white" : opt.color)} />
                  </div>
                  <span>{opt.label}</span>
                </div>
                {opt.count !== undefined && (
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", propertyType === opt.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                    {opt.count}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </ResponsiveDialog>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder={isEn ? "Search property title, lead name..." : "ค้นหาชื่อทรัพย์, ลีด..."}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-100"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-slate-400 active:scale-95 transition-transform cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ResponsiveDialog
            title={isEn ? "Filters & Sorting" : "ตัวกรองและเรียงลำดับ"}
            trigger={
              <Button
                variant="outline"
                className="h-11 rounded-xl px-4 border-slate-200 relative bg-white shadow-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {isEn ? "Filter" : "กรอง"}
                {activeCount > 0 && (
                  <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-white border-none text-[10px] font-bold animate-in zoom-in duration-300">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            }
          >
            <div className="p-6 pb-12">
              <div className="space-y-3 mb-8">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                  <ArrowUpDown className="h-3 w-3" /> {isEn ? "Sort Order" : "การจัดเรียง"}
                </span>
                <div className="grid grid-cols-2 gap-2">
                   {[
                    { label: isEn ? "Newest First" : "ใหม่ไปเก่า", value: "created_at" },
                    { label: isEn ? "Recently Updated" : "ล่าสุด", value: "updated_at" },
                    { label: isEn ? "Commission Amount" : "ค่าคอมมิชชั่น", value: "commission_amount" },
                    { label: isEn ? "Transaction Date" : "วันที่ธุรกรรม", value: "transaction_date" },
                  ].map((s) => (
                    <Button
                      key={s.value}
                      variant={orderBy === s.value ? "default" : "outline"}
                      className="h-10 rounded-xl text-xs font-semibold cursor-pointer"
                      onClick={() => {
                        setOrderBy(s.value);
                        onFilterChange();
                      }}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              {FilterInputs}

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={onClearAll}
                  className="w-full mt-8 h-12 rounded-xl text-rose-600 border-rose-100 hover:bg-rose-50 font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isEn ? "Clear All Filters" : "ล้างตัวกรองทั้งหมด"}
                </Button>
              )}
            </div>
          </ResponsiveDialog>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 py-1 overflow-x-auto no-scrollbar animate-in fade-in slide-in-from-left-4 duration-300 text-nowrap">
            {dealType && <Badge variant="secondary" className="rounded-lg h-7 bg-blue-50 text-blue-700 border-blue-100 font-semibold">{isEn ? "Deal:" : "ดีล:"} {dealType}</Badge>}
            {dealStatus && <Badge variant="secondary" className="rounded-lg h-7 bg-blue-50 text-blue-700 border-blue-100 font-semibold">{isEn ? "Status:" : "สถานะ:"} {dealStatus}</Badge>}
            {propertyType && <Badge variant="secondary" className="rounded-lg h-7 bg-blue-50 text-blue-700 border-blue-100 font-semibold">{isEn ? "Property:" : "ทรัพย์:"} {propertyTypeLabelMap[propertyType] || propertyType}</Badge>}
            <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-[10px] text-rose-500 hover:bg-rose-50 px-2 rounded-lg font-bold cursor-pointer">{isEn ? "Clear" : "ล้างออก"}</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center shadow-xs">
            <Filter className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              {isEn ? "Search & Filter" : "ตัวกรองข้อมูล"}
              {totalCount !== undefined && <span className="ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">{totalCount}</span>}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Search & Filter Deals</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100">
           {[
            { label: isEn ? "Newest" : "ใหม่ไปเก่า", value: "created_at", icon: Calendar },
            { label: isEn ? "Recent" : "ล่าสุด", value: "updated_at", icon: Clock },
            { label: isEn ? "Commission" : "ค่าคอม", value: "commission_amount", icon: DollarSign },
          ].map((sort) => {
            const isActive = orderBy === sort.value;
            return (
              <Button
                key={sort.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-xl text-[10px] font-bold px-3 transition-all cursor-pointer",
                  isActive 
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-900"
                )}
                onClick={() => {
                  if (isActive) setOrderDirection(!orderDirection);
                  else { setOrderBy(sort.value); setOrderDirection(false); }
                  onFilterChange();
                }}
              >
                <sort.icon className={cn("h-3 w-3 mr-1.5", isActive ? "text-blue-600" : "text-slate-400")} />
                {sort.label}
                {isActive && <span className="ml-1 opacity-70">{orderDirection ? "↑" : "↓"}</span>}
              </Button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            {isEn ? "Reset Filters" : "ล้างตัวกรอง"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-4 relative group">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 flex items-center gap-1.5">
            <Search className="h-3 w-3" /> {isEn ? "Search Records" : "ค้นหาข้อมูล"}
          </span>
          <div className="relative">
            <Input
              placeholder={isEn ? "Search property title, lead name..." : "ค้นหาชื่อทรัพย์, ลีด..."}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-4 h-10 bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl text-xs transition-all shadow-none text-slate-800"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {FilterInputs}
        </div>
      </div>
    </div>
  );
}

