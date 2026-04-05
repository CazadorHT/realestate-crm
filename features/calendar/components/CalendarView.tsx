"use client";

import { useState, useEffect, useRef } from "react";
import {
  format,
  setMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  LayoutList,
  Columns as ColumnsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../queries";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

import { EventDetailsDialog } from "./EventDetailsDialog";
import { CalendarGrid } from "./CalendarGrid";

interface CalendarViewProps {
  initialDate: Date;
  events: CalendarEvent[];
  properties: { id: string; title: string }[];
}

export function CalendarView({
  initialDate,
  events,
  properties,
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

  const navigate = (direction: "prev" | "next") => {
    setIsLoading(true);
    const newDate = direction === "prev" 
      ? subMonths(currentDate, 1) 
      : addMonths(currentDate, 1);
    updateUrl(newDate, selectedProperty, viewMode);
  };

  const handlePropertyChange = (val: string) => {
    setIsLoading(true);
    updateUrl(currentDate, val, viewMode);
  };

  const handleViewChange = (newView: "dayGridMonth" | "timeGridWeek" | "listMonth") => {
    setViewMode(newView);
    updateUrl(currentDate, selectedProperty, newView);
  };

  const updateUrl = (date: Date, propId: string, view: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("month", format(date, "yyyy-MM"));
    
    if (propId && propId !== "ALL") {
      params.set("propertyId", propId);
    } else {
      params.delete("propertyId");
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
            <h2 className="text-xl font-bold text-slate-800">
              {format(currentDate, "MMMM yyyy", { locale: th })}
            </h2>
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
          {/* Property Filter */}
          <Select value={selectedProperty} onValueChange={handlePropertyChange}>
            <SelectTrigger className="w-full sm:w-[280px] rounded-xl border-slate-200 h-10">
              <span className="truncate">
                {selectedProperty === "ALL"
                  ? "ทรัพย์สินทั้งหมด"
                  : properties.find((p) => p.id === selectedProperty)?.title ||
                    "Select Property"}
              </span>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto rounded-xl shadow-xl border-slate-100">
              <SelectItem value="ALL">ทรัพย์สินทั้งหมด</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="truncate block max-w-[300px] ">
                    {p.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle - Only show icons on small screens to save space */}
          <div className="flex bg-slate-100/50 p-1 rounded-xl h-10">
            <button
              onClick={() => handleViewChange("dayGridMonth")}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                viewMode === "dayGridMonth"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
              title="ตารางรายเดือน"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden lg:inline">เดือน</span>
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
              <span className="hidden lg:inline">สัปดาห์</span>
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
              <span className="hidden lg:inline">รายการ</span>
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
