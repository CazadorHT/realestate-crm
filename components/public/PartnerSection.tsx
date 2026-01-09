"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Partner = {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  category?: "developer" | "bank"; // สมมติว่ามี column นี้เพิ่มเข้ามา
};

export function PartnerSection() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartners() {
      const supabase = createClient();
      const { data } = await supabase
        .from("partners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data) {
        setPartners(data as Partner[]);
      }
      setLoading(false);
    }
    fetchPartners();
  }, []);

  // if (loading || partners.length === 0) return null;
  if (!loading && partners.length === 0) return null;

  return (
    <section className="pt-20 bg-white border-t border-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* --- Header Section (Micro-copy) --- */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Our Marketing Network
            <p className="text-base md:text-lg text-slate-500">
              เครือข่ายการโฆษณาของเรา
            </p>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-500 text-base md:text-lg">
            ดำเนินงานภายใต้มาตรฐานมืออาชีพ ผ่านการรับรองจากสถาบันนายหน้าชั้นนำ
          </p>
        </div>

        {/* --- Partner Logos Marquee --- */}
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
                      <Skeleton className="h-16 w-32 md:h-20 md:w-40 rounded-lg bg-slate-100" />
                    </div>
                  ))
                : partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="group relative flex items-center justify-center transition-all duration-500 ease-in-out px-4"
                    >
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        title={partner.name}
                        className="h-16 w-auto md:h-20 object-contain hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div
              aria-hidden="true"
              className="flex min-w-full shrink-0 animate-marquee items-center justify-around gap-[var(--gap)] py-4 ml-[var(--gap)]"
            >
              {loading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={`dup-${idx}`}
                      className="flex items-center justify-center px-4"
                    >
                      <Skeleton className="h-16 w-32 md:h-20 md:w-40 rounded-lg bg-slate-100" />
                    </div>
                  ))
                : partners.map((partner) => (
                    <div
                      key={`duplicate-${partner.id}`}
                      className="group relative flex items-center justify-center transition-all duration-500 ease-in-out px-4"
                    >
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        title={partner.name}
                        className="h-16 w-auto md:h-20 object-contain hover:scale-110 transition-transform duration-300"
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
