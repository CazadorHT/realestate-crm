"use client";

import { Button } from "@/components/ui/button";
import { Search, MessageCircle, TrendingUp, Users, Award } from "lucide-react";
import Link from "next/link";
import { SectionBackground } from "./SectionBackground";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { siteConfig } from "@/lib/site-config";

export function CTASection() {
  const { t } = useLanguage();

  // Schema.org Action for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteConfig.url}/properties?q={search_term}`,
      actionPlatform: [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform",
      ],
    },
    "query-input": "required name=search_term",
  };

  const STATS = [
    {
      icon: Users,
      label: t("home.cta.stats.users"),
      color: "text-[hsl(var(--brand-primary))]",
    },
    {
      icon: Award,
      label: t("home.cta.stats.satisfaction"),
      color: "text-[hsl(var(--brand-secondary))]",
    },
    {
      icon: TrendingUp,
      label: t("home.cta.stats.growth"),
      color: "text-green-600",
    },
  ];

  return (
    <section className="py-12 md:py-16 lg:py-24 px-4 md:px-6 lg:px-8 bg-[linear-gradient(to_br,hsl(var(--brand-gradient-from)/0.05),hsl(var(--brand-gradient-to)/0.05),hsl(var(--brand-gradient-from)/0.05))] relative overflow-hidden z-0">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Background Pattern */}
      <SectionBackground pattern="blobs" intensity="medium" />

      <div className="max-w-7xl mx-auto text-center space-y-6 md:space-y-8 relative z-10">
        {/* Trust Stats */}
        <div
          className="flex flex-wrap justify-center gap-3 md:gap-6 mb-6 md:mb-8"
          data-aos="fade-up"
        >
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-200"
            >
              <stat.icon
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${stat.color}`}
              />
              <span className="text-xs md:text-sm font-semibold text-slate-700">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <span className="text-slate-900">{t("home.hero.title_main")}</span>
          <br />
          <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(var(--brand-gradient-from)),hsl(var(--brand-gradient-to)),hsl(var(--brand-gradient-from)))]">
            {t("home.hero.title_highlight")}
          </span>
          <br />
          <span className="text-slate-900">{t("home.hero.title_sub")}</span>
        </h2>

        <p
          className="text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {t("home.hero.description")}
          <span className="font-semibold text-slate-900">
            {" "}
            {t("common.free")} {t("common.no_cost")}
          </span>
        </p>

        <div
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-2 md:pt-4"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <Link href="/properties">
            <Button
              size="lg"
              variant="default"
              className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-[linear-gradient(to_right,hsl(var(--brand-gradient-from)),hsl(var(--brand-gradient-to)))] hover:brightness-110 shadow-xl hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto text-white border border-transparent"
            >
              <Search className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              {t("common.start_search")}
            </Button>
          </Link>

          <a
            href={siteConfig.links.line}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6   hover:border-green-600 hover:bg-green-50 hover:text-green-700 transition-all w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              {t("common.contact_line")}
            </Button>
          </a>
        </div>

        {/* Small trust message */}
        <p
          className="text-xs md:text-sm text-slate-500 pt-2 md:pt-4"
          data-aos="fade-up"
        >
          {t("home.cta.trust_message")}
        </p>
      </div>
    </section>
  );
}
