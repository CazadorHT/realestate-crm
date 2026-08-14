"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Star, Compass, ShieldCheck } from "lucide-react";
import { PopularAreaTags } from "@/components/public/PopularAreaTags";

interface LuxuryVillaHeroContentProps {
  totalCount: number;
  popularAreas: any[];
  initialLanguage?: string;
}

export function LuxuryVillaHeroContent({
  totalCount,
  popularAreas,
  initialLanguage,
}: LuxuryVillaHeroContentProps) {
  const { language: clientLanguage, t } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400">
          <Star className="h-3.5 w-3.5 fill-amber-400" />
          <span>{t("silo_landing.luxury_villa.badge1")}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300">
          <span>{t("silo_landing.luxury_villa.badge2")}</span>
        </div>
      </div>

      <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
        {t("silo_landing.luxury_villa.title_line1")}{" "}
        <br className="hidden md:inline" />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500">
          {t("silo_landing.luxury_villa.title_line2")}
        </span>
      </h1>

      <p className="text-base text-slate-300 md:text-lg leading-relaxed font-medium">
        {t("silo_landing.luxury_villa.description")}{" "}
        <span className="text-amber-400 font-bold whitespace-nowrap">
          {language === "en"
            ? `(We found ${totalCount} luxury villas available)`
            : language === "cn"
            ? `(共找到 ${totalCount} 套豪华别墅)`
            : language === "ru"
            ? `(Найдено ${totalCount} роскошных вилл)`
            : `(พบวิลล่าหรูว่างทั้งหมดกว่า ${totalCount} รายการ)`}
        </span>
      </p>

      <div className="flex flex-wrap gap-4 pt-2">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-2 text-sm font-medium text-amber-400 shadow-lg">
          <Compass className="h-4 w-4 text-amber-400" />
          <span>{t("silo_landing.luxury_villa.feature1")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-2 text-sm font-medium text-slate-300 shadow-lg">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>{t("silo_landing.luxury_villa.feature2")}</span>
        </div>
      </div>

      {/* Popular Areas Quick Links */}
      <PopularAreaTags
        popularAreas={popularAreas}
        language={language}
        basePath="/properties/luxury-villa"
        targetId="villas-list"
        themeColor="violet"
        isDark={true}
      />
    </div>
  );
}
