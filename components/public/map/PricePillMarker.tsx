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
  isDimmed?: boolean;
  language: string;
  onClick: (group: MapLocationGroup) => void;
  onMouseEnter?: (group: MapLocationGroup) => void;
  onMouseLeave?: () => void;
}

export const PricePillMarker = memo(function PricePillMarker({
  group,
  isSelected,
  isHovered,
  isDimmed = false,
  language,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: PricePillMarkerProps) {
  const unitCount = group.units.length;
  const isMultiUnit = unitCount > 1;
  const listingType = group.leadListingType || "SALE";

  // Authoritative project or property headline resolution with bilingual English subtitle support
  const projectHeadline = useMemo(() => {
    if (!group?.units || group.units.length === 0) return null;

    const isThai = language === "th";

    // 1. Prioritize any unit in the group that has an explicit project name
    for (const unit of group.units) {
      if (!unit) continue;
      const nameTh = unit.projects?.name_th || unit.project_name || null;
      const nameEn = unit.projects?.name_en || null;
      const nameCn = unit.project_name_cn || null;
      const nameRu = unit.project_name_ru || null;

      if (nameTh || nameEn || nameCn || nameRu) {
        if (isThai) {
          // Thai user: Thai primary, English subtitle (if distinct)
          const primary = nameTh || nameEn;
          const secondary =
            nameEn && nameEn.trim().toLowerCase() !== primary?.trim().toLowerCase()
              ? nameEn
              : null;

          return {
            primaryTitle: primary?.trim() || "",
            englishSubtitle: secondary?.trim() || null,
            isProject: true,
          };
        } else {
          // Non-Thai user (EN, CN, RU, etc.): strictly show English / international title, NO Thai mixed in!
          const localized =
            language === "cn"
              ? nameCn || nameEn
              : language === "ru"
                ? nameRu || nameEn
                : nameEn;
          const primary = localized || nameEn || nameTh;

          return {
            primaryTitle: primary?.trim() || "",
            englishSubtitle: null,
            isProject: true,
          };
        }
      }
    }

    // 2. Fallback for standalone properties (house/land/townhome)
    const first = group.units[0];
    if (!first) return null;
    const headline = getPinProjectOrPropertyHeadline(first, language);
    const cleanTitle = (headline.primaryTitle || "").replace(/^[^\w\u0E00-\u0E7F]+/g, "").trim();

    if (isThai) {
      // Check if there is an english title / area to serve as subtitle for Thai users
      const enTitle = first.title_en?.replace(/^[^\w\u0E00-\u0E7F]+/g, "").trim() || first.popular_area_en || null;
      const secondary = enTitle && enTitle.toLowerCase() !== cleanTitle.toLowerCase() ? enTitle : null;

      return {
        primaryTitle: cleanTitle || first.popular_area || first.property_type || "",
        englishSubtitle: secondary,
        isProject: false,
      };
    } else {
      // Non-Thai user: strictly international title without Thai subtitle
      const nonThaiTitle =
        (language === "cn" && first.title_cn) ||
        (language === "ru" && first.title_ru) ||
        first.title_en ||
        cleanTitle;

      return {
        primaryTitle: (nonThaiTitle || first.popular_area_en || first.property_type || "").replace(/^[^\w\u0E00-\u0E7F]+/g, "").trim(),
        englishSubtitle: null,
        isProject: false,
      };
    }
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

  const isActive = isHovered || isSelected;

  // Active / Selected / Hovered theme colors (Airbnb style: transforms pill to solid brand color)
  const activePillClass = isBoth
    ? "bg-purple-600 text-white border-purple-600 shadow-xl ring-4 ring-purple-500/20 scale-105"
    : isRent
      ? "bg-blue-600 text-white border-blue-600 shadow-xl ring-4 ring-blue-500/20 scale-105"
      : "bg-emerald-600 text-white border-emerald-600 shadow-xl ring-4 ring-emerald-500/20 scale-105";

  const activeArrowClass = isBoth
    ? "bg-purple-600 border-r border-b border-purple-600"
    : isRent
      ? "bg-blue-600 border-r border-b border-blue-600"
      : "bg-emerald-600 border-r border-b border-emerald-600";

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
    ? "border-purple-200/90"
    : isRent
      ? "border-blue-200/90"
      : "border-emerald-200/90";

  // Accent icon color matching listing type
  const iconThemeColor = isBoth
    ? "text-purple-600"
    : isRent
      ? "text-blue-600"
      : "text-emerald-600";

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
        "group relative font-sans text-xs tracking-tight select-none cursor-pointer whitespace-nowrap origin-bottom p-0 bg-transparent border-0 outline-none transform-gpu transition-opacity duration-200 ease-out",
        isDimmed && "opacity-60 hover:opacity-100"
      )}
    >
      {/* 🌟 Floating Project Tooltip on Hover (Clean White style: clean, airy, luxury real estate design) */}
      {isHovered && projectHeadline?.primaryTitle && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex flex-col items-center animate-in fade-in zoom-in-95 duration-100 ease-out">
          <span className="flex flex-col items-center bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-xl shadow-xl border border-slate-200/90 text-center whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-xs font-bold leading-tight">
              {projectHeadline.isProject ? (
                <Building2 className={cn("w-3.5 h-3.5 shrink-0", iconThemeColor)} />
              ) : (
                <Home className={cn("w-3.5 h-3.5 shrink-0", iconThemeColor)} />
              )}
              <span className="max-w-[200px] sm:max-w-[260px] truncate text-slate-900 font-bold">
                {projectHeadline.primaryTitle}
              </span>
            </span>
            {projectHeadline.englishSubtitle && (
              <span className="text-[10.5px] text-slate-500 font-medium leading-tight max-w-[200px] sm:max-w-[260px] truncate mt-0.5">
                {projectHeadline.englishSubtitle}
              </span>
            )}
          </span>
          {/* Tooltip downward pointer arrow */}
          <span className="w-2 h-2 rotate-45 bg-white border-r border-b border-slate-200/90 -mt-1 shrink-0 shadow-xs" />
        </span>
      )}

      {/* 🏷️ Solid 32px Price Pill (Airbnb style: constant height, zero layout shift) */}
      <span className="relative flex flex-col items-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 h-[32px] px-2.5 py-1 rounded-full border font-bold transition-all duration-150 ease-out transform-gpu will-change-transform",
            isActive
              ? activePillClass
              : cn("bg-white text-[#1B263B] shadow-md hover:shadow-lg", defaultBorderClass)
          )}
        >
          {/* Accent Indicator Dot */}
          <span
            title={typeLabel}
            className={cn(
              "w-2 h-2 rounded-full shrink-0 transition-colors duration-150",
              isActive ? "bg-white ring-2 ring-white/40" : dotClass
            )}
          />

          <span className="leading-none flex items-center">{group.leadPriceLabel}</span>

          {group.hasAnyDiscount && (
            <span
              title={discountTooltip}
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isActive ? "bg-rose-300 ring-2 ring-white/60 animate-pulse" : "bg-rose-500 ring-2 ring-rose-200/70"
              )}
            />
          )}

          {isMultiUnit && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none transition-colors",
                isActive
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
        </span>

        {/* Bottom Pointer Triangle */}
        <span
          className={cn(
            "absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b transition-colors duration-150",
            isActive ? activeArrowClass : cn("bg-white", defaultArrowClass)
          )}
        />
      </span>
    </button>
  );
});
