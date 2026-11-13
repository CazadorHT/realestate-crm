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
  SheetFooter,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  CircleDollarSign,
  X,
  ChevronDown,
  Flame,
  Check,
  RotateCcw,
} from "lucide-react";

interface PriceRangeSelectProps {
  currentPriceOption?: any;
  flatPriceOptions?: any[];
  priceOptions?: any[];
  priceCounts?: Map<string, number>;
  minPrice?: string;
  maxPrice?: string;
  listingType?: string;
  priceType?: string;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setPriceType?: (v: string) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "end" | "center";
  isMobile?: boolean;
}

const I18N_DICT = {
  th: {
    price_range: "ช่วงราคา",
    rent_price: "ราคาเช่า",
    sale_price: "ราคาขาย",
    all_prices: "ทุกราคา",
    min: "ต่ำสุด",
    max: "สูงสุด",
    popular_ranges: "ช่วงราคายอดนิยม",
    sweet_spot: "ยอดฮิต",
    reset: "ล้างค่า",
    apply: "นำไปใช้",
    per_month: "บาท/เดือน",
    baht: "บาท",
    unlimited: "ไม่จำกัด",
    no_min: "เริ่มต้น 0",
    custom_title: "กำหนดงบประมาณเอง",
  },
  en: {
    price_range: "Price Range",
    rent_price: "Rent Price",
    sale_price: "Sale Price",
    all_prices: "All Prices",
    min: "Min",
    max: "Max",
    popular_ranges: "Popular Ranges",
    sweet_spot: "Hot",
    reset: "Reset",
    apply: "Apply",
    per_month: "฿/mo",
    baht: "฿",
    unlimited: "Any",
    no_min: "From ฿0",
    custom_title: "Custom Budget",
  },
  cn: {
    price_range: "价格范围",
    rent_price: "租金",
    sale_price: "售价",
    all_prices: "所有价格",
    min: "最低",
    max: "最高",
    popular_ranges: "热门区间",
    sweet_spot: "热选",
    reset: "重置",
    apply: "应用",
    per_month: "฿/月",
    baht: "฿",
    unlimited: "不限",
    no_min: "从 ฿0 起",
    custom_title: "自定义预算",
  },
  ru: {
    price_range: "Ценовой диапазон",
    rent_price: "Цена аренды",
    sale_price: "Цена продажи",
    all_prices: "Все цены",
    min: "Мин.",
    max: "Макс.",
    popular_ranges: "Популярные диапазоны",
    sweet_spot: "Хит",
    reset: "Сбросить",
    apply: "Применить",
    per_month: "฿/мес.",
    baht: "฿",
    unlimited: "Без лимита",
    no_min: "От ฿0",
    custom_title: "Свой бюджет",
  },
};

export function PriceRangeSelect({
  currentPriceOption,
  flatPriceOptions = [],
  priceOptions = [],
  priceCounts = new Map(),
  minPrice = "",
  maxPrice = "",
  listingType = "ALL",
  priceType = "",
  setMinPrice,
  setMaxPrice,
  setPriceType,
  placeholder,
  className,
  align = "start",
  isMobile = false,
}: PriceRangeSelectProps) {
  const { language } = useLanguage();
  const dict =
    I18N_DICT[(language as keyof typeof I18N_DICT) || "th"] || I18N_DICT.th;

  const [isOpen, setIsOpen] = useState(false);

  // Determine active mode: RENT vs SALE
  const initialMode =
    listingType === "SALE"
      ? "SALE"
      : listingType === "RENT"
      ? "RENT"
      : priceType === "SALE"
      ? "SALE"
      : "RENT";

  const [activeMode, setActiveMode] = useState<"RENT" | "SALE">(initialMode);

  useEffect(() => {
    if (listingType === "SALE") setActiveMode("SALE");
    else if (listingType === "RENT") setActiveMode("RENT");
    else if (priceType === "SALE") setActiveMode("SALE");
    else if (priceType === "RENT") setActiveMode("RENT");
  }, [listingType, priceType]);

  // Mode bounds
  const isRent = activeMode === "RENT";
  const SLIDER_MAX = isRent ? 120000 : 30000000;
  const SLIDER_STEP = isRent ? 1000 : 500000;

  // Local draft states for inputs and slider
  const [localMin, setLocalMin] = useState<string>(minPrice || "");
  const [localMax, setLocalMax] = useState<string>(maxPrice || "");

  // Sync draft states when popup opens or outside props change
  useEffect(() => {
    if (isOpen) {
      setLocalMin(minPrice || "");
      setLocalMax(maxPrice || "");
    }
  }, [isOpen, minPrice, maxPrice]);

  // Calculate slider thumb values [minVal, maxVal]
  const sliderValues = useMemo(() => {
    const minVal = localMin ? Math.min(Math.max(0, parseInt(localMin, 10) || 0), SLIDER_MAX) : 0;
    const maxVal = localMax
      ? Math.min(Math.max(minVal, parseInt(localMax, 10) || SLIDER_MAX), SLIDER_MAX)
      : SLIDER_MAX;
    return [minVal, maxVal];
  }, [localMin, localMax, SLIDER_MAX]);

  const handleSliderChange = (vals: number[]) => {
    const [minV, maxV] = vals;
    setLocalMin(minV > 0 ? String(minV) : "");
    setLocalMax(maxV < SLIDER_MAX ? String(maxV) : "");
  };

  const handleApply = () => {
    setMinPrice(localMin);
    setMaxPrice(localMax);
    if (setPriceType) {
      setPriceType(listingType === "ALL" || listingType === "SALE_AND_RENT" ? activeMode : "");
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalMin("");
    setLocalMax("");
    setMinPrice("");
    setMaxPrice("");
    if (setPriceType) setPriceType("");
    setIsOpen(false);
  };

  const handleSelectPreset = (opt: { min: string; max: string; type?: string }) => {
    setLocalMin(opt.min || "");
    setLocalMax(opt.max || "");
    setMinPrice(opt.min || "");
    setMaxPrice(opt.max || "");
    if (setPriceType) {
      setPriceType(opt.type && opt.type !== "ALL" ? opt.type : "");
    }
    setIsOpen(false);
  };

  // Get active presets according to mode
  const currentPresets = useMemo(() => {
    if (!priceOptions || priceOptions.length === 0) return [];

    const foundGroup = priceOptions.find(
      (g: any) =>
        g.isGroup &&
        ((activeMode === "RENT" && g.label?.includes("Rent")) ||
          (activeMode === "RENT" && g.label?.includes("เช่า")) ||
          (activeMode === "SALE" && g.label?.includes("Sale")) ||
          (activeMode === "SALE" && g.label?.includes("ขาย")))
    );

    if (foundGroup && foundGroup.options) {
      return foundGroup.options;
    }

    // If flat
    return flatPriceOptions.filter(
      (o: any) => (o.min || o.max) && (!o.type || o.type === activeMode)
    );
  }, [priceOptions, flatPriceOptions, activeMode]);

  // Check if current filter is active
  const hasActivePrice = Boolean((minPrice && minPrice !== "0") || maxPrice);

  // Trigger label formatting
  const triggerLabel = useMemo(() => {
    if (currentPriceOption?.label && currentPriceOption.min !== "" && currentPriceOption.max !== "") {
      return currentPriceOption.label;
    }
    if (hasActivePrice) {
      const minVal = minPrice && minPrice !== "0" ? parseInt(minPrice, 10).toLocaleString() : "";
      const maxVal = maxPrice ? parseInt(maxPrice, 10).toLocaleString() : "";
      if (minVal && maxVal) return `฿${minVal} - ฿${maxVal}`;
      if (minVal) return `> ฿${minVal}`;
      if (maxVal) return `< ฿${maxVal}`;
    }
    return placeholder || dict.price_range;
  }, [currentPriceOption, hasActivePrice, minPrice, maxPrice, placeholder, dict.price_range]);

  // Find the preset with the highest unit count (Dynamic Sweet Spot 🔥)
  const maxCountPresetKey = useMemo(() => {
    let max = 0;
    let maxKey = "";
    currentPresets.forEach((opt: any) => {
      const key = `${opt.min}-${opt.max}-${opt.type || "ALL"}`;
      const count = priceCounts.get(key) || 0;
      if (count > max) {
        max = count;
        maxKey = key;
      }
    });
    // Fallback if counts not populated yet: default to 20k-30k for rent
    if (!maxKey && isRent) {
      const defaultRent = currentPresets.find((o: any) => o.min === "20000" && o.max === "30000");
      if (defaultRent) return `${defaultRent.min}-${defaultRent.max}-${defaultRent.type || "ALL"}`;
    }
    return maxKey;
  }, [currentPresets, priceCounts, isRent]);

  // Main filter panel content (reusable for both Popover & Mobile Sheet)
  const FilterContent = (
    <div className="space-y-5">
      {/* Listing Type Mode Switcher (only if listingType is ALL or SALE_AND_RENT) */}
      {(listingType === "ALL" || listingType === "SALE_AND_RENT") && (
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode("RENT")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center",
              activeMode === "RENT"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {dict.rent_price}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("SALE")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center",
              activeMode === "SALE"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {dict.sale_price}
          </button>
        </div>
      )}

      {/* Min & Max Interactive Inputs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{dict.custom_title}</span>
          <span className="text-[11px] text-slate-400">
            {isRent ? dict.per_month : dict.baht}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Min Input */}
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              ฿
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder={dict.no_min}
              value={localMin ? Number(localMin.replace(/[^0-9]/g, "")).toLocaleString() : ""}
              onChange={(e) => {
                const num = e.target.value.replace(/[^0-9]/g, "");
                setLocalMin(num);
              }}
              className="w-full h-9 pl-6 pr-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-all text-slate-900"
            />
          </div>

          <span className="text-slate-300 font-semibold text-xs">-</span>

          {/* Max Input */}
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              ฿
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder={dict.unlimited}
              value={localMax ? Number(localMax.replace(/[^0-9]/g, "")).toLocaleString() : ""}
              onChange={(e) => {
                const num = e.target.value.replace(/[^0-9]/g, "");
                setLocalMax(num);
              }}
              className="w-full h-9 pl-6 pr-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-all text-slate-900"
            />
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
          <span>฿0</span>
          <span>
            {isRent
              ? language === "th"
                ? "3 หมื่น"
                : "฿30k"
              : language === "th"
              ? "10 ล้าน"
              : "฿10M"}
          </span>
          <span>
            {isRent
              ? language === "th"
                ? "6 หมื่น"
                : "฿60k"
              : language === "th"
              ? "20 ล้าน"
              : "฿20M"}
          </span>
          <span>
            {isRent
              ? "฿120k+"
              : "฿30M+"}
          </span>
        </div>
      </div>

      {/* Quick Presets Section */}
      {currentPresets.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>{dict.popular_ranges}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {currentPresets.map((opt: any) => {
              const key = `${opt.min}-${opt.max}-${opt.type || "ALL"}`;
              const count = priceCounts.get(key) || 0;
              const isSelected =
                localMin === opt.min && localMax === opt.max;
              const isSweetSpot = key === maxCountPresetKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(opt)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 text-left cursor-pointer",
                    isSelected
                      ? "bg-primary text-white border-primary shadow-xs"
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
          className="text-xs font-medium h-8 px-4 bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm"
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
              hasActivePrice
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-slate-200 text-slate-900",
              className
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <CircleDollarSign
                className={cn(
                  "h-4 w-4 shrink-0",
                  hasActivePrice ? "text-primary" : "text-emerald-500"
                )}
              />
              <span className="truncate">{triggerLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              {hasActivePrice && (
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
              <CircleDollarSign className="h-5 w-5 text-emerald-500" />
              {dict.price_range}
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
            hasActivePrice
              ? "border-primary/50 bg-primary/5 text-primary font-semibold ring-1 ring-primary/20"
              : "border-slate-200 text-slate-700 hover:border-slate-300",
            className
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <CircleDollarSign
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                hasActivePrice ? "text-primary" : "text-slate-400"
              )}
            />
            <span className="truncate">{triggerLabel}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {hasActivePrice && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-0.5 hover:bg-primary/10 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
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
