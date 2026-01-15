"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Partner = {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  category?: "developer" | "bank";
};

export function PartnerSection() {
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
    name: "Your Real Estate Company",
    description:
      "เครือข่ายพันธมิตรอสังหาริมทรัพย์ ธนาคาร และผู้พัฒนาโครงการชั้นนำ",
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Professional Certification",
      description: "รับรองโดยสถาบันนายหน้าอสังหาริมทรัพย์",
    },
  };

  return (
    <section className="pt-20 bg-white border-t border-slate-50">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        {/* SEO-Optimized Header Section */}
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              พันธมิตร
            </span>
            อสังหาริมทรัพย์ชั้นนำ
          </h2>
          <p
            className="text-sm md:text-base text-slate-400 mb-4 uppercase tracking-wider font-semibold"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Trusted Marketing Network
          </p>
          <p
            className="max-w-2xl mx-auto text-slate-600 text-base md:text-lg leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            ร่วมมือกับ
            <span className="font-semibold text-slate-900">
              ธนาคารชั้นนำ
            </span>{" "}
            และ
            <span className="font-semibold text-slate-900">
              ผู้พัฒนาโครงการ
            </span>
            คุณภาพ ผ่านการรับรองมาตรฐานอสังหาริมทรัพย์ระดับมืออาชีพ
          </p>
        </div>

        {/* Partner Logos Marquee */}
        <div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden"
          style={{ "--gap": "3rem" } as React.CSSProperties}
        >
          <div className="flex w-full overflow-hidden mask-linear-fade">
            <div className="flex min-w-full shrink-0 animate-marquee items-center justify-around gap-[var(--gap)] py-4">
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
                        alt={`${partner.name} - พันธมิตรอสังหาริมทรัพย์${
                          partner.category === "bank"
                            ? " ธนาคารสินเชื่อบ้าน"
                            : partner.category === "developer"
                            ? " ผู้พัฒนาโครงการ"
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
              className="flex min-w-full shrink-0 animate-marquee items-center justify-around gap-[var(--gap)] py-4 ml-[var(--gap)]
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
                        alt={`${partner.name} - พันธมิตรอสังหาริมทรัพย์${
                          partner.category === "bank"
                            ? " ธนาคารสินเชื่อบ้าน"
                            : partner.category === "developer"
                            ? " ผู้พัฒนาโครงการ"
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
