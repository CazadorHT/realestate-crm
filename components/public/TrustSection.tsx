"use client";

import { Shield, CheckCircle2, Clock, Star, Award } from "lucide-react";
import { SectionBackground } from "./SectionBackground";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function TrustSection() {
  const { t } = useLanguage();
  // Schema.org Service + AggregateRating for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t("trust.schema_name"),
    description: t("trust.schema_desc"),
    provider: {
      "@type": "Organization",
      name: "Your Real Estate Company",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
    serviceType: "Real Estate Service",
    areaServed: {
      "@type": "Place",
      name: "Thailand",
    },
  };

  const features = [
    {
      icon: CheckCircle2,
      iconBg: "bg-green-50 group-hover:bg-green-100",
      iconColor: "text-green-600",
      title: t("trust.verified_title"),
      description: t("trust.verified_desc"),
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: Shield,
      iconBg: "bg-blue-50 group-hover:bg-blue-100",
      iconColor: "text-blue-600",
      title: t("trust.safe_title"),
      description: t("trust.safe_desc"),
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: Clock,
      iconBg: "bg-purple-50 group-hover:bg-purple-100",
      iconColor: "text-purple-600",
      title: t("trust.service_title"),
      description: t("trust.service_desc"),
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <section id="trust" className="bg-white relative overflow-hidden z-0">
      <SectionBackground pattern="grid" intensity="low" />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-7xl mx-auto py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8">
        {/* SEO-Optimized Header */}
        <div
          className="text-center space-y-3 md:space-y-4 mb-10 md:mb-16"
          data-aos="fade-up"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">
              {t("trust.title_badge")}
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
            {t("trust.title_main")}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-blue-600">
              {" "}
              {t("trust.title_highlight")}
            </span>
            <br />
            <span className="text-2xl md:text-3xl text-slate-600">
              {t("trust.title_sub")}
            </span>
          </h2>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            {t("trust.desc")}
          </p>
        </div>

        {/* Enhanced Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 lg:p-8 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Gradient Background on Hover */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${feature.iconBg} flex items-center justify-center mb-4 md:mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <feature.icon
                    className={`h-6 w-6 md:h-7 md:w-7 ${feature.iconColor}`}
                  />
                </div>

                {/* Content */}
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* Enhanced Trust Badge */}
        <div
          className="mt-10 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <div className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-full">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <div className="h-6 w-px bg-amber-300 mx-2" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-slate-900">4.8/5.0</span>
              <span className="text-xs text-slate-600">
                {t("trust.rating_prefix")} 1,250+ {t("trust.rating_suffix")}
              </span>
            </div>
          </div>

          <span className="text-sm text-slate-500 font-medium">
            {t("trust.rating_footer")}
          </span>
        </div>
      </div>
    </section>
  );
}
