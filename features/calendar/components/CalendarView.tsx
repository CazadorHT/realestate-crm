"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  format,
  setMonth,
  addMonths,
  subMonths,
  addYears,
} from "date-fns";
import { th, enUS } from "date-fns/locale";
import {
  Loader2,
  Check,
  X,
  Search,
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
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../queries";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PropertyCombobox } from "@/components/PropertyCombobox";
import { LeadCombobox } from "@/components/LeadCombobox";
import { AgentCombobox } from "@/components/AgentCombobox";

import { EventDetailsDialog } from "./EventDetailsDialog";

const CalendarGrid = dynamic(() => import("./CalendarGrid").then((mod) => mod.CalendarGrid), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-sm font-medium text-slate-500">Loading calendar...</p>
    </div>
  ),
});

interface CalendarViewProps {
  initialDate: Date;
  events: CalendarEvent[];
  properties: { id: string; title: string; title_en?: string | null }[];
  leads: { id: string; full_name: string }[];
  agents?: { id: string; title: string; email?: string | null; role?: string | null; avatar_url?: string | null }[];
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
  const { language } = useLanguage();
  const isEn = language === "en";

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

  const initialPropObj = useMemo(() => {
    if (!selectedProperty || selectedProperty === "ALL") return null;
    const p = properties.find((x) => x.id === selectedProperty);
    return p ? { id: p.id, title: p.title, title_en: p.title_en } : null;
  }, [selectedProperty, properties]);

  const initialLeadObj = useMemo(() => {
    if (!selectedLead || selectedLead === "ALL") return null;
    const l = leads.find((x) => x.id === selectedLead);
    return l ? { id: l.id, full_name: l.full_name, phone: null, email: null } : null;
  }, [selectedLead, leads]);

  const initialAgentObj = useMemo(() => {
    if (!selectedAgent || selectedAgent === "ALL") return null;
    const a = agents.find((x) => x.id === selectedAgent);
    return a ? { id: a.id, title: a.title, email: a.email, role: a.role, avatar_url: a.avatar_url } : null;
  }, [selectedAgent, agents]);

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
      {/* Header controls - Responsive, Non-overflowing Layout */}
      <div id="tour-calendar-controls" className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 p-3.5 sm:p-4 bg-white/80 backdrop-blur-md rounded-[28px] sm:rounded-[32px] border border-slate-200/60 shadow-sm sticky top-0 z-20">
        
        {/* Section 1: Navigation & Title Group */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-11 px-3.5 hover:bg-slate-50 rounded-2xl flex items-center gap-2.5 group/btn transition-all border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 group-hover/btn:text-indigo-600 transition-colors whitespace-nowrap">
                    {format(currentDate, "MMMM yyyy", { locale: isEn ? enUS : th })}
                  </h2>
                  <FaChevronDown className="h-3 w-3 text-slate-400 group-hover/btn:text-indigo-600 transition-all group-data-[state=open]/btn:rotate-180" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-4 rounded-[28px] shadow-2xl border-slate-100/60 mt-2" align="start">
                {/* Year Navigation */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-50">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleYearChange(-1);
                    }}
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-semibold text-slate-900 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                    {isEn ? "" : "ปี "}{format(currentDate, "yyyy", { locale: isEn ? enUS : th })}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
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
                          "text-xs font-semibold h-12 rounded-2xl relative transition-all active:scale-95 cursor-pointer",
                          currentDate.getMonth() === i 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                            : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                        )}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="uppercase tracking-wider">{format(new Date(2000, i, 1), "MMM", { locale: isEn ? enUS : th })}</span>
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
          <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("prev")}
              className="rounded-xl h-9 w-9 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
            >
              <FaChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("next")}
              className="rounded-xl h-9 w-9 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
            >
              <FaChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Section 2: Filters & View Toggle (Flex Wrap + Compact Proportions) */}
        <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap justify-start xl:justify-end min-w-0">
          {/* Property Filter */}
          <div className="w-[calc(50%-4px)] sm:w-[165px] md:w-[180px] xl:w-[200px] shrink-0">
            <PropertyCombobox
              value={selectedProperty === "ALL" ? null : selectedProperty}
              onChangeAction={(id) => handlePropertyChange(id || "ALL")}
              placeholder={isEn ? "All Properties" : "ทรัพย์ทั้งหมด"}
              initialProperty={initialPropObj}
              className="h-11 rounded-2xl border-slate-200/80 bg-slate-50/50 hover:bg-white text-xs font-semibold"
            />
          </div>

          {/* Lead Filter */}
          <div className="w-[calc(50%-4px)] sm:w-[145px] md:w-[155px] xl:w-[160px] shrink-0">
            <LeadCombobox
              value={selectedLead === "ALL" ? null : selectedLead}
              onChangeAction={(id) => handleLeadChange(id || "ALL")}
              placeholder={isEn ? "All Leads" : "ลูกค้าทั้งหมด"}
              initialLead={initialLeadObj}
              className="h-11 rounded-2xl border-slate-200/80 bg-slate-50/50 hover:bg-white text-xs font-semibold"
            />
          </div>

          {/* Agent Filter (Admin Only) */}
          {isAdmin && (
            <div className="w-[calc(50%-4px)] sm:w-[145px] md:w-[155px] xl:w-[160px] shrink-0">
              <AgentCombobox
                value={selectedAgent === "ALL" ? null : selectedAgent}
                onChangeAction={(id) => handleAgentChange(id || "ALL")}
                placeholder={isEn ? "All Agents" : "พนักงานทั้งหมด"}
                agents={agents}
                initialAgent={initialAgentObj}
                className="h-11 rounded-2xl border-slate-200/80 bg-slate-50/50 hover:bg-white text-xs font-semibold"
              />
            </div>
          )}

          {/* View Mode Toggle */}
          <div id="tour-calendar-view-mode" className="flex bg-slate-100/60 p-1 gap-1 rounded-2xl border border-slate-200/50 shrink-0 h-11 items-center ml-auto xl:ml-0">
            <button
              onClick={() => handleViewChange("dayGridMonth")}
              className={cn(
                "px-3 h-full text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewMode === "dayGridMonth"
                  ? "bg-white text-indigo-600 shadow-md shadow-slate-200/80"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/40",
              )}
              title={isEn ? "Month view" : "ตารางรายเดือน"}
            >
              <FaCalendar className="h-3 w-3" />
              <span>{isEn ? "Month" : "เดือน"}</span>
            </button>
            <button
              onClick={() => handleViewChange("timeGridWeek")}
              className={cn(
                "px-3 h-full text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewMode === "timeGridWeek"
                  ? "bg-white text-indigo-600 shadow-md shadow-slate-200/80"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/40",
              )}
              title={isEn ? "Week view" : "ตารางรายสัปดาห์"}
            >
              <FaCalendarWeek className="h-3 w-3" />
              <span>{isEn ? "Week" : "สัปดาห์"}</span>
            </button>
            <button
              onClick={() => handleViewChange("listMonth")}
              className={cn(
                "px-3 h-full text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewMode === "listMonth"
                  ? "bg-white text-indigo-600 shadow-md shadow-slate-200/80"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white/40",
              )}
              title={isEn ? "List view" : "รายการ"}
            >
              <FaListUl className="h-3 w-3" />
              <span>{isEn ? "List" : "รายการ"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div id="tour-calendar-grid" className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden p-3 min-h-[700px] transition-all">
        {/* Event Legend - More Premium */}
        <div className="px-6 py-4 flex flex-wrap gap-5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 border-b border-slate-50 mb-2">
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-blue-600 transition-colors">{isEn ? "Viewing" : "นัดชม"}</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-emerald-600 transition-colors">{isEn ? "Lease Start" : "สัญญาเริ่ม"}</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-red-600 transition-colors">{isEn ? "Lease End" : "สัญญาหมด"}</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-purple-600 transition-colors">{isEn ? "Closed Deal" : "ปิดดีล"}</span>
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
