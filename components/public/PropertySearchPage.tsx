"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { MorphingLoader } from "@/components/ui/MorphingLoader";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { SearchPagination } from "./search/SearchPagination";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "sonner";

type ApiProperty = PropertyCardProps;

interface PropertySearchPageProps {
  initialProperties?: ApiProperty[];
}

export function PropertySearchPage({
  initialProperties,
}: PropertySearchPageProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
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
    // ... update others if needed, though mostly navigating to page sets them initially
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

  // Compute unique Popular Areas with Counts
  // Compute available Provinces
  const availableProvinces = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.province) set.add(p.province);
    });
    return Array.from(set).sort();
  }, [properties]);

  // Shared filter helper
  const matchesFilters = (p: ApiProperty, excludeFilters: string[] = []) => {
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
      if (!p.meta_keywords?.includes("Pet Friendly")) return false;
    }

    // Fully Furnished
    if (!excludeFilters.includes("fullyFurnished") && fullyFurnished) {
      const isFurnished =
        p.is_fully_furnished === true ||
        p.meta_keywords?.includes("Fully Furnished");
      if (!isFurnished) return false;
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
  };

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
  }, [
    properties,
    province,
    type,
    listingType,
    nearTrain,
    petFriendly,
    fullyFurnished,
    bedrooms,
    minPrice,
    maxPrice,
  ]);

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
  }, [
    properties,
    province,
    listingType,
    area,
    keyword,
    nearTrain,
    petFriendly,
    fullyFurnished,
    bedrooms,
    minPrice,
    maxPrice,
  ]);

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
  }, [
    properties,
    keyword,
    type,
    listingType,
    minPrice,
    maxPrice,
    sort,
    area,
    nearTrain,
    petFriendly,
    fullyFurnished,
    bedrooms,
    province,
  ]);

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
    bedrooms,
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
        <div className="mb-6 flex items-center justify-between">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
              {paginatedProperties.map((item, i) => (
                <PropertyCard
                  key={item.id}
                  property={item}
                  priority={currentPage === 1 && i < 4}
                />
              ))}
            </div>

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
