"use client";

import { useEffect, useState } from "react";
import { MorphingLoader } from "@/components/ui/MorphingLoader";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { SearchPagination } from "./search/SearchPagination";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { PropertyCardProps } from "./PropertyCard";

// Hooks
import { usePropertyFilters } from "@/hooks/search/usePropertyFilters";
import { usePropertyData } from "@/hooks/search/usePropertyData";
import { usePropertyFiltering } from "@/hooks/search/usePropertyFiltering";

// Components
import { SearchResultsHeader } from "./search/SearchResultsHeader";
import { PropertyGrid } from "./search/PropertyGrid";
import { NoResultsView } from "./search/NoResultsView";

type ApiProperty = PropertyCardProps;

interface PropertySearchPageProps {
  initialProperties?: ApiProperty[];
}

export function PropertySearchPage({
  initialProperties,
}: PropertySearchPageProps) {
  const { t } = useLanguage();
  
  // State 1: Data Fetching
  const { properties, isLoading } = usePropertyData(initialProperties);

  // State 2: Filters & URL Sync
  const filters = usePropertyFilters();
  const {
    keyword, province, type, listingType, area, bedrooms,
    nearTrain, petFriendly, fullyFurnished, isForeigner,
    companyRegistered, isHotDeal, minPrice, maxPrice, sort,
    clearFilters
  } = filters;

  // State 3: Filtering & Sorting Logic
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

  // Pagination
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProperties = filtered.slice(startIndex, endIndex);

  // Track No Results
  useEffect(() => {
    if (!isLoading && properties.length > 0 && filtered.length === 0) {
      pushToDataLayer(GTM_EVENTS.SEARCH_NO_RESULTS, {
        keyword, province, popular_area: area, property_type: type,
        item_category: type, listing_type: listingType, min_price: minPrice,
        max_price: maxPrice, bedrooms, near_train: nearTrain,
        pet_friendly: petFriendly, fully_furnished: fullyFurnished,
        is_foreigner: isForeigner, company_registered: companyRegistered,
        is_hot_deal: isHotDeal,
      });
    }
  }, [isLoading, filtered.length, properties.length, keyword, province, area, type, listingType, minPrice, maxPrice, bedrooms, nearTrain, petFriendly, fullyFurnished, isForeigner, companyRegistered, isHotDeal]);

  // Track View Item List
  useEffect(() => {
    if (!isLoading && properties.length > 0) {
      pushToDataLayer(GTM_EVENTS.VIEW_ITEM_LIST, {
        items_count: filtered.length,
        keyword, province, property_type: type, listing_type: listingType,
        popular_area: area, bedrooms, near_train: nearTrain,
        pet_friendly: petFriendly, fully_furnished: fullyFurnished,
        is_foreigner: isForeigner, company_registered: companyRegistered,
        is_hot_deal: isHotDeal,
      });
    }
  }, [isLoading, filtered.length, keyword, province, type, listingType, area, bedrooms, nearTrain, petFriendly, fullyFurnished, isForeigner, companyRegistered, isHotDeal]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword, type, listingType, minPrice, maxPrice, area, province,
    nearTrain, petFriendly, fullyFurnished, bedrooms, isForeigner,
    companyRegistered, isHotDeal,
  ]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      {/* Results Grid */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <SearchResultsHeader
          totalFound={filtered.length}
          startIndex={startIndex}
          endIndex={endIndex}
        />

        {isLoading ? (
          <MorphingLoader />
        ) : filtered.length === 0 ? (
          <NoResultsView onClearFilters={clearFilters} />
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
