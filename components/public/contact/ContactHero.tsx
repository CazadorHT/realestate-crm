"use client";

import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ContactHero() {
  const { t } = useLanguage();
  return (
    <section className="relative bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20 md:py-28 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 shadow-lg border border-white/20">
            <MessageSquare className="w-8 h-8 text-blue-50" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            {t("contact.hero_title")}
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            {t("contact.hero_desc")}
          </p>
        </div>
      </div>
    </section>
  );
}
