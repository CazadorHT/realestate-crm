"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

// Hooks
import { usePropertyFilters } from "@/hooks/search/usePropertyFilters";
import { usePropertyData } from "@/hooks/search/usePropertyData";
import { usePropertyFiltering } from "@/hooks/search/usePropertyFiltering";

// Components
import { SearchResultsHeader } from "./search/SearchResultsHeader";
import { PropertyGrid } from "./search/PropertyGrid";
import { NoResultsView } from "./search/NoResultsView";
import { PropertyGridSkeleton } from "./search/SearchSkeletons";
import { AiInsightRibbon } from "./search/AiInsightRibbon";

import { PropertyCardProps } from "./PropertyCard";
type ApiProperty = PropertyCardProps;

interface PropertySearchPageProps {
  initialProperties?: ApiProperty[];
}

/**
 * [S-Tier] Property Search Page Shell
 * - Hardened with Skeleton UI (Zero CLS)
 * - Managed via Single-Pass Optimization logic
 * - Integrated Analytics Layer
 */
export function PropertySearchPage({
  initialProperties,
}: PropertySearchPageProps) {
  const { t } = useLanguage();
  const filters = usePropertyFilters();
  
  // 1. Data Access Layer (Fortress Tier)
  const { properties, facets: serverFacets, isLoading } = usePropertyData(initialProperties);

  // 2. Optimized Analysis Logic
  const {
    filtered,
    availableProvinces,
    availableAreas,
    availableTypes,
    availableListingTypes,
    availableQuickFilters,
    availableBedrooms,
    availableStations,
    matchesFilters,
  } = usePropertyFiltering(properties, { ...filters, keyword: filters.debouncedKeyword }, serverFacets);

  // 3. Infinite Scroll / Cumulative Loading Logic (Diamond Tier)
  const ITEMS_PER_PAGE = 12;
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  const visibleProperties = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  const hasMore = displayCount < filtered.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    }
  }, [hasMore]);

  // 4. Analytics Layer (Hardened Effects)
  useEffect(() => {
    if (!isLoading && properties.length === 0) {
      pushToDataLayer(GTM_EVENTS.SEARCH_NO_RESULTS, {
        keyword: filters.keyword,
        province: filters.province,
        popular_area: filters.area,
        property_type: filters.type,
      });
    }
  }, [isLoading, properties.length, filters.keyword, filters.province, filters.area, filters.type]);

  useEffect(() => {
    if (!isLoading && filtered.length > 0) {
      pushToDataLayer(GTM_EVENTS.VIEW_ITEM_LIST, {
        items_count: filtered.length,
        property_type: filters.type,
        listing_type: filters.listingType,
      });
    }
  }, [isLoading, filtered.length, filters.type, filters.listingType]);

  // Reset display count on filter changes (Only when actual filtering parameters change)
  const filterFingerprint = JSON.stringify([
    filters.debouncedKeyword, filters.type, filters.listingType, filters.minPrice, 
    filters.maxPrice, filters.area, filters.province, filters.nearTrain, 
    filters.petFriendly, filters.fullyFurnished, filters.bedrooms, 
    filters.isForeigner, filters.isHotDeal, filters.transitStation
  ]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [filterFingerprint]);

  // 5. Automatic Infinite Scroll Observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" } // Load early before user hits the bottom
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SearchFilterBar
        {...filters}
        isLoading={isLoading}
        filteredLength={filtered.length}
        availableAreas={availableAreas}
        availableProvinces={availableProvinces}
        availableTypes={availableTypes}
        availableListingTypes={availableListingTypes}
        availableQuickFilters={availableQuickFilters}
        availableBedrooms={availableBedrooms}
        availableStations={availableStations}
        properties={properties}
        matchesFilters={matchesFilters}
        setBulkFilters={filters.setBulkFilters}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <SearchResultsHeader
          totalFound={filtered.length}
          startIndex={0}
          endIndex={visibleProperties.length}
        />

        {filters.aiInsight && (
          <AiInsightRibbon 
            insight={filters.aiInsight} 
            onClear={() => filters.setAiInsight(null)} 
          />
        )}

        {isLoading ? (
          <PropertyGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <NoResultsView onClearFilters={filters.clearFilters} />
        ) : (
          <>
            <PropertyGrid
              properties={visibleProperties}
              currentPage={1}
            />

            {/* Sentinel for Infinite Scroll (Diamond Tier) */}
            {hasMore && (
              <div 
                ref={sentinelRef}
                id="search-sentinel"
                className="h-20 flex items-center justify-center"
              >
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
