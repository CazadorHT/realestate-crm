"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { getChannelStyle} from "@/features/admin/partners-utils";
import { PartnerRow } from "@/features/admin/partners-actions";

const HIGHLIGHT_KEYWORDS = ["Facebook", "Instagram", "TikTok", "LivingInsider"];

function HighlightedText({ text, links = {} }: { text: string; links?: Record<string, string> }) {
  const keywords = Object.keys(links).length > 0 ? Object.keys(links) : HIGHLIGHT_KEYWORDS;
  const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const match = keywords.find(k => k.toLowerCase() === part.toLowerCase());
        if (!match) return part;
        const href = links[match];
        return href ? (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
          >
            {part}
          </a>
        ) : (
          <span key={i} className="font-bold text-blue-500">{part}</span>
        );
      })}
    </>
  );
}

interface PartnerSectionProps {
  partners?: PartnerRow[];
}

export function PartnerSection({ partners: dbPartners }: PartnerSectionProps) {
  const { t, language } = useLanguage();
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;

  const partnersDescription = (() => {
    if (language === "th") return settings.partners_description;
    if (language === "en") return settings.partners_description_en;
    if (language === "cn") return settings.partners_description_cn;
    if (language === "ru") return settings.partners_description_ru;
    return settings.partners_description || t("home.partners.description");
  })() || t("home.partners.description");

  const partnersList = (dbPartners ?? []).map(p => ({
    id: p.id,
    name: p.name,
    website_url: p.website_url || undefined,
  }));

  // Schema.org Organization markup for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteConfig.url,
    description: partnersDescription,
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Professional Certification",
      description: t("home.partners.certified"),
    },
  };

  return (
    <section className="py-16 md:py-20 lg:py-24 px-4 md:px-6 lg:px-8 bg-slate-50/30 border-t border-slate-100 relative overflow-hidden">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Decorative gradient backgrounds */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto relative z-10">
        {/* SEO-Optimized Header Section */}
        <m.div
          className="text-center "
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 mr-2">
              {t("home.partners.title").split(" ")[0]}
            </span>
            {t("home.partners.title").split(" ").slice(1).join(" ")}
          </h2>
          <m.p
            className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 mb-5 uppercase tracking-widest font-black"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t("home.partners.subtitle")}
          </m.p>
          <m.p
            className="max-w-4xl mx-auto text-slate-600 text-base md:text-lg leading-relaxed font-medium"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <HighlightedText
              text={partnersDescription ?? ""}
              links={Object.fromEntries(
                partnersList
                  .filter(p => p.website_url)
                  .map(p => [p.name, p.website_url!])
              )}
            />
          </m.p>
        </m.div>

        {/* Marketing Channels Flex Layout — แสดงเฉพาะเมื่อมีข้อมูลจาก DB */}
        {partnersList.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 max-w-screen-xl mx-auto py-4">
            {partnersList.map((partner, idx) => {
              const channelStyle = getChannelStyle(partner.name);
              const content = (
                <span
                  className={cn(
                    "group inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl text-base md:text-lg font-bold border transition-all duration-300 cursor-pointer backdrop-blur-xs select-none",
                    channelStyle.bg,
                    channelStyle.text,
                    channelStyle.border,
                    channelStyle.hover,
                    "transform hover:-translate-y-1 hover:scale-105 active:scale-95 shadow-sm"
                  )}
                >
                    <span>{partner.name}</span>
                </span>
              );

              return (
                <m.div
                  key={partner.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  {partner.website_url ? (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${partner.name} - ${partner.website_url}`}
                    >
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </m.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
