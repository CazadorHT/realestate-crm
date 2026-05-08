"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import Image from "next/image";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

type Partner = {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
};

export function PartnerSection() {
  const { t } = useLanguage();
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("partners")
          .select("id, name, logo_url, website_url")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (data) {
          setPartners(data as unknown as Partner[]);
        }
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  // Don't render if no partners
  if (!loading && partners.length === 0) return null;

  // Schema.org Organization markup for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteConfig.url,
    description: t("home.partners.description"),
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Professional Certification",
      description: t("home.partners.certified"),
    },
  };

  return (
    <section className="py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8 bg-white border-t border-slate-50">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-screen-2xl mx-auto">
        {/* SEO-Optimized Header Section */}
        <m.div 
          className="text-center mb-8 md:mb-10 lg:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 mr-2">
              {t("home.partners.title").split(" ")[0]}
            </span>
            {t("home.partners.title").split(" ").slice(1).join(" ")}
          </h2>
          <m.p
            className="text-sm md:text-base text-slate-400 mb-4 uppercase tracking-wider font-semibold"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t("home.partners.subtitle")}
          </m.p>
          <m.p
            className="max-w-2xl mx-auto text-slate-600 text-base md:text-lg leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t("home.partners.description")}
          </m.p>
        </m.div>

        {/* Partner Logos Marquee */}
        <div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden"
          style={{ "--gap": "3rem" } as React.CSSProperties}
        >
          <div className="flex w-full overflow-hidden mask-linear-fade">
            <div className="flex min-w-full shrink-0 animate-marquee items-center justify-around gap-(--gap) py-4">
              {loading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center px-4"
                    >
                      <div className="h-16 w-32 md:h-20 md:w-40 rounded-lg animate-shimmer" />
                    </div>
                  ))
                : partners.map((partner, idx) => (
                    <m.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="group relative flex items-center justify-center transition-all duration-500 ease-in-out px-4 h-16 w-32 md:h-20 md:w-40"
                    >
                      <PartnerLogo partner={partner} t={t} />
                    </m.div>
                  ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div
              aria-hidden="true"
              className="flex min-w-full shrink-0 animate-marquee items-center justify-around gap-(--gap) py-4 ml-(--gap)
              "
            >
              {loading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={`dup-${idx}`}
                      className="flex items-center justify-center px-4"
                    >
                      <div className="h-16 w-32 md:h-20 md:w-40 rounded-lg animate-shimmer" />
                    </div>
                  ))
                : partners.map((partner, idx) => (
                    <m.div
                      key={`duplicate-${partner.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="group relative flex items-center justify-center transition-all duration-500 ease-in-out px-4 h-16 w-32 md:h-20 md:w-40"
                    >
                      <PartnerLogo partner={partner} t={t} />
                    </m.div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerLogo({ 
  partner, 
  t 
}: { 
  partner: Partner; 
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [error, setError] = useState(false);

  // 🛡️ Enterprise-Grade Hostname Validation
  // Check if the URL is from an allowed domain to prevent Next.js Image unconfigured host error
  const isAllowedHost = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname;
      const allowedHosts = [
        "images.unsplash.com",
        "api.dicebear.com",
        "livinginsider.com",
        "pgimgs.com",
        "wikimedia.org",
        "freepik.com"
      ];
      
      return allowedHosts.some(allowed => host === allowed || host.endsWith("." + allowed)) || 
             host.includes("supabase.co");
    } catch {
      return false;
    }
  };

  // Immediate fallback if host is not in our known list
  const finalSrc = (!error && isAllowedHost(partner.logo_url)) 
    ? partner.logo_url 
    : siteConfig.logo;

  return (
    <Image
      src={finalSrc}
      alt={`${partner.name} - ${t("home.partners.title")}`}
      title={partner.name}
      fill
      className={cn(
        "object-contain hover:scale-110 transition-transform duration-300",
        (error || !isAllowedHost(partner.logo_url)) && "opacity-20 grayscale scale-90"
      )}
      onError={() => setError(true)}
      sizes="(max-width: 768px) 120px, 160px"
    />
  );
}
