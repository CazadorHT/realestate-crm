"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { m } from "framer-motion";

interface PropertyTypeCardProps {
  image: string;
  title: string;
  count: string;
  href: string;
}

function PropertyTypeSkeleton() {
  return (
    <div className="flex flex-col items-center animate-pulse">
      {/* Circle Skeleton */}
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-200 mb-3" />
      {/* Title Skeleton */}
      <div className="h-4 w-16 bg-slate-200 rounded" />
    </div>
  );
}

export function PropertyTypeCard({
  image,
  title,
  count,
  href,
}: PropertyTypeCardProps) {
  const { t } = useLanguage();
  return (
    <Link href={href} className="group flex flex-col items-center">
      {/* Outer wrapper that handles translate-y to prevent clipping overflow-hidden */}
      <div className="transition-transform duration-300 group-hover:-translate-y-1 py-1">
        {/* Circle Image Wrapper - Using rounded-full and overflow-hidden for clean circle masking */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full shadow-md border border-slate-100/80 transition-shadow duration-300 group-hover:shadow-lg overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 96px, 128px"
            className="object-cover"
          />
          {/* Soft overlay on hover */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-2 text-xs md:text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-center max-w-[100px] md:max-w-[128px] line-clamp-1">
        {title}
      </h3>
    </Link>
  );
}

export function PropertyTypeGrid({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  const { t, language } = useLanguage();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(ua));
    }
  }, []);
  const propertyTypes = [
    {
      image: "/images/property-types/condo.webp",
      title: t("home.property_types.condo"),
      count: "2,847",
      href: "/?type=CONDO#latest-properties",
    },
    {
      image: "/images/property-types/house.webp",
      title: t("home.property_types.house"),
      count: "1,653",
      href: "/?type=HOUSE#latest-properties",
    },
    {
      image: "/images/property-types/townhome.webp",
      title: t("home.property_types.townhome"),
      count: "892",
      href: "/?type=TOWNHOME#latest-properties",
    },
    
    {
      image: "/images/property-types/pool_villa.webp",
      title: t("home.property_types.pool_villa"),
      count: "328",
      href: "/?type=POOL_VILLA#latest-properties",
    },
    {
      image: "/images/property-types/office.webp",
      title: t("home.property_types.office_building"),
      count: "264",
      href: "/?type=OFFICE_BUILDING#latest-properties",
    },
    {
      image: "/images/property-types/home_office.webp",
      title: t("home.property_types.home_office"),
      count: "135",
      href: "/?type=HOME_OFFICE#latest-properties",
    },
    {
      image: "/images/property-types/commercial.webp",
      title: t("home.property_types.commercial_building"),
      count: "98",
      href: "/?type=COMMERCIAL_BUILDING#latest-properties",
    },
    {
      image: "/images/property-types/warehouse.webp",
      title: t("home.property_types.warehouse"),
      count: "187",
      href: "/?type=WAREHOUSE#latest-properties",
    },
    {
      image: "/images/property-types/land.webp",
      title: t("home.property_types.land"),
      count: "1,243",
      href: "/?type=LAND#latest-properties",
    },
  ];

  return (
    <section id="discover" className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-50/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-50/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-screen-2xl mx-auto relative z-10 px-4 md:px-6 lg:px-8">
        {/* SEO-Optimized Section Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
            {t("home.property_types.title")}{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
              {t("home.property_types.description")}
            </span>
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            {t("property_listing.title")}{" "}
            <span className="font-semibold text-blue-600">
              {t("common.rent_buy")}
            </span>{" "}
            {t("common.verified_100")}
          </p>
        </m.div>

        {/* PropertyTypeCard Wrapper - Swiper/Slider container */}
        <div className="relative group/slider px-4 ">
          {/* Edge Fade Indicators to signal horizontal scrolling */}
          <div className="absolute -left-4 sm:left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute -right-4 sm:right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

          {/* Scroll Area */}
          <div
            id="property-type-slider"
            className="flex items-center gap-6 md:gap-8 overflow-x-auto pt-4 pb-4 scroll-smooth scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {isLoading
              ? Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="shrink-0 w-24 md:w-32 snap-center"
                  >
                    <PropertyTypeSkeleton />
                  </div>
                ))
              : propertyTypes.map((type, idx) => (
                  <m.div
                    key={idx}
                    initial={isIOS ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                    whileInView={isIOS ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                    viewport={isIOS ? undefined : { once: true }}
                    transition={isIOS ? { duration: 0 } : { duration: 0.4, delay: idx * 0.05 }}
                    className="shrink-0 w-24 md:w-32 snap-center"
                  >
                    <PropertyTypeCard {...type} />
                  </m.div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
