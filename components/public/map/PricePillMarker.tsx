"use client";

import React, { memo } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapLocationGroup } from "./useMapClusters";

interface PricePillMarkerProps {
  group: MapLocationGroup;
  isSelected: boolean;
  isHovered: boolean;
  language: string;
  onClick: (group: MapLocationGroup) => void;
  onMouseEnter?: (group: MapLocationGroup) => void;
  onMouseLeave?: () => void;
}

export const PricePillMarker = memo(function PricePillMarker({
  group,
  isSelected,
  isHovered,
  language,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: PricePillMarkerProps) {
  const unitCount = group.units.length;
  const isMultiUnit = unitCount > 1;

  const countSuffix =
    language === "th"
      ? `${unitCount} ห้อง`
      : language === "cn"
        ? `${unitCount}套`
        : language === "ru"
          ? `${unitCount}`
          : `${unitCount}`;

  const discountTooltip =
    language === "en"
      ? "Special Discount"
      : language === "cn"
        ? "特惠降价"
        : language === "ru"
          ? "Спецпредложение"
          : "ลดราคาพิเศษ";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(group);
      }}
      onMouseEnter={() => onMouseEnter?.(group)}
      onMouseLeave={() => onMouseLeave?.()}
      aria-label={`${group.leadPriceLabel}${isMultiUnit ? ` (${countSuffix})` : ""}`}
      className={cn(
        "group relative inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 rounded-full font-extrabold text-xs tracking-tight transition-all duration-200 select-none cursor-pointer shadow-md border whitespace-nowrap",
        isSelected
          ? "bg-blue-600 text-white border-white ring-4 ring-blue-500/35 scale-110 shadow-xl"
          : isHovered
            ? "bg-[#1D4ED8] text-white border-white ring-2 ring-blue-400/40 scale-105 shadow-lg"
            : isMultiUnit
              ? "bg-[#1B263B] text-white border-slate-700/80 hover:bg-blue-600 hover:border-white hover:scale-105"
              : "bg-white text-[#1B263B] border-slate-300/90 hover:bg-[#1B263B] hover:text-white hover:border-slate-800 hover:scale-105"
      )}
    >
      {/* Rose Discount Indicator Dot when original_price / original_rental_price > current price */}
      {group.hasAnyDiscount && (
        <span
          title={discountTooltip}
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isSelected || isHovered
              ? "bg-rose-300 animate-pulse"
              : "bg-rose-500"
          )}
        />
      )}

      <span>{group.leadPriceLabel}</span>

      {/* Multi-Unit Condo / Shared-Location Count Pill */}
      {isMultiUnit && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
            isSelected || isHovered
              ? "bg-white/20 text-white"
              : "bg-blue-500/25 text-blue-200 border border-blue-400/30"
          )}
        >
          <Building2 className="w-2.5 h-2.5 shrink-0" />
          <span>{countSuffix}</span>
        </span>
      )}

      {/* Bottom Pointer Triangle */}
      <span
        className={cn(
          "absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r border-b transition-colors duration-200",
          isSelected
            ? "bg-blue-600 border-white"
            : isHovered
              ? "bg-[#1D4ED8] border-white"
              : isMultiUnit
                ? "bg-[#1B263B] border-slate-700/80 group-hover:bg-blue-600 group-hover:border-white"
                : "bg-white border-slate-300/90 group-hover:bg-[#1B263B] group-hover:border-slate-800"
        )}
      />
    </button>
  );
});
