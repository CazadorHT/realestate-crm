"use client";

import { useEffect, useState, useMemo } from "react";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { SearchPagination } from "./search/SearchPagination";
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
  const { properties, isLoading } = usePropertyData(initialProperties);

  // 2. Optimized Analysis Logic
  const {
    filtered,
    availableProvinces,
    availableAreas,
    availableTypes,
    availableListingTypes,
    availableQuickFilters,
    availableBedrooms,
    matchesFilters,
  } = usePropertyFiltering(properties, filters);

  // 3. Pagination Logic
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  
  const pagination = useMemo(() => {
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedProperties: filtered.slice(startIndex, endIndex),
    };
  }, [filtered, currentPage]);

  const { totalPages, startIndex, endIndex, paginatedProperties } = pagination;

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

  // Reset page on filter changes (Memoized triggers)
  const filterFingerprint = JSON.stringify([
    filters.keyword, filters.type, filters.listingType, filters.minPrice, 
    filters.maxPrice, filters.area, filters.province, filters.nearTrain, 
    filters.petFriendly, filters.fullyFurnished, filters.bedrooms, 
    filters.isForeigner, filters.isHotDeal
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterFingerprint]);

  // UX: Auto-scroll on pagination
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

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
        properties={properties}
        matchesFilters={matchesFilters}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <SearchResultsHeader
          totalFound={filtered.length}
          startIndex={startIndex}
          endIndex={endIndex}
        />

        {isLoading ? (
          /* S-Tier: Stable Skeleton instead of full-page loader */
          <PropertyGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <NoResultsView onClearFilters={filters.clearFilters} />
        ) : (
          <>
            <PropertyGrid
              properties={paginatedProperties}
              currentPage={currentPage}
            />

            <SearchPagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
