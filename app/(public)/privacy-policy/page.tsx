import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { Shield, Lock, FileText, Info, Phone as PhoneIcon, Home } from "lucide-react";
import { format } from "date-fns";
import { enUS, th, zhCN, ru } from "date-fns/locale";
import { getSiteSettings } from "@/features/site-settings/actions";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const settings = await getSiteSettings();
  const siteName = settings.site_name || siteConfig.name;

  return {
    title: `${t("privacy.title")} | ${siteName}`,
    description: t("privacy.hero_desc"),
    applicationName: siteName,
    alternates: {
      canonical: `${siteConfig.url}/privacy-policy`,
    },
    robots: "index, follow",
  };
}

export default async function PrivacyPolicyPage() {
  const { t, language } = await getServerTranslations();
  const settings = await getSiteSettings();
  
  const company_name = settings.company_name || siteConfig.company;
  const contact_phone = settings.contact_phone || siteConfig.contact.phone;
  const contact_email = settings.contact_email || siteConfig.contact.email;
  const contact_address = settings.contact_address || siteConfig.contact.address;

  const dateLocale = language === "th" ? th : language === "cn" ? zhCN : language === "ru" ? ru : enUS;
  const lastUpdated = format(new Date(), "MMMM dd, yyyy", { locale: dateLocale });

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-slate-50/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">{t("nav.home")}</span>
          </Link>
          <div className="text-xs text-slate-400 font-mono tracking-tighter">
            {siteConfig.url}/privacy-policy
          </div>
        </div>
      </nav>

      <header className="bg-slate-900 text-white py-16 md:py-20 border-b border-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6 border border-blue-500/20">
              <Shield className="w-3 h-3" />
              <span>Official Privacy Policy</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              {t("privacy.title")}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
              {t("privacy.hero_desc")}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 flex items-center gap-2 text-slate-500 border-b border-slate-200 pb-6">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              {t("privacy.update_label")}: {lastUpdated}
            </span>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-800 prose-a:text-blue-600">
            <section className="mb-12">
              <h2 className="text-2xl mb-6">1. {t("privacy.section1_title")}</h2>
              <p>{t("privacy.section1_p1", { company_name })}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">2. {t("privacy.section2_title")}</h2>
              <p className="mb-6">{t("privacy.section2_p1")}</p>
              <div className="grid sm:grid-cols-2 gap-6 not-prose">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <FileText className="w-6 h-6 text-blue-600 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">{t("privacy.identity_title")}</h3>
                  <p className="text-slate-500 text-sm">{t("privacy.identity_desc")}</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <PhoneIcon className="w-6 h-6 text-blue-600 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">{t("privacy.contact_info_title")}</h3>
                  <p className="text-slate-500 text-sm">{t("privacy.contact_info_desc")}</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">3. {t("privacy.section3_title")}</h2>
              <ul className="space-y-2">
                <li>{t("privacy.section3_l1")}</li>
                <li>{t("privacy.section3_l2")}</li>
                <li>{t("privacy.section3_l3", { company_name })}</li>
                <li>{t("privacy.section3_l4")}</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">4. {t("privacy.section4_title")}</h2>
              <p>{t("privacy.section4_p1")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">5. {t("privacy.section5_title")}</h2>
              <p className="mb-6">{t("privacy.section5_p1")}</p>
              <div className="grid gap-3 not-prose">
                {[t("privacy.right1"), t("privacy.right2"), t("privacy.right3"), t("privacy.right4")].map((right, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200 !text-slate-900 text-sm font-bold shadow-sm" style={{ color: '#0f172a' }}>
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20" />
                    {right}
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">6. {t("privacy.section6_title")}</h2>
              <p className="mb-8">{t("privacy.section6_p1", { company_name })}</p>
              
              <div className="not-prose p-8 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-200">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Shield className="w-6 h-6 text-blue-400" />
                      {t("privacy.customer_service", { company_name })}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {t("privacy.customer_service_desc", { company_name })}
                    </p>
                  </div>
                  
                  <div className="flex-1 space-y-4 border-l border-slate-800 pl-0 md:pl-12 pt-8 md:pt-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                        <PhoneIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Phone</p>
                        <p className="font-semibold">{contact_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Email</p>
                        <p className="font-semibold">{contact_email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700 shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Office</p>
                        <p className="text-sm leading-relaxed text-slate-300">{contact_address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">7. {t("privacy.section7_title")}</h2>
              <p>{t("privacy.section7_p1")}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl mb-6">8. {t("privacy.section8_title")}</h2>
              <p>{t("privacy.section8_p1")}</p>
              <ul className="space-y-2">
                <li>{t("privacy.section8_l1")}</li>
                <li>{t("privacy.section8_l2")}</li>
                <li>{t("privacy.section8_l3")}</li>
              </ul>
            </section>
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
