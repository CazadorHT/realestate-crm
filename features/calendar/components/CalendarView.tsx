"use client";

import { useState, useEffect, useRef } from "react";
import {
  format,
  setMonth,
  addMonths,
  subMonths,
  addYears,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  LayoutList,
  Columns as ColumnsIcon,
  ChevronDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../queries";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, User, Building2, Check, X, Users } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";

import { EventDetailsDialog } from "./EventDetailsDialog";
import { CalendarGrid } from "./CalendarGrid";

interface CalendarViewProps {
  initialDate: Date;
  events: CalendarEvent[];
  properties: { id: string; title: string }[];
  leads: { id: string; full_name: string }[];
  agents?: { id: string; title: string }[];
  currentUserId?: string;
  isAdmin?: boolean;
}

export function CalendarView({
  initialDate,
  events,
  properties,
  leads,
  agents = [],
  currentUserId,
  isAdmin = false,
}: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"dayGridMonth" | "timeGridWeek" | "listMonth">(
    (searchParams.get("view") as any) || (isMobile ? "listMonth" : "dayGridMonth")
  );
  const hasInitializedView = useRef(false);

  // Initial mobile view detection - only run once when isMobile is determined
  useEffect(() => {
    if (isMobile !== undefined && !hasInitializedView.current) {
      if (isMobile && !searchParams.get("view")) {
        setViewMode("listMonth");
      }
      hasInitializedView.current = true;
    }
  }, [isMobile, searchParams]);

  // Dialog State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Filter State
  const selectedProperty = searchParams.get("propertyId") || "ALL";
  const selectedLead = searchParams.get("leadId") || "ALL";
  const selectedAgent = searchParams.get("agentId") || "ALL";

  const navigate = (direction: "prev" | "next") => {
    setIsLoading(true);
    const newDate = direction === "prev" 
      ? subMonths(currentDate, 1) 
      : addMonths(currentDate, 1);
    updateUrl(newDate, selectedProperty, selectedLead, selectedAgent, viewMode);
  };

  const handlePropertyChange = (val: string) => {
    setIsLoading(true);
    updateUrl(currentDate, val, selectedLead, selectedAgent, viewMode);
  };

  const handleLeadChange = (val: string) => {
    setIsLoading(true);
    updateUrl(currentDate, selectedProperty, val, selectedAgent, viewMode);
  };

  const handleAgentChange = (val: string) => {
    setIsLoading(true);
    updateUrl(currentDate, selectedProperty, selectedLead, val, viewMode);
  };

  const handleViewChange = (newView: "dayGridMonth" | "timeGridWeek" | "listMonth") => {
    setViewMode(newView);
    updateUrl(currentDate, selectedProperty, selectedLead, selectedAgent, newView);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setIsLoading(true);
    const newDate = setMonth(currentDate, monthIndex);
    updateUrl(newDate, selectedProperty, selectedLead, selectedAgent, viewMode);
  };

  const handleYearChange = (delta: number) => {
    setIsLoading(true);
    const newDate = addYears(currentDate, delta);
    updateUrl(newDate, selectedProperty, selectedLead, selectedAgent, viewMode);
  };

  const updateUrl = (
    date: Date,
    propertyId?: string,
    leadId?: string,
    agentId?: string,
    view?: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(date, "yyyy-MM"));
    
    if (propertyId && propertyId !== "ALL") {
      params.set("propertyId", propertyId);
    } else {
      params.delete("propertyId");
    }

    if (leadId && leadId !== "ALL") {
      params.set("leadId", leadId);
    } else {
      params.delete("leadId");
    }

    if (agentId && agentId !== "ALL") {
      params.set("agentId", agentId);
    } else {
      params.delete("agentId");
    }

    if (view && view !== (isMobile ? "listMonth" : "dayGridMonth")) {
      params.set("view", view);
    } else {
      params.delete("view");
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Turn off loader when date changes
  useEffect(() => {
    setCurrentDate(initialDate);
    setIsLoading(false);
  }, [initialDate]);

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* Header controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        {/* Left: Navigation & Title */}
        <div className="flex items-center justify-between w-full lg:w-auto lg:gap-4">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent flex items-center gap-2 group/btn"
                >
                  <h2 className="text-xl font-semibold text-slate-800 group-hover/btn:text-indigo-600 transition-colors">
                    {format(currentDate, "MMMM yyyy", { locale: th })}
                  </h2>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-hover/btn:text-indigo-600 transition-colors" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-3 rounded-2xl shadow-xl border-slate-100" align="start">
                {/* Year Navigation */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleYearChange(-1);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-semibold text-slate-900">
                    ปี {format(currentDate, "yyyy", { locale: th })}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleYearChange(1);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[...Array(12)].map((_, i) => {
                    const count = events.filter(e => {
                      const d = new Date(e.start);
                      return d.getMonth() === i && d.getFullYear() === currentDate.getFullYear();
                    }).length;
                    
                    return (
                      <Button
                        key={i}
                        variant={currentDate.getMonth() === i ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleMonthSelect(i)}
                        className={cn(
                          "text-xs font-semibold h-11 rounded-xl relative",
                          currentDate.getMonth() === i ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "text-slate-600"
                        )}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{format(new Date(2000, i, 1), "MMM", { locale: th })}</span>
                          {count > 0 && (
                            <div className="flex items-center gap-1">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                               <span className={cn("text-[9px]", currentDate.getMonth() === i ? "text-indigo-100" : "text-slate-400")}>
                                 {count}
                               </span>
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            )}
          </div>

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("prev")}
              className="rounded-xl border-slate-200 h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("next")}
              className="rounded-xl border-slate-200 h-9 w-9"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Right: Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Property Filter (Responsive Dialog) */}
          <FilterDialog
            title="เลือกทรัพย์สิน"
            placeholder="ค้นหาทรัพย์สิน..."
            items={properties.map(p => ({ id: p.id, title: p.title }))}
            value={selectedProperty}
            onSelect={handlePropertyChange}
            icon={<Building2 className="h-4 w-4" />}
            allLabel="ทรัพย์สินทั้งหมด"
            indicator={(id) => events.some(e => e.meta?.propertyId === id)}
          />

          {/* Lead Filter (Responsive Dialog) */}
          <FilterDialog
            title="เลือกลูกค้า"
            placeholder="ค้นหาชื่อลูกค้า..."
            items={leads.map(l => ({ id: l.id, title: l.full_name }))}
            value={selectedLead}
            onSelect={handleLeadChange}
            icon={<User className="h-4 w-4" />}
            allLabel="ลูกค้าทั้งหมด"
            indicator={(id) => events.some(e => e.meta?.leadId === id)}
          />

          {/* Agent Filter (Admin Only) */}
          {isAdmin && (
            <FilterDialog
              title="เลือกพนักงาน"
              placeholder="ค้นหาชื่อพนักงาน..."
              items={agents}
              value={selectedAgent}
              onSelect={handleAgentChange}
              icon={<Users className="h-4 w-4" />}
              allLabel="พนักงานทั้งหมด"
              indicator={(id) => events.some(e => e.meta?.agentId === id)}
            />
          )}

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100/50 gap-4 rounded-xl h-10">
            <button
              onClick={() => handleViewChange("dayGridMonth")}
              className={cn(
                "flex-1 px-3 py-1.5  text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                viewMode === "dayGridMonth"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
              title="ตารางรายเดือน"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className=" ">เดือน</span>
            </button>
            <button
              onClick={() => handleViewChange("timeGridWeek")}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                viewMode === "timeGridWeek"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
              title="ตารางรายสัปดาห์"
            >
              <ColumnsIcon className="h-4 w-4" />
              <span className=" ">สัปดาห์</span>
            </button>
            <button
              onClick={() => handleViewChange("listMonth")}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                viewMode === "listMonth"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
              title="มุมมองแบบรายการ"
            >
              <LayoutList className="h-4 w-4" />
              <span className="">รายการ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2 min-h-[700px]">
        {/* Event Legend - More subtle */}
        <div className="px-4 py-3 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>นัดชม</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>สัญญาเริ่ม</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>สัญญาหมด</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>ปิดดีล</span>
          </div>
        </div>

        <CalendarGrid
          events={events}
          initialDate={currentDate}
          onEventClick={setSelectedEvent}
          viewMode={viewMode}
          editable={true}
        />
      </div>

      {/* Details Dialog */}
      <EventDetailsDialog
        open={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

/**
 * 🛰️ Internal Helper: FilterDialog
 * A reusable responsive dialog for selection with search and activity indicators.
 */
interface FilterItem {
  id: string;
  title: string;
}

interface FilterDialogProps {
  title: string;
  placeholder: string;
  items: FilterItem[];
  value: string;
  onSelect: (id: string) => void;
  icon: React.ReactNode;
  allLabel: string;
  indicator?: (id: string) => boolean;
}

function FilterDialog({
  title,
  placeholder,
  items,
  value,
  onSelect,
  icon,
  allLabel,
  indicator
}: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const selectedItem = items.find(i => i.id === value);
  
  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
    if (showOnlyActive && indicator) {
      return matchesSearch && indicator(i.id);
    }
    return matchesSearch;
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      trigger={
        <Button 
          variant="outline" 
          className="w-full sm:w-[180px] rounded-xl border-slate-200 h-10 justify-between px-3 font-semibold text-slate-700"
        >
          <div className="flex items-center gap-2 truncate text-inherit">
            {icon}
            <span className="truncate">
              {value === "ALL" ? allLabel : selectedItem?.title || "ไม่ทราบข้อมูล"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      }
    >
      <div className="flex flex-col h-full bg-white">
        {/* Search Header */}
        <div className="px-4 py-3 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500"
              autoFocus
            />
            {search && (
              <button 
                 onClick={() => setSearch("")}
                 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
               onClick={() => setShowOnlyActive(!showOnlyActive)}
               className={cn(
                 "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                 showOnlyActive 
                   ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm" 
                   : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
               )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                showOnlyActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              )} />
              แสดงเฉพาะที่มีกิจกรรม
            </button>
            
            {search && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                พบ {filteredItems.length} รายการ
              </span>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[500px]">
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                onSelect("ALL");
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left",
                value === "ALL" ? "bg-indigo-50 text-indigo-700 font-semibold" : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <span>{allLabel}</span>
              {value === "ALL" && <Check className="h-4 w-4" />}
            </button>

            {filteredItems.map((item) => {
              const active = indicator?.(item.id);
              const isSelected = value === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group",
                    isSelected ? "bg-indigo-50 text-indigo-700 font-semibold" : "hover:bg-slate-50 text-slate-600",
                    !active && !isSelected && "opacity-50" // หรี่สีลงหากไม่มีกิจกรรม
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 text-inherit">
                    <div className="relative shrink-0">
                      {active && (
                         <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      )}
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                        isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                        !active && !isSelected && "grayscale" // ทำให้ไอคอนเป็นสีเทาหากไม่มีกิจกรรม
                      )}>
                        {title.includes("ทรัพย์สิน") ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                    </div>
                    <span className={cn(
                      "truncate transition-colors",
                      !active && !isSelected ? "text-slate-400" : ""
                    )}>
                      {item.title}
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
            
            {filteredItems.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 italic">ไม่พบข้อมูลที่ค้นหา</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
