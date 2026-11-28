"use client";

import Link from "next/link";
import { ArrowUpRight, Columns2, LayoutGrid, Map as MapIcon } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

export type PropertyViewMode = "grid" | "split";

interface SearchResultsHeaderProps {
  totalFound: number;
  startIndex: number;
  endIndex: number;
  totalAvailableCount?: number;
  isLoading?: boolean;
  viewMode?: PropertyViewMode;
  onViewModeChange?: (mode: PropertyViewMode) => void;
  mapHref?: string;
}

export function SearchResultsHeader({
  totalFound,
  startIndex,
  endIndex,
  totalAvailableCount,
  isLoading = false,
  viewMode = "grid",
  onViewModeChange,
  mapHref,
}: SearchResultsHeaderProps) {
  const { language, langPrefix } = useLanguage();
  const resolvedMapHref = mapHref ?? `${langPrefix}/map`;

  const grandTotal =
    totalAvailableCount && totalAvailableCount > totalFound
      ? totalAvailableCount
      : totalFound;
  const displayedCount = Math.min(endIndex, grandTotal);

  const viewLabels = {
    grid:
      language === "en"
        ? "Grid"
        : language === "cn"
          ? "列表"
          : language === "ru"
            ? "Сетка"
            : "รายการ",
    split:
      language === "en"
        ? "Split"
        : language === "cn"
          ? "分屏地图"
          : language === "ru"
            ? "Сплит"
            : "แบ่งจอ",
    map:
      language === "en"
        ? "Map"
        : language === "cn"
          ? "地图找房"
          : language === "ru"
            ? "Карта"
            : "แผนที่",
  };

  const viewSwitcher = onViewModeChange ? (
    <div
      role="tablist"
      aria-label="Property view mode"
      className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-sm shrink-0"
    >
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === "grid"}
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "h-7 sm:h-8.5 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer",
          viewMode === "grid"
            ? "bg-slate-900 text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        )}
      >
        <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span>{viewLabels.grid}</span>
      </button>

      {/* Split-View button visible on Desktop (lg+) */}
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === "split"}
        onClick={() => onViewModeChange("split")}
        className={cn(
          "h-7 sm:h-8.5 hidden lg:inline-flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
          viewMode === "split"
            ? "bg-slate-900 text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        )}
      >
        <Columns2 className="w-3.5 h-3.5" />
        <span>{viewLabels.split}</span>
      </button>

      {/* Subtle Divider between In-Page Views & Fullscreen Map Route */}
      <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

      {/* Full-Screen Explorer Route (/map) carrying all active filters */}
      <Link
        href={resolvedMapHref}
        prefetch={false}
        className="h-7 sm:h-8.5 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 transition-all cursor-pointer"
      >
        <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
        <span>{viewLabels.map}</span>
        <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5] shrink-0 opacity-70" />
      </Link>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className="mb-4 md:mb-6 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>
            {language === "en"
              ? "Searching properties..."
              : language === "cn"
                ? "正在搜索房源..."
                : language === "ru"
                  ? "Поиск недвижимости..."
                  : "กำลังค้นหาทรัพย์..."}
          </span>
        </div>
        {viewSwitcher}
      </div>
    );
  }

  if (grandTotal === 0) {
    if (!onViewModeChange) return null;
    return (
      <div className="mb-4 md:mb-6 flex items-center justify-between gap-3">
        <div className="text-slate-500 text-xs sm:text-sm font-medium">
          {language === "en"
            ? "0 properties found"
            : language === "cn"
              ? "找到 0 套房源"
              : language === "ru"
                ? "Найдено 0 объектов"
                : "พบ 0 รายการ"}
        </div>
        {viewSwitcher}
      </div>
    );
  }

  return (
    <div className="mb-4 md:mb-6 flex items-center justify-between gap-2 sm:gap-3">
      <div className="text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-1 shrink min-w-0">
        {language === "en" ? (
          <>
            <span className="hidden sm:inline">Showing</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span className="hidden sm:inline">of</span>
            <span className="sm:hidden text-slate-400">/</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-[11px] sm:text-xs shrink-0">
              {grandTotal.toLocaleString()}
            </span>
            <span>properties</span>
          </>
        ) : language === "cn" ? (
          <>
            <span className="hidden sm:inline">正在显示</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span className="text-slate-400">/</span>
            <span className="hidden sm:inline">共</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-[11px] sm:text-xs shrink-0">
              {grandTotal.toLocaleString()}
            </span>
            <span>套房源</span>
          </>
        ) : language === "ru" ? (
          <>
            <span className="hidden sm:inline">Показано</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span className="hidden sm:inline">из</span>
            <span className="sm:hidden text-slate-400">/</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-[11px] sm:text-xs shrink-0">
              {grandTotal.toLocaleString()}
            </span>
            <span>объектов</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">แสดง</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span className="hidden sm:inline">จากทั้งหมด</span>
            <span className="sm:hidden text-slate-400">/</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-[11px] sm:text-xs shrink-0">
              {grandTotal.toLocaleString()}
            </span>
            <span>รายการ</span>
          </>
        )}
      </div>

      {viewSwitcher}
    </div>
  );
}
