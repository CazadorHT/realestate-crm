"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white rounded-2xl shadow-sm border border-slate-100", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-2 relative items-center h-10 w-full mb-2",
        caption_label: "text-sm font-bold text-slate-800 tracking-tight",
        nav: "flex items-center justify-between w-full absolute top-0 left-0 right-0 z-10 h-10 px-1 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-slate-50 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg pointer-events-auto shadow-sm border border-slate-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-slate-50 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg pointer-events-auto shadow-sm border border-slate-100"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex w-full mb-2",
        weekday:
          "text-slate-400 rounded-md w-9 font-semibold text-[0.75rem] flex-1 uppercase tracking-wider",
        week: "flex w-full mt-1.5",
        day: "h-9 w-9 text-center text-sm p-0 relative transition-all duration-200 focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110 transition-all rounded-xl aria-selected:opacity-100"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-indigo-600 text-white shadow-[0_5px_15px_-3px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white rounded-xl scale-105 z-10",
        today: "bg-amber-50 text-amber-700 border border-amber-100 font-bold",
        outside:
          "day-outside text-slate-300 opacity-50 aria-selected:bg-indigo-50/50 aria-selected:text-slate-400 aria-selected:opacity-30",
        disabled: "text-slate-300 opacity-50",
        range_middle:
          "aria-selected:bg-indigo-50 aria-selected:text-indigo-700",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4 " />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
