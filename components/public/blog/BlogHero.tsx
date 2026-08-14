"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface BlogHeroProps {
  translations?: {
    title_main?: string;
    desc?: string;
    title_highlight?: string;
    title_badge?: string;
  };
}

export function BlogHero({ translations: initialTranslations }: BlogHeroProps) {
  const { t } = useLanguage();

  const title_main = t("blog.title_main") || initialTranslations?.title_main || "บทความและสาระน่ารู้{highlight}";
  const desc = t("blog.desc") || initialTranslations?.desc || "รวมข่าวสารและบทความน่าสนใจเกี่ยวกับ{bold} อัปเดตล่าสุด";
  const title_highlight = t("blog.title_highlight") || initialTranslations?.title_highlight || "อสังหาริมทรัพย์";
  const title_badge = t("blog.title_badge") || initialTranslations?.title_badge || "บทความและข่าวสาร";

  const mainParts = title_main.split("{highlight}");
  const descParts = desc.split("{bold}");


  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Pattern - Optimized with next/image */}
      <div className="absolute inset-0 bg-slate-900 z-0">
        <Image
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop"
          alt="Blog Hero Background"
          fill
          priority
          className="object-cover opacity-10 mix-blend-overlay"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/50 to-transparent"></div>
      </div>

      <div className="container mx-auto relative z-10 px-4 md:px-6 text-center text-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
          <BookOpen className="w-3.5 h-3.5" />
          {title_badge}
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          {mainParts[0]}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-purple-400 to-blue-400">
            {title_highlight}
          </span>
          {mainParts[1]}
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {descParts[0]}
          <span className="font-semibold text-white">{title_highlight}</span>
          {descParts[1]}
        </p>
      </div>
    </section>
  );
}
