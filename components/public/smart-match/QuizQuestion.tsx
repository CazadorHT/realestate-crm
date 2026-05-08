"use client";

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
      <h2 className="text-xl sm:text-2xl font-medium md:text-2xl mb-4 sm:mb-6 text-slate-900 shrink-0">
        {title}
      </h2>
      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pb-4">
          {options.map((option) => {
            const isDisabled =
              isLoading ||
              (availableOptions && !availableOptions.includes(option));

            return (
              <button
                key={option}
                disabled={isDisabled}
                onClick={() => onSelect(option)}
                className={`group px-3 py-6 rounded-xl border-2 text-sm font-medium h-full cursor-pointer relative overflow-hidden transition-colors duration-200 ${
                  isDisabled
                    ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 text-slate-700 active:scale-95 transition-transform"
                } ${isLoading ? "opacity-60" : ""}`}
              >
                {!isDisabled && (
                  <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                )}
                <div className={`relative z-10 ${!isDisabled ? "group-hover:text-blue-600 transition-colors" : ""}`}>
                  {!isDisabled && availableOptions && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                  <span className="line-clamp-2 wrap-break-word text-balance">
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
