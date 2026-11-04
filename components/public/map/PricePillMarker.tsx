"use client";

import React, { memo, useMemo } from "react";
import { Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapLocationGroup } from "./useMapClusters";
import { getPinProjectOrPropertyHeadline } from "./map-price-utils";

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
  const listingType = group.leadListingType || "SALE";

  // Authoritative project or property headline resolution for hover tooltip
  const projectHeadline = useMemo(() => {
    if (!group?.units || group.units.length === 0) return null;

    // 1. Prioritize any unit in the group that has an explicit project name
    for (const unit of group.units) {
      if (!unit) continue;
      const headline = getPinProjectOrPropertyHeadline(unit, language);
      if (headline.isProjectHeadline && headline.primaryTitle) {
        return {
          title: headline.primaryTitle,
          isProject: true,
        };
      }
    }

    // 2. Fallback for standalone properties (house/land/townhome)
    const first = group.units[0];
    if (!first) return null;
    const headline = getPinProjectOrPropertyHeadline(first, language);
    const cleanTitle = (headline.primaryTitle || "").replace(/^[^\w\u0E00-\u0E7F]+/g, "").trim();

    return {
      title: cleanTitle || first.popular_area || first.property_type || "",
      isProject: false,
    };
  }, [group?.units, language]);

  const countSuffix =
    language === "th"
      ? `${unitCount} ห้อง`
      : language === "cn"
        ? `${unitCount}套`
        : language === "ru"
          ? `${unitCount}`
          : `${unitCount}`;

  const typeLabel =
    listingType === "RENT"
      ? language === "th"
        ? "ให้เช่า"
        : language === "cn"
          ? "出租"
          : language === "ru"
            ? "Аренда"
            : "For Rent"
      : listingType === "SALE"
        ? language === "th"
          ? "ขาย"
          : language === "cn"
            ? "出售"
            : language === "ru"
              ? "Продажа"
              : "For Sale"
        : language === "th"
          ? "มีทั้งขายและเช่า"
          : language === "cn"
            ? "租售均有"
            : language === "ru"
              ? "Продажа и Аренда"
              : "Sale & Rent";

  const discountTooltip =
    language === "en"
      ? "Special Discount"
      : language === "cn"
        ? "特惠降价"
        : language === "ru"
          ? "Спецпредложение"
          : "ลดราคาพิเศษ";

  // Dynamic Theme Styling by Listing Type (Style 1: Accent Indicator Dot & Border)
  const isRent = listingType === "RENT";
  const isBoth = listingType === "BOTH";

  // Active / Selected background and ring
  const activeBgClass = isBoth
    ? "bg-purple-600 text-white border-white ring-4 ring-purple-500/35"
    : isRent
      ? "bg-blue-600 text-white border-white ring-4 ring-blue-500/35"
      : "bg-emerald-600 text-white border-white ring-4 ring-emerald-500/35";

  // Hovered background and ring
  const hoverBgClass = isBoth
    ? "bg-purple-600 text-white border-white ring-2 ring-purple-400/40"
    : isRent
      ? "bg-blue-600 text-white border-white ring-2 ring-blue-400/40"
      : "bg-emerald-600 text-white border-white ring-2 ring-emerald-400/40";

  // Default normal border & subtle tint
  const defaultBorderClass = isBoth
    ? "border-purple-200/90 hover:border-purple-500"
    : isRent
      ? "border-blue-200/90 hover:border-blue-500"
      : "border-emerald-200/90 hover:border-emerald-500";

  // Arrow triangle colors
  const arrowNormalClass = isBoth
    ? "bg-white border-purple-200/90 group-hover:bg-purple-600 group-hover:border-white"
    : isRent
      ? "bg-white border-blue-200/90 group-hover:bg-blue-600 group-hover:border-white"
      : "bg-white border-emerald-200/90 group-hover:bg-emerald-600 group-hover:border-white";

  const arrowActiveClass = isBoth
    ? "bg-purple-600 border-white"
    : isRent
      ? "bg-blue-600 border-white"
      : "bg-emerald-600 border-white";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(group);
      }}
      onMouseEnter={() => onMouseEnter?.(group)}
      onMouseLeave={() => onMouseLeave?.()}
      aria-label={`${typeLabel}: ${group.leadPriceLabel}${isMultiUnit ? ` (${countSuffix})` : ""}`}
      className={cn(
        "group relative inline-flex items-center gap-1.5 h-[32px] px-2.5 py-1 rounded-full font-sans font-bold text-xs tracking-tight transition-all duration-150 select-none cursor-pointer shadow-md border whitespace-nowrap bg-white text-[#1B263B] origin-bottom",
        isSelected
          ? `${activeBgClass} scale-105 shadow-xl`
          : isHovered
            ? `${hoverBgClass} shadow-lg`
            : `${defaultBorderClass} hover:shadow-lg`
      )}
    >
      {/* Accent Indicator Dot: Green for Sale, Blue for Rent, Purple for Both (hidden on hover in favor of project chip) */}
      {!(isHovered || isSelected) && (
        <span
          title={typeLabel}
          className={cn(
            "w-2 h-2 rounded-full shrink-0 transition-colors duration-200",
            isBoth
              ? "bg-purple-500 ring-2 ring-purple-500/25"
              : isRent
                ? "bg-blue-500 ring-2 ring-blue-500/25"
                : "bg-emerald-500 ring-2 ring-emerald-500/25"
          )}
        />
      )}

      {/* When Hovered or Selected: Prominent High-Contrast Project Chip (Distinct Dark Luxury BG) */}
      {(isHovered || isSelected) && projectHeadline?.title && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 -ml-1 rounded-full bg-slate-950/90 text-white border border-white/25 shadow-xs shrink-0 max-w-[160px] sm:max-w-[210px] animate-in fade-in duration-150">
          {projectHeadline.isProject ? (
            <Building2 className="w-3 h-3 text-sky-400 shrink-0" />
          ) : (
            <Home className="w-3 h-3 text-emerald-400 shrink-0" />
          )}
          <span className="truncate font-bold text-xs tracking-tight text-white leading-none">
            {projectHeadline.title}
          </span>
        </span>
      )}

      <span className="leading-none flex items-center">{group.leadPriceLabel}</span>

      {/* Rose Discount Indicator Dot when original_price / original_rental_price > current price */}
      {group.hasAnyDiscount && (
        <span
          title={discountTooltip}
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isSelected || isHovered
              ? "bg-rose-200 animate-pulse"
              : "bg-rose-500 ring-2 ring-rose-200/70"
          )}
        />
      )}

      {/* Multi-Unit Condo / Shared-Location Count Pill */}
      {isMultiUnit && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none transition-colors",
            isSelected || isHovered
              ? "bg-white/20 text-white"
              : isBoth
                ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                : isRent
                  ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
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
          isSelected || isHovered ? arrowActiveClass : arrowNormalClass
        )}
      />
    </button>
  );
});
