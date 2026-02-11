"use client";

import {
  Building2,
  Home,
  Building,
  Trees,
  BriefcaseBusiness,
  Warehouse,
  Palmtree,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertyTypeCardProps {
  icon: React.ElementType;
  title: string;
  count: string;
  description: string;
  href: string;
  gradient: string;
}

function PropertyTypeSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse flex flex-col items-center">
      {/* Icon Circle Skeleton */}
      <div className="w-16 h-16 rounded-xl bg-slate-200 mb-4" />

      {/* Title Skeleton */}
      <div className="h-5 w-24 bg-slate-200 rounded mb-2" />

      {/* Description Skeleton */}
      <div className="space-y-2 w-full flex flex-col items-center">
        <div className="h-3 w-4/5 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
      </div>

      {/* Link Skeleton */}
      <div className="h-4 w-16 bg-slate-100 rounded mt-5" />
    </div>
  );
}

export function PropertyTypeCard({
  icon: Icon,
  title,
  count,
  description,
  href,
  gradient,
}: PropertyTypeCardProps) {
  const { t } = useLanguage();
  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-2xl py-6 px-4 shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
        {/* Gradient Background on Hover */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
        ></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div
            className={`w-18 h-18 mx-auto rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-10 w-10 text-white stroke-[1.5]" />
          </div>

          {/* Title */}
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2 min-h-[48px] flex items-center justify-center">
            {title}
          </h3>
          {/* <p className="text-xs font-medium text-blue-600 mb-3 uppercase tracking-wider">
            {count} {t("property_listing.found_suffix")}
          </p> */}
          {/* Description */}
          <p className="text-xs md:text-sm text-slate-500 mb-4 min-h-[56px] leading-relaxed">
            {description}
          </p>

          {/* CTA */}
          <div className="text-center">
            <span className="text-sm text-blue-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              {t("common.start_search")} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PropertyTypeGrid({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  const { t } = useLanguage();
  const propertyTypes = [
    {
      icon: Home,
      title: t("home.property_types.house"),
      count: "1,653",
      description: t("home.property_types.house_desc"),
      href: "/?type=HOUSE#latest-properties",
      gradient: "from-purple-500 to-purple-800",
    },
    {
      icon: Building2,
      title: t("home.property_types.condo"),
      count: "2,847",
      description: t("home.property_types.condo_desc"),
      href: "/?type=CONDO#latest-properties",
      gradient: "from-blue-600 to-indigo-600",
    },
     {
      icon: BriefcaseBusiness,
      title: t("home.property_types.office_building"),
      count: "264",
      description: t("home.property_types.office_desc"),
      href: "/?type=OFFICE_BUILDING#latest-properties",
      gradient: "from-sky-500 to-cyan-800",
    },
    {
      icon: Palmtree,
      title: t("home.property_types.villa"),
      count: "412",
      description: t("home.property_types.villa_desc"),
      href: "/?type=VILLA#latest-properties",
      gradient: "from-rose-500 to-rose-700",
    },
    {
      icon: Waves,
      title: t("home.property_types.pool_villa"),
      count: "328",
      description: t("home.property_types.pool_villa_desc"),
      href: "/?type=POOL_VILLA#latest-properties",
      gradient: "from-cyan-500 to-blue-700",
    },
    {
      icon: Building,
      title: t("home.property_types.townhome"),
      count: "892",
      description: t("home.property_types.townhome_desc"),
      href: "/?type=TOWNHOME#latest-properties",
      gradient: "from-orange-500 to-orange-800",
    },
   
    {
      icon: Warehouse,
      title: t("home.property_types.warehouse"),
      count: "187",
      description: t("home.property_types.warehouse_desc"),
      href: "/?type=WAREHOUSE#latest-properties",
      gradient: "from-amber-500 to-yellow-700",
    },
    {
      icon: Trees,
      title: t("home.property_types.land"),
      count: "1,243",
      description: t("home.property_types.land_desc"),
      href: "/?type=LAND#latest-properties",
      gradient: "from-emerald-500 to-teal-800",
    },
  ];

  // Schema.org ItemList for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("home.property_types.title"),
    description: t("property_listing.description"),
    itemListElement: propertyTypes.map((type, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: type.title,
        description: type.description,
        url: `https://oma-asset.com${type.href}`,
      },
    })),
  };

  return (
    <section className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px]" />
      </div>

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-screen-2xl mx-auto relative z-10">
        {/* SEO-Optimized Section Header */}
        <div className="text-center mb-10" data-aos="fade-up">
          <h2 className="text-2xl md:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
            {t("nav.properties")}{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
              {t("home.property_types.description")}
            </span>{" "}
            {t("home.property_types.description").includes("ตามประเภท")
              ? ""
              : t("common.all")}
          </h2>
          <p
            className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {t("property_listing.title")}{" "}
            <span className="font-semibold text-blue-600">
              {t("property_listing.title").includes("ซื้อ · ขาย · เช่า")
                ? ""
                : "Buy · Sell · Rent"}
            </span>{" "}
            {t("common.verified_100")}
          </p>
        </div>

        {/* PropertyTypeCard wrapper - Mobile: horizontal scroll, Desktop: grid */}
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 md:gap-6 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {isLoading
            ? Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="shrink-0 w-[160px] md:w-auto snap-center"
                >
                  <PropertyTypeSkeleton />
                </div>
              ))
            : propertyTypes.map((type, idx) => (
                <div
                  key={idx}
                  data-aos="fade-up"
                  data-aos-delay={idx * 50}
                  className="shrink-0 w-[160px] md:w-auto snap-center"
                >
                  <PropertyTypeCard {...type} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
