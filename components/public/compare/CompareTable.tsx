"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { CompareProperty } from "./types";
import { ComparisonSection, COMPARISON_SECTIONS } from "./constants";
import { ComparePropertyHeader } from "./ComparePropertyHeader";
import { CompareAppleHero } from "./CompareAppleHero";
import { CompareRow } from "./CompareRow";
import { CompareActionRow } from "./CompareActionRow";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { clearCompare } from "@/lib/compare-store";
import { isRowPopulated } from "./utils";
import { cn } from "@/lib/utils";

interface CompareTableProps {
  properties: CompareProperty[];
  sections?: ComparisonSection[];
  onRemove: (id: string) => void;
}

/** Check if properties have different values for a given row */
function hasRowDifferences(rowKey: string, properties: CompareProperty[]): boolean {
  if (properties.length <= 1) return true;

  const getRowVal = (p: CompareProperty): any => {
    switch (rowKey) {
      case "price":
        return `${p.price || 0}-${p.rental_price || 0}`;
      case "price_per_sqm":
        return p.price && p.size_sqm ? Math.round(p.price / p.size_sqm) : 0;
      case "property_size":
        return p.size_sqm || 0;
      case "land_size_sqwah":
        return p.land_size_sqwah || 0;
      case "bedrooms":
        return p.bedrooms || 0;
      case "bathrooms":
        return p.bathrooms || 0;
      case "floor":
        return p.floor || 0;
      case "parking_slots":
        return p.parking_slots || 0;
      case "ceiling_height":
        return p.ceiling_height || (p.amenities as any)?.ceiling_height || 0;
      case "direction":
        return p.direction || p.orientation || "";
      case "furnishing":
        return p.is_fully_furnished ? "FULL" : p.is_bare_shell ? "BARE" : "";
      case "petFriendly":
        return Boolean(p.is_pet_friendly || p.pet_friendly || (p.amenities as any)?.pet_friendly);
      case "allow_airbnb":
        return Boolean(p.allow_airbnb || (p.amenities as any)?.allow_airbnb);
      case "foreigner_quota":
        return Boolean(p.is_foreigner_quota);
      case "listing_type":
        return p.listing_type || "";
      case "property_type":
        return p.property_type || "";
      case "min_contract_months":
        return p.min_contract_months || 0;
      case "transportation":
        return `${p.transit_station_name || ""}-${p.transit_distance_meters || 0}`;
      case "zone":
        return p.popular_area || "";
      default:
        return (p as any)[rowKey] ?? "";
    }
  };

  const firstVal = getRowVal(properties[0]);
  return properties.some((p) => getRowVal(p) !== firstVal);
}

export function CompareTable({
  properties,
  sections = COMPARISON_SECTIONS,
  onRemove,
}: CompareTableProps) {
  const { t, language, langPrefix } = useLanguage();
  const [showDifferencesOnly, setShowDifferencesOnly] = useState<boolean>(false);

  const filterLabel =
    t("compare_page.values.diff_only") ||
    (language === "th"
      ? "แสดงเฉพาะจุดต่าง"
      : language === "cn"
        ? "只看不同项"
        : language === "ru"
          ? "Только отличия"
          : "Differences only");

  const addMoreLabel =
    t("compare_page.values.add_from_map") ||
    (language === "th"
      ? "+ เพิ่มจากแผนที่"
      : language === "cn"
        ? "+ 从地图添加"
        : language === "ru"
          ? "+ Добавить с карты"
          : "+ Add from map");

  const compareCountLabel =
    language === "th"
      ? `เปรียบเทียบ ${properties.length} โครงการ (สูงสุด 4)`
      : language === "cn"
        ? `对比 ${properties.length} 个房源（最多4个）`
        : language === "ru"
          ? `Сравнение ${properties.length} объектов (макс. 4)`
          : `Comparing ${properties.length} properties (max 4)`;

  const itemsCountLabel =
    t("compare_page.values.items_count", { count: properties.length }) ||
    (language === "th"
      ? `${properties.length} รายการ`
      : language === "cn"
        ? `${properties.length} 个`
        : language === "ru"
          ? `${properties.length} объектов`
          : `${properties.length} items`);

  return (
    <div className="space-y-6">
      {/* 1. Apple-Style Product Showcase Hero Area */}
      <CompareAppleHero properties={properties} onRemove={onRemove} />

      {/* 2. Apple / International Toolbar */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Differences Only Toggle Switch */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={showDifferencesOnly}
              onChange={(e) => setShowDifferencesOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{filterLabel}</span>
            </span>
          </label>

          <span className="text-xs text-slate-400 hidden sm:inline">|</span>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline whitespace-nowrap truncate">
            {compareCountLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {properties.length < 4 && (
            <Link
              href={`${langPrefix || ""}/map`}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>{addMoreLabel}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              clearCompare();
              window.location.href = `${langPrefix || ""}/compare`;
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 p-1.5 sm:px-2 sm:py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            title={t("compare_page.values.clear_all") || "ล้างทั้งหมด"}
          >
            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">
              {t("compare_page.values.clear_all") || (language === "th" ? "ล้างทั้งหมด" : "Clear all")}
            </span>
          </button>
        </div>
      </div>

      {/* Main Comparison Matrix Container */}
      <div className="overflow-x-auto pb-4 md:pb-6 animate-in fade-in duration-500 -mx-4 px-4 md:mx-0 md:px-0 [--compare-label-w:105px] sm:[--compare-label-w:140px] md:[--compare-label-w:175px]">
        <div
          className={cn(
            "border border-slate-200 rounded-2xl md:rounded-3xl bg-white shadow-xs overflow-hidden",
            properties.length === 2
              ? "min-w-[380px] sm:min-w-[580px] md:min-w-[780px]"
              : properties.length === 3
                ? "min-w-[540px] sm:min-w-[740px] md:min-w-[920px]"
                : "min-w-[680px] sm:min-w-[880px] md:min-w-[1040px]"
          )}
        >
          {/* Flush Header Row (แก้ปัญหาข้างบนมันเว้น: ให้แนบชิดขอบบนพอดี ไม่เว้นช่องว่าง) */}
          <div
            className="grid divide-x divide-slate-100 sticky top-0 z-20 bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-2xs rounded-t-2xl md:rounded-t-3xl"
            style={{
              gridTemplateColumns: `var(--compare-label-w, 105px) repeat(${properties.length}, minmax(145px, 1fr))`,
            }}
          >
            <div className="sticky left-0 bg-white z-30 px-2 py-3 sm:px-3.5 sm:py-4 flex flex-col justify-center items-center text-center font-bold text-slate-900 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] rounded-tl-2xl md:rounded-tl-3xl">
              <span className="font-extrabold text-[11px] sm:text-xs md:text-sm leading-tight text-slate-900">{t("compare_page.topics") || "หัวข้อเปรียบเทียบ"}</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-1 bg-slate-100 px-2 py-0.5 rounded-full">
                {itemsCountLabel}
              </span>
            </div>

            {properties.map((p) => (
              <ComparePropertyHeader
                key={p.id}
                property={p}
                onRemove={onRemove}
              />
            ))}
          </div>

          {/* Sectioned Data Rows with Merged Full-Width Section Header (แก้ปัญหาต้อง merch ตาราง) */}
          {sections.map((section) => {
            const visibleRows = section.rows.filter((row) => {
              // 🛡️ หากอันไหนไม่ได้ระบุ ไม่ต้องโชว์กรณีไม่ได้ระบุทั้งหมด (Hide row completely if NO property has data)
              const hasAnyData = properties.some((p) => isRowPopulated(row.key, p));
              if (!hasAnyData) return false;

              if (!showDifferencesOnly) return true;
              return hasRowDifferences(row.key, properties);
            });

            if (visibleRows.length === 0) return null;

            return (
              <div key={section.id} className="border-b border-slate-100 last:border-b-0">
                {/* Merged Horizontal Section Banner (แนวยาวเต็มตาราง) */}
                <div className="w-full bg-slate-100/90 border-y border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 sticky left-0 z-10 shadow-2xs">
                  <section.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                  <span>
                    {(() => {
                      const title = t(section.titleKey);
                      if (
                        !title ||
                        title.includes("COMPARE_PAGE.") ||
                        title === section.titleKey
                      ) {
                        return section.defaultTitle;
                      }
                      return title;
                    })()}
                  </span>
                </div>

                {/* Section Rows */}
                {visibleRows.map((row, idx) => (
                  <CompareRow
                    key={row.key}
                    row={row}
                    properties={properties}
                    idx={idx}
                  />
                ))}
              </div>
            );
          })}

          {/* Action CTA Row at Bottom */}
          <CompareActionRow properties={properties} />
        </div>
      </div>
    </div>
  );
}
