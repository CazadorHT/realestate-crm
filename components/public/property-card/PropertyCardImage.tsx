"use client";

import Image from "next/image";
import { Heart, PawPrint, ChevronLeft, ChevronRight } from "lucide-react";
import { IoShieldCheckmark } from "react-icons/io5";
import { getTypeLabel, getListingBadge } from "@/lib/property-utils";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MdOutlinePets } from "react-icons/md";
import { useState, useRef, useEffect } from "react";

interface PropertyCardImageProps {
  property: PropertyCardProps;
  priority?: boolean;
  isFavorite: boolean;
  isAnimating: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  comparisonBadges: { label: string; color: string }[];
  areaProvince: string;
}

export function PropertyCardImage({
  property,
  priority = false,
  isFavorite,
  isAnimating,
  onFavoriteClick,
  comparisonBadges,
  areaProvince,
}: PropertyCardImageProps) {
  const { t } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayImages =
    property.images && property.images.length > 0
      ? property.images
      : ([property.image_url].filter(Boolean) as string[]);

  const badge = getListingBadge(property.listing_type);

  // Handle scroll for pagination dots
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      if (index !== activeImageIndex) {
        setActiveImageIndex(index);
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
    <div className="group/image relative aspect-square sm:aspect-4/3 md:aspect-square h-auto sm:h-auto md:h-[300px] w-full overflow-hidden rounded-t-2xl sm:rounded-t-2xl md:rounded-t-3xl bg-slate-200 group-hover:after:bg-black/5">
      {displayImages.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x"
        >
          {displayImages.map((img, index) => (
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover object-top transform-gpu will-change-transform"
                priority={priority && index === 0}
                loading={priority && index === 0 ? "eager" : "lazy"}
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
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none opacity-100 md:opacity-0 md:group-hover/image:opacity-100 transition-opacity duration-300">
          {displayImages.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeImageIndex
                  ? "w-4 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  : "w-1 bg-white/60 shadow-sm"
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
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover/image:opacity-100 transition-all duration-300 shadow-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover/image:opacity-100 transition-all duration-300 shadow-sm"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-t-2xl md:rounded-t-3xl bg-linear-to-t from-black/50 via-transparent to-transparent" />

      {/* Badge Overlay Container */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
        {/* Verified Badge */}
        {property.verified && (
          <div className="group/verified flex items-center bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-lg transition-all duration-300 hover:pr-3 cursor-default">
            <IoShieldCheckmark className="w-5 h-5" />
            <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 group-hover/verified:max-w-[100px] group-hover/verified:opacity-100 group-hover/verified:ml-1.5">
              VERIFIED
            </span>
          </div>
        )}

        {/* Comparison Badges */}
        {comparisonBadges.map((b, idx) => (
          <div
            key={idx}
            className={`flex items-center px-2 py-1 rounded-md shadow-sm border border-white/20 text-[10px] font-bold ${b.color} backdrop-blur-md`}
          >
            {b.label}
          </div>
        ))}
      </div>

      {property.meta_keywords?.includes("Pet Friendly") && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-20">
          <MdOutlinePets className="w-4 h-4 rotate-25" />
          <span>Pet Friendly</span>
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={onFavoriteClick}
        className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
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
