"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CompareProperty, ComparisonRow } from "./types";
import { ComparisonSection, COMPARISON_SECTIONS } from "./constants";
import { ComparePropertyHeader } from "./ComparePropertyHeader";
import { CompareRow } from "./CompareRow";
import { CompareActionRow } from "./CompareActionRow";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { clearCompare } from "@/lib/compare-store";
import { cn } from "@/lib/utils";

interface CompareTableProps {
  properties: CompareProperty[];
  rows?: ComparisonRow[];
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
      case "petFriendly":
        return Boolean(p.pet_friendly || (p as any).petFriendly);
      case "listing_type":
        return p.listing_type || "";
      case "property_type":
        return p.property_type || "";
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
    language === "th"
      ? "แสดงเฉพาะจุดต่าง"
      : language === "cn"
        ? "只看不同项"
        : language === "ru"
          ? "Только отличия"
          : "Differences only";

  const addMoreLabel =
    language === "th"
      ? "+ เพิ่มจากแผนที่"
      : language === "cn"
        ? "+ 从地图添加"
        : language === "ru"
          ? "+ Добавить с карты"
          : "+ Add from map";

  return (
    <div className="space-y-4">
      {/* Top International-Style Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Differences Only Toggle Switch */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDifferencesOnly}
              onChange={(e) => setShowDifferencesOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative" />
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>{filterLabel}</span>
            </span>
          </label>

          <span className="text-xs text-slate-400 hidden sm:inline">|</span>

          <span className="text-xs text-slate-500 font-medium">
            {language === "th"
              ? `เปรียบเทียบ ${properties.length} โครงการ (สูงสุด 4)`
              : `Comparing ${properties.length} properties (max 4)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {properties.length < 4 && (
            <Link
              href={`${langPrefix || ""}/map`}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addMoreLabel}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              clearCompare();
              window.location.href = `${langPrefix || ""}/compare`;
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="ล้างทั้งหมด"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {language === "th" ? "ล้างทั้งหมด" : "Clear all"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Comparison Matrix Container */}
      <div className="overflow-x-auto pb-4 md:pb-6 animate-in fade-in duration-500 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[650px] md:min-w-[850px] border border-slate-200 rounded-2xl md:rounded-3xl bg-white overflow-hidden shadow-xs">
          {/* Sticky Header Row: Stays pinned as user scrolls down */}
          <div
            className="grid divide-x divide-slate-100 sticky top-0 sm:top-[64px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs"
            style={{
              gridTemplateColumns: `160px repeat(${properties.length}, 1fr)`,
            }}
          >
            <div className="sticky left-0 bg-white/95 backdrop-blur-xs z-30 p-3 md:p-6 flex flex-col justify-center font-bold text-xs md:text-sm text-slate-900 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
              <span>{t("compare_page.topics") || "หัวข้อเปรียบเทียบ"}</span>
              <span className="text-[11px] text-slate-400 font-normal mt-0.5">
                {properties.length} รายการ
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

          {/* Sectioned Data Rows */}
          {sections.map((section) => {
            const visibleRows = section.rows.filter((row) => {
              if (!showDifferencesOnly) return true;
              return hasRowDifferences(row.key, properties);
            });

            if (visibleRows.length === 0) return null;

            return (
              <div key={section.id} className="border-b border-slate-100 last:border-b-0">
                {/* Section Divider Bar */}
                <div
                  className="grid bg-slate-100/80 border-y border-slate-200/80 px-4 py-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider"
                  style={{
                    gridTemplateColumns: `160px repeat(${properties.length}, 1fr)`,
                  }}
                >
                  <div className="sticky left-0 z-10 flex items-center gap-2">
                    <section.icon className="w-3.5 h-3.5 text-blue-600" />
                    <span>{section.defaultTitle}</span>
                  </div>
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
