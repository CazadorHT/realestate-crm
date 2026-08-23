"use client";

import React, { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent } from "../queries";
import { updateEventDate } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import "./calendar-custom.css";

interface CalendarGridProps {
  events: CalendarEvent[];
  initialDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  viewMode?: "dayGridMonth" | "timeGridWeek" | "listMonth";
  editable?: boolean;
  onEventDrop?: (event: any) => void;
}

export function CalendarGrid({
  events,
  initialDate,
  onEventClick,
  viewMode = "dayGridMonth",
  editable = false,
  onEventDrop,
}: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";

  // Sync viewMode when it changes from props
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(viewMode);
    }
  }, [viewMode]);

  // Sync date when it changes from props (URL)
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(initialDate);
    }
  }, [initialDate]);

  const formattedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.type.startsWith("contract"),
    extendedProps: { ...event.meta, type: event.type },
    backgroundColor: getEventColor(event.type),
    borderColor: getEventColor(event.type),
    textColor: "#ffffff",
  }));

  return (
    <div className="calendar-container">
      <FullCalendar
        ref={calendarRef}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin,
        ]}
        initialView={viewMode}
        initialDate={initialDate}
        headerToolbar={false} // We handle toolbar in CalendarView
        events={formattedEvents}
        eventContent={(eventInfo) => {
          const isAllDay = eventInfo.event.allDay;
          const type = eventInfo.event.extendedProps.type;
          
          if (isAllDay) {
            return (
              <div className="w-full px-1.5 py-0.5 text-[10px] font-semibold truncate leading-tight">
                {eventInfo.event.title}
              </div>
            );
          }

          return (
            <div className="flex flex-col w-full overflow-hidden px-1.5 py-1 group/event leading-tight">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div 
                  className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" 
                  style={{ backgroundColor: eventInfo.event.backgroundColor }}
                />
                <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tight">
                  {eventInfo.timeText}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 truncate font-medium">
                {eventInfo.event.title}
              </div>
            </div>
          );
        }}
        eventClick={(info) => {
          const eventId = info.event.id;
          const originalEvent = events.find((e) => e.id === eventId);
          if (originalEvent) onEventClick(originalEvent);
        }}
        firstDay={1} // Monday
        locale={isEn ? "en" : "th"}
        dayMaxEvents={3}
        height="auto"
        stickyHeaderDates={true}
        handleWindowResize={true}
        editable={editable}
        eventDrop={async (info) => {
          const { event } = info;
          try {
            const result = await updateEventDate(
              event.id, 
              event.startStr, 
              event.extendedProps.type
            );
            if (result.success) {
               toast.success(isEn ? "Event rescheduled successfully" : "เลื่อนวันนัดหมายเรียบร้อย");
            }
          } catch (error) {
            info.revert();
            toast.error(isEn ? "Failed to reschedule event" : "ไม่สามารถเลื่อนวันนัดหมายได้");
          }
        }}
        eventResize={async (info) => {
           // We only support resizing for deals if they have duration, 
           // but for simple activities we just revert.
           info.revert();
        }}
      />
    </div>
  );
}

function getEventColor(type: string) {
  switch (type) {
    case "viewing": return "#3b82f6"; // blue-500
    case "follow_up": return "#f59e0b"; // amber-500
    case "call": return "#10b981"; // emerald-500
    case "line_chat": return "#059669"; // emerald-600
    case "contract_start": return "#10b981"; // emerald-500
    case "contract_end": return "#ef4444"; // red-500
    case "early_termination": return "#f97316"; // orange-500
    case "deal_closing": return "#a855f7"; // purple-500
    default: return "#64748b"; // slate-500
  }
}
