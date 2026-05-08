"use client";

import { Building2, Users2, Trophy, Headset } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";

import { m, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  // Extract number and suffix (e.g., "500+" -> 500, "+")
  const numericValue = parseInt(value.replace(/[^0-9]/g, "")) || 0;
  const suffix = value.replace(/[0-9]/g, "");
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(numericValue);
    }
  }, [isInView, motionValue, numericValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat().format(Math.floor(latest)) + suffix;
      }
    });
  }, [springValue, suffix]);

  return <span ref={ref}>{isFinite(numericValue) ? "0" + suffix : value}</span>;
}

export function StatsBand() {
  const { t } = useLanguage();
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;
  
  const stats = [
    {
      icon: <Building2 className="w-6 h-6" />,
      value: "500+",
      label: t("home.stats.properties_label"),
      subLabel: t("home.stats.properties_sub"),
    },
    {
      icon: <Users2 className="w-6 h-6" />,
      value: "1200+",
      label: t("home.stats.customers_label"),
      subLabel: t("home.stats.customers_sub"),
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      value: "98%",
      label: t("home.stats.satisfaction_label"),
      subLabel: t("home.stats.satisfaction_sub"),
    },
    {
      icon: <Headset className="w-6 h-6" />,
      value: "24/7",
      label: t("home.stats.support_label"),
      subLabel: t("home.stats.support_sub"),
    },
  ];

  return (
    <section className="relative py-8 md:py-10 px-4 md:px-6 lg:px-8 overflow-hidden bg-linear-to-r from-blue-500 to-purple-500">
      <div className="absolute inset-0 bg-[#0F172A] -z-20" />
      <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 -z-10 blur-3xl opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] -z-10" />

      <div className="max-w-screen-2xl mx-auto">
        <h2 className="sr-only">{t("property_listing.title")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <m.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group flex flex-col items-center text-center space-y-4"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-xl md:rounded-2xl relative overflow-hidden backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-500 shadow-xl shadow-blue-900/20 group-hover:scale-110">
                <div className="absolute inset-0 bg-linear-to-br from-white/10 to-white/5 z-0" />
                <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
                <div className="relative z-10 text-blue-200 group-hover:text-white transition-colors duration-500 [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5 lg:[&>svg]:w-6 lg:[&>svg]:h-6">
                  {stat.icon}
                </div>
              </div>

              <div className="space-y-0.5 md:space-y-1">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-normal">
                  <Counter value={stat.value} />
                </div>
                <div className="flex flex-col">
                  <span className="text-blue-100 font-medium text-xs sm:text-sm md:text-base leading-tight">
                    {stat.label}
                  </span>
                  <span className="text-white/30 text-[8px] sm:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold">
                    {stat.subLabel}
                  </span>
                </div>
              </div>

              {index !== stats.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-px h-12 bg-linear-to-b from-transparent via-white/10 to-transparent" />
              )}
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
