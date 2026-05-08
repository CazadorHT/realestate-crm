"use client";

import { HeroTitle } from "@/components/public/HeroTitle";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
const SmartMatchWizard = dynamic(
  () => import("@/components/public/SmartMatchWizard").then((mod) => mod.SmartMatchWizard),
  { 
    loading: () => (
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-8 border border-slate-100 h-[450px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      </div>
    )
  }
);
import {
  TrendingUp,
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollDownButton } from "@/components/public/ScrollDownButton";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Image from "next/image";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DepositWizard } from "@/components/public/deposit/DepositWizard";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

export function HeroSection() {
  const { t } = useLanguage();
  const settings = useSiteConfig();
  const showSmartMatch = settings.smart_match_wizard_enabled;
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isDepositSuccess, setIsDepositSuccess] = useState(false);

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
    <div className="relative min-h-screen bg-slate-900 overflow-x-hidden">
      <Image
        src="/images/hero-realestate.png"
        alt="Hero Background"
        fill
        priority
        // @ts-ignore
        fetchPriority="high"
        sizes="(max-width: 640px) 750px, (max-width: 768px) 1024px, (max-width: 1536px) 1440px, 1920px"
        className="object-cover"
        quality={40} // Optimized for mobile TBT/LCP
      />
      {/* Gradient Overlay สำหรับความคมของ text */}
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/50 to-black/50" />

      {/* Optional Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <section
        className="
        relative 
        z-10
        py-28 sm:py-32 md:py-32 lg:py-48 xl:py-48
        max-w-screen-2xl 
        mx-auto 
       "
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div
            className={`grid grid-cols-1 ${showSmartMatch ? "lg:grid-cols-12" : ""} gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center`}
          >
            <div
              className={`space-y-4 sm:space-y-5 md:space-y-6 flex flex-col items-center md:items-center lg:items-start text-center md:text-center lg:text-left ${showSmartMatch ? "lg:col-span-8" : "w-full mx-auto"}`}
            >
              {/* Premium Glass Badge */}
              <div
                className={`inline-flex items-center gap-2 sm:gap-2.5 bg-white/10 backdrop-blur-md text-white/80 px-3 sm:px-5 md:px-5 py-1.5 md:py-2 rounded-full text-xs sm:text-sm md:text-base font-semibold border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-200 hover:text-white hover:bg-white/20 ${!showSmartMatch ? "mx-auto" : "md:mx-0"}`}
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-400" />
                <span className="font-semibold tracking-tight">{t("common.verified_100")}</span>
              </div>

              <HeroTitle />

              <h2 className="text-sm sm:text-base font-light md:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl drop-shadow-md mx-auto md:mx-0">
                {t("home.hot_deals.description")}
              </h2>

              <div
                className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 justify-center md:justify-center lg:justify-start w-full ${!showSmartMatch ? "justify-center " : ""}`}
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto md:w-auto h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl bg-linear-to-r from-blue-600 to-blue-500 hover:brightness-110 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2 text-white"
                >
                  <Link href="/properties">
                    {t("home.hero.cta_buy")}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 hidden sm:block" />
                  </Link>
                </Button>

                <ResponsiveDialog
                  open={isDepositOpen}
                  onOpenChange={(open) => {
                    setIsDepositOpen(open);
                    if (!open) setIsDepositSuccess(false);
                  }}
                  trigger={
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto md:w-auto h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl bg-white/90 hover:bg-white! border-slate-200 text-slate-700 hover:text-blue-600! shadow-sm transition-all animate-in fade-in-0 duration-200 slide-in-from-bottom-2"
                    >
                      {t("home.hero.cta_deposit")}
                    </Button>
                  }
                  className="sm:max-w-[720px]  p-0 border-0 gap-0 rounded-3xl"
                >
                  {isDepositSuccess ? (
                    <div className="text-center py-20 px-6 space-y-8 animate-in fade-in zoom-in duration-500">
                      <div className="w-24 h-24 bg-linear-to-br from-green-50 to-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle className="h-12 w-12" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                          {t("deposit.success.title")}
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg max-w-sm mx-auto">
                          {t("deposit.success.message")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDepositSuccess(false);
                          setIsDepositOpen(false);
                        }}
                        className="mt-6 border-slate-200 hover:bg-slate-50 rounded-2xl px-12 py-7 text-base font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        {t("common.close")}
                      </Button>
                    </div>
                  ) : (
                    <DepositWizard
                      onSuccessAction={() => setIsDepositSuccess(true)}
                      onCancelAction={() => setIsDepositOpen(false)}
                      location="Hero Section"
                    />
                  )}
                </ResponsiveDialog>
              </div>

              <div
                className={`flex flex-wrap gap-3 sm:gap-4 md:gap-6 pt-4 sm:pt-6 border-t border-white/10 justify-center md:justify-start ${!showSmartMatch ? "justify-center" : ""}`}
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
