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
      className={cn(
        "p-5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80",
        className,
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
        month: "space-y-4 flex-1",
        month_caption:
          "flex justify-center pt-2 relative items-center h-9 w-full mb-4",
        caption_label: "text-sm font-bold text-slate-800 tracking-tight",
        nav: "flex items-center justify-between w-full absolute top-0 left-0 right-0 z-10 h-9 px-0.5 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-white p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg pointer-events-auto shadow-sm border border-slate-100 flex items-center justify-center",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-white p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg pointer-events-auto shadow-sm border border-slate-100 flex items-center justify-center",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full mb-3 justify-between",
        weekday:
          "text-slate-400 rounded-md w-8 font-bold text-[10px] uppercase tracking-widest text-center flex-1",
        week: "flex w-full mt-1 justify-between",
        day: "h-8 w-8 text-center text-sm p-0 relative transition-all duration-200 focus-within:relative focus-within:z-20 flex-1 flex justify-center",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110 transition-all rounded-xl aria-selected:opacity-100 aria-selected:text-white! tabular-nums",
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-indigo-600 text-white! shadow-lg shadow-indigo-100 rounded-xl aria-selected:bg-indigo-600 aria-selected:text-white! aria-selected:opacity-100 scale-105 z-10 aria-selected:after:bg-white!",
        today: "relative font-black not-aria-selected:text-indigo-600 aria-selected:text-white! bg-indigo-50/50 ring-1 ring-inset ring-indigo-200 after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-indigo-600 after:rounded-full after:transition-colors aria-selected:after:bg-white!",
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
        DayButton: (props) => {
          const { day, modifiers, className, ...buttonProps } = props;
          return (
            <button
              {...buttonProps}
              className={cn(
                className,
                modifiers.selected && "text-white! aria-selected:text-white!",
              )}
            />
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
