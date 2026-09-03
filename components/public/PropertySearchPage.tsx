"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

// Hooks
import { usePropertyFilters, DefaultPropertyFilters } from "@/hooks/search/usePropertyFilters";
import { usePropertyData } from "@/hooks/search/usePropertyData";
import { usePropertyFiltering } from "@/hooks/search/usePropertyFiltering";
import { cn } from "@/lib/utils";
import { getLocaleValue } from "@/lib/utils/locale-utils";

// Components
import { SearchResultsHeader } from "./search/SearchResultsHeader";
import { PropertyGrid } from "./search/PropertyGrid";
import { NoResultsView } from "./search/NoResultsView";
import { PropertyGridSkeleton } from "./search/SearchSkeletons";
import { AiInsightRibbon } from "./search/AiInsightRibbon";

import { PropertyCardProps } from "./PropertyCard";
type ApiProperty = PropertyCardProps;

import { PropertyFacets } from "@/features/properties/types/search";

interface PropertySearchPageProps {
  initialProperties?: ApiProperty[];
  initialFacets?: PropertyFacets | null;
  initialTransitStation?: string;
  basePath?: string;
  defaultFilters?: DefaultPropertyFilters;
}

/**
 * [S-Tier] Property Search Page Shell
 * - Hardened with Skeleton UI (Zero CLS)
 * - Managed via Single-Pass Optimization logic
 * - Integrated Analytics Layer
 */
export function PropertySearchPage({
  initialProperties,
  initialFacets,
  initialTransitStation = "",
  basePath,
  defaultFilters,
}: PropertySearchPageProps) {
  const { t, language } = useLanguage();
  const filters = usePropertyFilters(initialTransitStation, basePath, defaultFilters);
  
  // 1. Data Access Layer (Fortress Tier)
  const { properties, facets: serverFacets, isLoading, isRefetching, isFetchingMore, loadMoreProperties } = usePropertyData(
    initialProperties,
    initialFacets,
    filters.queryString
  );

  // 2. Optimized Analysis Logic
  const {
    filtered,
    availableProvinces,
    availableAreas,
    availableTypes,
    availableListingTypes,
    availableQuickFilters,
    availableBedrooms,
    availablePrices,
    availableSizes,
    availableStations,
    allStations,
    matchesFilters,
  } = usePropertyFiltering(properties, { ...filters, keyword: filters.debouncedKeyword }, serverFacets);

  // 3. Dynamic Cumulative Loading Logic (Diamond Tier)
  const ITEMS_PER_PAGE = 12;
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  const visibleProperties = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  // Total count for current active filter state
  const totalAvailableCount = useMemo(() => {
    // 1. If we have multiple compound filters or active quick filters combined with landing filters,
    // filtered.length represents the exact matching count in memory
    const hasMultipleFilters = Boolean(
      (filters.type && filters.type !== "ALL") ||
      (filters.province && filters.province !== "ALL") ||
      (filters.area && filters.area !== "ALL") ||
      (filters.bedrooms && filters.bedrooms !== "ALL") ||
      filters.minPrice || filters.maxPrice ||
      filters.debouncedKeyword ||
      (filters.petFriendly && (filters.companyRegistered || filters.nearTrain || filters.isForeigner || filters.fullyFurnished || filters.isHotDeal || filters.listingType !== "ALL")) ||
      filters.luxuryVilla ||
      filters.cbd
    );

    if (hasMultipleFilters) {
      return filtered.length;
    }

    if (filters.petFriendly && serverFacets?.availableQuickFilters?.petFriendly !== undefined) {
      return serverFacets.availableQuickFilters.petFriendly;
    }
    if (filters.cbd && serverFacets?.availableQuickFilters?.cbd !== undefined) {
      return serverFacets.availableQuickFilters.cbd;
    }
    if (filters.nearTrain && serverFacets?.availableQuickFilters?.nearTrain !== undefined) {
      return serverFacets.availableQuickFilters.nearTrain;
    }
    if (filters.isForeigner && serverFacets?.availableQuickFilters?.isForeigner !== undefined) {
      return serverFacets.availableQuickFilters.isForeigner;
    }
    if (filters.companyRegistered && serverFacets?.availableQuickFilters?.companyRegistered !== undefined) {
      return serverFacets.availableQuickFilters.companyRegistered;
    }
    if (filters.isHotDeal && serverFacets?.availableQuickFilters?.isHotDeal !== undefined) {
      return serverFacets.availableQuickFilters.isHotDeal;
    }
    if (filters.area && filters.area !== "ALL") {
      const selected = filters.area.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (selected.length > 0 && serverFacets?.availableAreas) {
        const sum = selected.reduce((acc: number, a: string) => acc + (serverFacets.availableAreas[a]?.count || 0), 0);
        if (sum > 0) return sum;
      }
    }
    if (filters.listingType === "RENT" && serverFacets?.availableListingTypes?.RENT !== undefined) {
      return serverFacets.availableListingTypes.RENT;
    }
    if (filters.listingType === "SALE" && serverFacets?.availableListingTypes?.SALE !== undefined) {
      return serverFacets.availableListingTypes.SALE;
    }
    return serverFacets?.availableListingTypes?.ALL || filtered.length;
  }, [filters, serverFacets, filtered.length]);

  // Can load more if we haven't displayed all local filtered properties OR if server has more properties
  const hasMore = visibleProperties.length < filtered.length || (properties.length < totalAvailableCount && filtered.length < totalAvailableCount);

  const loadMore = useCallback(() => {
    if (displayCount < filtered.length) {
      // Reveal more locally fetched properties
      setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
    } else {
      // Request next page/batch from server
      loadMoreProperties();
      setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [displayCount, filtered.length, loadMoreProperties]);

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
    filters.isForeigner, filters.isHotDeal, filters.luxuryVilla, filters.cbd, filters.transitStation
  ]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [filterFingerprint]);

  // Localized Area Filter Name for NoResultsView
  const localizedAreaFilterName = useMemo(() => {
    if (!filters.area || filters.area === "ALL") return undefined;
    const tokens = filters.area.split(",").map((s: string) => s.trim()).filter(Boolean);
    return tokens
      .map((name: string) => {
        const facet = serverFacets?.availableAreas?.[name];
        if (facet) {
          return (
            getLocaleValue(
              {
                name,
                name_en: facet.name_en,
                name_cn: facet.name_cn,
                name_ru: facet.name_ru,
              },
              "name",
              language
            ) || name
          );
        }
        return name;
      })
      .join(", ");
  }, [filters.area, serverFacets?.availableAreas, language]);

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
        availablePrices={availablePrices}
        availableSizes={availableSizes}
        availableBedrooms={availableBedrooms}
        availableStations={availableStations}
        allStations={allStations}
        properties={properties}
        matchesFilters={matchesFilters}
        setBulkFilters={filters.setBulkFilters}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <SearchResultsHeader
          totalFound={filtered.length}
          startIndex={0}
          endIndex={visibleProperties.length}
          totalAvailableCount={totalAvailableCount}
        />

        {filters.aiInsight && (
          <AiInsightRibbon 
            insight={filters.aiInsight} 
            onClear={() => filters.setAiInsight(null)} 
          />
        )}

        {isLoading || isRefetching ? (
          <PropertyGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <NoResultsView
            onClearFilters={filters.clearFilters}
            keyword={filters.keyword}
            onClearKeyword={() => filters.setKeyword("")}
            areaFilterName={localizedAreaFilterName}
            onSelectSuggestion={(text) => filters.setKeyword(text)}
            serverAreaTotal={
              filters.area && filters.area !== "ALL" && serverFacets?.availableAreas
                ? filters.area.split(",").reduce((acc: number, a: string) => acc + (serverFacets.availableAreas[a.trim()]?.count || 0), 0)
                : 0
            }
            serverGrandTotal={totalAvailableCount}
            onFetchMoreServer={loadMoreProperties}
            isFetchingMore={isFetchingMore}
          />
        ) : (
          <>
          <div>
            <PropertyGrid
              properties={visibleProperties}
              currentPage={1}
              hasMore={hasMore}
              areaRemainingCount={
                filters.area && filters.area !== "ALL" && serverFacets?.availableAreas
                  ? Math.max(
                      0,
                      filters.area.split(",").reduce((acc: number, a: string) => acc + (serverFacets.availableAreas[a.trim()]?.count || 0), 0) - visibleProperties.length
                    )
                  : Math.max(0, filtered.length - visibleProperties.length)
              }
              totalRemainingCount={Math.max(0, totalAvailableCount - visibleProperties.length)}
              isFetchingMore={isFetchingMore}
              loadMore={loadMore}
              areaFilterName={filters.area || undefined}
              filterLabel={
                filters.petFriendly
                  ? language === "en" ? "Pet-Friendly properties" : language === "cn" ? "允许养宠物的房源" : language === "ru" ? "объектов, разрешенных для животных" : "คอนโดเลี้ยงสัตว์ได้"
                  : filters.luxuryVilla
                  ? language === "en" ? "Luxury Villas" : language === "cn" ? "独栋奢华别墅" : language === "ru" ? "роскошных вилл" : "วิลล่าหรู"
                  : filters.cbd
                  ? language === "en" ? "Prime CBD & New CBD Properties" : language === "cn" ? "核心CBD与新CBD房源" : language === "ru" ? "CBD и New CBD объекты" : "ทำเล CBD & New CBD"
                  : undefined
              }
            />
          </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-12 flex flex-col items-center justify-center gap-3">
                <button
                  onClick={loadMore}
                  disabled={isFetchingMore}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 active:scale-95 cursor-pointer group"
                >
                  {isFetchingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t("common.loading") || "กำลังโหลด..."}</span>
                    </div>
                  ) : (
                    <>
                      <span>
                        {language === "en"
                          ? "Load More Properties"
                          : language === "cn"
                          ? "加载更多房源"
                          : language === "ru"
                          ? "Показать еще объекты"
                          : "โหลดทรัพย์เพิ่มเติม"}
                      </span>
                      {totalAvailableCount > visibleProperties.length && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
                          +{totalAvailableCount - visibleProperties.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500">
                  {language === "en"
                    ? `Showing ${visibleProperties.length} of ${totalAvailableCount} properties`
                    : language === "cn"
                    ? `已显示 ${totalAvailableCount} 个房源中的 ${visibleProperties.length} 个`
                    : language === "ru"
                    ? `Показано ${visibleProperties.length} из ${totalAvailableCount} объектов`
                    : `กำลังแสดง ${visibleProperties.length} จากทั้งหมด ${totalAvailableCount} ประกาศ`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
