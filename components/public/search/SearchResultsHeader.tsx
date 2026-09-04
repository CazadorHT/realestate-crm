"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface SearchResultsHeaderProps {
  totalFound: number;
  startIndex: number;
  endIndex: number;
  totalAvailableCount?: number;
  isLoading?: boolean;
}

export function SearchResultsHeader({
  totalFound,
  startIndex,
  endIndex,
  totalAvailableCount,
  isLoading = false,
}: SearchResultsHeaderProps) {
  const { language } = useLanguage();

  const grandTotal = totalAvailableCount && totalAvailableCount > totalFound ? totalAvailableCount : totalFound;
  const displayedCount = Math.min(endIndex, grandTotal);

  if (isLoading) {
    return (
      <div className="mb-4 md:mb-6 flex items-center justify-between">
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
      </div>
    );
  }

  if (grandTotal === 0) {
    return null;
  }

  return (
    <div className="mb-4 md:mb-6 flex items-center justify-between">
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
    </div>
  );
}


