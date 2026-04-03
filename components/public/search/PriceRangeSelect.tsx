"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PriceRangeSelectProps {
  currentPriceOption: any;
  flatPriceOptions: any[];
  priceOptions: any[];
  priceCounts: Map<string, number>;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setPriceType?: (v: string) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "end" | "center";
}

export function PriceRangeSelect({
  currentPriceOption,
  flatPriceOptions,
  priceOptions,
  priceCounts,
  setMinPrice,
  setMaxPrice,
  setPriceType,
  placeholder,
  className,
  align = "start",
}: PriceRangeSelectProps) {
  return (
    <Select
      value={`${currentPriceOption.min}-${currentPriceOption.max}-${currentPriceOption.type || "ALL"}`}
      onValueChange={(val) => {
        const [min, max, type] = val.split("-");
        const opt = flatPriceOptions.find(
          (o: any) =>
            o.min === min &&
            o.max === max &&
            (o.type === type || !o.type || type === "ALL")
        ) as { min: string; max: string; type?: string } | undefined;
        if (opt) {
          setMinPrice(opt.min);
          setMaxPrice(opt.max);
          setPriceType?.(opt.type && opt.type !== "ALL" ? opt.type : "");
        }
      }}
    >
      <SelectTrigger className={cn("h-12! rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align={align}>
        {priceOptions.map((opt: any, i) => {
          if (opt.isGroup) {
            return (
              <SelectGroup key={`group-${i}`}>
                <SelectLabel className="font-semibold text-slate-800 bg-slate-50 py-2 border-y border-slate-100 mt-1 mb-1">
                  {opt.label}
                </SelectLabel>
                {opt.options.map((subOpt: any) => {
                  const key = `${subOpt.min}-${subOpt.max}-${subOpt.type || "ALL"}`;
                  const count = priceCounts.get(key) || 0;
                  return (
                    <SelectItem key={key} value={key} disabled={count === 0}>
                      <span className="flex items-center justify-between w-full gap-2">
                        <span className={count === 0 ? "text-slate-400" : ""}>
                          {subOpt.label}
                        </span>
                        <span
                          className={`text-xs ${
                            count === 0 ? "text-slate-400" : "text-blue-500"
                          } opacity-70`}
                        >
                          ({count})
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            );
          }
          const optKey = `${opt.min}-${opt.max}-${opt.type || "ALL"}`;
          const optCount =
            opt.min || opt.max ? priceCounts.get(optKey) || 0 : null;
          return (
            <SelectItem key={optKey} value={optKey} disabled={optCount === 0}>
              <span className="flex items-center justify-between w-full gap-2">
                <span className={optCount === 0 ? "text-slate-400" : ""}>
                  {opt.label}
                </span>
                {optCount !== null && (
                  <span
                    className={`text-xs ${
                      optCount === 0 ? "text-slate-400" : "text-blue-500"
                    } opacity-70`}
                  >
                    ({optCount})
                  </span>
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
