"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface SearchResultsHeaderProps {
  totalFound: number;
  startIndex: number;
  endIndex: number;
}

export function SearchResultsHeader({
  totalFound,
  startIndex,
  endIndex,
}: SearchResultsHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-8 md:mb-10 flex items-center justify-between">
      <div className="text-slate-600 text-sm">
        {t("search.found_total")}{" "}
        <span className="font-bold text-blue-600">{totalFound}</span>{" "}
        {t("search.items")}
        {totalFound > 0 && (
          <span className="text-slate-400 ml-2">
            ({t("search.displaying")} {startIndex + 1}-
            {Math.min(endIndex, totalFound)})
          </span>
        )}
      </div>
    </div>
  );
}
