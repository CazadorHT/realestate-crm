"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Bed, Bath, Maximize2, MapPin, Sparkles, ArrowUpRight, Pause, Play } from "lucide-react";
import { getPublicImageUrl } from "@/features/properties/image-utils";

export interface StoryPropertyItem {
  id: string;
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  title_ru?: string | null;
  slug?: string | null;
  price?: number | null;
  rental_price?: number | null;
  rent_price?: number | null;
  sale_price?: number | null;
  listing_type?: string | null;
  property_type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  usable_area?: number | null;
  size_sqm?: number | null;
  popular_area?: string | null;
  transit_station?: string | null;
  cover_image?: string | null;
  images?: string[] | { url?: string; image_url?: string }[] | null;
  projects?: {
    name_th?: string | null;
    name_en?: string | null;
  } | null;
}

interface FeaturedStoryCarouselProps {
  properties: StoryPropertyItem[];
  language?: string;
  autoPlayIntervalMs?: number;
}

export function FeaturedStoryCarousel({
  properties,
  language = "th",
  autoPlayIntervalMs = 4500,
}: FeaturedStoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalItems = properties.length;
  const currentProperty = properties[currentIndex] || properties[0];

  // Helper for localized title
  const getDisplayTitle = useCallback(
    (item: StoryPropertyItem) => {
      if (!item) return "";
      if (language === "en" && item.title_en) return item.title_en;
      if (language === "cn" && item.title_cn) return item.title_cn;
      if (language === "ru" && item.title_ru) return item.title_ru;
      return item.title || item.projects?.name_th || "ทรัพย์คุณภาพไฮไลท์";
    },
    [language]
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const handleSelect = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Helper for image URL
  const getImageUrl = (item: StoryPropertyItem) => {
    if (!item) return "/images/placeholder-property.webp";
    if (item.cover_image) return getPublicImageUrl(item.cover_image);
    if (Array.isArray(item.images) && item.images.length > 0) {
      const firstImg = item.images[0];
      const urlStr = typeof firstImg === "string" ? firstImg : firstImg?.url || firstImg?.image_url;
      if (urlStr) return getPublicImageUrl(urlStr);
    }
    return "/images/placeholder-property.webp";
  };

  if (!currentProperty || totalItems === 0) return null;

  const currentImageUrl = getImageUrl(currentProperty);
  const detailLink = `/properties/${currentProperty.slug || currentProperty.id}`;

  return (
    <>
      {/* Inject Keyframe Animation Style once for smooth progress fill */}
      <style>{`
        @keyframes storyProgressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      <div
        className="relative w-full max-w-full mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border text-white transition-all duration-300 hover:shadow-blue-500/10 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Segmented Story Progress Bar (Hardware-Accelerated CSS Keyframes) */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-3.5 bg-linear-to-b from-black/40 to-transparent flex gap-1.5 items-center">
          {properties.map((_, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className="h-1.5 flex-1 rounded-full bg-white/40 border border-white/20 backdrop-blur-xs overflow-hidden cursor-pointer transition-all hover:h-2 group/bar"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <div
                  key={`${currentIndex}-${idx}`}
                  onAnimationEnd={isActive ? handleNext : undefined}
                  className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-sky-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.9)]"
                  style={{
                    width: isCompleted ? "100%" : isActive ? undefined : "0%",
                    animationName: isActive ? "storyProgressFill" : "none",
                    animationDuration: `${autoPlayIntervalMs}ms`,
                    animationTimingFunction: "linear",
                    animationFillMode: "forwards",
                    animationPlayState: isPaused ? "paused" : "running",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Hero Image Container (Widescreen cinematic presentation) */}
        <div className="relative w-full h-[360px] sm:h-[400px]  overflow-hidden bg-slate-950">
          <AnimatePresence mode="popLayout">
            <m.div
              key={currentProperty.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={currentImageUrl}
                alt={getDisplayTitle(currentProperty)}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />
            </m.div>
          </AnimatePresence>

        {/* Top Gradient Shadow ONLY for Progress Bar (Photo remains 100% bright & vivid) */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* Top Header Overlay Badges */}
        <div className="absolute top-6 left-4 right-4 z-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/90 text-white text-[11px] font-bold shadow-md backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>
                {language === "en"
                  ? "HOT DEAL"
                  : language === "cn"
                  ? "热门房源"
                  : language === "ru"
                  ? "ХИТ ПРОДАЖ"
                  : "ทรัพย์ไฮไลท์เด็ด"}
              </span>
            </span>

            <span className="px-2 py-0.5 rounded-full bg-black/50 text-white/90 text-[11px] font-medium backdrop-blur-md border border-white/10">
              {currentIndex + 1} / {totalItems}
            </span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white backdrop-blur-md transition-all hover:bg-black/60 cursor-pointer"
            title={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          </button>
        </div>

        {/* Manual Left/Right Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white/90 hover:text-white backdrop-blur-md transition-all hover:bg-black/70 cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Previous property"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white/90 hover:text-white backdrop-blur-md transition-all hover:bg-black/70 cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Next property"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Floating Translucent Light Glass Widget (Bright Frosted White Glassmorphism) */}
        <div className="absolute bottom-3 left-3 right-3 z-20 p-3 sm:p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ring-1 ring-slate-900/5 space-y-2 text-slate-900">
          {/* Row 1: Title & Location */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[70%] group-hover:text-blue-600 transition-colors">
              {getDisplayTitle(currentProperty)}
            </h3>

            {(currentProperty.transit_station || currentProperty.popular_area) && (
              <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-bold bg-indigo-50/90 px-2 py-0.5 rounded-full border border-indigo-200/60 shrink-0 shadow-2xs">
                <MapPin className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                <span className="truncate max-w-[110px]">
                  {currentProperty.transit_station || currentProperty.popular_area}
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Price + Specs + Action Button (Single Compact Bar) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
            {/* Price & Specs Left Cluster */}
            <div className="flex items-center gap-2.5 truncate">
              {/* Dynamic Price */}
              {(() => {
                const isRental = currentProperty.listing_type === "RENT" || currentProperty.listing_type === "SALE_AND_RENT" || currentProperty.listing_type === "BOTH";
                const isSale = currentProperty.listing_type === "SALE" || currentProperty.listing_type === "SALE_AND_RENT" || currentProperty.listing_type === "BOTH";

                const rentVal = currentProperty.rental_price || currentProperty.rent_price || (isRental ? currentProperty.price : null);
                const saleVal = currentProperty.sale_price || (isSale && currentProperty.price !== rentVal ? currentProperty.price : null);

                const formatMil = (val: number) => {
                  if (val >= 1_000_000) {
                    const millionVal = (val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 2);
                    if (language === "en") return `฿${millionVal}M`;
                    if (language === "cn") return `฿${millionVal}百万`;
                    if (language === "ru") return `฿${millionVal} млн`;
                    return `฿${millionVal} ล้าน`;
                  }
                  return `฿${val.toLocaleString("th-TH")}`;
                };

                const formatR = (val: number) => {
                  const formatted = val.toLocaleString("th-TH");
                  if (language === "en") return `฿${formatted}/mo`;
                  if (language === "cn") return `฿${formatted}/月`;
                  if (language === "ru") return `฿${formatted}/мес`;
                  return `฿${formatted}/เดือน`;
                };

                if (rentVal && saleVal && (currentProperty.listing_type === "BOTH" || currentProperty.listing_type === "SALE_AND_RENT")) {
                  return (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-800 text-xs font-black border border-amber-300/60 shadow-2xs">
                        {formatR(rentVal)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 text-xs font-black border border-emerald-300/60 shadow-2xs">
                        {formatMil(saleVal)}
                      </span>
                    </div>
                  );
                }

                if (rentVal && (currentProperty.listing_type === "RENT" || !saleVal)) {
                  return (
                    <span className="text-base sm:text-lg font-black text-amber-600 shrink-0 drop-shadow-2xs">
                      {formatR(rentVal)}
                    </span>
                  );
                }

                if (saleVal || currentProperty.price) {
                  return (
                    <span className="text-base sm:text-lg font-black text-emerald-600 shrink-0 drop-shadow-2xs">
                      {formatMil(saleVal || currentProperty.price!)}
                    </span>
                  );
                }

                return (
                  <span className="text-xs font-bold text-amber-700 shrink-0">
                    {language === "en" ? "Contact" : "สอบถามราคา"}
                  </span>
                );
              })()}

              {/* Inline Specs */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-600 font-semibold border-l border-slate-200 pl-2.5">
                {(currentProperty.bedrooms !== undefined && currentProperty.bedrooms !== null) && (
                  <div className="flex items-center gap-1">
                    <Bed className="w-3 h-3 text-blue-600" />
                    <span>{currentProperty.bedrooms}</span>
                  </div>
                )}

                {(currentProperty.bathrooms !== undefined && currentProperty.bathrooms !== null) && (
                  <div className="flex items-center gap-1">
                    <Bath className="w-3 h-3 text-indigo-600" />
                    <span>{currentProperty.bathrooms}</span>
                  </div>
                )}

                {((currentProperty.usable_area || currentProperty.size_sqm) !== undefined && (currentProperty.usable_area || currentProperty.size_sqm) !== null) && (
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-emerald-600" />
                    <span>{currentProperty.usable_area || currentProperty.size_sqm} ㎡</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Action Button */}
            <Link
              href={detailLink}
              className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0 active:scale-95 shadow-blue-500/20"
            >
              <span>
                {language === "en"
                  ? "View"
                  : language === "cn"
                  ? "详情"
                  : language === "ru"
                  ? "Инфо"
                  : "ดูรายละเอียด"}
              </span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </>
);
}
