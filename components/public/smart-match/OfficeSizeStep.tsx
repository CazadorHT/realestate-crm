"use client";

import { OfficeSizeOption } from "@/features/smart-match/config-actions";

interface OfficeSizeStepProps {
  officeSizes: OfficeSizeOption[];
  availableSizes: Record<string, number>;
  onSelect: (min: number, max: number) => void;
}

export function OfficeSizeStep({
  officeSizes,
  availableSizes,
  onSelect,
}: OfficeSizeStepProps) {
  const hasChecked = Object.keys(availableSizes).length > 0;

  const renderOptions = () => {
    if (officeSizes.length > 0) {
      return officeSizes.map((opt) => {
        const sizeKey = opt.label.match(/\((S|M|L|XL)\)/)?.[1] || "";
        const count = availableSizes[sizeKey] ?? 0;
        const isDisabled = hasChecked && count === 0;

        // Try to split label into size and description
        // Example: "(M) 40-70 ตร.ม. (SMEs 5-8 คน)"
        const parts = opt.label.split(/(\(.*\))/);
        // A more reliable split for this specific pattern:
        // Find the second set of parentheses
        const labelStr = opt.label;
        const secondParenIndex = labelStr.indexOf("(", 1);
        const sizePart =
          secondParenIndex !== -1
            ? labelStr.substring(0, secondParenIndex).trim()
            : labelStr;
        const descPart =
          secondParenIndex !== -1
            ? labelStr.substring(secondParenIndex).trim()
            : "";

        return (
          <button
            key={opt.id}
            disabled={isDisabled}
            onClick={() => onSelect(opt.min_sqm, opt.max_sqm)}
            className={`px-3 py-5 rounded-xl border-2 transition-all h-full cursor-pointer flex flex-col items-center text-center relative ${
              isDisabled
                ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                : "border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600"
            }`}
          >
            {!isDisabled && hasChecked && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
            <span className="font-bold text-lg">{sizePart}</span>
            {descPart && (
              <p
                className={`text-[11px] leading-tight mt-1 font-medium ${isDisabled ? "text-slate-300" : "text-blue-500"}`}
              >
                {descPart}
              </p>
            )}
          </button>
        );
      });
    }

    // Default Fallback Options
    return [
      { key: "S", size: "< 40 ตร.ม.", desc: "Startup", min: 0, max: 40 },
      { key: "M", size: "40-70 ตร.ม.", desc: "SMEs 5-8 คน", min: 40, max: 70 },
      {
        key: "L",
        size: "71-100 ตร.ม.",
        desc: "พนักงาน 9-15 คน",
        min: 71,
        max: 100,
      },
      {
        key: "XL",
        size: "> 100 ตร.ม.",
        desc: "พนักงาน 15-20+ คน",
        min: 100,
        max: 9999,
      },
    ].map((opt) => {
      const count = availableSizes[opt.key] ?? 0;
      const isDisabled = hasChecked && count === 0;

      return (
        <button
          key={opt.key}
          disabled={isDisabled}
          onClick={() => onSelect(opt.min, opt.max)}
          className={`px-3 py-5 rounded-xl border-2 transition-all h-full cursor-pointer flex flex-col items-center text-center relative ${
            isDisabled
              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
              : "border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600"
          }`}
        >
          {!isDisabled && hasChecked && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <span className="font-bold text-lg">
            ({opt.key}) {opt.size}
          </span>
          <p
            className={`text-[11px] leading-tight mt-1 font-medium ${isDisabled ? "text-slate-300" : "text-blue-500"}`}
          >
            ({opt.desc})
          </p>
        </button>
      );
    });
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <h2 className="text-2xl sm:text-3xl font-medium md:text-2xl mb-4 sm:mb-6 text-slate-900 shrink-0">
        ต้องการพื้นที่ขนาดประมาณเท่าไหร่?
      </h2>
      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
          {renderOptions()}
        </div>
      </div>
    </div>
  );
}
