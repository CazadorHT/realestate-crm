"use client";

import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import Link from "next/link";
import { Scale, FileText, AlertCircle, HelpCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { format } from "date-fns";
import { th, enUS, zhCN } from "date-fns/locale";

export default function TermsPage() {
  const { t, language } = useLanguage();
  const lastUpdated = format(new Date(), "PPP", {
    locale: language === "th" ? th : language === "cn" ? zhCN : enUS,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Background */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white pb-24 pt-12 md:pt-16">
        <div className="container mx-auto px-4 md:px-6">
          <AppBreadcrumbs
            variant="on-dark"
            items={[
              { label: t("nav.home"), href: "/" },
              { label: t("terms.title"), href: "/terms" },
            ]}
            className="text-slate-400 my-6 "
          />
          <div className="max-w-4xl mx-auto text-center space-y-4 ">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-2">
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              {t("terms.title")}
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t("terms.hero_desc")}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-16 pb-20">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Content Header */}
          <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <span>
                {t("terms.update_label")}: {lastUpdated}
              </span>
            </div>
          </div>

          <div className="p-6 md:p-10 prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-700">
            <section className="mb-10 last:mb-0">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg mb-6 not-prose">
                <p className="text-blue-900 font-medium">
                  {t("terms.welcome_title")} {t("terms.welcome_p1")}
                </p>
              </div>
              <h2 className="text-2xl mb-4">{t("terms.section1_title")}</h2>
              <p>{t("terms.section1_p1")}</p>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="text-2xl mb-4">{t("terms.section2_title")}</h2>
              <p>{t("terms.section2_p1")}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4 not-prose">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-red-500">✕</span> {t("terms.cant_do")}
                  </h5>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                    <li>{t("terms.cant1")}</li>
                    <li>{t("terms.cant2")}</li>
                    <li>{t("terms.cant3")}</li>
                  </ul>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-green-500">✓</span>{" "}
                    {t("terms.can_do")}
                  </h5>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                    <li>{t("terms.can1")}</li>
                    <li>{t("terms.can2")}</li>
                    <li>{t("terms.can3")}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="text-2xl mb-4">{t("terms.section3_title")}</h2>
              <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-xl not-prose">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-900">
                    {t("terms.section3_alert_title")}
                  </h4>
                  <p className="text-sm text-amber-800/80 leading-relaxed">
                    {t("terms.section3_alert_p1")}
                    <br />
                    <b>{t("terms.section3_alert_p2")}</b>
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="text-2xl mb-4">{t("terms.section4_title")}</h2>
              <p>{t("terms.section4_p1")}</p>
            </section>

            <div className="mt-12 p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center not-prose">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-4 text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t("terms.help_title")}
              </h3>
              <p className="text-slate-500 mb-6">{t("terms.help_desc")}</p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                {t("terms.contact_legal")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
