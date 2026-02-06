"use client";

interface QuizQuestionProps {
  title: string;
  options: string[];
  onSelect: (val: string) => void;
  availableOptions?: string[];
}

export function QuizQuestion({
  title,
  options,
  onSelect,
  availableOptions,
}: QuizQuestionProps) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <h2 className="text-2xl sm:text-3xl font-medium md:text-2xl mb-4 sm:mb-6 text-slate-900 shrink-0">
        {title}
      </h2>
      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
          {options.map((option) => {
            const isDisabled =
              availableOptions && !availableOptions.includes(option);

            return (
              <button
                key={option}
                disabled={isDisabled}
                onClick={() => onSelect(option)}
                className={`px-3 py-6 rounded-xl border-2 transition-all text-sm font-medium h-full cursor-pointer relative ${
                  isDisabled
                    ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600"
                }`}
              >
                {!isDisabled && availableOptions && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
