"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Partner = {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  category?: "developer" | "bank";
};

export function PartnerSection() {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("partners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (data) {
          setPartners(data as Partner[]);
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
    name: "OMA ASSET",
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
        <div className="text-center mb-8 md:mb-10 lg:mb-12" data-aos="fade-up">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 mr-2">
              {t("home.partners.title").split(" ")[0]}
            </span>
            {t("home.partners.title").split(" ").slice(1).join(" ")}
          </h2>
          <p
            className="text-sm md:text-base text-slate-400 mb-4 uppercase tracking-wider font-semibold"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {t("home.partners.subtitle")}
          </p>
          <p
            className="max-w-2xl mx-auto text-slate-600 text-base md:text-lg leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {t("home.partners.description")}
          </p>
        </div>

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
                    <div
                      key={partner.id}
                      data-aos="fade-up"
                      data-aos-delay={idx * 50}
                      className="group relative flex items-center justify-center transition-all duration-500 ease-in-out px-4"
                    >
                      <img
                        src={partner.logo_url}
                        alt={`${partner.name} - ${t("home.partners.title")}${
                          partner.category === "bank"
                            ? ` ${t("home.partners.banks")}`
                            : partner.category === "developer"
                              ? ` ${t("home.partners.developers")}`
                              : ""
                        }`}
                        title={partner.name}
                        className="h-16 w-auto md:h-20 object-contain hover:scale-110 transition-transform duration-300 "
                      />
                    </div>
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
                    <div
                      key={`duplicate-${partner.id}`}
                      data-aos="fade-up"
                      data-aos-delay={idx * 50}
                      className="group relative flex items-center justify-center transition-all duration-500 ease-in-out px-4"
                    >
                      <img
                        src={partner.logo_url}
                        alt={`${partner.name} - ${t("home.partners.title")}${
                          partner.category === "bank"
                            ? ` ${t("home.partners.banks")}`
                            : partner.category === "developer"
                              ? ` ${t("home.partners.developers")}`
                              : ""
                        }`}
                        title={partner.name}
                        className="h-16 w-auto md:h-20 object-contain hover:scale-110 transition-transform duration-300 "
                      />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
