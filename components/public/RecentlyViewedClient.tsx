"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  readRecentProperties,
  clearRecentProperties,
  RecentProperty,
} from "@/lib/recent-properties";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RecommendedProperty } from "@/features/properties/recommended-actions";
import { getRecommendedProperties } from "@/features/properties/recommended-actions";
import { SectionBackground } from "./SectionBackground";
import { siteConfig } from "@/lib/site-config";

// Modularized components
import { convertToRecentProperty } from "./RecentlyViewedUtils";
import { RecentlyViewedSkeleton } from "./RecentlyViewedSkeleton";
import { RecentlyViewedHeader } from "./RecentlyViewedHeader";
import { RecentlyViewedNav } from "./RecentlyViewedNav";
import { RecentlyViewedCard } from "./RecentlyViewedCard";

export function RecentlyViewedClient({
  recommendedProperties = [],
  containerClassName,
  disableAos = false,
}: {
  recommendedProperties?: RecommendedProperty[];
  containerClassName?: string;
  disableAos?: boolean;
}) {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<RecentProperty[]>([]);
  const [showingRecommended, setShowingRecommended] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const recentItems = readRecentProperties();
      if (recentItems.length === 0) {
        if (recommendedProperties.length > 0) {
          setItems(
            recommendedProperties.map((p) =>
              convertToRecentProperty(p, t, language),
            ),
          );
          setShowingRecommended(true);
        } else {
          getRecommendedProperties(10).then((recs) => {
            if (recs.length > 0) {
              setItems(
                recs.map((p) => convertToRecentProperty(p, t, language)),
              );
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
  }, [recommendedProperties, t, language]);

  // Listen for updates from other tabs/components
  useEffect(() => {
    const handleUpdate = async () => {
      const updated = readRecentProperties();
      if (updated.length === 0) {
        setItems([]);
        if (recommendedProperties.length > 0) {
          setItems(
            recommendedProperties.map((p) =>
              convertToRecentProperty(p, t, language),
            ),
          );
          setShowingRecommended(true);
        } else {
          setInitializing(true);
          try {
            const freshRecs = await getRecommendedProperties(10);
            if (freshRecs.length > 0) {
              setItems(
                freshRecs.map((p) => convertToRecentProperty(p, t, language)),
              );
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
  }, [recommendedProperties, t, language]);

  const handleClear = async () => {
    clearRecentProperties();
    setItems([]);
    setShowingRecommended(true);

    if (recommendedProperties.length > 0) {
      setItems(
        recommendedProperties.map((p) =>
          convertToRecentProperty(p, t, language),
        ),
      );
    } else {
      setInitializing(true);
      try {
        const freshRecs = await getRecommendedProperties(10);
        if (freshRecs.length > 0) {
          setItems(
            freshRecs.map((p) => convertToRecentProperty(p, t, language)),
          );
        }
      } catch (error) {
        console.error("Failed to fetch recommendations on clear", error);
      } finally {
        setInitializing(false);
      }
    }
  };

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
    const walk = (x - startX) * 1.2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

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

  if (initializing) {
    return <RecentlyViewedSkeleton containerClassName={containerClassName} />;
  }

  if (items.length === 0) return null;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteConfig.url}/#recently-viewed-list`,
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
      item: {
        "@type": "Product",
        name: getLocaleValue(item, "title", language),
        url: item.slug
          ? `${siteConfig.url}/properties/${item.slug}`
          : `${siteConfig.url}/properties/${item.id}`,
        image: item.image_url || `${siteConfig.url}${siteConfig.ogImage}`,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5",
          reviewCount: "1",
        },
        offers: {
          "@type": "Offer",
          price: Math.max(1, item.price || item.rental_price || 0),
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        }
      }
    })),
  };

  return (
    <section className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-50 border-t border-slate-100 overflow-hidden relative z-0">
      <SectionBackground pattern="blobs" intensity="low" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className={cn("max-w-7xl mx-auto px-4 md:px-6 lg:px-8", containerClassName)}>
        <RecentlyViewedHeader
          showingRecommended={showingRecommended}
          t={t}
          handleClear={handleClear}
          disableAos={disableAos}
        />

        <RecentlyViewedNav
          scrollPrev={scrollPrev}
          scrollNext={scrollNext}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
        />

        <div>
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-6 scrollbar-hide select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item) => (
              <RecentlyViewedCard
                key={item.id}
                item={item}
                language={language}
                t={t}
                isDragging={isDragging}
                disableAos={disableAos}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
