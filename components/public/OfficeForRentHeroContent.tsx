"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Briefcase, Building, Sparkles } from "lucide-react";
import { PopularAreaTags } from "@/components/public/PopularAreaTags";

interface OfficeForRentHeroContentProps {
  totalCount: number;
  popularAreas: any[];
  initialLanguage?: string;
}

export function OfficeForRentHeroContent({
  totalCount,
  popularAreas,
  initialLanguage,
}: OfficeForRentHeroContentProps) {
  const { language: clientLanguage, t } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-4 py-1.5 text-sm font-medium text-blue-800">
          <Briefcase className="h-3.5 w-3.5 text-blue-700" />
          <span>{t("silo_landing.office_for_rent.badge1")}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-4 py-1.5 text-sm font-medium text-emerald-800">
          <span>{t("silo_landing.office_for_rent.badge2")}</span>
        </div>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
        {t("silo_landing.office_for_rent.title_line1")}{" "}
        <br className="hidden md:inline" />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-indigo-700">
          {t("silo_landing.office_for_rent.title_line2")}
        </span>
      </h1>

      <p className="text-base text-slate-600 md:text-lg leading-relaxed font-medium">
        {t("silo_landing.office_for_rent.description")}{" "}
        <span className="text-blue-700 font-semibold whitespace-nowrap">
          {language === "en"
            ? `(We found ${totalCount} premium spaces available)`
            : language === "cn"
            ? `(共找到 ${totalCount} 间办公室出租)`
            : language === "ru"
            ? `(Найдено ${totalCount} офисных помещений в аренду)`
            : `(พบพื้นที่เช่าว่างทั้งหมดกว่า ${totalCount} รายการ)`}
        </span>
      </p>

      <div className="flex flex-wrap gap-4 pt-2">
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
          <Building className="h-4 w-4 text-indigo-600" />
          <span>{t("silo_landing.office_for_rent.feature1")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>{t("silo_landing.office_for_rent.feature2")}</span>
        </div>
      </div>

      {/* Popular Areas Quick Links */}
      <PopularAreaTags
        popularAreas={popularAreas}
        language={language}
        basePath="/properties/office-for-rent"
        targetId="offices-list"
        themeColor="blue"
      />
    </div>
  );
}
