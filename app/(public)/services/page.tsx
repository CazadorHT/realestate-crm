"use client";

import { Suspense } from "react";
import { getServices, type ServiceRow } from "@/features/services/actions";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState, useEffect } from "react";

export const revalidate = 60; // Revalidate every minute

async function ServicesContent() {
  const { t } = useLanguage();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServices().then((data) => {
      setServices(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/90 to-purple-600/90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-20" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm mb-6 border border-white/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span>{t("services.title_badge")}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            {t("services.hero_title")}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("services.hero_desc")}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 -mt-10 md:-mt-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link
                href={`/services/${service.slug}`}
                key={service.id}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full border border-slate-100"
              >
                {/* Image */}
                <div className="aspect-4/3 bg-slate-200 relative overflow-hidden">
                  {service.cover_image ? (
                    <img
                      src={service.cover_image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                      {t("services.no_image")}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-2xl font-bold text-white mb-1 shadow-black/50 drop-shadow-md">
                      {service.title}
                    </h3>
                    {service.price_range && (
                      <p className="text-yellow-300 font-medium text-sm drop-shadow-md">
                        {service.price_range}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-slate-600 line-clamp-3 mb-6 flex-1 text-sm leading-relaxed">
                    {service.description ||
                      "View details to learn more about this service."}
                  </p>

                  <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                    {t("services.view_details")}{" "}
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}

            {services.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400">
                <p className="text-lg">{t("services.coming_soon")}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ServicesPage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          {t("common.loading")}
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
