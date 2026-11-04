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

  // Dynamic Theme Styling by Listing Type
  const isRent = listingType === "RENT";
  const isBoth = listingType === "BOTH";

  const isExpanded = (isHovered || isSelected) && Boolean(projectHeadline?.title);

  // Active / Selected / Hovered theme border & text colors
  const activeBorderClass = isBoth
    ? "border-purple-600 ring-4 ring-purple-500/15"
    : isRent
      ? "border-blue-600 ring-4 ring-blue-500/15"
      : "border-emerald-600 ring-4 ring-emerald-500/15";

  const priceColorClass = isBoth
    ? "text-purple-600"
    : isRent
      ? "text-blue-600"
      : "text-emerald-600";

  const iconColorClass = isBoth
    ? "text-purple-600"
    : isRent
      ? "text-blue-600"
      : "text-emerald-600";

  const arrowBorderClass = isBoth
    ? "border-purple-600"
    : isRent
      ? "border-blue-600"
      : "border-emerald-600";

  // Default normal border & subtle tint
  const defaultBorderClass = isBoth
    ? "border-purple-200/90 hover:border-purple-500"
    : isRent
      ? "border-blue-200/90 hover:border-blue-500"
      : "border-emerald-200/90 hover:border-emerald-500";

  // Dot color for normal state
  const dotClass = isBoth
    ? "bg-purple-500 ring-2 ring-purple-500/25"
    : isRent
      ? "bg-blue-500 ring-2 ring-blue-500/25"
      : "bg-emerald-500 ring-2 ring-emerald-500/25";

  // Default arrow color
  const defaultArrowClass = isBoth
    ? "border-purple-200/90 group-hover:border-purple-500"
    : isRent
      ? "border-blue-200/90 group-hover:border-blue-500"
      : "border-emerald-200/90 group-hover:border-emerald-500";

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
        "group relative font-sans font-bold text-xs tracking-tight transition-all duration-150 select-none cursor-pointer whitespace-nowrap bg-white text-[#1B263B] origin-bottom",
        isExpanded
          ? `flex flex-col items-start gap-1 px-3 py-2 rounded-2xl shadow-xl border-2 ${activeBorderClass} z-40 animate-in fade-in zoom-in-95 duration-150`
          : `inline-flex items-center gap-1.5 h-[32px] px-2.5 py-1 rounded-full shadow-md border ${defaultBorderClass} hover:shadow-lg`
      )}
    >
      {isExpanded ? (
        /* 2-Line Expanded View on Hover: Line 1 = Icon + Project Name (White BG), Line 2 = Price */
        <>
          {/* Line 1: Icon + Project Name (White BG, crisp dark slate text) */}
          <span className="flex items-center gap-1.5 text-slate-900 font-bold text-xs tracking-tight">
            {projectHeadline?.isProject ? (
              <Building2 className={cn("w-3.5 h-3.5 shrink-0", iconColorClass)} />
            ) : (
              <Home className={cn("w-3.5 h-3.5 shrink-0", iconColorClass)} />
            )}
            <span className="truncate max-w-[170px] sm:max-w-[210px]">
              {projectHeadline?.title}
            </span>
          </span>

          {/* Line 2: Price + Multi-Unit / Discount Badges */}
          <span className="flex items-center justify-between w-full gap-2 pt-0.5">
            <span className={cn("font-extrabold text-xs leading-none", priceColorClass)}>
              {group.leadPriceLabel}
            </span>

            {group.hasAnyDiscount && (
              <span
                title={discountTooltip}
                className="w-1.5 h-1.5 rounded-full shrink-0 bg-rose-500 ring-2 ring-rose-200/70"
              />
            )}

            {isMultiUnit && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                <Building2 className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                <span>{countSuffix}</span>
              </span>
            )}
          </span>

          {/* Bottom Pointer Triangle */}
          <span
            className={cn(
              "absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-white border-r-2 border-b-2 transition-colors duration-150",
              arrowBorderClass
            )}
          />
        </>
      ) : (
        /* Compact Single-Line View (Normal State) */
        <>
          {/* Accent Indicator Dot */}
          <span
            title={typeLabel}
            className={cn("w-2 h-2 rounded-full shrink-0 transition-colors duration-200", dotClass)}
          />

          <span className="leading-none flex items-center">{group.leadPriceLabel}</span>

          {group.hasAnyDiscount && (
            <span
              title={discountTooltip}
              className="w-1.5 h-1.5 rounded-full shrink-0 bg-rose-500 ring-2 ring-rose-200/70"
            />
          )}

          {isMultiUnit && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none transition-colors",
                isBoth
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
              "absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-white border-r border-b transition-colors duration-200",
              defaultArrowClass
            )}
          />
        </>
      )}
    </button>
  );
});
