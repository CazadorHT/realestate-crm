"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  X, 
  Filter, 
  Layers, 
  History as HistoryIcon,
  Loader2
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-context";

const LOG_ACTIONS = [
  "property.create",
  "property.update",
  "property.delete",
  "lead.create",
  "lead.update",
  "deal.create",
  "deal.update",
  "member.add",
  "member.remove",
  "member.transfer",
  "tenant.create",
  "tenant.update",
  "tenant.delete",
  "auth.login",
];

const LOG_ENTITIES = [
  "properties",
  "leads",
  "deals",
  "owners",
  "users",
  "tenants",
  "tenant_members",
  "auth",
];

interface AuditLogFiltersProps {
  users: { id: string; full_name: string | null; email: string | null }[];
  totalCount?: number;
}

export function AuditLogFilters({ users, totalCount }: AuditLogFiltersProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Initial State from URL
  const [filters, setFilters] = useState({
    action: searchParams.get("action") || "ALL",
    entity: searchParams.get("entity") || "ALL",
    userId: searchParams.get("userId") || "ALL",
  });

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    if (start) {
      return {
        from: new Date(start),
        to: end ? new Date(end) : undefined,
      };
    }
    return undefined;
  });

  const applyFilters = (
    newFilters: typeof filters,
    newDate: DateRange | undefined,
  ) => {
    const params = new URLSearchParams();
    if (newFilters.action && newFilters.action !== "ALL")
      params.set("action", newFilters.action);
    if (newFilters.entity && newFilters.entity !== "ALL")
      params.set("entity", newFilters.entity);
    if (newFilters.userId && newFilters.userId !== "ALL")
      params.set("userId", newFilters.userId);

    if (newDate?.from) {
      params.set("startDate", format(newDate.from, "yyyy-MM-dd"));
      if (newDate.to) {
        params.set("endDate", format(newDate.to, "yyyy-MM-dd"));
      }
    }

    // Always reset to page 1 when filtering
    params.set("page", "1");

    setIsNavigating(true);
    router.push(`/protected/admin/audit-logs?${params.toString()}`);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters, date);
  };

  const handleDateSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && (newDate?.to || !newDate?.from)) {
      applyFilters(filters, newDate);
    } else if (!newDate) {
      applyFilters(filters, undefined);
    }
  };

  // Effect to sync URL changes back to state (e.g. browser back button)
  useEffect(() => {
    setFilters({
      action: searchParams.get("action") || "ALL",
      entity: searchParams.get("entity") || "ALL",
      userId: searchParams.get("userId") || "ALL",
    });
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    if (start) {
      setDate({
        from: new Date(start),
        to: end ? new Date(end) : undefined,
      });
    } else {
      setDate(undefined);
    }
  }, [searchParams]);

  const clearFilters = () => {
    const cleared = {
      action: "ALL",
      entity: "ALL",
      userId: "ALL",
    };
    setFilters(cleared);
    setDate(undefined);
    setIsMobileMenuOpen(false);
    setIsNavigating(true);
    router.push("/protected/admin/audit-logs");
  };

  const activeFilterCount = [
    filters.action !== "ALL",
    filters.entity !== "ALL",
    filters.userId !== "ALL",
    !!date,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const filterContent = (
    <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-3">
      <div className="flex items-center gap-2 mb-1 xl:hidden">
        <Layers className="h-4 w-4 text-blue-500" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {isEn ? "Filter Options" : "ตัวเลือกการกรอง"}{" "}
          {totalCount !== undefined && `(${totalCount.toLocaleString()})`}
        </span>
      </div>

      {/* Action Filter */}
      <div className="space-y-1.5 xl:space-y-0">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter xl:hidden ml-2">
          {isEn ? "Event Action" : "ประเภทการดำเนินการ"}
        </label>
        <Select
          value={filters.action}
          onValueChange={(val) => handleFilterChange("action", val)}
        >
          <SelectTrigger className="w-full xl:w-[200px] h-12 xl:h-11 rounded-2xl border-slate-200 bg-white font-semibold text-slate-700 shadow-sm">
            <SelectValue placeholder={isEn ? "Select Action" : "ประเภทการดำเนินการ"} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
            <SelectItem value="ALL" className="font-semibold text-slate-500 italic">
              {isEn ? "All Actions" : "การดำเนินการทั้งหมด"}
            </SelectItem>
            {LOG_ACTIONS.map((action) => (
              <SelectItem key={action} value={action} className="font-semibold text-slate-700">
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entity Filter */}
      <div className="space-y-1.5 xl:space-y-0">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter xl:hidden ml-2">
          {isEn ? "Entity Type" : "หมวดหมู่ข้อมูล"}
        </label>
        <Select
          value={filters.entity}
          onValueChange={(val) => handleFilterChange("entity", val)}
        >
          <SelectTrigger className="w-full xl:w-[200px] h-12 xl:h-11 rounded-2xl border-slate-200 bg-white font-semibold text-slate-700 shadow-sm">
            <SelectValue placeholder={isEn ? "Select Entity" : "เลือกหมวดหมู่"} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
            <SelectItem value="ALL" className="font-semibold text-slate-500 italic">
              {isEn ? "All Entities" : "หมวดหมู่ทั้งหมด"}
            </SelectItem>
            {LOG_ENTITIES.map((entity) => (
              <SelectItem key={entity} value={entity} className="font-semibold text-slate-700">
                {entity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Filter */}
      <div className="space-y-1.5 xl:space-y-0">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter xl:hidden ml-2">
          {isEn ? "Triggered User" : "ผู้ดำเนินการ"}
        </label>
        <Select
          value={filters.userId}
          onValueChange={(val) => handleFilterChange("userId", val)}
        >
          <SelectTrigger className="w-full xl:w-[240px] h-12 xl:h-11 rounded-2xl border-slate-200 bg-white font-semibold text-slate-700 shadow-sm">
            <SelectValue placeholder={isEn ? "Select User" : "เลือกผู้ใช้"} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
            <SelectItem value="ALL" className="font-semibold text-slate-500 italic">
              {isEn ? "All Users" : "ผู้ใช้ทั้งหมด"}
            </SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id} className="font-semibold text-slate-700">
                {user.full_name || user.email || (isEn ? "Unknown User" : "ไม่ระบุชื่อ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Picker */}
      <div className="space-y-1.5 xl:space-y-0">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter xl:hidden ml-2">
          {isEn ? "Time Range" : "ช่วงเวลา"}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full xl:w-[280px] justify-start text-left font-semibold h-12 xl:h-11 rounded-2xl border-slate-200 bg-white transition-all hover:bg-slate-50 shadow-sm",
                !date && "text-slate-400",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM yyyy", { locale: isEn ? enUS : th })} -{" "}
                    {format(date.to, "dd MMM yyyy", { locale: isEn ? enUS : th })}
                  </>
                ) : (
                  format(date.from, "dd MMM yyyy", { locale: isEn ? enUS : th })
                )
              ) : (
                <span>{isEn ? "Select date range" : "เลือกช่วงเวลา"}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-[32px] overflow-hidden shadow-2xl border-slate-100 mt-2" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              className="font-semibold"
            />
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="xl:ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-11 xl:h-10 font-semibold transition-all px-4"
        >
          <X className="h-4 w-4 mr-1.5" />
          {isEn ? "Clear filters" : "ล้างตัวกรอง"}
        </Button>
      )}

      <div className="pt-4 xl:hidden border-t border-slate-100 mt-2">
        <Button 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-2xl font-semibold shadow-lg shadow-slate-200 transition-all active:scale-95"
          onClick={() => setIsMobileMenuOpen(false)}
          disabled={isNavigating}
        >
          {isNavigating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isEn ? "Apply Filters" : "ดูผลลัพธ์ข้อมูลระบบ"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      {/* 🖥️ Desktop Container */}
      <div className={cn(
        "hidden xl:flex items-center gap-3 p-3 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-[32px] shadow-sm",
        hasActiveFilters && "border-blue-100 bg-blue-50/20"
      )}>
        <div className="px-4 border-r border-slate-200/60 mr-1 flex items-center gap-2.5">
          <div className={cn(
            "p-1.5 rounded-xl transition-all",
            hasActiveFilters ? "bg-blue-500 text-white shadow-md shadow-blue-100" : "bg-slate-100 text-slate-400"
          )}>
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
            {isEn ? "Filter" : "Search"}
          </span>
          {totalCount !== undefined && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border-blue-100 rounded-lg">
              {totalCount.toLocaleString()}
            </Badge>
          )}
        </div>
        {filterContent}
      </div>

      {/* 📱 Mobile Container */}
      <div className="xl:hidden flex items-center justify-between gap-3 p-2 bg-white/70 backdrop-blur-md border border-slate-100 rounded-[28px] shadow-sm">
        <ResponsiveDialog
          open={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          title={
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                <HistoryIcon className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-semibold text-xl">
                {isEn ? "Audit Log Filters" : "ตัวกรองประวัติระบบ"}
              </span>
            </div>
          }
          description={
            isEn
              ? "Filter criteria to inspect system events and historical change logs"
              : "ระบุเงื่อนไขการค้นหาเพื่อตรวจสอบประวัติการใช้งาน (Audit Logs) ทั้งหมดในระบบ"
          }
          trigger={
            <Button 
              variant="outline" 
              className={cn(
                "flex-1 h-14 rounded-[22px] border-slate-200 font-semibold gap-3 transition-all active:scale-95 shadow-sm bg-white/80",
                hasActiveFilters && "border-blue-500 bg-blue-50/50 text-blue-600 ring-2 ring-blue-100"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg",
                hasActiveFilters ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
              )}>
                <Filter className="h-4 w-4" />
              </div>
              <span className="italic">
                {isEn ? "Filter audit logs" : "กรองข้อมูลที่ต้องการตรวจสอบ"}
              </span>
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : hasActiveFilters && (
                <Badge className="ml-1 h-5 w-5 flex items-center justify-center p-0 bg-blue-600 text-[10px] rounded-lg">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          }
        >
          <div className="p-6">
            {filterContent}
          </div>
        </ResponsiveDialog>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearFilters}
            className="h-14 w-14 rounded-[22px] bg-red-50 text-red-500 border border-red-100 shadow-sm transition-all active:scale-95"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}


