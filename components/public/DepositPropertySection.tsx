"use client";

import { useState } from "react";
import { Home, Key, CheckCircle, User, Phone, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import { DepositWizard } from "./deposit/DepositWizard";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
export function DepositPropertySection({ className }: { className?: string }) {
  const { t } = useLanguage();
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Schema.org Service for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: siteName,
    description: t("deposit.description"),
    provider: {
      "@type": "RealEstateAgent",
      name: siteName,
    },
    areaServed: "Thailand",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteConfig.url}/#deposit-section`,
    },
  };

  return (
    <section
      id="deposit-section"
      className="py-20 md:py-32 lg:py-40 px-4 md:px-6 lg:px-8 relative overflow-hidden z-0"
    >
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Modern Mesh Gradient Background */}
      <div className="absolute inset-0 bg-slate-50/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)]" />
      
      {/* Dynamic Blurs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/images/grid.svg')] bg-center mask-[radial-gradient(white,transparent_85%)] opacity-[0.03] pointer-events-none" />

      {/* Subtle Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div
          className="text-center space-y-4 md:space-y-6 mb-12 md:mb-20"
          data-aos="fade-up"
        >
          <div className="inline-flex items-center rounded-full border border-blue-200/60 bg-white/80 backdrop-blur-sm px-4 py-2 text-[11px] md:text-sm font-bold uppercase tracking-widest shadow-sm">
            <Key className="mr-2 h-3.5 w-3.5 text-blue-600" />
            <span className="text-blue-600">
              {t("deposit.title")}
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 max-w-4xl mx-auto">
            {t("deposit.subtitle")
              .split(" ")
              .map((word: string, i: number) => (
                <span
                  key={i}
                  className={
                    i >= 2
                      ? "text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600"
                      : "inline-block"
                  }
                >
                  {word}{" "}
                </span>
              ))}
          </h2>

          <p className="text-base md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium opacity-80">
            {t("deposit.description")}
          </p>
        </div>

        {/* Steps Row */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-8 mb-8 md:mb-16"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          {[
            { step: 1, text: t("deposit.step1"), icon: User, color: "blue" },
            { step: 2, text: t("deposit.step2"), icon: Phone, color: "indigo" },
            {
              step: 3,
              text: t("deposit.step3"),
              icon: CheckCircle,
              color: "emerald",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    item.color === "blue" && "bg-blue-100 text-blue-600",
                    item.color === "indigo" && "bg-indigo-100 text-indigo-600",
                    item.color === "emerald" &&
                      "bg-emerald-100 text-emerald-600",
                  )}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {t("common.step")} {item.step}
                  </div>
                  <p className="text-base font-semibold text-slate-800 leading-snug">
                    {item.text.replace(/^\d\.\s*/, "")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <div
          className="relative max-w-xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-600 rounded-3xl blur-xl opacity-20 scale-[1.02]" />
          <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100 text-center space-y-5">
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-200">
              <Home className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1.5">
                {t("deposit.form.submit_btn")}
              </h3>
              <p className="text-slate-500 text-sm md:text-base">
                {t("deposit.form.required_note")}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-700">
                <CheckCircle className="w-3.5 h-3.5" />
                {t("common.no_cost")}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full text-xs font-semibold text-blue-700">
                <CheckCircle className="w-3.5 h-3.5" />
                {t("common.professional_team")}
              </div>
            </div>

            <ResponsiveDialog
              open={isOpen}
              onOpenChange={setIsOpen}
              trigger={
                <Button
                  size="lg"
                  className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-7 text-lg font-bold rounded-2xl shadow-lg shadow-blue-200/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  {t("deposit.form.submit_btn")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              }
              className="sm:max-w-[720px]  p-0 border-0 gap-0 rounded-3xl "
            >
              {isSuccess ? (
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
                      setIsSuccess(false);
                      setIsOpen(false);
                    }}
                    className="mt-6 border-slate-200 hover:bg-slate-50 rounded-2xl px-12 py-7 text-base font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    {t("common.close")}
                  </Button>
                </div>
              ) : (
                <DepositWizard
                  onSuccess={() => setIsSuccess(true)}
                  onCancel={() => setIsOpen(false)}
                  location="Deposit Section"
                />
              )}
            </ResponsiveDialog>
          </div>
        </div>
      </div>
    </section>
  );
}
