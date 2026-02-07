"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface LoadingStateProps {
  loadingText?: string;
}

export function LoadingState({ loadingText }: LoadingStateProps) {
  const { t } = useLanguage();
  const displayLoadingText = loadingText || t("smart_match.loading_analyzing");

  return (
    <div className="text-center py-12 animate-pulse flex-1 flex flex-col justify-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <div className="text-blue-600 text-lg font-medium">
        {displayLoadingText}
      </div>
      <p className="text-sm text-slate-500 mt-2">
        {t("smart_match.loading_subtext")}
      </p>
    </div>
  );
}
