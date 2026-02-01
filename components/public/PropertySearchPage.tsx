"use client";

import { useEffect, useState, useMemo } from "react";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { MorphingLoader } from "@/components/ui/MorphingLoader";
import { SearchFilterBar } from "./search/SearchFilterBar";
import { SearchPagination } from "./search/SearchPagination";

type ApiProperty = PropertyCardProps;

export function PropertySearchPage() {
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("ALL");
  const [listingType, setListingType] = useState("ALL"); // ALL, SALE, RENT, SALE_AND_RENT
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("NEWEST"); // NEWEST, PRICE_ASC, PRICE_DESC

  // New Filters
  const [area, setArea] = useState("ALL");
  const [nearTrain, setNearTrain] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [bedrooms, setBedrooms] = useState("ALL"); // ALL, 1, 2, 3, 4+

  // Pagination
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
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
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Compute unique Popular Areas from data
  const availableAreas = useMemo(() => {
    const areas = new Set<string>();
    properties.forEach((p) => {
      if (p.popular_area) areas.add(p.popular_area);
    });
    return Array.from(areas).sort();
  }, [properties]);

  const filtered = useMemo(() => {
    let result = [...properties];

    // Keyword
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(k) ||
          (p.description || "").toLowerCase().includes(k) ||
          (p.popular_area || "").toLowerCase().includes(k) ||
          (p.province || "").toLowerCase().includes(k),
      );
    }

    // Type
    if (type !== "ALL") {
      result = result.filter((p) => p.property_type === type);
    }

    // Listing Type (Strict Logic)
    if (listingType !== "ALL") {
      if (listingType === "SALE") {
        // Show SALE or SALE_AND_RENT
        result = result.filter(
          (p) =>
            p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT",
        );
      } else if (listingType === "RENT") {
        // Show RENT or SALE_AND_RENT
        result = result.filter(
          (p) =>
            p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT",
        );
      } else if (listingType === "SALE_AND_RENT") {
        // Show strictly SALE_AND_RENT
        result = result.filter((p) => p.listing_type === "SALE_AND_RENT");
      }
    }

    // Area
    if (area !== "ALL") {
      result = result.filter((p) => p.popular_area === area);
    }

    // Near Train (BTS/MRT logic)
    if (nearTrain) {
      result = result.filter((p) => {
        const txt = (p.title + " " + (p.description || "")).toLowerCase();
        return (
          txt.includes("bts") ||
          txt.includes("mrt") ||
          txt.includes("รถไฟฟ้า") ||
          txt.includes("ใกล้สถานี")
        );
      });
    }

    // Pet Friendly
    if (petFriendly) {
      result = result.filter((p) => {
        return p.meta_keywords?.includes("Pet Friendly");
      });
    }

    // Bedrooms
    if (bedrooms !== "ALL") {
      result = result.filter((p) => {
        const beds = p.bedrooms || 0;
        if (bedrooms === "4+") {
          return beds >= 4;
        }
        return beds === parseInt(bedrooms);
      });
    }

    // Price Range
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;

    if (min > 0 || max < Infinity) {
      result = result.filter((p) => {
        const price = p.price || 0;
        const rent = p.rental_price || 0;
        const pVal = price > 0 ? price : rent;
        return pVal >= min && pVal <= max;
      });
    }

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
    bedrooms,
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
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        filteredLength={filtered.length}
        availableAreas={availableAreas}
      />

      {/* Results Grid */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-slate-600 text-sm">
            พบทรัพย์ทั้งหมด{" "}
            <span className="font-bold text-blue-600">{filtered.length}</span>{" "}
            รายการ
            {filtered.length > 0 && (
              <span className="text-slate-400 ml-2">
                (แสดง {startIndex + 1}-{Math.min(endIndex, filtered.length)})
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <MorphingLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="text-slate-400 mb-2">ไม่พบรายการที่ค้นหา</div>
            <Button
              variant="outline"
              onClick={() => {
                setKeyword("");
                setType("ALL");
              }}
            >
              ล้างการค้นหา
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
