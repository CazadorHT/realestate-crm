"use client";

import Link from "next/link";
import { MoveLeft, Home, Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="min-h-[70vh] mt-20 flex flex-col items-center justify-center px-4 py-20 bg-linear-to-b from-slate-50 to-white">
      <div className="relative mb-8">
        {/* Animated background element */}
        <div className="absolute -inset-4 bg-blue-100/50 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-white p-8 rounded-full shadow-xl border border-blue-50">
          <Search className="w-16 h-16 text-blue-600" />
        </div>
      </div>

      <div className="text-center max-w-lg mx-auto ">
        <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
          {t("errors.property_not_found_title")}
        </h2>
        <p className="text-slate-600 text-lg mb-10 leading-relaxed">
          {t("errors.property_not_found_desc")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="rounded-full px-8 shadow-md">
            <Link href="/properties">
              <MoveLeft className="w-4 h-4 mr-2" />
              {t("errors.back_to_properties")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              {t("errors.go_home")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Subtle bottom decoration */}
      <div className="mt-20 opacity-20 pointer-events-none select-none">
        <div className="flex gap-8 items-center text-slate-400">
          <div className="h-px w-24 bg-current" />
          <span className="font-serif italic text-2xl">Real Estate CRM</span>
          <div className="h-px w-24 bg-current" />
        </div>
      </div>
    </main>
  );
}
