"use client";

import Link from "next/link";
import { CheckSquare, Square } from "lucide-react";
import { PiFireFill } from "react-icons/pi";
import { 
  HiArrowTrendingDown, 
  HiArrowsPointingOut, 
  HiOutlineSparkles 
} from "react-icons/hi2";
import { useEffect, useState, useRef, useCallback, MouseEvent, memo } from "react";
import { toggleCompareId, readCompareIds } from "@/lib/compare-store";
import { toggleFavoriteId, readFavoriteIds } from "@/lib/favorite-store";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { useRouter } from "next/navigation";

// New Sub-components
import { PropertyCardImage } from "./property-card/PropertyCardImage";
import { PropertyCardInfo } from "./property-card/PropertyCardInfo";
import { PropertyCardSpecs } from "./property-card/PropertyCardSpecs";
import { PropertyCardFeatures } from "./property-card/PropertyCardFeatures";
import { PropertyCardFooter } from "./property-card/PropertyCardFooter";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { getEffectivePrice } from "@/lib/property-hardened-utils";

// Re-using types or defining subset
export type PropertyCardProps = {
  id: string;
  slug?: string | null;
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  title_ru?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_cn?: string | null;
  description_ru?: string | null;
  property_type: string | null;
  price?: number | null;
  rental_price?: number | null;
  price_en?: number | null;
  price_cn?: number | null;
  price_ru?: number | null;
  rental_price_en?: number | null;
  rental_price_cn?: number | null;
  rental_price_ru?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  popular_area?: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  popular_area_ru?: string | null;
  popular_area_slug?: string | null;
  project_name?: string | null;
  project_slug?: string | null;
  projects?: {
    name_th?: string | null;
    name_en?: string | null;
    slug?: string | null;
  } | null;
  province?: string | null;
  created_at: string;
  created_at_time?: number;
  bumped_at?: string | null;
  meta_data?: Record<string, unknown> | null;
  updated_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  image_url?: string | null;
  images?: (string | { url: string })[] | null;
  location?: string | null;
  size_sqm?: number | null;
  land_size_sqwah?: number | null;
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
  transit_type?: string | null;
  transit_station_name?: string | null;
  transit_station_name_en?: string | null;
  transit_station_name_cn?: string | null;
  transit_station_name_ru?: string | null;
  transit_distance_meters?: number | null;
  is_fully_furnished?: boolean | null;
  is_pet_friendly?: boolean | null;
  is_foreigner_quota?: boolean | null;
  is_tax_registered?: boolean | null;
  is_hot_deal?: boolean | null;
  allow_airbnb?: boolean | null;
  is_cbd?: boolean | null;
  airbnb_daily_price?: number | null;
  airbnb_monthly_price?: number | null;
  ai_summary_content?: string | null;
  features?:
    | {
        id: string;
        name: string;
        name_en?: string | null;
        name_cn?: string | null;
        name_ru?: string | null;
        icon_key: string;
      }[]
    | null;
  nearby_transits?:
    | {
        type: string;
        station_name: string;
        station_name_en?: string | null;
        station_name_cn?: string | null;
        station_name_ru?: string | null;
        distance_meters?: number | null;
      }[]
    | null;
  footerVariant?: "default" | "minimal";
};

/**
 * [Diamond-Grade] Performance Optimized Property Card
 */
function PropertyCardComponent({
  property,
  priority = false,
  compareWith,
  footerVariant,
  hideShare = false,
}: {
  property: PropertyCardProps;
  priority?: boolean;
  compareWith?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
  footerVariant?: "default" | "minimal";
  hideShare?: boolean;
}) {
  const { t, language } = useLanguage();
  const [isInCompare, setIsInCompare] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();
  const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const check = () => {
      const ids = readCompareIds();
      setIsInCompare(ids.includes(property.id));
    };
    check();
    window.addEventListener("compare-updated", check);
    return () => window.removeEventListener("compare-updated", check);
  }, [property.id]);

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
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    if (!isFavorite) {
      pushToDataLayer(GTM_EVENTS.ADD_FAVORITE, {
        item_id: property.id,
        item_name: property.title,
        content_ids: [property.id],
        content_name: property.title,
        content_type: "product",
        value: prices.rentalPrice || prices.salePrice,
        currency: "THB",
      });
      updateAIScore(30);
    }
    toggleFavoriteId(property.id);
  };

  const areaProvince = [
    getLocaleValue(property, "popular_area", language),
    getProvinceName(property.province || "", language),
  ].filter(Boolean).join(" • ");

  const prices = getEffectivePrice(property);

  const comparisonBadges = [];
  if (compareWith) {
    const currentPrice = property.listing_type === "RENT" ? prices.rentalPrice : prices.salePrice;
    const comparePrice = compareWith.price;
    if (currentPrice && comparePrice && currentPrice < comparePrice) {
      comparisonBadges.push({ label: t("common.save_more"), icon: HiArrowTrendingDown, color: "bg-green-600/90 text-white" });
    }
    if (property.size_sqm && compareWith.size && property.size_sqm > compareWith.size) {
      comparisonBadges.push({ label: t("common.larger_area"), icon: HiArrowsPointingOut, color: "bg-[#4285F4]/90 text-white" });
    }
    if (property.created_at && compareWith.date && new Date(property.created_at) > new Date(compareWith.date)) {
      comparisonBadges.push({ label: t("common.newer"), icon: HiOutlineSparkles, color: "bg-purple-600/90 text-white" });
    }
  }

  const isHotDeal = prices.hasSaleDiscount || prices.hasRentalDiscount || property.meta_keywords?.some(k => k.toLowerCase().includes("hot deal") || k.toLowerCase().includes("hotdeal"));

  const cardRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
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
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [property.id, property.title, property.property_type, property.listing_type, property.price, property.rental_price]);

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

  const handleMouseEnter = () => {
    prefetchTimerRef.current = setTimeout(() => {
      router.prefetch(`/properties/${property.slug || property.id}`);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
  };

  return (
    <div 
      ref={cardRef} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative isolate rounded-2xl sm:rounded-2xl md:rounded-3xl w-full max-w-[360px] md:max-w-none mx-auto bg-white shadow-md h-full flex flex-col transition-transform duration-300 ease-out hover:-translate-y-1.5 after:content-[''] after:absolute after:inset-0 after:rounded-2xl sm:after:rounded-2xl md:after:rounded-3xl after:shadow-xl after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100 after:pointer-events-none after:-z-10 before:content-[''] before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-2xl md:before:rounded-3xl before:ring-inset before:pointer-events-none before:z-10 ${isInCompare ? "ring-2 ring-blue-500/80 bg-blue-50/5" : ""}`}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* Main Image Area - Interactive but not a button/link itself (contains buttons) */}
      <div className="group/imgwrap relative overflow-hidden rounded-t-2xl sm:rounded-t-2xl md:rounded-t-3xl">
        <PropertyCardImage
          property={property}
          priority={priority}
          isHotDeal={isHotDeal}
          isFavorite={isFavorite}
          isAnimating={isAnimating}
          onFavoriteClick={handleFavoriteClick}
          comparisonBadges={comparisonBadges}
          areaProvince={areaProvince}
          isInCompare={isInCompare}
          onCompareClick={handleCompareClick}
          hideShare={hideShare}
        />
      </div>

      <div className="pt-2 pb-4 sm:pb-5 md:pb-6 px-4 mt-0 md:mt-1 gap-y-2 sm:gap-y-2  grow min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex flex-col relative">
        <PropertyCardInfo 
          property={property} 
          areaProvince={areaProvince} 
          isInCompare={isInCompare}
          onCompareClick={handleCompareClick}
          handleCardClick={handleCardClick}
        />
        
        <PropertyCardSpecs property={property} />
        <PropertyCardFeatures features={property.features} />
      </div>

      {/* Footer - Contains potential separate links/actions */}
      <div className="relative z-20">
        <PropertyCardFooter 
          property={property} 
          variant={footerVariant || property.footerVariant} 
          isInCompare={isInCompare}
          onCompareClick={handleCompareClick}
        />
      </div>
    </div>
  );
}

// Export named constant for memoized version
export const PropertyCard = memo(PropertyCardComponent);
