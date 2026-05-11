import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { Scale, FileText, AlertCircle, HelpCircle, Home } from "lucide-react";
import { format } from "date-fns";
import { enUS, th, zhCN, ru } from "date-fns/locale";
import { getSiteSettings } from "@/features/site-settings/actions";
import Link from "next/link";

// ✅ Always use production URL — siteConfig.url returns localhost in dev mode
const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || "https://vccasset.com";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const settings = await getSiteSettings();
  // ✅ FORCE: Match Google Cloud Console App Name exactly
  const siteName = "VC Connect Asset Co., Ltd.";

  return {
    title: `${t("terms.title")} | ${siteName}`,
    description: t("terms.hero_desc"),
    applicationName: siteName,
    alternates: {
      // ✅ FIX: Use PRODUCTION_URL so canonical is always the production domain
      canonical: `${PRODUCTION_URL}/terms`,
    },
    robots: "index, follow",
  };
}

export default async function TermsPage() {
  const { t, language } = await getServerTranslations();
  const settings = await getSiteSettings();
  
  // ✅ FORCE: Match Google Cloud Console App Name exactly
  const company_name = "VC Connect Asset Co., Ltd.";
  const dateLocale = language === "th" ? th : language === "cn" ? zhCN : language === "ru" ? ru : enUS;
  const lastUpdated = format(new Date(), "MMMM dd, yyyy", { locale: dateLocale });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-slate-50/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">{t("nav.home")}</span>
          </Link>
          <div className="text-xs text-slate-400 font-mono tracking-tighter">
            {PRODUCTION_URL}/terms
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-slate-900 text-white py-16 md:py-20 border-b border-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6 border border-blue-500/20">
              <Scale className="w-3 h-3" />
              <span>Agreement & Use</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              {t("terms.title")}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
              {t("terms.hero_desc")}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Last Updated */}
          <div className="mb-12 flex items-center gap-2 text-slate-500 border-b border-slate-200 pb-6">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              {t("terms.update_label")}: {lastUpdated}
            </span>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-800 prose-a:text-blue-600">
            
            {/* 🛡️ Terms Content: Removed numeric prefixes for cleaner structure */}
            <section className="mb-12 p-8 bg-blue-50 border border-blue-100 rounded-3xl not-prose shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t("terms.welcome_title")}</h2>
              <p className="text-slate-800 leading-relaxed font-semibold">
                {t("terms.welcome_p1")}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section1_title")}</h2>
              <p>{t("terms.section1_p1")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section2_title")}</h2>
              <p className="mb-6">{t("terms.section2_p1")}</p>
              <div className="grid sm:grid-cols-2 gap-6 not-prose">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 leading-tight">
                    <span className="text-red-500 font-black">✕</span>
                    {t("terms.cant_do")}
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                    <li>{t("terms.cant1")}</li>
                    <li>{t("terms.cant2")}</li>
                    <li>{t("terms.cant3")}</li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 leading-tight">
                    <span className="text-green-500 font-black">✓</span>
                    {t("terms.can_do")}
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                    <li>{t("terms.can1")}</li>
                    <li>{t("terms.can2")}</li>
                    <li>{t("terms.can3")}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section3_title")}</h2>
              <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-2xl not-prose border border-amber-100">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-900">
                    {t("terms.section3_alert_title")}
                  </h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {t("terms.section3_alert_p1")}
                    <br />
                    <strong className="text-amber-900 font-bold underline decoration-amber-200 underline-offset-4">{t("terms.section3_alert_p2")}</strong>
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section4_title")}</h2>
              <p>{t("terms.section4_p1")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section5_title")}</h2>
              <p>{t("terms.section5_p1", { company_name })}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section6_title")}</h2>
              <p className="mb-6">{t("terms.section6_p1")}</p>
              <ul className="grid sm:grid-cols-3 gap-4 not-prose">
                <li>
                  <a href="https://www.facebook.com/terms" target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm font-bold text-blue-600 hover:bg-white hover:shadow-md transition-all">
                    Meta Terms
                  </a>
                </li>
                <li>
                  <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm font-bold text-blue-600 hover:bg-white hover:shadow-md transition-all">
                    TikTok Terms
                  </a>
                </li>
                <li>
                  <a href="https://terms.line.me" target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm font-bold text-blue-600 hover:bg-white hover:shadow-md transition-all">
                    LINE Terms
                  </a>
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section7_title")}</h2>
              <p>{t("terms.section7_p1")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section8_title")}</h2>
              <p>{t("terms.section8_p1")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">{t("terms.section9_title")}</h2>
              <p>{t("terms.section9_p1")}</p>
            </section>

            <div className="pt-8 border-t border-slate-100 italic text-slate-400 text-sm">
              {t("terms.pdpa_note")}
            </div>

            <div className="mt-16 p-10 bg-slate-900 rounded-3xl text-center not-prose text-white shadow-2xl shadow-slate-200">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-800 rounded-2xl mb-6 text-blue-400 border border-slate-700">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                {t("terms.help_title")}
              </h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">{t("terms.help_desc")}</p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
              >
                {t("terms.contact_legal")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} {company_name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
