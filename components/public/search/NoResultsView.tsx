"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface NoResultsViewProps {
  onClearFilters: () => void;
}

export function NoResultsView({ onClearFilters }: NoResultsViewProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
      <div className="text-slate-400 mb-4">{t("search.no_results")}</div>
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="rounded-xl border-slate-200 hover:bg-slate-50"
      >
        {t("search.clear_filters")}
      </Button>
    </div>
  );
}
