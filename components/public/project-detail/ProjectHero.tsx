"use client";

import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { getLangPrefix } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { parseBilingualProjectName } from "@/lib/utils/project-name-utils";
import { getProjectDetailString } from "./project-detail-i18n";

interface ProjectHeroProps {
  project: any;
  language?: string;
  nameText?: string;
}

export function ProjectHero({
  project,
  language: propLanguage,
  nameText: propNameText,
}: ProjectHeroProps) {
  const { language: contextLang, langPrefix: contextLangPrefix } = useLanguage();
  const language = contextLang || propLanguage || "th";
  const langPrefix = contextLangPrefix ?? getLangPrefix(language);

  const rawTh = typeof project?.name === "object" ? project.name?.th : project?.name;
  const rawEn = typeof project?.name === "object" ? project.name?.en : undefined;
  const bilingual = parseBilingualProjectName(rawTh || propNameText, rawEn);

  const fallbackName = typeof propNameText === "string" ? propNameText : (typeof rawTh === "string" ? rawTh : "");
  const primaryName =
    language === "th"
      ? bilingual.cleanTh || bilingual.cleanEn || fallbackName
      : bilingual.cleanEn || bilingual.cleanTh || fallbackName;

  const formatProjectCategory = (type: number, lang: string): string => {
    if (type === 1) {
      return lang === "en" ? "Condominium" : lang === "cn" ? "公寓" : lang === "ru" ? "Кондоминиум" : "คอนโดมิเนียม";
    }
    return lang === "en" ? "House Project" : lang === "cn" ? "住宅小区" : lang === "ru" ? "Жилой комплекс" : "โครงการบ้าน";
  };

  const resolveString = (key: string) => {
    return getProjectDetailString(key, language);
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-12 md:pt-32 md:pb-20 text-white bg-slate-800">
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xs brightness-60"
        style={{ backgroundImage: `url(${project.imageUrl || "/images/hero-projects.png"})` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/60 to-transparent" />

      <div className="relative max-w-screen-2xl mx-auto px-5 md:px-8 z-10">
        {/* Breadcrumbs (Desktop lg+) & Back Button (Mobile < lg) */}
        <nav aria-label="breadcrumb" className="mb-6">
          <ol className="hidden lg:flex items-center gap-2 text-sm text-slate-300 flex-wrap">
            <li><Link href={langPrefix || "/"} className="hover:text-white transition-colors">{resolveString("breadcrumb_home")}</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li><Link href={`${langPrefix}/projects`} className="hover:text-white transition-colors">{resolveString("breadcrumb_projects")}</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li className="text-white font-medium">{primaryName}</li>
          </ol>
          <div className="block lg:hidden">
            <Link
              href={`${langPrefix}/projects`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/20 shadow-2xs active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{resolveString("breadcrumb_projects")}</span>
            </Link>
          </div>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 uppercase">
              {formatProjectCategory(project.propertyType, language)}
            </span>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {primaryName}
              </h1>
              {language === "th" && bilingual.hasEnglishLine && bilingual.cleanEn && (
                <p className="text-lg md:text-2xl font-medium text-slate-300 tracking-normal">
                  {bilingual.cleanEn}
                </p>
              )}
            </div>
          </div>

          {/* Quick Summary Specs */}
          <div className="flex gap-4 md:gap-6 bg-white/10 border border-white/15 p-4 rounded-3xl shrink-0 flex-wrap sm:flex-nowrap">
            {project.developer && (
              <div className="px-3">
                <span className="block text-[10px] uppercase font-bold text-slate-400">{resolveString("developer")}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{project.developer}</span>
              </div>
            )}
            {project.yearCompleted && (
              <div className="px-3 border-l border-white/10">
                <span className="block text-[10px] uppercase font-bold text-slate-400">{resolveString("year_completed")}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{project.yearCompleted}</span>
              </div>
            )}
            {project.totalUnits && (
              <div className="px-3 border-l border-white/10">
                <span className="block text-[10px] uppercase font-bold text-slate-400">{resolveString("total_units")}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{project.totalUnits}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
