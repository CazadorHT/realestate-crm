"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Map as MapIcon } from "lucide-react";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

// Hooks
import { usePropertyFilters, DefaultPropertyFilters } from "@/hooks/search/usePropertyFilters";
import { usePropertyData } from "@/hooks/search/usePropertyData";
import { usePropertyFiltering } from "@/hooks/search/usePropertyFiltering";
import { useMapPins } from "@/hooks/search/useMapPins";
import { getLocaleValue } from "@/lib/utils/locale-utils";

import { buildAreaHierarchy, expandAreaTokens } from "@/lib/utils/area-hierarchy";

// Components
import { SearchResultsHeader, type PropertyViewMode } from "./search/SearchResultsHeader";
import { PropertyGrid } from "./search/PropertyGrid";
import { NoResultsView } from "./search/NoResultsView";
import { PropertyGridSkeleton } from "./search/SearchSkeletons";
import { AiInsightRibbon } from "./search/AiInsightRibbon";
import { PropertyVectorMapLazy } from "./map/PropertyVectorMapLazy";

import { PropertyCardProps } from "./PropertyCard";
import type { SlimMapPin } from "@/lib/services/map-pins";
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
 * - Zero-Egress Interactive Price Map (Grid | Split 50:50 | Full Map)
 */
export function PropertySearchPage({
  initialProperties,
  initialFacets,
  initialTransitStation = "",
  basePath,
  defaultFilters,
}: PropertySearchPageProps) {
  const { t, language, langPrefix } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = usePropertyFilters(initialTransitStation, basePath, defaultFilters);

  const mapExplorerHref = useMemo(() => {
    const mapBase = `${langPrefix || ""}/map`;
    return filters.queryString ? `${mapBase}?${filters.queryString}` : mapBase;
  }, [langPrefix, filters.queryString]);

  // View Mode: defaults strictly to "grid" (0 map JS & 0 map API calls unless user opens split view)
  const [viewMode, setViewMode] = useState<PropertyViewMode>(() => {
    const raw = searchParams.get("view");
    return raw === "split" ? "split" : "grid";
  });

  useEffect(() => {
    const raw = searchParams.get("view");
    if (raw === "map") {
      // Forward legacy/direct ?view=map URLs straight to dedicated /map explorer with filters preserved
      router.replace(mapExplorerHref);
      return;
    }
    if (raw === "split") {
      setViewMode("split");
    } else if (!raw) {
      setViewMode("grid");
    }
  }, [searchParams, router, mapExplorerHref]);

  const handleViewModeChange = useCallback(
    (nextMode: PropertyViewMode) => {
      setViewMode(nextMode);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (nextMode === "grid") {
          params.delete("view");
        } else {
          params.set("view", nextMode);
        }
        const qs = params.toString();
        const path = basePath || window.location.pathname;
        window.history.replaceState(null, "", qs ? `${path}?${qs}` : path);
      }
    },
    [basePath]
  );

  // 1. Data Access Layer for Standard Paginated Cards (limit=12)
  const { properties, facets: serverFacets, isLoading, isRefetching, isFetchingMore, loadMoreProperties } = usePropertyData(
    initialProperties,
    initialFacets,
    filters.queryString
  );

  // 1b. Separate Lightweight Map Pins Pipeline (loads ONLY when viewMode !== "grid", cached 1 year)
  const isMapActive = viewMode !== "grid";
  const {
    pins: mapPins,
    stations: mapStations,
    isLoading: isMapPinsLoading,
  } = useMapPins(isMapActive);

  // 2. Optimized Analysis Logic (Paginated Grid Stream)
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

  // 2b. Full-Inventory Filtering for Map Pins (100% filter parity in RAM, 0 network requests)
  const { filtered: filteredMapPins } = usePropertyFiltering(
    mapPins,
    { ...filters, keyword: filters.debouncedKeyword }
  );

  // 2-Way Sync State (Card Hover <-> Map Pin & Search-as-map-moves)
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [searchAsMove, setSearchAsMove] = useState<boolean>(true);
  const [boundsPins, setBoundsPins] = useState<SlimMapPin[]>([]);

  // 3. Dynamic Cumulative Loading Logic (Diamond Tier)
  const ITEMS_PER_PAGE = 12;
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [splitDisplayCount, setSplitDisplayCount] = useState(ITEMS_PER_PAGE);

  const visibleProperties = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  // In Split View: once full map pins are loaded, synchronize left-hand cards directly with map bounds/pins!
  const splitSourceList = useMemo<ApiProperty[]>(() => {
    if (mapPins.length === 0) return filtered;
    const rawMapPins = filteredMapPins as SlimMapPin[];
    return searchAsMove ? boundsPins : rawMapPins;
  }, [mapPins.length, filtered, filteredMapPins, searchAsMove, boundsPins]);

  const visibleSplitProperties = useMemo(() => {
    return splitSourceList.slice(0, splitDisplayCount);
  }, [splitSourceList, splitDisplayCount]);

  // Reset split pagination when bounds or filters change
  useEffect(() => {
    setSplitDisplayCount(ITEMS_PER_PAGE);
  }, [boundsPins.length, searchAsMove]);

  // Signature for auto-fitting map bounds when user selects an area, province, or transit station
  const locationFilterSignature = useMemo(() => {
    const parts = [
      filters.province && filters.province !== "ALL" ? `p:${filters.province}` : "",
      filters.area && filters.area !== "ALL" ? `a:${filters.area}` : "",
      filters.transitStation ? `s:${filters.transitStation}` : "",
      filters.cbd ? "cbd" : "",
      filters.luxuryVilla ? "villa" : "",
    ].filter(Boolean);
    return parts.join("|");
  }, [filters.province, filters.area, filters.transitStation, filters.cbd, filters.luxuryVilla]);

  // Area hierarchy tree with parent-child cluster aggregation
  const areaHierarchy = useMemo(() => {
    return buildAreaHierarchy(availableAreas, language, getLocaleValue);
  }, [availableAreas, language]);

  // Facet count total for selected areas (expanding parent zones into sub-zones e.g. กรุงเทพกรีฑา 8 + กรุงเทพกรีฑาตัดใหม่ 2 = 10)
  const selectedAreaFacetTotal = useMemo(() => {
    if (!filters.area || filters.area === "ALL") return 0;
    const selected = filters.area.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (selected.length === 0) return 0;
    const expandedTokens = expandAreaTokens(selected, areaHierarchy);
    const uniqueTokens = Array.from(new Set(expandedTokens));
    return uniqueTokens.reduce((acc: number, a: string) => {
      const facetCount = serverFacets?.availableAreas?.[a]?.count 
        ?? availableAreas.find((item: any) => item.name === a || item.name_en === a)?.count 
        ?? 0;
      return acc + facetCount;
    }, 0);
  }, [filters.area, areaHierarchy, serverFacets?.availableAreas, availableAreas]);

  // Total count for current active filter state
  const totalAvailableCount = useMemo(() => {
    // When full map dataset is loaded in RAM, filteredMapPins.length is the exact 100% truth across ALL active inventory
    if (isMapActive && mapPins.length > 0) {
      return viewMode === "split" && searchAsMove
        ? splitSourceList.length
        : filteredMapPins.length;
    }

    // 1. If we have narrowing compound filters (e.g. specific keyword, bedrooms, price range, property type),
    // then local filtered.length reflects the exact intersection of these granular filters in memory
    const hasNarrowingFilters = Boolean(
      (filters.type && filters.type !== "ALL") ||
      (filters.bedrooms && filters.bedrooms !== "ALL") ||
      filters.minPrice || filters.maxPrice ||
      filters.debouncedKeyword ||
      filters.transitStation ||
      (filters.petFriendly && (filters.companyRegistered || filters.nearTrain || filters.isForeigner || filters.fullyFurnished || filters.isHotDeal))
    );

    if (hasNarrowingFilters) {
      return filtered.length;
    }

    // 2. Listing types
    if (filters.listingType === "RENT" && serverFacets?.availableListingTypes?.RENT !== undefined) {
      return serverFacets.availableListingTypes.RENT;
    }
    if (filters.listingType === "SALE" && serverFacets?.availableListingTypes?.SALE !== undefined) {
      return serverFacets.availableListingTypes.SALE;
    }

    // 3. Server facets total count for active query (includes area, quick filters, etc.)
    if (serverFacets?.availableListingTypes?.ALL !== undefined && serverFacets.availableListingTypes.ALL > 0) {
      return serverFacets.availableListingTypes.ALL;
    }

    // 4. Area filters fallback
    if (filters.area && filters.area !== "ALL" && selectedAreaFacetTotal > 0) {
      return selectedAreaFacetTotal;
    }

    // 5. Quick filters
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

    return serverFacets?.availableListingTypes?.ALL || filtered.length;
  }, [
    isMapActive,
    mapPins.length,
    viewMode,
    searchAsMove,
    splitSourceList.length,
    filteredMapPins.length,
    filters,
    serverFacets,
    filtered.length,
    selectedAreaFacetTotal,
  ]);

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
    setSplitDisplayCount(ITEMS_PER_PAGE);
  }, [filterFingerprint]);

  // Localized Area Filter Name for NoResultsView and PropertyGrid
  const localizedAreaFilterName = useMemo(() => {
    if (!filters.area || filters.area === "ALL") return undefined;
    const tokens = filters.area.split(",").map((s: string) => s.trim()).filter(Boolean);
    return tokens
      .map((name: string) => {
        const facet = serverFacets?.availableAreas?.[name] || availableAreas.find((a: any) => a.name === name || a.name_en === name);
        if (facet) {
          return (
            getLocaleValue(
              {
                name: (facet as any).name || name,
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
  }, [filters.area, serverFacets?.availableAreas, availableAreas, language]);

  // Synchronize dynamic client browser tab document.title when area filter or language changes
  useEffect(() => {
    if (typeof window === "undefined" || !document) return;
    const siteName = "VC Connect Asset";
    if (localizedAreaFilterName) {
      if (language === "en") {
        document.title = `Properties in ${localizedAreaFilterName} for Sale & Rent | ${siteName}`;
      } else if (language === "cn") {
        document.title = `${localizedAreaFilterName} 房源出售与出租 | ${siteName}`;
      } else if (language === "ru") {
        document.title = `Недвижимость в ${localizedAreaFilterName} | ${siteName}`;
      } else {
        document.title = `อสังหาฯ ย่าน${localizedAreaFilterName} ซื้อ-เช่า | ${siteName}`;
      }
    }
  }, [localizedAreaFilterName, language]);

  const activeEndIndex =
    viewMode === "split" ? visibleSplitProperties.length : visibleProperties.length;

  const activeTotalFound =
    viewMode === "split" ? splitSourceList.length : filtered.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SearchFilterBar
        {...filters}
        isLoading={isLoading}
        filteredLength={isMapActive && mapPins.length > 0 ? filteredMapPins.length : filtered.length}
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
        properties={isMapActive && mapPins.length > 0 ? mapPins : properties}
        matchesFilters={matchesFilters}
        setBulkFilters={filters.setBulkFilters}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <SearchResultsHeader
          totalFound={activeTotalFound}
          startIndex={0}
          endIndex={activeEndIndex}
          totalAvailableCount={totalAvailableCount}
          isLoading={isLoading || isRefetching}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          mapHref={mapExplorerHref}
        />

        {filters.aiInsight && (
          <AiInsightRibbon 
            insight={filters.aiInsight} 
            onClear={() => filters.setAiInsight(null)} 
          />
        )}

        {/* MODE A: SPLIT VIEW 50:50 (Airbnb / Zillow Style with 2-Way Sync) */}
        {viewMode === "split" ? (
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-7 min-w-0">
              {isLoading && mapPins.length === 0 ? (
                <PropertyGridSkeleton count={6} />
              ) : splitSourceList.length === 0 ? (
                searchAsMove && filteredMapPins.length > 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-xs my-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <MapIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                      {language === "th"
                        ? "ไม่มีทรัพย์ในกรอบแผนที่ที่คุณกำลังซูมอยู่"
                        : language === "cn"
                          ? "当前地图视野内暂无房源"
                          : language === "ru"
                            ? "В этой области карты нет объектов"
                            : "No properties in this map area"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mb-5">
                      {language === "th"
                        ? `แต่มีทรัพย์ที่ตรงกับตัวกรองของคุณทั้งหมด ${filteredMapPins.length} รายการในพื้นที่อื่น`
                        : language === "cn"
                          ? `但在其他区域共有 ${filteredMapPins.length} 套符合筛选条件的房源。`
                          : language === "ru"
                            ? `Однако в других районах найдено ${filteredMapPins.length} подходящих объектов.`
                            : `However, ${filteredMapPins.length} properties match your filters across other areas.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchAsMove(false)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                      {language === "th"
                        ? `แสดงทรัพย์ทั้งหมดที่ตรงเงื่อนไข (${filteredMapPins.length})`
                        : language === "cn"
                          ? `显示全部符合条件的房源 (${filteredMapPins.length})`
                          : language === "ru"
                            ? `Показать все подходящие объекты (${filteredMapPins.length})`
                            : `Show all ${filteredMapPins.length} matching properties`}
                    </button>
                  </div>
                ) : (
                  <NoResultsView
                    onClearFilters={filters.clearFilters}
                    keyword={filters.keyword}
                    onClearKeyword={() => filters.setKeyword("")}
                    areaFilterName={localizedAreaFilterName}
                    onSelectSuggestion={(text) => filters.setKeyword(text)}
                    serverAreaTotal={selectedAreaFacetTotal}
                    serverGrandTotal={totalAvailableCount}
                    onFetchMoreServer={loadMoreProperties}
                    isFetchingMore={isFetchingMore}
                  />
                )
              ) : (
                <>
                  <PropertyGrid
                    properties={visibleSplitProperties}
                    currentPage={1}
                    compactColumns
                    hoveredPropertyId={hoveredPropertyId}
                    onHoverProperty={setHoveredPropertyId}
                    hasMore={visibleSplitProperties.length < splitSourceList.length}
                    totalRemainingCount={Math.max(
                      0,
                      splitSourceList.length - visibleSplitProperties.length
                    )}
                    loadMore={() =>
                      setSplitDisplayCount((prev) => prev + ITEMS_PER_PAGE)
                    }
                    areaFilterName={localizedAreaFilterName}
                  />
                </>
              )}
            </div>

            <div className="hidden lg:block lg:col-span-5 xl:col-span-5 sticky top-[calc(var(--nav-offset,0px)+148px)] h-[calc(100dvh-var(--nav-offset,0px)-164px)] isolate z-10 rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 bg-slate-100 transition-[top,height] duration-300">
              <PropertyVectorMapLazy
                filteredPins={filteredMapPins as SlimMapPin[]}
                stations={mapStations}
                isLoading={isMapPinsLoading}
                activeListingFilter={filters.priceType || filters.listingType}
                activeStationFilter={filters.transitStation}
                locationFilterSignature={locationFilterSignature}
                hoveredPropertyId={hoveredPropertyId}
                onHoverPropertyId={setHoveredPropertyId}
                enableSearchAsMove
                searchAsMove={searchAsMove}
                onSearchAsMoveChange={setSearchAsMove}
                onBoundsPinsChange={setBoundsPins}
                onFallbackToList={() => handleViewModeChange("grid")}
              />
            </div>
          </div>
        ) : /* MODE C (DEFAULT): STANDARD 4-COL GRID VIEW (0 Map Overhead) */ isLoading ||
          isRefetching ? (
          <PropertyGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <NoResultsView
            onClearFilters={filters.clearFilters}
            keyword={filters.keyword}
            onClearKeyword={() => filters.setKeyword("")}
            areaFilterName={localizedAreaFilterName}
            onSelectSuggestion={(text) => filters.setKeyword(text)}
            serverAreaTotal={selectedAreaFacetTotal}
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
                  filters.area && filters.area !== "ALL" && selectedAreaFacetTotal > 0
                    ? Math.max(0, selectedAreaFacetTotal - visibleProperties.length)
                    : Math.max(0, filtered.length - visibleProperties.length)
                }
                totalRemainingCount={Math.max(0, totalAvailableCount - visibleProperties.length)}
                isFetchingMore={isFetchingMore}
                loadMore={loadMore}
                areaFilterName={localizedAreaFilterName}
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
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                          +{Math.min(ITEMS_PER_PAGE, totalAvailableCount - visibleProperties.length)}
                        </span>
                      )}
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 font-medium">
                  {language === "en"
                    ? `Showing ${visibleProperties.length} of ${totalAvailableCount} properties (${totalAvailableCount - visibleProperties.length} remaining)`
                    : language === "cn"
                    ? `已显示 ${totalAvailableCount} 个房源中的 ${visibleProperties.length} 个 (还剩 ${totalAvailableCount - visibleProperties.length} 个)`
                    : language === "ru"
                    ? `Показано ${visibleProperties.length} из ${totalAvailableCount} объектов (осталось ${totalAvailableCount - visibleProperties.length})`
                    : `กำลังแสดง ${visibleProperties.length} จากทั้งหมด ${totalAvailableCount} รายการ (คงเหลืออีก ${totalAvailableCount - visibleProperties.length} รายการ)`}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Floating Price Map CTA -> Opens Dedicated /map Explorer with Active Filters */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <Link
          href={mapExplorerHref}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1B263B] hover:bg-blue-600 text-white font-bold text-xs shadow-2xl border border-white/15 transition-all active:scale-95 cursor-pointer"
        >
          <MapIcon className="w-4 h-4 text-blue-300" />
          <span>
            {language === "en"
              ? "Price Map"
              : language === "cn"
                ? "地图找房"
                : language === "ru"
                  ? "На карте"
                  : "ค้นหาจากแผนที่"}
          </span>
        </Link>
      </div>
    </div>
  );
}
