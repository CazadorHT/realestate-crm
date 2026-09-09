"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROPERTY_STATUS_ORDER,
  PROPERTY_STATUS_LABELS,
} from "@/features/properties/labels";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface QuickStatusProps {
  value: string;
  onValueChange: (value: string) => void;
  counts?: Record<string, number>;
  totalCount?: number;
}

export function QuickStatus({
  value,
  onValueChange,
  counts = {},
  totalCount,
}: QuickStatusProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[170px]">
        <SelectValue placeholder={isEn ? "Status" : "สถานะ"} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white min-w-[200px]">
        <SelectItem value="ALL">
          <span className="flex items-center justify-between w-full gap-2">
            <span>{isEn ? "All Statuses" : "ทุกสถานะ"}</span>
            {typeof totalCount === "number" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 shrink-0 ml-1.5">
                {totalCount}
              </span>
            )}
          </span>
        </SelectItem>
        {PROPERTY_STATUS_ORDER.map((s) => {
          const count = counts[s] || 0;
          const isActive = value === s;
          const isDisabled = count === 0 && !isActive;

          return (
            <SelectItem
              key={s}
              value={s}
              disabled={isDisabled}
              className={cn(
                isDisabled &&
                  "text-slate-400 bg-slate-50/50 cursor-not-allowed opacity-50 select-none"
              )}
            >
              <span className="flex items-center justify-between w-full gap-2">
                <span>
                  {isEn
                    ? PROPERTY_STATUS_LABELS[s]?.en || s
                    : PROPERTY_STATUS_LABELS[s]?.th || s}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ml-1.5",
                    isDisabled
                      ? "bg-slate-200/60 text-slate-400"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {count}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
