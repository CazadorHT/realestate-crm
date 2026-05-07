"use client";

import Image from "next/image";
import { Heart, PawPrint, ChevronLeft, ChevronRight } from "lucide-react";
import { IoShieldCheckmark } from "react-icons/io5";
import { getTypeLabel, getListingBadge } from "@/lib/property-utils";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MdOutlinePets } from "react-icons/md";
import { PiFireFill } from "react-icons/pi";
import { useState, useRef, useEffect, useCallback } from "react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";

interface PropertyCardImageProps {
  property: PropertyCardProps;
  priority?: boolean;
  isFavorite: boolean;
  isAnimating: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  comparisonBadges: { label: string; icon: any; color: string }[];
  areaProvince: string;
  isHotDeal?: boolean;
}

export function PropertyCardImage({
  property,
  priority = false,
  isFavorite,
  isAnimating,
  onFavoriteClick,
  comparisonBadges,
  areaProvince,
  isHotDeal = false,
}: PropertyCardImageProps) {
  const { t } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isInteracted, setIsInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tracking refs (prevent duplicate fires per card instance)
  const hasTrackedSlide = useRef(false);
  const hasTrackedMid = useRef(false);
  const hasTrackedHalf = useRef(false);
  const hasTrackedDeep = useRef(false);
  const hasTrackedAll = useRef(false);
  const viewedImages = useRef(new Set<number>());

  // Touch handling refs for directional swipe detection
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Normalized images list from both possible formats (string array or object array with .url)
  const displayImages = (() => {
    const rawImages: (string | { url: string } | null | undefined)[] = 
      property.images && property.images.length > 0
        ? property.images
        : [property.image_url];
    
    return (rawImages || [])
      .filter((img): img is string | { url: string } => img !== null && img !== undefined)
      .map(img => {
        if (typeof img === 'string') return img;
        return (img as { url: string }).url;
      })
      .filter(url => typeof url === 'string' && url.trim() !== "");
  })();

  const badge = getListingBadge(property.listing_type);

  const trackImageParams = useCallback(() => ({
    item_id: property.id,
    item_name: property.title,
    content_ids: [property.id],
    content_type: "product",
  }), [property.id, property.title]);

  // Touch handlers: detect horizontal vs vertical swipe direction
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null; // reset direction
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;

    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    // Determine direction on first significant move (threshold: 5px)
    if (isHorizontalSwipe.current === null && (dx > 5 || dy > 5)) {
      isHorizontalSwipe.current = dx > dy;
    }

    // If vertical swipe: let browser handle scrolling naturally
    if (isHorizontalSwipe.current === false) {
      scrollRef.current.style.overflowX = "hidden";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Re-enable horizontal scroll after touch ends
    if (scrollRef.current) {
      scrollRef.current.style.overflowX = "auto";
    }
    isHorizontalSwipe.current = null;
  }, []);

  // Handle scroll for pagination dots + tracking
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      if (index !== activeImageIndex) {
        setActiveImageIndex(index);

        // Track viewed images
        viewedImages.current.add(index);
        const uniqueCount = viewedImages.current.size;

        // 1) First slide: image_slide
        if (!hasTrackedSlide.current && index > 0) {
          hasTrackedSlide.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE, {
            ...trackImageParams(),
            total_images: displayImages.length,
          });
          updateAIScore(2);
        }

        // 1.5) Viewed 3+ unique images: image_slide_mid (but less than 10)
        if (!hasTrackedMid.current && uniqueCount >= 3 && uniqueCount < 10) {
          hasTrackedMid.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_MID, {
            ...trackImageParams(),
            images_viewed: uniqueCount,
            total_images: displayImages.length,
          });
          updateAIScore(3);
        }

        // 1.8) Viewed > 50% of images: image_slide_half
        if (!hasTrackedHalf.current && uniqueCount > displayImages.length / 2 && displayImages.length > 2) {
          hasTrackedHalf.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_HALF, {
            ...trackImageParams(),
            images_viewed: uniqueCount,
            total_images: displayImages.length,
          });
          updateAIScore(4);
        }

        // 2) Viewed 10+ unique images: image_slide_deep
        if (!hasTrackedDeep.current && uniqueCount >= 10) {
          hasTrackedDeep.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_DEEP, {
            ...trackImageParams(),
            images_viewed: uniqueCount,
            total_images: displayImages.length,
          });
          updateAIScore(5);
        }

        // 3) Viewed ALL images: image_slide_all
        if (!hasTrackedAll.current && uniqueCount >= displayImages.length && displayImages.length > 1) {
          hasTrackedAll.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_ALL, {
            ...trackImageParams(),
            total_images: displayImages.length,
          });
          updateAIScore(8);
        }
      }
    }
  };

  const scrollPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
    // Track image click (arrow navigation)
    pushToDataLayer(GTM_EVENTS.IMAGE_CLICK, {
      ...trackImageParams(),
      direction: "prev",
      current_index: activeImageIndex,
    });
  };

  const scrollNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
    // Track image click (arrow navigation)
    pushToDataLayer(GTM_EVENTS.IMAGE_CLICK, {
      ...trackImageParams(),
      direction: "next",
      current_index: activeImageIndex,
    });
  };

  // Translate badge label if needed
  const displayBadgeLabel = badge
    ? badge.label === "ขาย"
      ? t("common.sale")
      : badge.label === "เช่า"
        ? t("common.rent")
        : badge.label === "ขาย/เช่า"
          ? `${t("common.sale")}/${t("common.rent")}`
          : badge.label
    : null;

  return (
    <div 
      onMouseEnter={() => setIsInteracted(true)}
      onTouchStartCapture={() => setIsInteracted(true)}
      className="group/image relative aspect-square sm:aspect-4/3 md:aspect-square h-auto sm:h-auto md:h-[300px] w-full overflow-hidden rounded-t-2xl sm:rounded-t-2xl md:rounded-t-3xl bg-slate-200 group-hover:after:bg-black/5"
    >
      {displayImages.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={isInteracted ? handleScroll : undefined}
          onPointerDown={() => setIsInteracted(true)}
          className={`flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-none ${!isInteracted ? "overflow-hidden" : ""}`}
        >
          {(!isInteracted ? displayImages.slice(0, 1) : displayImages).map((img, index) => (
            <div
              key={index}
              className="relative h-full w-full shrink-0 snap-start"
            >
              <Image
                src={img}
                alt={`${
                  property.listing_type === "RENT"
                    ? t("common.rent")
                    : property.listing_type === "SALE"
                      ? t("common.sale")
                      : `${t("common.sale")}/${t("common.rent")}`
                } ${t(
                  `property_types.${property.property_type?.toLowerCase() || "other"}`,
                )} - ${property.title}${
                  areaProvince ? ` ${t("nav.properties")} ${areaProvince}` : ""
                } - Image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 95vw, (max-width: 1024px) 48vw, (max-width: 1280px) 31vw, 23vw"
                className="object-cover object-top transform-gpu will-change-transform"
                priority={priority && index === 0}
                {...(!(priority && index === 0) && { loading: "lazy" })}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
          {t("recently_viewed.no_image")}
        </div>
      )}

      {/* Pagination Dots */}
      {isInteracted && displayImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none opacity-100 xl:opacity-0 xl:group-hover/image:opacity-100 transition-opacity duration-300">
          {displayImages
            .slice(
              Math.floor(activeImageIndex / 10) * 10,
              Math.floor(activeImageIndex / 10) * 10 + 10
            )
            .map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === activeImageIndex % 10
                    ? "w-4 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                    : "w-1 bg-white/80 shadow-sm"
                }`}
              />
            ))}
        </div>
      )}

      {/* Navigation Arrows (Desktop Only) */}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover/image:opacity-100 transition-all duration-300 shadow-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover/image:opacity-100 transition-all duration-300 shadow-sm"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-t-2xl md:rounded-t-3xl bg-linear-to-t from-black/50 via-transparent to-transparent" />

      {/* Badge Overlay Container */}
      <div className="absolute top-3 left-3 flex flex-col items-start gap-2 z-20">
        {/* Hot Deal Badge */}
        {isHotDeal && (
          <div className={`flex items-center bg-linear-to-br from-red-500 to-orange-600 text-white p-1.5 rounded-full shadow-lg transition-all duration-300 cursor-default ${activeImageIndex === 0 ? "group-hover:pr-3" : ""}`}>
            <PiFireFill className="w-5 h-5 fill-yellow-200" />
            <span className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 ${activeImageIndex === 0 ? "group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1.5" : ""}`}>
              HOT DEAL
            </span>
          </div>
        )}


        {/* Verified Badge */}
        {property.verified && (
          <div className={`flex items-center bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-lg transition-all duration-300 cursor-default ${activeImageIndex === 0 ? "group-hover:pr-3" : ""}`}>
            <IoShieldCheckmark className="w-5 h-5" />
            <span className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 ${activeImageIndex === 0 ? "group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1.5" : ""}`}>
              VERIFIED
            </span>
          </div>
        )}

        {/* Pet Friendly Badge */}
        {property.meta_keywords?.includes("Pet Friendly") && (
          <div className={`flex items-center bg-white/90 backdrop-blur-md text-orange-600 p-1.5 rounded-full shadow-lg transition-all duration-300 cursor-default ${activeImageIndex === 0 ? "group-hover:pr-3" : ""}`}>
            <MdOutlinePets className="w-5 h-5 rotate-25" />
            <span className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 uppercase ${activeImageIndex === 0 ? "group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1.5" : ""}`}>
              Pet Friendly
            </span>
          </div>
        )}

        {/* Comparison Badges */}
        {comparisonBadges.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className={`flex items-center ${b.color} backdrop-blur-md p-1.5 rounded-full shadow-lg transition-all duration-300 cursor-default ${activeImageIndex === 0 ? "group-hover/image:pr-3" : ""}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 uppercase ${activeImageIndex === 0 ? "group-hover/image:max-w-[120px] group-hover/image:opacity-100 group-hover/image:ml-1.5" : ""}`}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>


      {/* Favorite Button */}
      <button
        onClick={onFavoriteClick}
        aria-label={isFavorite ? t("common.remove_favorite") || "Remove from favorite" : t("common.add_favorite") || "Add to favorite"}
        className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 z-30 ${
          isFavorite
            ? "bg-red-500 text-white"
            : "bg-white/40 text-[#1B263B] hover:bg-red-500 hover:text-white"
        } ${isAnimating ? "scale-125" : "scale-100"}`}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-500 ${
            isFavorite ? "fill-current scale-110" : "scale-100"
          } ${isAnimating ? "animate-pulse" : ""}`}
          style={{
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </button>

      {displayBadgeLabel && (
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md border border-white/30 text-[#12213b] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          {displayBadgeLabel}
        </div>
      )}
    </div>
  );
}
