import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { getProvinceName, getDistrictName, getSubdistrictName } from "@/lib/utils/provinces";

interface ProjectHeroProps {
  project: any;
  language: string;
  nameText: string;
  getString: (key: string, params?: Record<string, string | number>) => string;
}

export function ProjectHero({
  project,
  language,
  nameText,
  getString,
}: ProjectHeroProps) {
  const formatProjectCategory = (type: number, lang: string): string => {
    if (type === 1) return lang === "en" ? "Condominium" : lang === "cn" ? "公寓" : lang === "ru" ? "Кондоминиум" : "คอนโดมิเนียม";
    return lang === "en" ? "House Project" : lang === "cn" ? "住宅小区" : lang === "ru" ? "Жилой комплекс" : "โครงการบ้าน";
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-12 md:pt-32 md:pb-20 text-white bg-slate-800">
      <div 
        className="absolute inset-0 bg-cover bg-center  blur-xs brightness-60"
        style={{ backgroundImage: `url(${project.imageUrl || "/images/hero-projects.png"})` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/60 to-transparent" />

      <div className="relative max-w-screen-2xl mx-auto px-5 md:px-8 z-10">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
            <li><Link href="/" className="hover:text-white transition-colors">{getString("breadcrumb_home")}</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li><Link href="/projects" className="hover:text-white transition-colors">{getString("breadcrumb_projects")}</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li className="text-white font-medium">{nameText}</li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 uppercase">
              {formatProjectCategory(project.propertyType, language)}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {nameText}
            </h1>
            
          </div>

          {/* Quick Summary Specs */}
          <div className="flex gap-4 md:gap-6 bg-white/5 backdrop-blur-xs border border-white/10 p-4 rounded-3xl shrink-0 flex-wrap sm:flex-nowrap">
            {project.developer && (
              <div className="px-3">
                <span className="block text-[10px] uppercase font-bold text-slate-400">{getString("developer")}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{project.developer}</span>
              </div>
            )}
            {project.yearCompleted && (
              <div className="px-3 border-l border-white/10">
                <span className="block text-[10px] uppercase font-bold text-slate-400">{getString("year_completed")}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{project.yearCompleted}</span>
              </div>
            )}
            {project.totalUnits && (
              <div className="px-3 border-l border-white/10">
                <span className="block text-[10px] uppercase font-bold text-slate-400">{getString("total_units")}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{project.totalUnits}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
