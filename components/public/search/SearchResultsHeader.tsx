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
  const { t, language } = useLanguage();

  const grandTotal = totalAvailableCount && totalAvailableCount > totalFound ? totalAvailableCount : totalFound;
  const displayedCount = Math.min(endIndex, grandTotal);
  const remainingCount = Math.max(0, grandTotal - endIndex);

  return (
    <div className="mb-6 md:mb-8 flex items-center justify-between">
      <div className="text-slate-600 text-sm flex items-center flex-wrap gap-1.5 font-medium">
        <span>{t("search.found_total")}</span>
        
        {isLoading ? (
          <span className="inline-flex items-center px-2 py-0.5 font-bold text-blue-600 animate-pulse bg-blue-50 border border-blue-100/60 rounded-md tracking-widest text-xs min-w-[32px] justify-center shadow-2xs">
            •••
          </span>
        ) : (
          <span className="font-bold text-blue-600 text-base">
            {grandTotal.toLocaleString()}
          </span>
        )}

        <span>{t("search.items")}</span>

        {isLoading ? (
          <span className="text-slate-400 text-xs ml-1 animate-pulse">
            ({language === "en"
              ? "Searching..."
              : language === "cn"
              ? "搜索中..."
              : language === "ru"
              ? "Поиск..."
              : "กำลังค้นหา..."})
          </span>
        ) : grandTotal > 0 && (
          <span className="text-slate-400 text-xs sm:text-sm ml-1 flex items-center flex-wrap gap-1">
            <span>
              ({t("search.displaying")} {startIndex + 1}-{displayedCount}
            </span>
            {remainingCount > 0 ? (
              <span className="text-slate-500 font-medium">
                • {language === "en"
                  ? `${remainingCount} more to display`
                  : language === "cn"
                  ? `还有 ${remainingCount} 套待展示`
                  : language === "ru"
                  ? `еще ${remainingCount} не показано`
                  : `ยังไม่ได้แสดงอีก ${remainingCount} รายการ`})
              </span>
            ) : (
              <span>)</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

