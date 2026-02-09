"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  History,
  ArrowRight,
  MapPin,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import {
  readRecentProperties,
  clearRecentProperties,
  RecentProperty,
} from "@/lib/recent-properties";
import { getTypeColor, getTypeLabel, getSafeText } from "@/lib/property-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RecommendedProperty } from "@/features/properties/recommended-actions";
import { getRecommendedProperties } from "@/features/properties/recommended-actions";
import "aos/dist/aos.css";
import { SectionBackground } from "./SectionBackground";

function formatPrice(price: number) {
  return `฿${price.toLocaleString()}`;
}

function convertToRecentProperty(
  prop: RecommendedProperty,
  t: any,
): RecentProperty {
  // Calculate price_text based on listing type and discount
  let price_text = "";

  if (prop.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (prop.price) {
      const hasDiscount =
        prop.original_price && prop.original_price > prop.price;
      if (hasDiscount) {
        const discountPercent = Math.round(
          ((prop.original_price! - prop.price) / prop.original_price!) * 100,
        );
        parts.push(`${formatPrice(prop.price)} (-${discountPercent}%)`);
      } else {
        parts.push(formatPrice(prop.price));
      }
    }
    if (prop.rental_price) {
      const hasDiscount =
        prop.original_rental_price &&
        prop.original_rental_price > prop.rental_price;
      if (hasDiscount) {
        const discountPercent = Math.round(
          ((prop.original_rental_price! - prop.rental_price) /
            prop.original_rental_price!) *
            100,
        );
        parts.push(
          `${formatPrice(prop.rental_price)}/${t("recently_viewed.per_month_short")} (-${discountPercent}%)`,
        );
      } else {
        parts.push(
          `${formatPrice(prop.rental_price)}/${t("recently_viewed.per_month_short")}`,
        );
      }
    }
    price_text = parts.join(" | ");
  } else if (prop.listing_type === "SALE") {
    const hasDiscount =
      prop.original_price && prop.price && prop.original_price > prop.price;
    if (hasDiscount) {
      const discountPercent = Math.round(
        ((prop.original_price! - prop.price!) / prop.original_price!) * 100,
      );
      price_text = `${formatPrice(prop.price!)} (-${discountPercent}%)`;
    } else if (prop.price) {
      price_text = formatPrice(prop.price);
    }
  } else if (prop.listing_type === "RENT") {
    const hasDiscount =
      prop.original_rental_price &&
      prop.rental_price &&
      prop.original_rental_price > prop.rental_price;
    if (hasDiscount) {
      const discountPercent = Math.round(
        ((prop.original_rental_price! - prop.rental_price!) /
          prop.original_rental_price!) *
          100,
      );
      price_text = `${formatPrice(
        prop.rental_price!,
      )}/${t("recently_viewed.per_month_short")} (-${discountPercent}%)`;
    } else if (prop.rental_price) {
      price_text = `${formatPrice(prop.rental_price)}/${t("recently_viewed.per_month_short")}`;
    }
  }

  return {
    id: prop.id,
    title: prop.title,
    image_url: prop.image_url,
    price: prop.price,
    original_price: prop.original_price,
    rental_price: prop.rental_price,
    original_rental_price: prop.original_rental_price,
    price_per_sqm: prop.price_per_sqm,
    rent_price_per_sqm: prop.rent_price_per_sqm,
    size_sqm: prop.size_sqm,
    price_text,
    province: prop.province,
    popular_area: prop.popular_area,
    popular_area_en: prop.popular_area_en,
    popular_area_cn: prop.popular_area_cn,
    property_type: prop.property_type,
    listing_type: prop.listing_type,
    slug: prop.slug,
    ts: Date.now(),
  };
}

// Helper to get consistent display price similar to PropertyCard
function getCardPrice(item: RecentProperty, t: any) {
  // Backward compatibility: If new price fields are missing (old history), use price_text
  const hasNewFields =
    item.price !== undefined ||
    item.rental_price !== undefined ||
    item.original_price !== undefined;

  if (!hasNewFields) {
    return item.price_text || t("common.contact_for_price");
  }

  const isSale =
    item.listing_type === "SALE" || item.listing_type === "SALE_AND_RENT";
  const isRent =
    item.listing_type === "RENT" || item.listing_type === "SALE_AND_RENT";

  const getPriceValue = (listingType: string) => {
    const isR = listingType === "RENT";
    const mainP = isR ? item.rental_price : item.price;
    const originP = isR ? item.original_rental_price : item.original_price;
    const sqmP = isR ? item.rent_price_per_sqm : item.price_per_sqm;

    // Office logic
    if (
      item.property_type === "OFFICE_BUILDING" &&
      !mainP &&
      sqmP &&
      item.size_sqm
    ) {
      return sqmP * item.size_sqm;
    }
    return mainP ?? originP; // Fallback to original price
  };

  const saleP = isSale ? getPriceValue("SALE") : null;
  const rentP = isRent ? getPriceValue("RENT") : null;

  if (item.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (saleP) parts.push(formatPrice(saleP));
    if (rentP)
      parts.push(
        `${formatPrice(rentP)}/${t("recently_viewed.per_month_short")}`,
      );
    return (
      parts.join(" | ") || item.price_text || t("common.contact_for_price")
    );
  }

  if (isSale && saleP) return formatPrice(saleP);
  if (isRent && rentP)
    return `${formatPrice(rentP)}/${t("recently_viewed.per_month_short")}`;

  return item.price_text || t("common.contact_for_price");
}

export function RecentlyViewedClient({
  recommendedProperties,
  containerClassName,
  disableAos = false,
}: {
  recommendedProperties: RecommendedProperty[];
  containerClassName?: string;
  disableAos?: boolean;
}) {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<RecentProperty[]>([]);
  const [showingRecommended, setShowingRecommended] = useState(false);
  const [initializing, setInitializing] = useState(true); // New state for client-side loading
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    // Small timeout to simulate hydration/check and prevent flash
    const timer = setTimeout(() => {
      const recentItems = readRecentProperties();
      if (recentItems.length === 0) {
        // Show recommended properties
        if (recommendedProperties.length > 0) {
          setItems(
            recommendedProperties.map((p) => convertToRecentProperty(p, t)),
          );
          setShowingRecommended(true);
        } else {
          // Provide fallback fetch on mount if needed
          getRecommendedProperties(10).then((recs) => {
            if (recs.length > 0) {
              setItems(recs.map((p) => convertToRecentProperty(p, t)));
              setShowingRecommended(true);
            }
          });
        }
      } else {
        setItems(recentItems);
        setShowingRecommended(false);
      }
      setInitializing(false);
    }, 100);
    return () => clearTimeout(timer);

    const handleUpdate = async () => {
      const updated = readRecentProperties();
      if (updated.length === 0) {
        // Assume we need to switch to recommended
        // First, clear items or show loading to give immediate feedback
        setItems([]);

        if (recommendedProperties.length > 0) {
          setItems(recommendedProperties.map(convertToRecentProperty));
          setShowingRecommended(true);
        } else {
          // Show skeletons while fetching
          setInitializing(true);
          try {
            const freshRecs = await getRecommendedProperties(10);
            if (freshRecs.length > 0) {
              setItems(freshRecs.map((p) => convertToRecentProperty(p, t)));
              setShowingRecommended(true);
            }
          } catch (error) {
            console.error("Failed to fetch fresh recommendations", error);
          } finally {
            setInitializing(false);
          }
        }
      } else {
        setItems(updated);
        setShowingRecommended(false);
      }
    };

    window.addEventListener("recent-updated", handleUpdate);
    return () => window.removeEventListener("recent-updated", handleUpdate);
  }, [recommendedProperties]);

  const handleClear = async () => {
    // 1. Clear Local Storage
    clearRecentProperties();

    // 2. Immediate UI Feedback
    setItems([]);
    setShowingRecommended(true);

    // 3. Load Recommendations
    if (recommendedProperties.length > 0) {
      setItems(recommendedProperties.map((p) => convertToRecentProperty(p, t)));
    } else {
      setInitializing(true);
      try {
        const freshRecs = await getRecommendedProperties(10);
        if (freshRecs.length > 0) {
          setItems(freshRecs.map((p) => convertToRecentProperty(p, t)));
        }
      } catch (error) {
        console.error("Failed to fetch recommendations on clear", error);
      } finally {
        setInitializing(false);
      }
    }
  };

  // Drag-to-scroll logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.2; // Slower scroll speed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Check scroll position to show/hide buttons
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll handlers for buttons
  const scrollPrev = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -500, behavior: "smooth" });
  };

  const scrollNext = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 500, behavior: "smooth" });
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      return () => container.removeEventListener("scroll", checkScrollPosition);
    }
  }, [items]);

  // if (items.length === 0) return null; // Old logic

  // If initializing, show skeletons to hold layout
  if (initializing) {
    return (
      <section className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-50 border-t border-slate-100 overflow-hidden relative z-0">
        <SectionBackground pattern="blobs" intensity="low" />
        <div className={cn("max-w-7xl mx-auto", containerClassName)}>
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 md:h-8 w-48 md:w-80" />
                <Skeleton className="h-3 md:h-4 w-40 md:w-64" />
              </div>
            </div>
          </div>

          {/* Navigation Buttons Skeleton */}
          <div className="flex justify-end gap-2 mb-3 md:mb-4">
            <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
            <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
          </div>

          {/* Cards Skeleton */}
          <div className="flex gap-4 md:gap-6 overflow-hidden pb-4 md:pb-6 px-1 md:px-2 pt-6 md:pt-9">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] bg-white rounded-[1.5rem] md:rounded-4xl border border-slate-100 overflow-hidden"
              >
                <Skeleton className="h-36 md:h-44 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  // Schema.org ItemList for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: showingRecommended
      ? t("recently_viewed.schema_rec_name")
      : t("recently_viewed.schema_recent_name"),
    description: showingRecommended
      ? t("recently_viewed.schema_rec_desc")
      : t("recently_viewed.schema_recent_desc"),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 10).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.slug
        ? `https://your-domain.com/properties/${item.slug}`
        : `https://your-domain.com/properties/${item.id}`,
    })),
  };

  return (
    <section className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-50 border-t border-slate-100 overflow-hidden relative z-0">
      <SectionBackground pattern="blobs" intensity="low" />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className={cn("max-w-7xl mx-auto", containerClassName)}>
        {/* === HEADER WITH CLEAR ACTION === */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 md:mb-4"
          {...(!disableAos && { "data-aos": "fade-up" })}
          suppressHydrationWarning
        >
          <div className="flex items-start sm:items-center gap-2 md:gap-3">
            <div
              className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl ${
                showingRecommended ? "bg-amber-50" : "bg-blue-50"
              }`}
            >
              {showingRecommended ? (
                <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
              ) : (
                <History className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                {showingRecommended ? (
                  <>
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-600 to-orange-600">
                      {t("recently_viewed.property_types")}
                    </span>
                    <br className="hidden md:block" />
                    {t("recently_viewed.title_recommended")}
                  </>
                ) : (
                  <>
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                      {t("recently_viewed.property_types")}
                    </span>
                    <br className="hidden md:block" />
                    {t("recently_viewed.title_recent")}
                  </>
                )}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {showingRecommended
                  ? t("recently_viewed.desc_recommended")
                  : t("recently_viewed.desc_recent")}
              </p>
            </div>
          </div>

          {!showingRecommended && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-slate-400 hover:text-red-500 transition-colors rounded-md gap-2"
            >
              <Trash2 className="h-5 w-4" />
            </Button>
          )}
        </div>
        {/* Navigation Buttons - Always visible at right */}
        <div className="flex justify-end gap-2 mb-3 md:mb-4">
          <button
            onClick={scrollPrev}
            disabled={!canScrollLeft}
            className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all! duration-300! flex items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-slate-700"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-slate-700 group-hover:text-white" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollRight}
            className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all! duration-300! flex items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-slate-700"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-slate-700 group-hover:text-white" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div>
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-6 scrollbar-hide px-1 md:px-2 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item, _index) => (
              <Link
                key={item.id}
                href={
                  item.slug
                    ? `/properties/${item.slug}`
                    : `/properties/${item.id}`
                }
                className="min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] bg-white rounded-[1.5rem] md:rounded-4xl border border-slate-100 overflow-hidden hover:shadow-md hover:shadow-blue-500/10 transition-all! duration-500! snap-start shrink-0 group relative isolate hover:-translate-y-1"
                {...(!disableAos && { "data-aos": "fade-left" })}
                onClick={(e) => {
                  if (isDragging) e.preventDefault();
                }}
                itemScope
                itemType="https://schema.org/RealEstateListing"
              >
                <meta itemProp="name" content={item.title} />
                <meta
                  itemProp="url"
                  content={
                    item.slug
                      ? `/properties/${item.slug}`
                      : `/properties/${item.id}`
                  }
                />
                {item.image_url && (
                  <meta itemProp="image" content={item.image_url} />
                )}
                <meta
                  itemProp="description"
                  content={`${t("common.sale")}/${t("common.rent")} ${item.title} ${item.popular_area || ""} ${
                    item.province || ""
                  } ${item.price_text}`}
                />
                {/* Image Section */}
                <div className="relative h-36 md:h-44 bg-slate-100 overflow-hidden">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="300px"
                      className="object-cover  group-hover:scale-110 transition-transform duration-700!"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Sparkles className="h-8 w-8 opacity-20" />
                    </div>
                  )}

                  {/* Price Badge */}
                  <div
                    className={`absolute top-3 left-3 backdrop-blur-md border text-xs font-medium px-3 py-1.5 rounded-full shadow-sm flex flex-col gap-0.5 ${
                      (item.original_price &&
                        item.price &&
                        item.original_price > item.price) ||
                      (item.original_rental_price &&
                        item.rental_price &&
                        item.original_rental_price > item.rental_price) ||
                      item.price_text?.includes("(-")
                        ? "bg-red-500 border-red-600 text-white"
                        : "bg-white/90 border-white/40 text-blue-700"
                    }`}
                  >
                    {/* Original Price (Line Through) */}
                    {item.listing_type === "SALE" &&
                      item.original_price &&
                      item.price &&
                      item.original_price > item.price && (
                        <span className="text-[10px] text-white/80 line-through decoration-white/50">
                          {formatPrice(item.original_price)}
                        </span>
                      )}
                    {item.listing_type === "RENT" &&
                      item.original_rental_price &&
                      item.rental_price &&
                      item.original_rental_price > item.rental_price && (
                        <span className="text-[10px] text-white/80 line-through decoration-white/50">
                          {formatPrice(item.original_rental_price)}
                        </span>
                      )}
                    {item.listing_type === "SALE_AND_RENT" && (
                      <div className="flex flex-col -space-y-0.5">
                        {item.original_price &&
                          item.price &&
                          item.original_price > item.price && (
                            <span className="text-[9px] text-white/80 line-through decoration-white/50">
                              {formatPrice(item.original_price)}
                            </span>
                          )}
                        {item.original_rental_price &&
                          item.rental_price &&
                          item.original_rental_price > item.rental_price && (
                            <span className="text-[9px] text-white/80 line-through decoration-white/50">
                              {formatPrice(item.original_rental_price)}
                            </span>
                          )}
                      </div>
                    )}
                    {/* Current Price / Calculated Price */}
                    <div className="font-bold whitespace-nowrap">
                      {getCardPrice(item, t)}
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <FavoriteButton
                      propertyId={item.id}
                      className="bg-white/70 backdrop-blur-sm rounded-full p-2 hover:bg-white/80"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 md:p-5">
                  <h3 className="font-bold text-slate-900 truncate mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  {/* Property Type & Listing Type Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    {item.property_type && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          getTypeColor(item.property_type).bg
                        } ${getTypeColor(item.property_type).text}`}
                      >
                        {t(
                          `property_types.${
                            item.property_type.toLowerCase() ===
                            "commercial_building"
                              ? "commercial_building"
                              : item.property_type.toLowerCase()
                          }`,
                        )}
                      </span>
                    )}
                    {item.listing_type && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          item.listing_type === "SALE"
                            ? "bg-green-600 text-white"
                            : item.listing_type === "RENT"
                              ? "bg-orange-600 text-white"
                              : "bg-blue-600 text-white"
                        }`}
                      >
                        {item.listing_type === "SALE"
                          ? t("common.sale")
                          : item.listing_type === "RENT"
                            ? t("common.rent")
                            : `${t("common.sale")}/${t("common.rent")}`}
                      </span>
                    )}
                  </div>

                  {/* Features Preview */}
                  {item.features && item.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3 h-5 overflow-hidden">
                      {item.features.slice(0, 3).map((f) => (
                        <span
                          key={f.id}
                          className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 truncate max-w-[80px]"
                        >
                          {getLocaleValue(f, "name", language)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                    <MapPin className="h-3 w-3 mr-1.5 text-blue-500" />
                    <span className="truncate">
                      {[
                        getLocaleValue(item, "popular_area", language),
                        getProvinceName(item.province || "", language),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600/50 uppercase tracking-widest">
                      {t("recently_viewed.view_details")}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
