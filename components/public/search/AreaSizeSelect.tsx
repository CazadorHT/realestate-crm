"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AreaSizeSelectProps {
  currentSizeOption: { min: string; max: string; label?: string };
  sizeOptions: { min: string; max: string; label: string }[];
  sizeCounts: Map<string, number>;
  setMinSize: (v: string) => void;
  setMaxSize: (v: string) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "end" | "center";
}

export function AreaSizeSelect({
  currentSizeOption,
  sizeOptions,
  sizeCounts,
  setMinSize,
  setMaxSize,
  placeholder,
  className,
  align = "start",
}: AreaSizeSelectProps) {
  return (
    <Select
      value={`${currentSizeOption.min}-${currentSizeOption.max}`}
      onValueChange={(val) => {
        const opt = sizeOptions.find(
          (o) => `${o.min}-${o.max}` === val
        );
        if (opt) {
          setMinSize(opt.min);
          setMaxSize(opt.max);
        }
      }}
    >
      <SelectTrigger className={cn("h-10! rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-xs", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align={align}>
        {sizeOptions.map((opt) => {
          const key = `${opt.min}-${opt.max}`;
          const count = opt.min || opt.max ? sizeCounts.get(key) || 0 : null;
          return (
            <SelectItem key={key} value={key} disabled={count === 0}>
              <span className="flex items-center justify-between w-full gap-2">
                <span className={count === 0 ? "text-slate-400" : ""}>
                  {opt.label}
                </span>
                {count !== null && (
                  <span
                    className={`text-xs ${
                      count === 0 ? "text-slate-400" : "text-blue-500"
                    } opacity-70`}
                  >
                    ({count})
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
