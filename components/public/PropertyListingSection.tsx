"use client";
//property listing section
import {
  useEffect,
  useMemo,
  useState,
  useRef,
  type MouseEvent,
  Suspense,
} from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { PropertyCard, type PropertyCardProps } from "./PropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { getProvinceName } from "@/lib/utils/provinces";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { PropertyListingSkeleton } from "./PropertyListingSkeleton";
import { useSectionTracking } from "@/hooks/use-section-tracking";
import type { PropertyFacets, PropertySearchResponse } from "@/features/properties/types/search";
import { m } from "framer-motion";

type FilterType =
  | "ALL"
  | "HOUSE"
  | "CONDO"
  | "VILLA"
  | "POOL_VILLA"
  | "TOWNHOME"
  | "LAND"
  | "OFFICE"
  | "WAREHOUSE"
  | "COMMERCIAL"
  | "OTHER";

const OFFICE_TYPES = new Set(["OFFICE_BUILDING", "OFFICE"]);
const COMMERCIAL_TYPES = new Set(["COMMERCIAL_BUILDING", "COMMERCIAL"]);
const WAREHOUSE_TYPES = new Set(["WAREHOUSE"]);

const MAX_VISIBLE = 8;

// Property Filtering Logic

function matchesFilter(item: PropertyCardProps, filter: FilterType) {
  if (filter === "ALL") return true;

  const pt = item.property_type ?? "";
  switch (filter) {
    case "OFFICE":
      return OFFICE_TYPES.has(pt);
    case "COMMERCIAL":
      return COMMERCIAL_TYPES.has(pt);
    case "WAREHOUSE":
      return WAREHOUSE_TYPES.has(pt);
    default:
      return pt === filter;
  }
}

type PopularArea = {
  popular_area: string;
  popular_area_en?: string;
  popular_area_cn?: string;
  popular_area_ru?: string;
  province?: string;
};

export interface PropertyListingSectionProps {
  initialProperties?: PropertyCardProps[];
  initialFacets?: PropertyFacets | null;
}

// Inside component:
export function PropertyListingSection({
  initialProperties,
  initialFacets,
}: PropertyListingSectionProps) {
  return (
    <Suspense fallback={<PropertyListingSkeleton />}>
      <PropertyListingContent
        initialProperties={initialProperties}
        initialFacets={initialFacets}
      />
    </Suspense>
  );
}

function PropertyListingContent({
  initialProperties,
  initialFacets,
}: PropertyListingSectionProps) {
  const { t, language } = useLanguage();
  const [properties, setProperties] = useState<PropertyCardProps[]>(initialProperties || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  // In-memory cache by category to guarantee ZERO redundant network requests
  const categoryCache = useRef<Record<string, PropertyCardProps[]>>({
    ALL: initialProperties || [],
  });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(ua));
    }
  }, []);
  const [reloadKey, setReloadKey] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Navigation Detection
  const [activeParams, setActiveParams] = useState(searchParams.toString());
  
  useEffect(() => {
    setActiveParams(searchParams.toString());
  }, [searchParams]);

  const isNavigating = searchParams.toString() !== activeParams;

  const FILTER_LABELS: Record<FilterType, string> = useMemo(() => ({
    ALL: t("common.all"),
    HOUSE: t("home.property_types.house"),
    CONDO: t("home.property_types.condo"),
    VILLA: t("home.property_types.villa"),
    POOL_VILLA: t("home.property_types.pool_villa"),
    OFFICE: t("property_types.office_building"),
    TOWNHOME: t("home.property_types.townhome"),
    WAREHOUSE: t("home.property_types.warehouse"),
    COMMERCIAL: t("property_types.commercial_building"),
    LAND: t("home.property_types.land"),
    OTHER: t("property_types.other"),
  }), [t]);

  // Derived filters from searchParams
  const areaFilter = useMemo(() => (searchParams.get("area") ?? "").trim(), [searchParams]);
  const provinceFilter = useMemo(() => (searchParams.get("province") ?? "").trim(), [searchParams]);
  const urlType = searchParams.get("type") ?? "";
  
  // Local state for type filter if not in URL, but prioritized by URL
  const [localFilter, setLocalFilter] = useState<FilterType>("ALL");

  // Track user interest duration for this section
  useSectionTracking({
    sectionId: "latest-properties",
    category: localFilter !== "ALL" ? localFilter : undefined,
    threshold: 3, // At least 3 seconds
  });

  // Fetch popular areas for localization support
  const [popularAreas, setPopularAreas] = useState<PopularArea[]>([]);
  useEffect(() => {
    fetch("/api/public/popular-areas")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPopularAreas(data);
      })
      .catch(() => {});
  }, []);

  const getLocalizedArea = (name: string) => {
    const area = popularAreas.find((a) => a.popular_area === name);
    if (area) {
      return getLocaleValue(area, "popular_area", language);
    }
    return getProvinceName(name, language);
  };
  
  const filter = useMemo(() => {
    if (!urlType) return localFilter;
    const mapped =
      urlType === "OFFICE_BUILDING"
        ? "OFFICE"
        : urlType === "COMMERCIAL_BUILDING"
          ? "COMMERCIAL"
          : urlType === "WAREHOUSE"
            ? "WAREHOUSE"
            : (urlType as FilterType);

    return (Object.keys(FILTER_LABELS) as string[]).includes(mapped) 
      ? (mapped as FilterType) 
      : localFilter;
  }, [urlType, localFilter, FILTER_LABELS]);

  const setFilter = (newFilter: FilterType) => {
    setLocalFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === "ALL") {
      params.delete("type");
    } else {
      const urlVal =
        newFilter === "OFFICE"
          ? "OFFICE_BUILDING"
          : newFilter === "COMMERCIAL"
            ? "COMMERCIAL_BUILDING"
            : newFilter;
      params.set("type", urlVal);
    }
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/${queryStr}#latest-properties`, { scroll: false });
  };

  // -- Drag to Scroll Logic --
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isDragClick = useRef(false); // flag to distinguish drag vs click

  const handleMouseDown = (e: MouseEvent) => {
    isDragClick.current = false;
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // scroll-fast
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
    if (Math.abs(x - startX) > 5) {
      isDragClick.current = true;
    }
  };
  // -- End Drag Logic --


  // 3. Lazy Data Fetch (Zero Egress: Use server initial properties for ALL, fetch only when clicking specific types)
  useEffect(() => {
    // If ALL and we already have initial properties from server, zero network fetch!
    if (filter === "ALL" && !areaFilter && !provinceFilter) {
      if (initialProperties && initialProperties.length > 0) {
        setProperties(initialProperties);
        setIsLoading(false);
        return;
      }
    }

    const cacheKey = `${filter}_${areaFilter}_${provinceFilter}`;
    // If category properties are already in memory, switch instantly (0ms, 0 Network)!
    if (categoryCache.current[cacheKey]) {
      setProperties(categoryCache.current[cacheKey]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadCategoryProperties() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("sort", "NEWEST");
        params.set("limit", "12");

        if (filter !== "ALL") {
          const apiType =
            filter === "OFFICE"
              ? "OFFICE_BUILDING"
              : filter === "COMMERCIAL"
                ? "COMMERCIAL_BUILDING"
                : filter;
          params.set("property_type", apiType);
        }
        if (areaFilter) params.set("popular_area", areaFilter);
        if (provinceFilter) params.set("province", provinceFilter);

        const res = await fetch(`/api/public/properties?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to load properties (${res.status})`);
        }

        const data = (await res.json()) as PropertySearchResponse;
        const propertiesArray = data.properties || [];
        categoryCache.current[cacheKey] = propertiesArray;
        setProperties(propertiesArray);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(t("common.error_loading") || "Failed to load properties. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCategoryProperties();
    return () => controller.abort();
  }, [filter, areaFilter, provinceFilter, reloadKey, initialProperties, t]);

  const typeCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      ALL: 0,
      HOUSE: 0,
      CONDO: 0,
      VILLA: 0,
      POOL_VILLA: 0,
      TOWNHOME: 0,
      LAND: 0,
      OFFICE: 0,
      WAREHOUSE: 0,
      COMMERCIAL: 0,
      OTHER: 0,
    };

    // ⚡️ Zero Egress: Use True Database Facet Counts from 1-Year Cache
    if (initialFacets?.availableTypes) {
      const types = initialFacets.availableTypes;
      counts.CONDO = types["CONDO"] || 0;
      counts.HOUSE = types["HOUSE"] || 0;
      counts.VILLA = types["VILLA"] || 0;
      counts.POOL_VILLA = types["POOL_VILLA"] || 0;
      counts.TOWNHOME = types["TOWNHOME"] || 0;
      counts.LAND = types["LAND"] || 0;
      counts.WAREHOUSE = types["WAREHOUSE"] || 0;
      counts.OFFICE = (types["OFFICE_BUILDING"] || 0) + (types["OFFICE"] || 0);
      counts.COMMERCIAL = (types["COMMERCIAL_BUILDING"] || 0) + (types["COMMERCIAL"] || 0);
      counts.OTHER = types["OTHER"] || 0;
      counts.ALL =
        initialFacets.availableListingTypes?.ALL ||
        Object.values(types).reduce((acc, c) => acc + c, 0);
      return counts;
    }

    // Fallback if no facets provided
    const geoFiltered = properties.filter((item) => {
      let matches = true;
      if (areaFilter) matches = matches && (item.popular_area ?? "").includes(areaFilter);
      if (provinceFilter) matches = matches && (item.province ?? "").includes(provinceFilter);
      return matches;
    });

    counts.ALL = geoFiltered.length;
    geoFiltered.forEach((item) => {
      const pt = item.property_type ?? "";
      if (OFFICE_TYPES.has(pt)) counts.OFFICE++;
      else if (COMMERCIAL_TYPES.has(pt)) counts.COMMERCIAL++;
      else if (WAREHOUSE_TYPES.has(pt)) counts.WAREHOUSE++;
      else if (pt in counts) {
        counts[pt as FilterType]++;
      } else {
        counts.OTHER++;
      }
    });
    return counts;
  }, [initialFacets, properties, areaFilter, provinceFilter]);

  const sortedFilterTypes = useMemo(() => {
    const types = Object.keys(FILTER_LABELS) as FilterType[];
    const allType = types.find((t) => t === "ALL");
    const otherTypes = types.filter((t) => t !== "ALL");

    // Sort other types by count descending
    otherTypes.sort((a, b) => (typeCounts[b] || 0) - (typeCounts[a] || 0));

    return allType ? [allType, ...otherTypes] : otherTypes;
  }, [typeCounts, FILTER_LABELS]);

  const filteredProperties = useMemo(() => {
    let items = properties.filter((item) => matchesFilter(item, filter));

    if (areaFilter) {
      items = items.filter((p) => 
        (p.popular_area ?? "").toLowerCase().includes(areaFilter.toLowerCase()) ||
        (p.province ?? "").toLowerCase().includes(areaFilter.toLowerCase())
      );
    }
    if (provinceFilter) {
      items = items.filter((p) => (p.province ?? "").includes(provinceFilter));
    }

    return [...items].sort((a, b) => {
      const timeB = (b as any).created_at_time || new Date((b as any).bumped_at || b.created_at || 0).getTime();
      const timeA = (a as any).created_at_time || new Date((a as any).bumped_at || a.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [filter, properties, areaFilter, provinceFilter]);
  
  const visibleProperties = useMemo(
    () => filteredProperties.slice(0, MAX_VISIBLE),
    [filteredProperties],
  );

  const hasMore = filteredProperties.length > MAX_VISIBLE;
  const resultCount = typeCounts[filter] || filteredProperties.length;

  const schemaData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${siteConfig.url}/#latest-properties-list`,
      "name": t("property_listing.title") || "Latest Properties",
      "description": t("property_listing.description") || "Explore our latest real estate listings",
      "numberOfItems": visibleProperties.length,
      "itemListElement": visibleProperties.slice(0, 8).map((property, index) => {
        const propertyUrl = `${siteConfig.url}/properties/${property.slug || property.id}`;
        return {
          "@type": "ListItem",
          "position": index + 1,
          "name": property.title || "Real Estate Listing",
          "url": propertyUrl,
        };
      }),
    };
  }, [visibleProperties, t]);

  return (
    <m.section
      id="latest-properties"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      className="py-12 md:py-16 lg:py-20  bg-white border-y border-slate-100"
    >
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-screen-2xl px-6 lg:px-8 mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 md:gap-6 mb-8 md:mb-10 ">
          {/* SEO-Optimized Header */}
          <m.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-blue-600">
                {t("property_listing.title")}
              </span>
              <br />
            </h2>
            <p className="text-base md:text-md text-slate-600 max-w-2xl leading-relaxed">
              {t("property_listing.description")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {(isLoading || isNavigating) ? (
                <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse font-medium bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  <span>{t("common.loading")}</span>
                </div>
              ) : !error && (
                <div className="text-sm text-slate-600">
                  {t("property_listing.category_label")}{" "}
                  <span className="font-semibold text-blue-600">
                    {FILTER_LABELS[filter]}
                  </span>{" "}
                  • {t("property_listing.found_prefix")}{" "}
                  <span className="font-semibold text-blue-600">
                    {resultCount.toLocaleString("th-TH")}
                  </span>{" "}
                  {t("property_listing.found_suffix")}
                </div>
              )}
            </div>
          </m.div>

          {/* Right Side: Filters & Navigation */}
          <m.div
            className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-3 md:gap-4 text-sm"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Upper Action Row: See More & Active Filters */}
            <div className="flex flex-row flex-wrap items-center justify-start lg:justify-end gap-3 md:gap-4 w-full">
              <div className="hidden lg:flex">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 md:h-11 px-4 md:px-6 text-sm md:text-base rounded-2xl hover:bg-slate-50 hover:border-blue-200 text-blue-500! transition-all duration-300"
                >
                  <Link href="/properties">
                    {t("common.more")}
                    {hasMore && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Link>
                </Button>
              </div>

              {(areaFilter || provinceFilter) && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500 font-medium whitespace-nowrap">{t("search.location")} :</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 shadow-xs">
                    {[
                      areaFilter ? getLocalizedArea(areaFilter) : null,
                      provinceFilter
                        ? getProvinceName(provinceFilter, language)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                    <button
                      onClick={() => {
                        setLocalFilter("ALL");
                        router.push("/#latest-properties");
                        document.getElementById("latest-properties")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-rose-400 hover:text-white duration-300 transition-colors"
                      title={t("common.clear")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Filter Menu Row */}
            <div className="relative group w-full lg:w-auto lg:min-w-[400px] lg:max-w-[500px] select-none">
                <div
                  id="filter-scroll-container"
                  ref={scrollContainerRef}
                  className={`flex mx-10 gap-2 overflow-x-auto whitespace-nowrap py-2 scroll-smooth snap-x snap-mandatory px-8 sm:px-10 md:px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab active:cursor-grabbing ${
                    isDragging ? "snap-none scroll-auto" : ""
                  }`}
                  role="tablist"
                  aria-label="Property type filters"
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  {(isLoading && properties.length === 0) ? (
                    // Button Skeletons
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="shrink-0 h-9 w-24 bg-slate-100 animate-pulse rounded-full" />
                    ))
                  ) : sortedFilterTypes.map((type) => {
                    const active = filter === type;
                    const count = typeCounts[type];
                    const isDisabled = count === 0 && type !== "ALL" && !active;

                    return (
                      <button
                        key={type}
                        disabled={isDisabled}
                        onClick={(e) => {
                          if (isDragClick.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          setFilter(type);
                        }}
                        role="tab"
                        aria-selected={active}
                        className={`shrink-0 snap-start px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border text-xs sm:text-sm font-semibold transition-all duration-300 pointer-events-auto shadow-xs active:scale-95 ${
                          active
                            ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20"
                            : isDisabled
                              ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60 grayscale"
                              : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm"
                        }`}
                      >
                        {FILTER_LABELS[type]}
                        {!isDisabled && type !== "ALL" && (
                          <span className={`ml-1.5 font-bold text-[0.7rem] ${active ? "text-blue-100" : "text-blue-500/60"}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Prev Button */}
                <button
                  onClick={() => {
                    const el = document.getElementById(
                      "filter-scroll-container",
                    );
                    if (el) el.scrollBy({ left: -200, behavior: "smooth" });
                  }}
                  className="absolute left-0 md:-left-4 xl:-left-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full p-1.5 md:p-2 text-slate-600 shadow-md hover:bg-white hover:text-slate-900 focus:outline-none z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                  aria-label="Previous filters"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={() => {
                    const el = document.getElementById(
                      "filter-scroll-container",
                    );
                    if (el) el.scrollBy({ left: 200, behavior: "smooth" });
                  }}
                  className="absolute right-0 md:-right-4 xl:-right-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full p-1.5 md:p-2 text-slate-600 shadow-md hover:bg-white hover:text-slate-900 focus:outline-none z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next filters"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
          </m.div>
        </div>
        {error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>{error}</div>
                <Button
                  variant="outline"
                  className="bg-white"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  {t("common.loading") === "Loading..." ? "Try Again" : "ลองใหม่"}
                </Button>
              </div>
            </div>
          ) : (isLoading || isNavigating) ? (
            <div className="relative min-h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-50">
                {Array.from({ length: 8 }).map((_, index) => (
                  <PropertyCardSkeleton key={index} />
                ))}
              </div>
              
              {/* Centered Loading Overlay - Subtle and non-blocking */}
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-slate-100">
                  <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-blue-600 font-bold text-sm tracking-wide">
                    {t("common.loading")}
                  </span>
                </div>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>{t("property_listing.empty_state")}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter("ALL")}
                className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                {t("common.all") || "ดูทั้งหมด"}
              </Button>
            </div>
          ) : (
            <div className="space-y-8 align-center ">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-6 md:gap-y-8">
                {visibleProperties.map((property, index) => {
                  const hasDiscount =
                    (property.original_price &&
                      property.price &&
                      property.original_price > property.price) ||
                    (property.original_rental_price &&
                      property.rental_price &&
                      property.original_rental_price > property.rental_price);

                  return (
                    <m.div
                      key={property.id}
                      initial={isIOS ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      whileInView={isIOS ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={isIOS ? { duration: 0 } : { duration: 0.5, delay: (index % 4) * 0.1 }}
                      className="relative group"
                    >
                      <PropertyCard property={property} priority={index === 0} />
                    </m.div>
                  );
                }) }
              </div>

              <div className="flex justify-center">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 md:h-11 px-4 md:px-6 text-sm md:text-base w-full sm:w-auto"
                >
                  <Link href="/properties">
                    {t("common.more")}
                    {hasMore && <ArrowRight className="h-4 w-4" />}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </m.section>
    );
  }
