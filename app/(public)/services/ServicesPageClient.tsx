"use client";

import { Suspense } from "react";
import { getServices, type ServiceRow } from "@/features/services/actions";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Home,
  TrendingUp,
  Search,
  MessageCircle,
  ShieldCheck,
  Building2,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState, useEffect } from "react";
import { SectionBackground } from "@/components/public/SectionBackground";

function ServicesContent() {
  const { t } = useLanguage();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServices().then((data) => {
      setServices(data || []);
      setLoading(false);
    });
  }, []);

  const CORE_SERVICES = [
    {
      id: "buy",
      title: t("services.buy.title"),
      desc: t("services.buy.desc"),
      icon: Home,
      color: "text-[hsl(var(--brand-primary))]",
      bgColor: "bg-[var(--brand-primary-50)]",
    },
    {
      id: "sell",
      title: t("services.sell.title"),
      desc: t("services.sell.desc"),
      icon: TrendingUp,
      color: "text-[hsl(var(--brand-primary))]",
      bgColor: "bg-[var(--brand-primary-50)]",
    },
    {
      id: "rent",
      title: t("services.rent.title"),
      desc: t("services.rent.desc"),
      icon: Key,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      id: "consulting",
      title: t("services.consulting.title"),
      desc: t("services.consulting.desc"),
      icon: Building2,
      color: "text-[hsl(var(--brand-primary))]",
      bgColor: "bg-[var(--brand-primary-50)]",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900 border-b border-white/5">
        {/* Background blobs for premium feel */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-[hsl(var(--brand-primary)/0.2)] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-[hsl(var(--brand-secondary)/0.1)] rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/90 text-sm mb-8 border border-white/10 backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold tracking-wide uppercase text-[11px]">
              {t("services.title_badge")}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1] animate-in fade-in-0 gap-2 slide-in-from-bottom-6 duration-1000">
            <span className="block">
              {t("services.hero_title").split(" ")[0]}
            </span>
            <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(var(--brand-primary)),hsl(var(--brand-secondary)),hsl(var(--brand-primary)))]">
              {t("services.hero_title").split(" ").slice(1).join(" ")}
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
            {t("services.hero_desc")}
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-in fade-in-0 zoom-in-95 duration-1000 delay-300">
            <Button
              size="lg"
              className="rounded-2xl h-14 px-8 bg-[hsl(var(--brand-primary))] hover:brightness-110 text-white shadow-xl shadow-[hsl(var(--brand-primary)/0.2)] border-none transition-all hover:scale-105"
            >
              {t("common.start_search")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl h-14 px-8 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              {t("contact.title")}
            </Button>
          </div>
        </div>
      </section>

      {/* Structured Core Services */}
      <section className="py-24 relative bg-white">
        <SectionBackground pattern="blobs" intensity="low" />
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {CORE_SERVICES.map((service, idx) => (
              <div
                key={service.id}
                className="group p-8 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-[hsl(var(--brand-primary)/0.2)] transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-12"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div
                  className={`w-14 h-14 ${service.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                >
                  <service.icon className={`h-7 w-7 ${service.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-light">
                  {service.desc}
                </p>
                <div className="h-1 w-8 bg-slate-100 group-hover:w-16 group-hover:bg-[hsl(var(--brand-primary))] transition-all duration-500 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Services from DB */}
      {services.length > 0 && (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  {t("common.more")} {t("services.title_badge")}
                </h2>
                <p className="text-slate-500 max-w-xl font-light">
                  {t("services.hero_desc").substring(0, 100)}...
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {services.map((service) => (
                <Link
                  href={`/services/${service.slug}`}
                  key={service.id}
                  className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 flex flex-col h-full border border-slate-100"
                >
                  <div className="aspect-16/10  bg-slate-100 relative overflow-hidden">
                    {service.cover_image ? (
                      <img
                        src={service.cover_image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                        <Sparkles className="h-12 w-12 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h4 className="text-2xl font-bold text-white mb-2 shadow-black/50 drop-shadow-md">
                        {service.title}
                      </h4>
                      {service.price_range && (
                        <span className="inline-block px-3 py-1 rounded-full bg-[hsl(var(--brand-primary)/0.2)] backdrop-blur-sm text-yellow-300 border border-white/10 text-xs font-semibold">
                          {service.price_range}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <p className="text-slate-600 line-clamp-2 mb-8 flex-1 text-sm leading-relaxed font-light">
                      {service.description ||
                        "Learn more about our premium service offerings tailored for your success."}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[hsl(var(--brand-primary))] font-bold group-hover:gap-2 transition-all">
                        {t("services.view_details")}
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                      <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-[hsl(var(--brand-primary))] transition-colors">
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust & Consultation Section */}
      <section className="py-24 relative overflow-hidden">
        <SectionBackground pattern="grid" intensity="low" />
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-16 lg:p-20 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[hsl(var(--brand-primary))] rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[hsl(var(--brand-secondary))] rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] text-xs font-bold border border-[hsl(var(--brand-primary)/0.2)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>CERTIFIED PROFESSIONALS</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  {t("contact.sidebar_quick_title")}
                </h2>
                <p className="text-slate-400 text-lg font-light leading-relaxed">
                  {t("contact.sidebar_quick_desc2")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                <a
                  href={siteConfig.links.line}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-2xl h-16 px-10 bg-green-600 hover:bg-green-700 text-white border-none shadow-xl shadow-green-900/20"
                  >
                    <MessageCircle className="h-5 w-5 mr-3" />
                    {t("contact.sidebar_line_button")}
                  </Button>
                </a>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto rounded-2xl h-16 px-10 border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                  >
                    {t("contact.title_badge")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ServicesPageClient() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--brand-primary))]" />
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
