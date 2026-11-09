"use client";

import { Building2 } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AreaProjectsCarousel } from "@/components/public/AreaProjectsCarousel";
import { getProjectDetailString } from "./project-detail-i18n";

interface RelatedProjectsSectionProps {
  projects: any[];
  language?: string;
}

export function RelatedProjectsSection({
  projects,
  language: propLanguage,
}: RelatedProjectsSectionProps) {
  const { language: contextLang } = useLanguage();
  const language = contextLang || propLanguage || "th";

  if (!projects || projects.length === 0) return null;

  return (
    <div className="max-w-screen-2xl mx-auto px-5 md:px-8 pb-8">
      <section className="space-y-6 pt-10 border-t border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
            {getProjectDetailString("related_projects", language)}
          </h2>
        </div>
        <AreaProjectsCarousel
          projects={projects}
          language={language}
        />
      </section>
    </div>
  );
}
