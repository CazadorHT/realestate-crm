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
  project_name?: string | null;
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
  properties: initialProperties,
  language = "th",
  autoPlayIntervalMs = 4500,
}: FeaturedStoryCarouselProps) {
  const [properties, setProperties] = useState<StoryPropertyItem[]>(initialProperties);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Client-side refresh: fetch latest properties to ensure new ones appear immediately
  useEffect(() => {
    if (initialProperties && initialProperties.length > 0) return;

    const controller = new AbortController();
    fetch("/api/public/properties?sort=NEWEST&limit=6", {
      signal: controller.signal,
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.properties && Array.isArray(data.properties) && data.properties.length > 0) {
          setProperties(data.properties.slice(0, 6));
          // Reset index if it's out of bounds after data change
          setCurrentIndex((prev) => prev >= data.properties.slice(0, 6).length ? 0 : prev);
        }
      })
      .catch(() => {
        // Silently fall back to server-rendered initialProperties
      });
    return () => controller.abort();
  }, []);

  const totalItems = properties.length;
  const currentProperty = properties[currentIndex] || properties[0];

  // Helper for localized title
  const getDisplayTitle = useCallback(
    (item: StoryPropertyItem) => {
      if (!item) return "";
      if (language === "en" && item.title_en) return item.title_en;
      if (language === "cn" && item.title_cn) return item.title_cn;
      if (language === "ru" && item.title_ru) return item.title_ru;
      return item.title || item.project_name || item.projects?.name_th || "ทรัพย์คุณภาพไฮไลท์";
    },
    [language]
  );

  // Helper for localized project name
  const getProjectName = useCallback(
    (item: StoryPropertyItem) => {
      if (!item) return "";
      if (language !== "th") {
        return item.projects?.name_en || item.projects?.name_th || item.project_name || getDisplayTitle(item);
      }
      return item.projects?.name_th || item.projects?.name_en || item.project_name || getDisplayTitle(item);
    },
    [language, getDisplayTitle]
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
        className="relative w-full max-w-full mx-auto bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-200/80 text-slate-900 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Segmented Story Progress Bar (Hardware-Accelerated CSS Keyframes) */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-3.5 bg-linear-to-b from-black/50 via-black/20 to-transparent flex gap-1.5 items-center">
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
                  className="h-full bg-linear-to-r from-blue-400 via-indigo-400 to-sky-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.9)]"
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

        {/* Hero Image Container (Supports Landscape & Portrait via Ambient Blurred Backdrop) */}
        <div className="relative w-full h-[350px] sm:h-[400px] overflow-hidden bg-slate-100">
          <AnimatePresence mode="sync">
            <m.div
              key={currentProperty.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Ambient Blurred Backdrop (Fills empty edges naturally for portrait images) */}
              <Image
                src={currentImageUrl}
                alt=""
                fill
                className="object-cover scale-110 blur-lg opacity-80 select-none pointer-events-none"
                priority
              />

              {/* Main Crisp Image (Fully visible without awkward cropping) */}
              <Image
                src={currentImageUrl}
                alt={getDisplayTitle(currentProperty)}
                fill
                className="object-contain relative z-10 transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />
            </m.div>
          </AnimatePresence>

          {/* Top Gradient Shadow ONLY for Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-black/50 to-transparent pointer-events-none z-10" />

          {/* Top Header Overlay Badges */}
          <div className="absolute top-6 left-4 right-4 z-20 flex justify-between items-center mt-2">
            <div className="flex items-center gap-2 max-w-[75%]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-slate-900 text-xs font-semibold shadow-lg border border-white/90 ring-1 ring-slate-900/5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />
                <span className="truncate">
                  {getProjectName(currentProperty)}
                </span>
              </span>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white/80 backdrop-blur-md border border-white/20 opacity-60 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
              title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>

          {/* Manual Left/Right Navigation Arrows (Subtle Translucent Glass Pills) */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/90 backdrop-blur-md border border-white/20 shadow-xs opacity-60 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
            aria-label="Previous property"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/90 backdrop-blur-md border border-white/20 shadow-xs opacity-60 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
            aria-label="Next property"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bright Modern Info Panel Below Image */}
        <div className="p-4 sm:p-5 bg-white space-y-3 border-t border-slate-100">
          {/* Row 1: Title & Location Badge */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate  max-w-[70%] group-hover:text-blue-600 transition-colors">
              {getDisplayTitle(currentProperty)}
            </h3>

            {(currentProperty.transit_station || currentProperty.popular_area) && (
              <div className="flex items-center gap-1 text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 shrink-0 shadow-2xs">
                <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate max-w-[120px]">
                  {currentProperty.transit_station || currentProperty.popular_area}
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Price + Specs + Action Button */}
          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
            {/* Price & Specs Left Cluster */}
            <div className="flex items-center gap-3 truncate">
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
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50/50 text-amber-600 text-md sm:text-lg font-bold border border-amber-200/80 shadow-2xs">
                        {formatR(rentVal)}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50/50 text-emerald-800 text-md sm:text-lg font-bold border border-emerald-200/80 shadow-2xs">
                        {formatMil(saleVal)}
                      </span>
                    </div>
                  );
                }

                if (rentVal && (currentProperty.listing_type === "RENT" || !saleVal)) {
                  return (
                    <span className="text-lg shrink-0 px-2.5 py-1 rounded-lg bg-amber-50/50 text-amber-600 text-md sm:text-lg font-bold border border-amber-200/80 shadow-2xs">
                      {formatR(rentVal)}
                    </span>
                  );
                }

                if (saleVal || currentProperty.price) {
                  return (
                    <span className="text-lg shrink-0 px-2.5 py-1 rounded-lg bg-emerald-50/50 text-emerald-800 text-md sm:text-lg font-bold border border-emerald-200/80 shadow-2xs">
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

              {/* Inline Specs Pills */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-semibold border-l border-slate-200 pl-3">
                {(currentProperty.bedrooms !== undefined && currentProperty.bedrooms !== null) && (
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Bed className="w-3.5 h-3.5 text-blue-600" />
                    <span>{currentProperty.bedrooms}</span>
                  </div>
                )}

                {(currentProperty.bathrooms !== undefined && currentProperty.bathrooms !== null) && (
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Bath className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{currentProperty.bathrooms}</span>
                  </div>
                )}

                {((currentProperty.usable_area || currentProperty.size_sqm) !== undefined && (currentProperty.usable_area || currentProperty.size_sqm) !== null) && (
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentProperty.usable_area || currentProperty.size_sqm} ㎡</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Action Button */}
            <Link
              href={detailLink}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all shrink-0 active:scale-95"
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
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
