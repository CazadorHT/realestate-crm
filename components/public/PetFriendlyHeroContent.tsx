"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { PopularAreaTags } from "@/components/public/PopularAreaTags";

interface PetFriendlyHeroContentProps {
  totalCount: number;
  popularAreas: any[];
  initialLanguage?: string;
}

export function PetFriendlyHeroContent({
  totalCount,
  popularAreas,
  initialLanguage,
}: PetFriendlyHeroContentProps) {
  const { language: clientLanguage, t } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-4 py-1.5 text-xs sm:text-base font-bold text-orange-700">
        <Heart className="h-3.5 w-3.5 fill-orange-700" />
        <span>{t("silo_landing.pet_friendly.badge")}</span>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
        {t("silo_landing.pet_friendly.title_line1")}{" "}
        <br className="hidden md:inline" />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-600 to-amber-600">
          {t("silo_landing.pet_friendly.title_line2")}
        </span>
      </h1>

      <p className="text-base text-slate-600 md:text-lg leading-relaxed font-medium">
        {t("silo_landing.pet_friendly.description")}{" "}
        <span className="text-orange-600 font-bold whitespace-nowrap">
          {language === "en"
            ? `(We found ${totalCount} pet-friendly properties available)`
            : language === "cn"
            ? `(共找到 ${totalCount} 套允许养宠物的优质房源)`
            : language === "ru"
            ? `(Найдено ${totalCount} объектов, разрешенных для животных)`
            : `(พบที่อยู่อาศัยเลี้ยงสัตว์ได้ว่างทั้งหมดกว่า ${totalCount} รายการ)`}
        </span>
      </p>

      <div className="flex flex-wrap gap-4 pt-2">
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>{t("silo_landing.pet_friendly.feature1")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span>{t("silo_landing.pet_friendly.feature2")}</span>
        </div>
      </div>

      {/* Popular Areas Quick Links */}
      <PopularAreaTags
        popularAreas={popularAreas}
        language={language}
        basePath="/properties/pet-friendly-condo"
        targetId="pet-condos-list"
        themeColor="orange"
      />
    </div>
  );
}
