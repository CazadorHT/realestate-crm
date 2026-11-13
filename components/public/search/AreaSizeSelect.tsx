"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  Maximize2,
  X,
  ChevronDown,
  Flame,
  Check,
  RotateCcw,
} from "lucide-react";

interface AreaSizeSelectProps {
  currentSizeOption?: { min: string; max: string; label?: string };
  sizeOptions?: { min: string; max: string; label: string }[];
  sizeCounts?: Map<string, number>;
  minSize?: string;
  maxSize?: string;
  setMinSize: (v: string) => void;
  setMaxSize: (v: string) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "end" | "center";
  isMobile?: boolean;
}

const I18N_DICT = {
  th: {
    area_size: "ขนาดพื้นที่",
    min: "ต่ำสุด",
    max: "สูงสุด",
    unit: "ตร.ม.",
    popular_ranges: "ขนาดยอดนิยม",
    custom_title: "กำหนดขนาดพื้นที่เอง",
    unlimited: "ไม่จำกัด",
    no_min: "เริ่มต้น 0",
    reset: "ล้างค่า",
    apply: "นำไปใช้",
    all_sizes: "ทุกขนาด",
  },
  en: {
    area_size: "Area Size",
    min: "Min",
    max: "Max",
    unit: "sqm",
    popular_ranges: "Popular Sizes",
    custom_title: "Custom Area Size",
    unlimited: "Any",
    no_min: "From 0",
    reset: "Reset",
    apply: "Apply",
    all_sizes: "All Sizes",
  },
  cn: {
    area_size: "面积大小",
    min: "最低",
    max: "最高",
    unit: "平米",
    popular_ranges: "热门面积",
    custom_title: "自定义面积",
    unlimited: "不限",
    no_min: "从 0 起",
    reset: "重置",
    apply: "应用",
    all_sizes: "所有面积",
  },
  ru: {
    area_size: "Площадь",
    min: "Мин.",
    max: "Макс.",
    unit: "м²",
    popular_ranges: "Популярные размеры",
    custom_title: "Своя площадь",
    unlimited: "Без лимита",
    no_min: "От 0",
    reset: "Сбросить",
    apply: "Применить",
    all_sizes: "Все размеры",
  },
};

const SLIDER_MAX = 300;
const SLIDER_STEP = 5;

export function AreaSizeSelect({
  currentSizeOption,
  sizeOptions = [],
  sizeCounts = new Map(),
  minSize = "",
  maxSize = "",
  setMinSize,
  setMaxSize,
  placeholder,
  className,
  align = "start",
  isMobile = false,
}: AreaSizeSelectProps) {
  const { language } = useLanguage();
  const dict =
    I18N_DICT[(language as keyof typeof I18N_DICT) || "th"] || I18N_DICT.th;

  const [isOpen, setIsOpen] = useState(false);

  // Local draft states for inputs and slider
  const [localMin, setLocalMin] = useState<string>(minSize || "");
  const [localMax, setLocalMax] = useState<string>(maxSize || "");

  useEffect(() => {
    if (isOpen) {
      setLocalMin(minSize || "");
      setLocalMax(maxSize || "");
    }
  }, [isOpen, minSize, maxSize]);

  // Calculate slider thumb values [minVal, maxVal]
  const sliderValues = useMemo(() => {
    const minVal = localMin ? Math.min(Math.max(0, parseInt(localMin, 10) || 0), SLIDER_MAX) : 0;
    const maxVal = localMax
      ? Math.min(Math.max(minVal, parseInt(localMax, 10) || SLIDER_MAX), SLIDER_MAX)
      : SLIDER_MAX;
    return [minVal, maxVal];
  }, [localMin, localMax]);

  const handleSliderChange = (vals: number[]) => {
    const [minV, maxV] = vals;
    setLocalMin(minV > 0 ? String(minV) : "");
    setLocalMax(maxV < SLIDER_MAX ? String(maxV) : "");
  };

  const handleApply = () => {
    setMinSize(localMin);
    setMaxSize(localMax);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalMin("");
    setLocalMax("");
    setMinSize("");
    setMaxSize("");
    setIsOpen(false);
  };

  const handleSelectPreset = (opt: { min: string; max: string }) => {
    setLocalMin(opt.min || "");
    setLocalMax(opt.max || "");
    setMinSize(opt.min || "");
    setMaxSize(opt.max || "");
    setIsOpen(false);
  };

  const currentPresets = useMemo(() => {
    return sizeOptions.filter((o) => o.min !== "" || o.max !== "");
  }, [sizeOptions]);

  // Find preset with highest unit count (Dynamic Sweet Spot 🔥)
  const maxCountPresetKey = useMemo(() => {
    let max = 0;
    let maxKey = "";
    currentPresets.forEach((opt) => {
      const key = `${opt.min}-${opt.max}`;
      const count = sizeCounts.get(key) || 0;
      if (count > max) {
        max = count;
        maxKey = key;
      }
    });
    return maxKey;
  }, [currentPresets, sizeCounts]);

  const hasActiveSize = Boolean((minSize && minSize !== "0") || maxSize);

  // Trigger label formatting
  const triggerLabel = useMemo(() => {
    if (currentSizeOption?.label && currentSizeOption.min !== "" && currentSizeOption.max !== "") {
      return currentSizeOption.label;
    }
    if (hasActiveSize) {
      const minVal = minSize && minSize !== "0" ? minSize : "";
      const maxVal = maxSize ? maxSize : "";
      if (minVal && maxVal) return `${minVal} - ${maxVal} ${dict.unit}`;
      if (minVal) return `> ${minVal} ${dict.unit}`;
      if (maxVal) return `< ${maxVal} ${dict.unit}`;
    }
    return placeholder || dict.area_size;
  }, [currentSizeOption, hasActiveSize, minSize, maxSize, placeholder, dict.area_size, dict.unit]);

  const FilterContent = (
    <div className="space-y-5">
      {/* Min & Max Interactive Inputs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{dict.custom_title}</span>
          <span className="text-[11px] text-slate-400">{dict.unit}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Min Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder={dict.no_min}
              value={localMin ? Number(localMin.replace(/[^0-9]/g, "")).toLocaleString() : ""}
              onChange={(e) => {
                const num = e.target.value.replace(/[^0-9]/g, "");
                setLocalMin(num);
              }}
              className="w-full h-9 px-3 pr-9 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all text-slate-900"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
              {dict.unit}
            </span>
          </div>

          <span className="text-slate-300 font-semibold text-xs">-</span>

          {/* Max Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder={dict.unlimited}
              value={localMax ? Number(localMax.replace(/[^0-9]/g, "")).toLocaleString() : ""}
              onChange={(e) => {
                const num = e.target.value.replace(/[^0-9]/g, "");
                setLocalMax(num);
              }}
              className="w-full h-9 px-3 pr-9 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all text-slate-900"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
              {dict.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Thumb Range Slider */}
      <div className="pt-2 px-1">
        <Slider
          value={sliderValues}
          min={0}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          onValueChange={handleSliderChange}
          className="my-3"
        />
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span>0</span>
          <span>50 {dict.unit}</span>
          <span>100 {dict.unit}</span>
          <span>200 {dict.unit}</span>
          <span>300+</span>
        </div>
      </div>

      {/* Quick Presets Section */}
      {currentPresets.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>{dict.popular_ranges}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {currentPresets.map((opt) => {
              const key = `${opt.min}-${opt.max}`;
              const count = sizeCounts.get(key) || 0;
              const isSelected = localMin === opt.min && localMax === opt.max;
              const isSweetSpot = key === maxCountPresetKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(opt)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 text-left cursor-pointer",
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : isSweetSpot
                      ? "bg-amber-50/70 border-amber-200 text-amber-900 hover:border-amber-400 hover:bg-amber-100/70"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {isSweetSpot && (
                    <Flame
                      className={cn(
                        "h-3 w-3 shrink-0",
                        isSelected ? "text-white" : "text-amber-500 fill-amber-500"
                      )}
                    />
                  )}
                  <span>{opt.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] px-1 py-0.2 rounded-md font-normal",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs text-slate-500 hover:text-slate-800 h-8 px-2.5"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {dict.reset}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleApply}
          className="text-xs font-medium h-8 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {dict.apply}
        </Button>
      </div>
    </div>
  );

  // Mobile Sheet View
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full h-12 flex items-center justify-between px-4 rounded-xl border bg-white shadow-xs hover:shadow-sm transition-all text-sm font-medium",
              hasActiveSize
                ? "border-blue-500/40 bg-blue-50/40 text-blue-700"
                : "border-slate-200 text-slate-900",
              className
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Maximize2
                className={cn(
                  "h-4 w-4 shrink-0",
                  hasActiveSize ? "text-blue-600" : "text-blue-500"
                )}
              />
              <span className="truncate">{triggerLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              {hasActiveSize && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1 hover:bg-slate-200/60 rounded-full transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="p-0 rounded-t-3xl border-t-0 bg-white max-h-[85vh] flex flex-col">
          <SheetHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Maximize2 className="h-5 w-5 text-blue-500" />
              {dict.area_size}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5">
            {FilterContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Popover View
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 px-3 rounded-xl border bg-white shadow-xs hover:shadow-sm transition-all text-xs font-medium flex items-center justify-between gap-2 cursor-pointer select-none",
            hasActiveSize
              ? "border-blue-500/50 bg-blue-50/50 text-blue-700 font-semibold ring-1 ring-blue-500/20"
              : "border-slate-200 text-slate-700 hover:border-slate-300",
            className
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Maximize2
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                hasActiveSize ? "text-blue-600" : "text-slate-400"
              )}
            />
            <span className="truncate">{triggerLabel}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {hasActiveSize && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-0.5 hover:bg-blue-100/60 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-[360px] p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xl z-50 animate-in fade-in-0 zoom-in-95"
      >
        {FilterContent}
      </PopoverContent>
    </Popover>
  );
}
