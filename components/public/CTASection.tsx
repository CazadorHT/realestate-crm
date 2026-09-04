"use client";

import { Button } from "@/components/ui/button";
import { Search, MessageCircle, TrendingUp, Users, Award } from "lucide-react";
import Link from "next/link";
import { SectionBackground } from "./SectionBackground";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState, useEffect } from "react";

import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import { m } from "framer-motion";

export function CTASection() {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const settings = useSiteConfig();
  useEffect(() => setIsMounted(true), []);

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
      color: "text-blue-600",
    },
    {
      icon: Award,
      label: t("home.cta.stats.satisfaction"),
      color: "text-purple-600",
    },
    {
      icon: TrendingUp,
      label: t("home.cta.stats.growth"),
      color: "text-green-600",
    },
  ];

  return (
    <section className="py-12 md:py-16 lg:py-24 px-4 md:px-6 lg:px-8 bg-linear-to-br from-blue-50 via-purple-50 to-blue-50 relative overflow-hidden z-0">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Background Pattern */}
      <SectionBackground pattern="blobs" intensity="medium" />

      <div className="max-w-7xl mx-auto text-center space-y-6 md:space-y-8 relative z-10">
        {/* Trust Stats */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 md:gap-6 mb-6 md:mb-8"
        >
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/90 rounded-full shadow-xs border border-slate-200"
            >
              <stat.icon
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${stat.color}`}
              />
              <span className="text-xs md:text-sm font-semibold text-slate-700">
                {stat.label}
              </span>
            </div>
          ))}
        </m.div>

        <m.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
        >
          <span className="text-slate-900">{t("home.hero.title_main")}</span>
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-blue-600">
            {t("home.hero.title_highlight")}
          </span>
          <br />
          <span className="text-slate-900">{t("home.hero.title_sub")}</span>
        </m.h2>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto"
        >
          {t("home.hero.description")}
          <span className="font-semibold text-slate-900">
            {" "}
            {t("common.free")} {t("common.no_cost")}
          </span>
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-2 md:pt-4"
        >
          <Link href="/properties">
            <Button
              size="lg"
              variant="outline"
              className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-blue-600 shadow-xl hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto"
            >
              <Search className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              {t("common.start_search")}
            </Button>
          </Link>

          <a
            href={settings.line_url || siteConfig.links.line}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 hover:border-green-700 hover:bg-green-600 hover:text-white  text-green-700  border-green-700 transition-all w-full sm:w-auto shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              {t("common.contact_line")}
            </Button>
          </a>
        </m.div>

        {/* Small trust message */}
        <m.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs md:text-sm text-slate-500 pt-2 md:pt-4"
        >
          {t("home.cta.trust_message")}
        </m.p>
      </div>
    </section>
  );
}
