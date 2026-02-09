"use client";

import Link from "next/link";
import { CheckSquare, Square } from "lucide-react";
import { useEffect, useState, MouseEvent } from "react";
import { toggleCompareId, readCompareIds } from "@/lib/compare-store";
import { toggleFavoriteId, readFavoriteIds } from "@/lib/favorite-store";
import { useLanguage } from "@/components/providers/LanguageProvider";

// New Sub-components
import { PropertyCardImage } from "./property-card/PropertyCardImage";
import { PropertyCardInfo } from "./property-card/PropertyCardInfo";
import { PropertyCardSpecs } from "./property-card/PropertyCardSpecs";
import { PropertyCardFeatures } from "./property-card/PropertyCardFeatures";
import { PropertyCardFooter } from "./property-card/PropertyCardFooter";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";

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
    toggleCompareId(property.id);
  };

  const handleFavoriteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

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
        color: "bg-green-100 text-green-700",
      });
    }

    if (
      property.size_sqm &&
      compareWith.size &&
      property.size_sqm > compareWith.size
    ) {
      comparisonBadges.push({
        label: t("common.larger_area"),
        color: "bg-blue-100 text-blue-700",
      });
    }

    if (
      property.created_at &&
      compareWith.date &&
      new Date(property.created_at) > new Date(compareWith.date)
    ) {
      comparisonBadges.push({
        label: t("common.newer"),
        color: "bg-purple-100 text-purple-700",
      });
    }
  }

  return (
    <div className="group relative isolate rounded-2xl sm:rounded-2xl md:rounded-3xl w-full max-w-[350px] mx-auto bg-white overflow-hidden shadow-md h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 before:content-[''] before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-2xl md:before:rounded-3xl before:ring-inset before:pointer-events-none before:z-10">
      <Link
        href={`/properties/${property.slug || property.id}`}
        className="flex flex-col h-full focus:outline-none"
        aria-label={`${t("common.view_all")} ${property.title}`}
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
        <div className="pt-2 pb-4 sm:pb-5 md:pb-6 px-4 sm:px-5 md:px-6 mt-2 sm:mt-2 md:mt-3 gap-y-2 sm:gap-y-2 md:gap-y-3 grow min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex flex-col">
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
