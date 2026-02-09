"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function CompareEmptyState() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-slate-200 text-center animate-in fade-in zoom-in duration-500 shadow-sm">
      <div className="h-16 w-16 md:h-24 md:w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4 md:mb-6">
        <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-slate-400" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
        {t("compare_page.empty_title")}
      </h2>
      <p
        className="text-sm md:text-base text-slate-500 max-w-md mb-6 md:mb-8"
        dangerouslySetInnerHTML={{ __html: t("compare_page.empty_desc") }}
      />
      <Button
        size="lg"
        className="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:translaty-y-1 transition-all text-sm md:text-base"
        asChild
      >
        <Link href="/properties">{t("compare_page.go_search")}</Link>
      </Button>
    </div>
  );
}
