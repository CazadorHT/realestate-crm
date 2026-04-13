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
  Loader2,
  Check,
  X,
} from "lucide-react";
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaChevronDown, 
  FaCalendarDays, 
  FaCalendarWeek, 
  FaListUl, 
  FaBuilding, 
  FaUser, 
  FaUsers,
  FaCalendar
} from "react-icons/fa6";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../queries";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search } from "lucide-react";
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
      {/* Header controls - Elite Grid Overhaul */}
      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-200/60 shadow-sm sticky top-0 z-20">
        
        {/* Section 1: Navigation & Title Group */}
        <div className="flex items-center justify-between xl:justify-start gap-4 w-full">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-11 px-4 hover:bg-slate-50 rounded-2xl flex items-center gap-3 group/btn transition-all border border-transparent hover:border-slate-100"
                >
                  <h2 className="text-xl font-semibold text-slate-800 group-hover/btn:text-indigo-600 transition-colors">
                    {format(currentDate, "MMMM yyyy", { locale: th })}
                  </h2>
                  <FaChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover/btn:text-indigo-600 transition-all group-data-[state=open]/btn:rotate-180" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-4 rounded-[28px] shadow-2xl border-slate-100/60 mt-2" align="start">
                {/* Year Navigation */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-50">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleYearChange(-1);
                    }}
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-semibold text-slate-900 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                    ปี {format(currentDate, "yyyy", { locale: th })}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleYearChange(1);
                    }}
                  >
                    <FaChevronRight className="h-4 w-4" />
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
                          "text-xs font-semibold h-12 rounded-2xl relative transition-all active:scale-95",
                          currentDate.getMonth() === i 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                            : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                        )}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="uppercase tracking-wider">{format(new Date(2000, i, 1), "MMM", { locale: th })}</span>
                          {count > 0 && (
                            <div className="flex items-center gap-1">
                               <span className={cn(
                                 "w-1 h-1 rounded-full",
                                 currentDate.getMonth() === i ? "bg-white" : "bg-emerald-500"
                               )} />
                               <span className={cn("text-[9px] font-bold", currentDate.getMonth() === i ? "text-indigo-100" : "text-slate-400")}>
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
              <div className="bg-indigo-50 p-2 rounded-full">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              </div>
            )}
          </div>

          {/* Quick Nav arrows */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("prev")}
              className="rounded-xl h-9 w-10 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
            >
              <FaChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("next")}
              className="rounded-xl h-9 w-10 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
            >
              <FaChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Section 2: Loading Spacer / Center (Hidden on XL) */}
        <div className="hidden xl:block" />

        {/* Section 3: High-Fidelity Filters & View Toggle - Tablet Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4 w-full xl:w-auto">
          {/* Property Filter */}
          <FilterDialog
            title="เลือกทรัพย์สิน"
            placeholder="ค้นหาทรัพย์สิน..."
            
            items={properties.map(p => ({ id: p.id, title: p.title }))}
            value={selectedProperty}
            onSelect={handlePropertyChange}
            icon={<FaBuilding className="h-4 w-4 mb-0.5" />}
            allLabel="ทรัพย์สินทั้งหมด"
            indicator={(id) => events.some(e => e.meta?.propertyId === id)}
          />

          {/* Lead Filter */}
          <FilterDialog
            title="เลือกลูกค้า"
            placeholder="ค้นหาชื่อลูกค้า..."
            items={leads.map(l => ({ id: l.id, title: l.full_name }))}
            value={selectedLead}
            onSelect={handleLeadChange}
            icon={<FaUser className="h-4 w-4 mb-0.5" />}
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
              icon={<FaUsers className="h-4 w-4 mb-0.5" />}
              allLabel="พนักงานทั้งหมด"
              indicator={(id) => events.some(e => e.meta?.agentId === id)}
            />
          )}

          {/* View Mode Toggle - Elite Design Standardized Height */}
          <div className="flex bg-slate-100/60 p-1.5 gap-1.5 rounded-2xl border border-slate-200/50 w-full lg:w-auto h-11 items-center">
            <button
              onClick={() => handleViewChange("dayGridMonth")}
              className={cn(
                "flex-1 lg:px-4 h-full  text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                viewMode === "dayGridMonth"
                  ? "bg-white text-indigo-600 shadow-lg shadow-slate-200/80 scale-[1.03]"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/40",
              )}
              title="ตารางรายเดือน"
            >
              <FaCalendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">เดือน</span>
            </button>
            <button
              onClick={() => handleViewChange("timeGridWeek")}
              className={cn(
                "flex-1 lg:px-4 h-full  text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                viewMode === "timeGridWeek"
                  ? "bg-white text-indigo-600 shadow-lg shadow-slate-200/80 scale-[1.03]"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/40",
              )}
              title="ตารางรายสัปดาห์"
            >
              <FaCalendarWeek className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">สัปดาห์</span>
            </button>
            <button
              onClick={() => handleViewChange("listMonth")}
              className={cn(
                "flex-1 lg:px-4 h-full  text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                viewMode === "listMonth"
                  ? "bg-white text-indigo-600 shadow-lg shadow-slate-200/80 scale-[1.03]"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/40",
              )}
              title="มุมมองแบบรายการ"
            >
              <FaListUl className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">รายการ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden p-3 min-h-[700px] transition-all">
        {/* Event Legend - More Premium */}
        <div className="px-6 py-4 flex flex-wrap gap-5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 border-b border-slate-50 mb-2">
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-blue-600 transition-colors">นัดชม</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-emerald-600 transition-colors">สัญญาเริ่ม</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-red-600 transition-colors">สัญญาหมด</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-purple-600 transition-colors">ปิดดีล</span>
          </div>
        </div>

        <div className="p-1">
          <CalendarGrid
            events={events}
            initialDate={currentDate}
            onEventClick={setSelectedEvent}
            viewMode={viewMode}
            editable={true}
          />
        </div>
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
          className="w-full lg:w-[150px] xl:w-[180px] rounded-xl border-slate-200 h-11 justify-between px-3 font-semibold text-slate-700 bg-white/50 hover:bg-white hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 truncate text-inherit">
            {icon}
            <span className="truncate">
              {value === "ALL" ? allLabel : selectedItem?.title || "ไม่ทราบข้อมูล"}
            </span>
          </div>
          <FaChevronDown className="h-3 w-3 opacity-50 shrink-0 ml-2" />
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
                        {title.includes("ทรัพย์สิน") ? <FaBuilding className="h-4 w-4" /> : <FaUser className="h-4 w-4" />}
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
