import { HeroTitle } from "@/components/public/HeroTitle";
import dynamic from "next/dynamic";
import {
  Loader2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollDownButton } from "@/components/public/ScrollDownButton";
import Image from "next/image";
import { getServerTranslations } from "@/lib/i18n";
import { getSiteSettings } from "@/features/site-settings/actions";
import { siteConfig as defaultSiteConfig } from "@/lib/site-config";
import { HeroActions } from "./HeroActions";

// Client-only components that are heavy or interactive
const SmartMatchWizard = dynamic(
  () =>
    import("@/components/public/SmartMatchWizard").then(
      (mod) => mod.SmartMatchWizard,
    ),
  {
    loading: () => (
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-8 border border-slate-100 h-[450px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      </div>
    ),
  },
);

export async function HeroSection({
  hasProperties = true,
}: {
  hasProperties?: boolean;
}) {
  // ⚡️ Parallel fetch for faster TTFB
  const [translations, config] = await Promise.all([
    getServerTranslations(),
    getSiteSettings()
  ]);
  
  const { t } = translations;
  const siteName = config.site_name || defaultSiteConfig.name;
  const showSmartMatch = config.smart_match_wizard_enabled;

  // Prepare translations for Client Component
  const heroActionsT = {
    cta_deposit: t("home.hero.cta_deposit"),
    success_title: t("deposit.success.title"),
    success_message: t("deposit.success.message"),
    close: t("common.close"),
  };

  const words = (t("home.hero.words") as unknown as string[]) || [];
  const initialWord = words[0] || "";

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
      {/* Gradient Overlay */}
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
                <span className="font-semibold tracking-tight">
                  {t("common.verified_100")}
                </span>
              </div>

              <HeroTitle initialWord={initialWord} />

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

                <HeroActions t={heroActionsT} />
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
              <div className="lg:col-span-4 w-full max-w-md mx-auto lg:max-w-none relative z-20">
                {!hasProperties && (
                  <div className="absolute max-w-sm inset-0 z-50 bg-white/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50 text-center transform -translate-y-4">
                      <div className="w-12 h-12 mb-3 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                        <svg
                          className="w-6 h-6 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      </div>
                      <p className="font-semibold text-slate-800 mb-1">
                        {t("properties.not_found") || "ยังไม่ได้ลงประกาศทรัพย์"}
                      </p>
                    </div>
                  </div>
                )}
                <div
                  className={
                    !hasProperties
                      ? "opacity-60 select-none pointer-events-none transition-opacity duration-300"
                      : ""
                  }
                >
                  <SmartMatchWizard />
                </div>
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
