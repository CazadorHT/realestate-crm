"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addYears,
  subYears,
  setMonth,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../queries";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EventDetailsDialog } from "./EventDetailsDialog";

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
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "year">("month");

  // Dialog State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Filter State
  const [selectedProperty, setSelectedProperty] = useState(
    searchParams.get("propertyId") || "ALL",
  );

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const navigate = (direction: "prev" | "next") => {
    setIsLoading(true);
    let newDate = currentDate;

    if (viewMode === "month") {
      newDate =
        direction === "prev"
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1);
    } else {
      newDate =
        direction === "prev"
          ? subYears(currentDate, 1)
          : addYears(currentDate, 1);
    }

    setCurrentDate(newDate);
    updateUrl(newDate, selectedProperty);
  };

  const handlePropertyChange = (val: string) => {
    setSelectedProperty(val);
    setIsLoading(true);
    updateUrl(currentDate, val);
  };

  const updateUrl = (date: Date, propId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("month", format(date, "yyyy-MM"));
    if (propId && propId !== "ALL") {
      params.set("propertyId", propId);
    } else {
      params.delete("propertyId");
    }
    router.push(`?${params.toString()}`);
  };

  const switchToMonth = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex);
    setCurrentDate(newDate);
    setViewMode("month");
    updateUrl(newDate, selectedProperty);
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start), day));
  };

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-lg border shadow-sm">
        {/* Left: Navigation & Title */}
        <div className="flex items-center justify-between w-full md:w-auto md:gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              {viewMode === "month"
                ? format(currentDate, "MMMM yyyy", { locale: th })
                : `ปี ${format(currentDate, "yyyy", { locale: th })}`}
            </h2>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Mobile Nav Buttons */}
          <div className="flex gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop Nav - Hidden on mobile */}
          <div className="hidden md:flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Right: Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
          {/* Property Filter */}
          <Select value={selectedProperty} onValueChange={handlePropertyChange}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <span className="truncate">
                {selectedProperty === "ALL"
                  ? "ทรัพย์สินทั้งหมด"
                  : properties.find((p) => p.id === selectedProperty)?.title ||
                    "Select Property"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทรัพย์สินทั้งหมด</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="truncate block max-w-[300px]">
                    {p.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2" />

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2",
                viewMode === "month"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              เดือน
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={cn(
                "flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2",
                viewMode === "year"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Grid3X3 className="h-3 w-3" />
              ปี
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "month" ? (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {events.filter((e) => isSameMonth(new Date(e.start), currentDate))
            .length === 0 && (
            <div className="p-2 bg-slate-50 text-center text-sm text-muted-foreground border-b">
              ไม่มีนัดหมายในเดือนนี้
            </div>
          )}

          <div className="grid grid-cols-7 border-b bg-slate-50">
            {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px">
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[120px] p-2 bg-white flex flex-col gap-1 transition-colors hover:bg-slate-50",
                    !isCurrentMonth && "bg-slate-50/50 text-muted-foreground",
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={cn(
                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                        isSameDay(day, new Date()) &&
                          "bg-blue-600 text-white shadow-sm",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className={cn(
                          "text-[10px] px-1.5 py-1 rounded truncate font-medium border-l-2 cursor-pointer shadow-sm hover:opacity-80 transition-opacity",
                          event.type === "viewing" &&
                            "bg-blue-50 text-blue-700 border-blue-500",
                          event.type === "contract_end" &&
                            "bg-red-50 text-red-700 border-red-500",
                          event.type === "deal_closing" &&
                            "bg-green-50 text-green-700 border-green-500",
                        )}
                        title={event.title}
                      >
                        {format(new Date(event.start), "HH:mm")} {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {months.map((monthIndex) => {
            const tempDate = setMonth(currentDate, monthIndex);
            return (
              <button
                key={monthIndex}
                onClick={() => switchToMonth(monthIndex)}
                className="p-4 bg-white border rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col gap-2 min-h-[100px]"
              >
                <span className="font-semibold text-lg text-slate-700">
                  {format(tempDate, "MMMM", { locale: th })}
                </span>
                <div className="flex-1 border border-dashed rounded bg-slate-50 flex items-center justify-center text-xs text-muted-foreground p-2">
                  Click to view
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Details Dialog */}
      <EventDetailsDialog
        open={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
