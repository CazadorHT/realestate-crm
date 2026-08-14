"use client";

import { CheckCircle2, Shield, Clock, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { HeroTitle } from "./HeroTitle";
import { HeroActions } from "./HeroActions";

interface HeroLeftContentProps {
  initialWord?: string;
  initialDescription?: string;
  showSmartMatch?: boolean;
}

export function HeroLeftContent({
  initialWord,
  initialDescription,
  showSmartMatch,
}: HeroLeftContentProps) {
  const { t } = useLanguage();

  return (
    <div
      className={`space-y-4 sm:space-y-5 md:space-y-6 flex flex-col items-center md:items-center lg:items-start text-center md:text-center lg:text-left ${
        showSmartMatch ? "lg:col-span-8" : "w-full mx-auto"
      }`}
    >
      {/* Premium Glass Badge */}
      <div
        className={`inline-flex items-center gap-2 sm:gap-2.5 bg-white/10 backdrop-blur-md text-white/80 px-3 sm:px-5 md:px-5 py-1.5 md:py-2 rounded-full text-xs sm:text-sm md:text-base font-semibold border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-200 hover:text-white hover:bg-white/20 ${
          !showSmartMatch ? "mx-auto" : "md:mx-0"
        }`}
      >
        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-400" />
        <span className="font-semibold tracking-tight">
          {t("common.verified_100") || "ตรวจสอบแล้ว 100%"}
        </span>
      </div>

      <HeroTitle initialWord={initialWord} />

      <h2 className="text-sm sm:text-base font-light md:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl drop-shadow-md mx-auto md:mx-0">
        {t("home.hot_deals.description") || initialDescription}
      </h2>

      <div
        className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 justify-center md:justify-center lg:justify-start w-full ${
          !showSmartMatch ? "justify-center " : ""
        }`}
      >
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto md:w-auto h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl bg-linear-to-r from-blue-600 to-blue-500 hover:brightness-110 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2 text-white"
        >
          <Link href="/properties">
            {t("home.hero.cta_buy") || "ค้นหาทรัพย์"}
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 hidden sm:block" />
          </Link>
        </Button>

        <HeroActions />
      </div>

      <div
        className={`flex flex-wrap gap-3 sm:gap-4 md:gap-6 pt-4 sm:pt-6 border-t border-white/10 justify-center md:justify-start ${
          !showSmartMatch ? "justify-center" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 drop-shadow" />
          <span className="text-xs sm:text-sm text-white/90 drop-shadow-sm">
            {t("common.verified_100") || "ตรวจสอบแล้ว 100%"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 drop-shadow" />
          <span className="text-xs sm:text-sm text-white/90 drop-shadow-sm">
            {t("common.safe_transaction") || "ธุรกรรมปลอดภัย"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 drop-shadow" />
          <span className="text-xs sm:text-sm text-white/90 drop-shadow-sm">
            {t("common.fast_response") || "ตอบกลับไวภายใน 24 ชม."}
          </span>
        </div>
      </div>
    </div>
  );
}
