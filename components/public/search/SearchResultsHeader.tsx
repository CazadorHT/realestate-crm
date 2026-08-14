"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface SearchResultsHeaderProps {
  totalFound: number;
  startIndex: number;
  endIndex: number;
  totalAvailableCount?: number;
}

export function SearchResultsHeader({
  totalFound,
  startIndex,
  endIndex,
  totalAvailableCount,
}: SearchResultsHeaderProps) {
  const { t, language } = useLanguage();

  const grandTotal = totalAvailableCount && totalAvailableCount > totalFound ? totalAvailableCount : totalFound;

  return (
    <div className="mb-8 md:mb-10 flex items-center justify-between">
      <div className="text-slate-600 text-sm flex items-center flex-wrap gap-1.5">
        <span>{t("search.found_total")}</span>
        <span className="font-bold text-blue-600">
          {totalFound !== grandTotal ? `${totalFound} / ${grandTotal}` : totalFound}
        </span>
        <span>{t("search.items")}</span>
        {totalFound > 0 && (
          <span className="text-slate-400 ml-1">
            ({t("search.displaying")} {startIndex + 1}-
            {Math.min(endIndex, totalFound)})
          </span>
        )}
      </div>
    </div>
  );
}
