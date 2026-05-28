"use client";

import { cn } from "@/lib/utils";

interface QuizQuestionProps {
  title: string;
  options: string[];
  onSelect: (val: string) => void;
  availableOptions?: string[];
  isLoading?: boolean;
}

export function QuizQuestion({
  title,
  options,
  onSelect,
  availableOptions,
  isLoading,
}: QuizQuestionProps) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-slate-900 shrink-0">
        {title}
      </h2>
      <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pb-4">
          {options.map((option) => {
            const isDisabled =
              isLoading ||
              (availableOptions && !availableOptions.includes(option));

            return (
              <button
                key={option}
                disabled={isDisabled}
                onClick={() => onSelect(option)}
                className={`group px-2 py-3.5 sm:px-3 sm:py-6 rounded-xl border-2 text-xs sm:text-sm font-semibold h-full cursor-pointer relative overflow-hidden transition-colors duration-200 ${
                  isDisabled
                    ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 text-slate-700 active:scale-95 transition-transform"
                } ${isLoading ? "opacity-60" : ""}`}
              >
                {!isDisabled && (
                  <div className="absolute inset-0 bg-blue-50/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                )}
                <div className={`relative z-10 h-full flex flex-col items-center justify-center transition-transform duration-300 ${!isDisabled ? "group-hover:scale-105" : ""}`}>
                  <span className={cn(
                    "line-clamp-2 wrap-break-word text-balance px-0.5 transition-colors duration-300",
                    !isDisabled ? "group-hover:text-blue-600" : ""
                  )}>
                    {option}
                  </span>
                </div>

                {/* 🟢 Status dot (Solid for better performance) */}
                {!isDisabled && availableOptions && (
                  <span className="absolute top-2 right-2 sm:top-3 sm:right-3 h-1.5 w-1.5 sm:h-2 sm:w-2 z-20 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
