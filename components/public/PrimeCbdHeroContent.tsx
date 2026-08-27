"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Building2, Train, ShieldCheck, Sparkles, MapPin } from "lucide-react";
import { PopularAreaTags } from "@/components/public/PopularAreaTags";

interface PrimeCbdHeroContentProps {
  totalCount: number;
  popularAreas: any[];
  initialLanguage?: string;
}

export function PrimeCbdHeroContent({
  totalCount,
  popularAreas,
  initialLanguage,
}: PrimeCbdHeroContentProps) {
  const { language: clientLanguage, t } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-emerald-700">
          <Building2 className="h-4 w-4 text-emerald-700" />
          <span>{t("silo_landing.prime_cbd.badge1") || "Prime & New CBD Collection"}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-teal-700">
          <Train className="h-4 w-4 text-teal-700" />
          <span>{t("silo_landing.prime_cbd.badge2") || "ทำเลทองใจกลางมหานคร ติด BTS/MRT"}</span>
        </div>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
        {language === "en" ? (
          <>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600">
              Prime CBD & New CBD
            </span>{" "}
            <br className="hidden md:inline" />
            <span className="text-slate-900">Bangkok Premier Properties</span>
          </>
        ) : language === "cn" ? (
          <>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600">
              曼谷 核心CBD 与 新CBD
            </span>{" "}
            <br className="hidden md:inline" />
            <span className="text-slate-900">地标核心房产精选</span>
          </>
        ) : language === "ru" ? (
          <>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600">
              Prime CBD & New CBD
            </span>{" "}
            <br className="hidden md:inline" />
            <span className="text-slate-900">Элитная недвижимость</span>
          </>
        ) : (
          <>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600">
              Prime CBD & New CBD
            </span>{" "}
            <br className="hidden md:inline" />
            <span className="text-slate-900">อสังหาฯ ใจกลางย่านธุรกิจ</span>
          </>
        )}
      </h1>

      <p className="text-base text-slate-500 md:text-lg leading-relaxed font-medium">
        {t("silo_landing.prime_cbd.description") || "สัมผัสชีวิตเหนือระดับใจกลางกรุงเทพมหานคร รวมคอนโดมิเนียมระดับลักชัวรี่ บ้านเดี่ยว และออฟฟิศทำเลทองย่าน CBD & New CBD ครอบคลุม สุขุมวิท, สาทร, สีลม, ทองหล่อ, พร้อมพงษ์, และพระราม 9 เดินทางสะดวกสบายติดสถานีรถไฟฟ้า BTS/MRT ตอบโจทย์การอยู่อาศัยและการลงทุนที่คุ้มค่าที่สุด"}{" "}
        <span className="text-emerald-700 font-bold whitespace-nowrap">
          {language === "en"
            ? `(We found ${totalCount} CBD properties available)`
            : language === "cn"
            ? `(共找到 ${totalCount} 套CBD核心地标房源)`
            : language === "ru"
            ? `(Найдено ${totalCount} объектов в CBD районах)`
            : `(พบทรัพย์ย่าน CBD ว่างทั้งหมดกว่า ${totalCount} รายการ)`}
        </span>
      </p>

      <div className="flex flex-wrap gap-4 pt-2">
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>{t("silo_landing.prime_cbd.feature1") || "ทำเล CBD ศูนย์กลางธุรกิจ & ช้อปปิ้งมอลล์"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs">
          <Sparkles className="h-4 w-4 text-teal-600" />
          <span>{t("silo_landing.prime_cbd.feature2") || "ติดรถไฟฟ้า BTS/MRT เดินทางสะดวกสบาย"}</span>
        </div>
      </div>

      {/* Popular CBD Areas Quick Links */}
      <PopularAreaTags
        popularAreas={popularAreas}
        language={language}
        basePath="/properties/prime-cbd"
        targetId="cbd-properties-list"
        themeColor="emerald"
      />
    </div>
  );
}
