"use client";

import Link from "next/link";
import { CheckSquare, Square, Sparkles } from "lucide-react";
import { PiFireFill } from "react-icons/pi";
import { 
  HiArrowTrendingDown, 
  HiArrowsPointingOut, 
  HiOutlineSparkles 
} from "react-icons/hi2";
import { useEffect, useState, useRef, useCallback, MouseEvent } from "react";
import { toggleCompareId, readCompareIds } from "@/lib/compare-store";
import { toggleFavoriteId, readFavoriteIds } from "@/lib/favorite-store";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";

// New Sub-components
import { PropertyCardImage } from "./property-card/PropertyCardImage";
import { PropertyCardInfo } from "./property-card/PropertyCardInfo";
import { PropertyCardSpecs } from "./property-card/PropertyCardSpecs";
import { PropertyCardFeatures } from "./property-card/PropertyCardFeatures";
import { PropertyCardFooter } from "./property-card/PropertyCardFooter";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { FaFire,  } from "react-icons/fa6";

// Re-using types or defining subset
export type PropertyCardProps = {
  id: string;
  slug?: string | null;
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_cn?: string | null;
  property_type: string | null;
  price?: number | null;
  rental_price?: number | null;
  price_en?: number | null;
  price_cn?: number | null;
  rental_price_en?: number | null;
  rental_price_cn?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  popular_area?: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  province?: string | null;
  created_at: string;
  updated_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  image_url?: string | null;
  images?: string[] | null;
  location?: string | null;
  size_sqm?: number | null;
  parking_slots?: number | null;
  floor?: number | null;
  price_per_sqm?: number | null;
  rent_price_per_sqm?: number | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  verified?: boolean;
  min_contract_months?: number | null;
  meta_keywords?: string[] | null;
  near_transit?: boolean | null;
  is_fully_furnished?: boolean | null;
  is_pet_friendly?: boolean | null;
  is_foreigner_quota?: boolean | null;
  is_tax_registered?: boolean | null;
  features?:
    | {
        id: string;
        name: string;
        name_en?: string | null;
        name_cn?: string | null;
        icon_key: string;
      }[]
    | null;
  footerVariant?: "default" | "minimal";
};

export function PropertyCard({
  property,
  priority = false,
  compareWith,
  footerVariant,
}: {
  property: PropertyCardProps;
  priority?: boolean;
  compareWith?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
  footerVariant?: "default" | "minimal";
}) {
  const { t, language } = useLanguage();
  const [isInCompare, setIsInCompare] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Sync with compare store
  useEffect(() => {
    const check = () => {
      const ids = readCompareIds();
      setIsInCompare(ids.includes(property.id));
    };
    check();
    window.addEventListener("compare-updated", check);
    return () => window.removeEventListener("compare-updated", check);
  }, [property.id]);

  // Sync with favorite store
  useEffect(() => {
    const check = () => {
      const ids = readFavoriteIds();
      setIsFavorite(ids.includes(property.id));
    };
    check();
    window.addEventListener("favorite-updated", check);
    return () => window.removeEventListener("favorite-updated", check);
  }, [property.id]);

  const [isAnimating, setIsAnimating] = useState(false);

  const handleCompareClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInCompare) {
      pushToDataLayer(GTM_EVENTS.ADD_COMPARE, {
        item_id: property.id,
        item_name: property.title,
        // Meta Pixel
        content_ids: [property.id],
        content_name: property.title,
        content_type: "product",
      });
      updateAIScore(10);
    }

    toggleCompareId(property.id);
  };

  const handleFavoriteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    if (!isFavorite) {
      pushToDataLayer(GTM_EVENTS.ADD_FAVORITE, {
        item_id: property.id,
        item_name: property.title,
        // Meta Pixel
        content_ids: [property.id],
        content_name: property.title,
        content_type: "product",
        value: property.listing_type === "RENT" ? property.rental_price : property.price,
        currency: "THB",
      });
      updateAIScore(30);
    }
    toggleFavoriteId(property.id);
  };

  const areaProvince = [
    getLocaleValue(property, "popular_area", language),
    getProvinceName(property.province || "", language),
  ]
    .filter(Boolean)
    .join(" • ");

  // Comparison Logic
  const comparisonBadges = [];
  if (compareWith) {
    const currentPrice =
      property.listing_type === "RENT" ? property.rental_price : property.price;
    const comparePrice = compareWith.price;

    if (currentPrice && comparePrice && currentPrice < comparePrice) {
      comparisonBadges.push({
        label: t("common.save_more"),
        icon: HiArrowTrendingDown,
        color: "bg-green-600/90 text-white",
      });
    }

    if (
      property.size_sqm &&
      compareWith.size &&
      property.size_sqm > compareWith.size
    ) {
      comparisonBadges.push({
        label: t("common.larger_area"),
        icon: HiArrowsPointingOut,
        color: "bg-[#4285F4]/90 text-white", // Matches verified blue
      });
    }

    if (
      property.created_at &&
      compareWith.date &&
      new Date(property.created_at) > new Date(compareWith.date)
    ) {
      comparisonBadges.push({
        label: t("common.newer"),
        icon: HiOutlineSparkles,
        color: "bg-purple-600/90 text-white",
      });
    }
  }

  const isHotDeal = 
    (property.original_price && property.price && property.price < property.original_price) ||
    (property.original_rental_price && property.rental_price && property.rental_price < property.original_rental_price) ||
    property.meta_keywords?.includes("Hot Deal") || property.meta_keywords?.includes("HotDeal") || property.meta_keywords?.includes("hot deal");

  const cardRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpression = useRef(false);

  // Card Impression tracking via IntersectionObserver
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedImpression.current) {
          hasTrackedImpression.current = true;
          pushToDataLayer(GTM_EVENTS.CARD_IMPRESSION, {
            item_id: property.id,
            item_name: property.title,
            content_ids: [property.id],
            content_type: "product",
            property_type: property.property_type,
            listing_type: property.listing_type,
            price: property.listing_type === "RENT" ? property.rental_price : property.price,
          });
        }
      },
      { threshold: 0.5 }, // 50% ของการ์ดต้องเห็นบนหน้าจอ
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [property.id, property.title, property.property_type, property.listing_type, property.price, property.rental_price]);

  // Card Click tracking
  const handleCardClick = useCallback(() => {
    pushToDataLayer(GTM_EVENTS.CARD_CLICK, {
      item_id: property.id,
      item_name: property.title,
      content_ids: [property.id],
      content_type: "product",
      property_type: property.property_type,
      listing_type: property.listing_type,
      price: property.listing_type === "RENT" ? property.rental_price : property.price,
    });
    updateAIScore(5);
  }, [property.id, property.title, property.property_type, property.listing_type, property.price, property.rental_price]);

  return (
    <div ref={cardRef} className="group relative isolate rounded-2xl sm:rounded-2xl md:rounded-3xl w-full max-w-[360px] md:max-w-none mx-auto bg-white shadow-md h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 before:content-[''] before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-2xl md:before:rounded-3xl before:ring-inset before:pointer-events-none before:z-10 cursor-pointer">
      <style jsx global>{`
        @keyframes fire-flicker {
          0% { transform: scale(1) rotate(-12deg) translateZ(0); }
          50% { transform: scale(1.05) rotate(-11deg) translateZ(0); opacity: 0.9; }
          100% { transform: scale(1) rotate(-12deg) translateZ(0); }
        }
        @keyframes glow-pulse {
          0% { opacity: 0.3; transform: scale(1) translateZ(0); }
          50% { opacity: 0.5; transform: scale(1.15) translateZ(0); }
          100% { opacity: 0.3; transform: scale(1) translateZ(0); }
        }
      `}</style>
      {isHotDeal && (
        <div className="absolute -top-5 -left-3 md:-top-7 md:-left-5 z-40 block select-none pointer-events-none transform-gpu will-change-[transform,opacity]">
          <div className="relative">
            {/* Pulsing Glow Background */}
            <div className="absolute inset-0 bg-red-500 rounded-full blur-md animate-[glow-pulse_3s_infinite_ease-in-out] will-change-[transform,opacity]"></div>
            
            {/* The Badge Itself */}
            <div className="relative bg-linear-to-br from-red-500 to-orange-600 text-white p-2 md:p-2.5 rounded-full shadow-[0_4px_16px_rgba(239,68,68,0.4)] border border-white/20 transform animate-[fire-flicker_4s_infinite_ease-in-out] group-hover:animate-none group-hover:rotate-0 group-hover:scale-110 transition-all duration-700 ease-out will-change-transform">
              <PiFireFill className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 fill-yellow-200 drop-shadow-[0_0_8px_rgba(254,240,138,0.6)]" />
            </div>
          </div>
        </div>
      )}
      <Link
        href={`/properties/${property.slug || property.id}`}
        className="flex flex-col h-full focus:outline-none overflow-hidden rounded-2xl sm:rounded-2xl md:rounded-3xl"
        aria-label={`${t("common.view_all")} ${property.title}`}
        onClick={handleCardClick}
      >
        <PropertyCardImage
          property={property}
          priority={priority}
          isFavorite={isFavorite}
          isAnimating={isAnimating}
          onFavoriteClick={handleFavoriteClick}
          comparisonBadges={comparisonBadges}
          areaProvince={areaProvince}
        />

        {/* Content Section */}
        <div className="pt-2 pb-4 sm:pb-5 md:pb-6 px-4 mt-2 sm:mt-2 md:mt-3 gap-y-2 sm:gap-y-2 md:gap-y-3 grow min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex flex-col">
          <PropertyCardInfo property={property} areaProvince={areaProvince} />

          <PropertyCardSpecs property={property} />

          <PropertyCardFeatures features={property.features} />

          {/* Compare Checkbox Button */}
          <button
            onClick={handleCompareClick}
            className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${
              isInCompare
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {isInCompare ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {t("common.compare")}
          </button>
        </div>

        <PropertyCardFooter
          property={property}
          variant={footerVariant || property.footerVariant}
        />
      </Link>
    </div>
  );
}
