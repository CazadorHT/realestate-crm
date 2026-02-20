"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function BlogHero() {
  const { t } = useLanguage();

  const titleMain = t("blog.title_main");
  const description = t("blog.desc");
  const highlight = t("blog.title_highlight");

  const mainParts = titleMain.split("{highlight}");
  const descParts = description.split("{bold}");

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-[hsl(var(--brand-primary)/0.2)] z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
      </div>

      <div className="container mx-auto relative z-10 px-4 md:px-6 text-center text-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--brand-primary)/0.1)] border border-[hsl(var(--brand-primary)/0.2)] text-[hsl(var(--brand-primary))] text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <BookOpen className="w-3.5 h-3.5" />
          {t("blog.title_badge")}
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          {mainParts[0]}
          <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(var(--brand-primary)),hsl(var(--brand-secondary)),hsl(var(--brand-primary)))]">
            {highlight}
          </span>
          {mainParts[1]}
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          {descParts[0]}
          <span className="font-semibold text-white">{highlight}</span>
          {descParts[1]}
        </p>
      </div>
    </section>
  );
}
