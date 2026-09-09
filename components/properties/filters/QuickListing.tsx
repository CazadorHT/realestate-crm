"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LISTING_TYPE_ORDER,
  LISTING_TYPE_LABELS,
} from "@/features/properties/labels";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface QuickListingProps {
  value: string;
  onValueChange: (value: string) => void;
  counts?: Record<string, number>;
  totalCount?: number;
}

export function QuickListing({
  value,
  onValueChange,
  counts = {},
  totalCount,
}: QuickListingProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={isEn ? "Listing Type" : "ขาย/เช่า"} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white min-w-[180px]">
        <SelectItem value="ALL">
          <span className="flex items-center justify-between w-full gap-2">
            <span>{isEn ? "Sale & Rent" : "ขาย & เช่า"}</span>
            {typeof totalCount === "number" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 shrink-0 ml-1.5">
                {totalCount}
              </span>
            )}
          </span>
        </SelectItem>
        {LISTING_TYPE_ORDER.map((t) => {
          const count = counts[t] || 0;
          const isActive = value === t;
          const isDisabled = count === 0 && !isActive;

          return (
            <SelectItem
              key={t}
              value={t}
              disabled={isDisabled}
              className={cn(
                isDisabled &&
                  "text-slate-400 bg-slate-50/50 cursor-not-allowed opacity-50 select-none"
              )}
            >
              <span className="flex items-center justify-between w-full gap-2">
                <span>
                  {isEn
                    ? LISTING_TYPE_LABELS[t]?.en || t
                    : LISTING_TYPE_LABELS[t]?.th || t}
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
