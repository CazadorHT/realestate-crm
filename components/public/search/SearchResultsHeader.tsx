"use client";

import Link from "next/link";
import { Columns2, LayoutGrid, Map as MapIcon } from "lucide-react";
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
  mapHref = "/map",
}: SearchResultsHeaderProps) {
  const { language } = useLanguage();

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
      className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-xs shrink-0"
    >
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === "grid"}
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
          viewMode === "grid"
            ? "bg-[#1B263B] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>{viewLabels.grid}</span>
      </button>

      {/* Split-View button visible on Desktop (lg+) */}
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === "split"}
        onClick={() => onViewModeChange("split")}
        className={cn(
          "hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
          viewMode === "split"
            ? "bg-[#1B263B] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        )}
      >
        <Columns2 className="w-3.5 h-3.5" />
        <span>{viewLabels.split}</span>
      </button>

      {/* Full-Screen Explorer Route (/map) carrying all active filters */}
      <Link
        href={mapHref}
        className="inline-flex ml-2 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50/70 transition-all cursor-pointer"
      >
        <MapIcon className="w-3.5 h-3.5" />
        <span>{viewLabels.map}</span>
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
    <div className="mb-4 md:mb-6 flex items-center justify-between gap-3 flex-wrap">
      <div className="text-slate-500 text-xs sm:text-sm font-medium flex items-center flex-wrap gap-1">
        {language === "en" ? (
          <>
            <span>Showing</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span>of</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-xs">
              {grandTotal.toLocaleString()}
            </span>
            <span>properties</span>
          </>
        ) : language === "cn" ? (
          <>
            <span>正在显示</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span>/ 共</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-xs">
              {grandTotal.toLocaleString()}
            </span>
            <span>套房源</span>
          </>
        ) : language === "ru" ? (
          <>
            <span>Показано</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span>из</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-xs">
              {grandTotal.toLocaleString()}
            </span>
            <span>объектов</span>
          </>
        ) : (
          <>
            <span>แสดง</span>
            <span className="font-semibold text-slate-800">
              {startIndex + 1}–{displayedCount}
            </span>
            <span>จากทั้งหมด</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 text-xs">
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
