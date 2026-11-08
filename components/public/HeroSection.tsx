import { HeroTitle } from "@/components/public/HeroTitle";
import {
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
import { HeroLeftContent } from "./HeroLeftContent";


import { HeroRightWidget } from "./HeroRightWidget";

export async function HeroSection({
  hasProperties = true,
  locale,
}: {
  hasProperties?: boolean;
  locale?: string;
}) {
  // ⚡️ Parallel fetch for faster TTFB
  const [translations, config] = await Promise.all([
    getServerTranslations(locale || "th"),
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
        src="/images/hero-realestate.webp"
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
            <HeroLeftContent
              initialWord={initialWord}
              initialDescription={t("home.hot_deals.description")}
              showSmartMatch={showSmartMatch}
            />

            {showSmartMatch && (
              <div className="lg:col-span-4 w-full max-w-md mx-auto lg:max-w-none relative z-20">
                <HeroRightWidget hasProperties={hasProperties} />
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
