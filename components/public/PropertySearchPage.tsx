"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { MorphingLoader } from "@/components/ui/MorphingLoader";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { SearchPagination } from "./search/SearchPagination";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "sonner";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

type ApiProperty = PropertyCardProps;

interface PropertySearchPageProps {
  initialProperties?: ApiProperty[];
}

export function PropertySearchPage({
  initialProperties,
}: PropertySearchPageProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<ApiProperty[]>(
    initialProperties || [],
  );
  const [isLoading, setIsLoading] = useState(!initialProperties);

  // Filters - Init from URL
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [type, setType] = useState(searchParams.get("property_type") || "ALL");
  const [listingType, setListingType] = useState(
    searchParams.get("listing_type") || "ALL",
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sort, setSort] = useState("NEWEST");

  // New Filters
  const [area, setArea] = useState(searchParams.get("popular_area") || "ALL");
  const [nearTrain, setNearTrain] = useState(
    searchParams.get("near_train") === "true",
  );
  const [petFriendly, setPetFriendly] = useState(
    searchParams.get("pet_friendly") === "true",
  );
  const [fullyFurnished, setFullyFurnished] = useState(
    searchParams.get("fully_furnished") === "true",
  );
  const [bedrooms, setBedrooms] = useState(
    searchParams.get("bedrooms") || "ALL",
  );
  const [isForeigner, setIsForeigner] = useState(
    searchParams.get("foreigner") === "true",
  );
  const [companyRegistered, setCompanyRegistered] = useState(
    searchParams.get("company_registered") === "true",
  );
  const [isHotDeal, setIsHotDeal] = useState(
    searchParams.get("hot_deal") === "true",
  );

  const [province, setProvince] = useState(
    searchParams.get("province") || "ALL",
  );
  // Note: province filtering is done in the search logic, but not yet a standalone state/UI filter in SearchFilterBar
  // If we want to filter by province passed in URL (from breadcrumbs), we should respect it in the filtering logic too.
  const provinceParam = searchParams.get("province");

  // Update state when params change (for back/forward navigation)
  useEffect(() => {
    setKeyword(searchParams.get("keyword") || "");
    setType(searchParams.get("property_type") || "ALL");
    setListingType(searchParams.get("listing_type") || "ALL");
    setArea(searchParams.get("popular_area") || "ALL");
    setProvince(searchParams.get("province") || "ALL");
    setNearTrain(searchParams.get("near_train") === "true");
    setPetFriendly(searchParams.get("pet_friendly") === "true");
    setFullyFurnished(searchParams.get("fully_furnished") === "true");
    setIsForeigner(searchParams.get("foreigner") === "true");
    setCompanyRegistered(searchParams.get("company_registered") === "true");
    setIsHotDeal(searchParams.get("hot_deal") === "true");
  }, [searchParams]);

  // Pagination
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Skip loading if initialProperties provided
    if (initialProperties) return;

    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/public/properties", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Load failed");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("PropertySearchPage fetch error:", err);
        pushToDataLayer(GTM_EVENTS.SYSTEM_ERROR, {
          error_message: err instanceof Error ? err.message : String(err),
          source: "PropertySearchPage",
        });
        toast.error(
          t("common.error") ||
            "Load failed: " +
              (err instanceof Error ? err.message : String(err)),
        );
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [initialProperties]);

  // shared filter logic
  const matchesFilters = useCallback(
    (p: ApiProperty, excludeFilters: string[] = []) => {
      // Keyword
      if (!excludeFilters.includes("keyword") && keyword.trim()) {
        const k = keyword.toLowerCase();
        const matchesKeyword =
          p.title.toLowerCase().includes(k) ||
          (p.description || "").toLowerCase().includes(k) ||
          (p.popular_area || "").toLowerCase().includes(k) ||
          (p.province || "").toLowerCase().includes(k);
        if (!matchesKeyword) return false;
      }

      // Province
      if (!excludeFilters.includes("province") && province !== "ALL") {
        if (p.province !== province) return false;
      }

      // Type
      if (!excludeFilters.includes("type") && type !== "ALL") {
        if (p.property_type !== type) return false;
      }

      // Listing Type
      if (!excludeFilters.includes("listingType") && listingType !== "ALL") {
        if (listingType === "SALE") {
          if (p.listing_type !== "SALE" && p.listing_type !== "SALE_AND_RENT")
            return false;
        } else if (listingType === "RENT") {
          if (p.listing_type !== "RENT" && p.listing_type !== "SALE_AND_RENT")
            return false;
        } else if (listingType === "SALE_AND_RENT") {
          if (p.listing_type !== "SALE_AND_RENT") return false;
        }
      }

      // Area
      if (!excludeFilters.includes("area") && area !== "ALL") {
        if (p.popular_area !== area) return false;
      }

      // Near Train
      if (!excludeFilters.includes("nearTrain") && nearTrain) {
        const txt = (p.title + " " + (p.description || "")).toLowerCase();
        const isNearTrain =
          p.near_transit === true ||
          txt.includes("bts") ||
          txt.includes("mrt") ||
          txt.includes("รถไฟฟ้า") ||
          txt.includes("ใกล้สถานี");
        if (!isNearTrain) return false;
      }

      // Pet Friendly
      if (!excludeFilters.includes("petFriendly") && petFriendly) {
        if (p.is_pet_friendly !== true) return false;
      }

      // Fully Furnished
      if (!excludeFilters.includes("fullyFurnished") && fullyFurnished) {
        const isFurnished =
          p.is_fully_furnished === true ||
          p.meta_keywords?.includes("Fully Furnished");
        if (!isFurnished) return false;
      }

      // Foreigner Quota
      if (!excludeFilters.includes("isForeigner") && isForeigner) {
        if (p.is_foreigner_quota !== true) return false;
      }

      // Company Registered
      if (!excludeFilters.includes("companyRegistered") && companyRegistered) {
        if (p.is_tax_registered !== true) return false;
      }

      // Hot Deal
      if (!excludeFilters.includes("isHotDeal") && isHotDeal) {
        const hasPriceDrop =
          (p.original_price && p.price && p.original_price > p.price) ||
          (p.original_rental_price &&
            p.rental_price &&
            p.original_rental_price > p.rental_price);
        if (!hasPriceDrop) return false;
      }

      // Bedrooms
      if (!excludeFilters.includes("bedrooms") && bedrooms !== "ALL") {
        const beds = p.bedrooms || 0;
        if (bedrooms === "4+") {
          if (beds < 4) return false;
        } else if (beds !== parseInt(bedrooms)) {
          return false;
        }
      }

      // Price Range
      if (!excludeFilters.includes("price")) {
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        if (min > 0 || max < Infinity) {
          const price = p.price || 0;
          const rent = p.rental_price || 0;
          const pVal = price > 0 ? price : rent;
          if (pVal < min || pVal > max) return false;
        }
      }

      return true;
    },
    [
      keyword,
      province,
      type,
      listingType,
      area,
      nearTrain,
      petFriendly,
      fullyFurnished,
      bedrooms,
      isForeigner,
      companyRegistered,
      isHotDeal,
      minPrice,
      maxPrice,
    ],
  );

  // Compute available Provinces with Counts
  const availableProvinces = useMemo(() => {
    const map = new Map<string, number>();
    properties.forEach((p) => {
      // Apply all filters EXCEPT province itself
      if (!matchesFilters(p, ["province"])) return;

      if (p.province) {
        map.set(p.province, (map.get(p.province) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [properties, matchesFilters]);

  // Compute unique Popular Areas with Counts
  const availableAreas = useMemo(() => {
    const map = new Map<
      string,
      { count: number; name_en?: string | null; name_cn?: string | null }
    >();
    properties.forEach((p) => {
      // Apply all filters EXCEPT area itself
      if (
        !matchesFilters(p, [
          "area",
          "keyword", // Usually areas are distinct enough and we want to see available even if keyword filter active
        ])
      )
        return;

      if (p.popular_area) {
        const existing = map.get(p.popular_area) || {
          count: 0,
          name_en: null,
          name_cn: null,
        };
        map.set(p.popular_area, {
          count: existing.count + 1,
          name_en: p.popular_area_en || existing.name_en,
          name_cn: p.popular_area_cn || existing.name_cn,
        });
      }
    });

    return Array.from(map.entries())
      .map(([name, val]) => ({
        name,
        count: val.count,
        name_en: val.name_en,
        name_cn: val.name_cn,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties, matchesFilters]);

  // Compute property type counts
  const availableTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach((p) => {
      // Apply all filters EXCEPT property type itself
      if (!matchesFilters(p, ["type"])) return;

      const t = p.property_type;
      if (t) {
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return counts;
  }, [properties, matchesFilters]);

  const filtered = useMemo(() => {
    let result = properties.filter((p) => matchesFilters(p));

    // Sort
    result.sort((a, b) => {
      if (sort === "NEWEST") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sort === "PRICE_ASC" || sort === "PRICE_DESC") {
        const pA = a.price || a.rental_price || 0;
        const pB = b.price || b.rental_price || 0;
        return sort === "PRICE_ASC" ? pA - pB : pB - pA;
      }
      if (sort === "AREA_ASC" || sort === "AREA_DESC") {
        const areaA = a.size_sqm || 0;
        const areaB = b.size_sqm || 0;
        return sort === "AREA_ASC" ? areaA - areaB : areaB - areaA;
      }
      return 0;
    });

    return result;
  }, [properties, matchesFilters, sort]);

  // Track No Results (to identify high demand gaps)
  useEffect(() => {
    if (!isLoading && properties.length > 0 && filtered.length === 0) {
      pushToDataLayer(GTM_EVENTS.SEARCH_NO_RESULTS, {
        keyword,
        province,
        popular_area: area,
        property_type: type,
        item_category: type,
        listing_type: listingType,
        min_price: minPrice,
        max_price: maxPrice,
        bedrooms,
        near_train: nearTrain,
        pet_friendly: petFriendly,
        fully_furnished: fullyFurnished,
        is_foreigner: isForeigner,
        company_registered: companyRegistered,
        is_hot_deal: isHotDeal,
      });
    }
  }, [isLoading, filtered.length, properties.length]); // Dependencies to fire when search finishes and results are empty

  // Track View Item List (Standard GA4)
  useEffect(() => {
    if (!isLoading && properties.length > 0) {
      try {
        pushToDataLayer(GTM_EVENTS.VIEW_ITEM_LIST, {
          items_count: filtered.length,
          keyword: keyword,
          province: province,
          property_type: type,
          listing_type: listingType,
          popular_area: area,
          bedrooms: bedrooms,
          near_train: nearTrain,
          pet_friendly: petFriendly,
          fully_furnished: fullyFurnished,
          is_foreigner: isForeigner,
          company_registered: companyRegistered,
          is_hot_deal: isHotDeal,
        });
      } catch (e) {}
    }
    // We want to re-run this when core filters change and loading finishes
  }, [isLoading, filtered.length, keyword, province, type, listingType, area, bedrooms, nearTrain, petFriendly, fullyFurnished, isForeigner, companyRegistered, isHotDeal]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword,
    type,
    listingType,
    minPrice,
    maxPrice,
    area,
    nearTrain,
    petFriendly,
    fullyFurnished,
    bedrooms,
    isForeigner,
    companyRegistered,
    isHotDeal,
  ]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (type !== "ALL") params.set("property_type", type);
    if (listingType !== "ALL") params.set("listing_type", listingType);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (area !== "ALL") params.set("popular_area", area);
    if (province !== "ALL") params.set("province", province);
    if (nearTrain) params.set("near_train", "true");
    if (petFriendly) params.set("pet_friendly", "true");
    if (fullyFurnished) params.set("fully_furnished", "true");
    if (bedrooms !== "ALL") params.set("bedrooms", bedrooms);
    if (isForeigner) params.set("foreigner", "true");
    if (companyRegistered) params.set("company_registered", "true");
    if (isHotDeal) params.set("hot_deal", "true");

    const query = params.toString();
    const url = `/properties${query ? `?${query}` : ""}`;
    
    // Use window.history.replaceState to avoid adding many history entries
    // but keeping it synchronized with the URL.
    window.history.replaceState({ ...window.history.state, as: url, url }, "", url);
  }, [
    keyword,
    type,
    listingType,
    minPrice,
    maxPrice,
    area,
    province,
    nearTrain,
    petFriendly,
    fullyFurnished,
    bedrooms,
    isForeigner,
    companyRegistered,
    isHotDeal,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProperties = filtered.slice(startIndex, endIndex);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SearchFilterBar
        isLoading={isLoading}
        keyword={keyword}
        setKeyword={setKeyword}
        type={type}
        setType={setType}
        listingType={listingType}
        setListingType={setListingType}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sort={sort}
        setSort={setSort}
        area={area}
        setArea={setArea}
        nearTrain={nearTrain}
        setNearTrain={setNearTrain}
        petFriendly={petFriendly}
        setPetFriendly={setPetFriendly}
        fullyFurnished={fullyFurnished}
        setFullyFurnished={setFullyFurnished}
        isForeigner={isForeigner}
        setIsForeigner={setIsForeigner}
        companyRegistered={companyRegistered}
        setCompanyRegistered={setCompanyRegistered}
        isHotDeal={isHotDeal}
        setIsHotDeal={setIsHotDeal}
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        filteredLength={filtered.length}
        availableAreas={availableAreas}
        province={province}
        setProvince={setProvince}
        availableProvinces={availableProvinces}
        availableTypes={availableTypes}
      />

      {/* Results Grid */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-10 flex items-center justify-between">
          <div className="text-slate-600 text-sm">
            {t("search.found_total")}{" "}
            <span className="font-bold text-blue-600">{filtered.length}</span>{" "}
            {t("search.items")}
            {filtered.length > 0 && (
              <span className="text-slate-400 ml-2">
                ({t("search.displaying")} {startIndex + 1}-
                {Math.min(endIndex, filtered.length)})
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <MorphingLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="text-slate-400 mb-2">{t("search.no_results")}</div>
            <Button
              variant="outline"
              onClick={() => {
                setKeyword("");
                setType("ALL");
              }}
            >
              {t("search.clear_filters")}
            </Button>
          </div>
        ) : (
          <>
            <motion.div 
              layout
              className="grid gap-6  md:gap-y-8 lg:gap-x-4   md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12"
            >
              <AnimatePresence mode="popLayout">
                {paginatedProperties.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: i * 0.05,
                      ease: "easeOut" 
                    }}
                  >
                    <PropertyCard
                      property={item}
                      priority={currentPage === 1 && i < 4}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

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
