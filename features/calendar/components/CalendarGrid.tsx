"use client";

import React, { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent } from "../queries";
import "./calendar-custom.css";

interface CalendarGridProps {
  events: CalendarEvent[];
  initialDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  viewMode?: "dayGridMonth" | "timeGridWeek" | "listMonth";
}

export function CalendarGrid({
  events,
  initialDate,
  onEventClick,
  viewMode = "dayGridMonth",
}: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);

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
        eventClick={(info) => {
          const eventId = info.event.id;
          const originalEvent = events.find((e) => e.id === eventId);
          if (originalEvent) onEventClick(originalEvent);
        }}
        firstDay={1} // Monday
        locale="th"
        dayMaxEvents={3}
        height="auto"
        stickyHeaderDates={true}
        handleWindowResize={true}
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
