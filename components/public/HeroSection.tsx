"use client";

import { HeroTitle } from "@/components/public/HeroTitle";
import { SmartMatchWizard } from "@/components/public/SmartMatchWizard";
import {
  TrendingUp,
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollDownButton } from "@/components/public/ScrollDownButton";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function HeroSection() {
  const { t } = useLanguage();
  const [showSmartMatch, setShowSmartMatch] = useState(true);

  useEffect(() => {
    // Fetch setting on client side
    async function checkSetting() {
      try {
        const response = await fetch("/api/site-settings/smart-match");
        if (response.ok) {
          const data = await response.json();
          setShowSmartMatch(data.enabled);
        }
      } catch (error) {
        // Default to showing if error
        setShowSmartMatch(true);
      }
    }
    checkSetting();
  }, []);

  const handleScrollToDeposit = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("deposit-section");
    if (element) {
      const offset = 80;
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-[url('/images/hero-realestate.png')] bg-cover bg-center bg-no-repeat overflow-x-hidden">
      {/* Gradient Overlay สำหรับความคมของ text */}
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/70" />

      {/* Optional Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <section
        className="
        relative 
        z-10
        py-8 sm:py-12 md:py-16 lg:py-20 xl:py-48
        max-w-screen-2xl 
        mx-auto 
       "
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div
            className={`grid grid-cols-1 ${showSmartMatch ? "lg:grid-cols-12" : ""} gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center`}
          >
            <div
              className={`space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in-0 duration-700 slide-in-from-bottom-4 ${showSmartMatch ? "lg:col-span-8" : "max-w-4xl mx-auto text-center"}`}
            >
              <div
                className={`inline-flex items-center gap-1.5 sm:gap-2 bg-blue-50 backdrop-blur-sm text-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-blue-100 shadow-sm ${!showSmartMatch ? "mx-auto" : ""}`}
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{t("common.verified_100")}</span>
              </div>

              <HeroTitle />

              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl drop-shadow-md">
                {t("home.hot_deals.description")}
              </h2>

              <div
                className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 ${!showSmartMatch ? "justify-center" : ""}`}
              >
                <Link href="/properties">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl bg-linear-to-r from-blue-600 to-blue-500 hover:brightness-125 transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-4"
                  >
                    {t("home.hero.cta_buy")}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>

                <Button
                  onClick={handleScrollToDeposit}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl bg-white/90 hover:bg-white border-slate-200 text-slate-700 hover:text-blue-600 shadow-sm transition-all animate-in fade-in-0 duration-300 slide-in-from-bottom-4"
                >
                  {t("home.hero.cta_deposit")}
                </Button>
              </div>

              <div
                className={`flex flex-wrap gap-3 sm:gap-4 md:gap-6 pt-4 sm:pt-6 border-t border-white/10 ${!showSmartMatch ? "justify-center" : ""}`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 drop-shadow" />
                  <span className="text-xs sm:text-sm text-white/90 drop-shadow-sm">
                    {t("common.verified_100")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 drop-shadow" />
                  <span className="text-xs sm:text-sm text-white/90 drop-shadow-sm">
                    {t("common.safe_transaction")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 drop-shadow" />
                  <span className="text-xs sm:text-sm text-white/90 drop-shadow-sm">
                    {t("common.fast_response")}
                  </span>
                </div>
              </div>
            </div>

            {showSmartMatch && (
              <div className="lg:col-span-4  w-full max-w-md mx-auto lg:max-w-none relative z-20">
                <SmartMatchWizard />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Animated Scroll Indicator */}
      <ScrollDownButton />
    </div>
  );
}
