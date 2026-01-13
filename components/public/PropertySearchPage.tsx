"use client";

import { useEffect, useState, useMemo } from "react";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { MorphingLoader } from "@/components/ui/MorphingLoader";
import { FilterBarSkeleton } from "./FilterBarSkeleton";
import { Home } from "lucide-react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MdOutlinePets } from "react-icons/md";
import { FaTrainSubway } from "react-icons/fa6";

type ApiProperty = PropertyCardProps;

const PROPERTY_TYPES = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "HOUSE", label: "บ้าน" },
  { value: "CONDO", label: "คอนโด" },
  { value: "TOWNHOME", label: "ทาวน์โฮม" },
  { value: "LAND", label: "ที่ดิน" },
  { value: "OFFICE_BUILDING", label: "ออฟฟิศ" },
  { value: "COMMERCIAL_BUILDING", label: "อาคารพาณิชย์" },
  { value: "WAREHOUSE", label: "โกดัง" },
];

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
  // Breadcrumb Schema.org
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: "https://your-domain.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ทรัพย์สิน",
        item: "https://your-domain.com/properties",
      },
    ],
  };
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
          (p.province || "").toLowerCase().includes(k)
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
          (p) => p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT"
        );
      } else if (listingType === "RENT") {
        // Show RENT or SALE_AND_RENT
        result = result.filter(
          (p) => p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT"
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
        // Simple logic: check both price and rental_price if they exist
        const price = p.price || 0;
        const rent = p.rental_price || 0;
        const pVal = price > 0 ? price : rent; // Prefer selling price if mixed
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
      {/* Luxury Filter Bar - 2 Row Layout */}
      {isLoading ? (
        <FilterBarSkeleton />
      ) : (
        <div className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* Row 1: Search + Core Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
              {/* Search Bar - Takes 5 columns */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="ค้นหาอสังหาฯ ที่ใช่สำหรับคุณ..."
                    className="pl-12 h-12 text-base rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>

              {/* Property Type - 2 columns */}
              <div className="lg:col-span-2">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-12 py-[23px] w-[160px] rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                    <SelectValue placeholder="ประเภททรัพย์" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Listing Type Buttons - 3 columns */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-4 gap-1.5 h-12">
                  {/* ALL */}
                  <button
                    onClick={() => setListingType("ALL")}
                    className={`rounded-lg border-2 transition-all font-medium text-xs ${
                      listingType === "ALL"
                        ? "bg-slate-600 border-slate-600 text-white shadow-md"
                        : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  {/* SALE */}
                  <button
                    onClick={() => setListingType("SALE")}
                    className={`rounded-lg border-2 transition-all font-medium text-xs ${
                      listingType === "SALE"
                        ? "bg-green-600 border-green-600 text-white shadow-md"
                        : "bg-white border-slate-200 hover:border-green-400 hover:bg-green-50 text-slate-700 hover:text-green-700"
                    }`}
                  >
                    ขาย
                  </button>
                  {/* RENT */}
                  <button
                    onClick={() => setListingType("RENT")}
                    className={`rounded-lg border-2 transition-all font-medium text-xs ${
                      listingType === "RENT"
                        ? "bg-orange-600 border-orange-600 text-white shadow-md"
                        : "bg-white border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-slate-700 hover:text-orange-700"
                    }`}
                  >
                    เช่า
                  </button>
                  {/* SALE_AND_RENT */}
                  <button
                    onClick={() => setListingType("SALE_AND_RENT")}
                    className={`rounded-lg border-2 transition-all font-medium text-xs ${
                      listingType === "SALE_AND_RENT"
                        ? "bg-blue-600 border-blue-600 text-white shadow-md"
                        : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                    }`}
                  >
                    ขาย+เช่า
                  </button>
                </div>
              </div>

              {/* Price Range - 2 columns */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 h-12 bg-white rounded-xl  border border-slate-200 shadow-sm">
                  <Input
                    type="number"
                    placeholder="ราคาต่ำสุด"
                    className="border-0 h-full w-full p-0 text-sm focus-visible:ring-0 bg-white px-2"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="text-slate-400">—</span>
                  <Input
                    type="number"
                    placeholder="สูงสุด"
                    className="border-0 h-full w-full p-0 text-sm focus-visible:ring-0 bg-white px-2"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Secondary Filters + Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Area */}
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="w-[160px] h-12 py-[23px] rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder="ทุกย่านทำเล" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">-- ทุกย่านทำเล --</SelectItem>
                  {availableAreas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bedrooms Toggle Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl h-12">
                <span className="text-xs text-slate-600 font-medium px-2">
                  ห้องนอน:
                </span>
                {["ALL", "1", "2", "3", "4+"].map((bed) => (
                  <button
                    key={bed}
                    onClick={() => setBedrooms(bed)}
                    className={`h-9 px-3 rounded-lg transition-all font-medium text-sm ${
                      bedrooms === bed
                        ? "bg-indigo-600 text-white shadow-md "
                        : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    {bed === "ALL" ? "ทั้งหมด" : bed}
                  </button>
                ))}
              </div>

              {/* Near Train */}
              <div
                className={`flex items-center justify-center gap-2 px-4 h-12 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                  nearTrain
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700"
                }`}
                onClick={() => setNearTrain(!nearTrain)}
              >
                <FaTrainSubway
                  className={`h-4 w-4 ${
                    nearTrain ? "text-white" : "text-blue-600"
                  }`}
                />
                <span className="text-sm font-medium select-none">
                  ใกล้รถไฟฟ้า
                </span>
              </div>

              {/* Pet Friendly */}
              <div
                className={`flex items-center justify-center gap-2 px-4 h-12 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                  petFriendly
                    ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/30"
                    : "bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-700 hover:text-orange-700"
                }`}
                onClick={() => setPetFriendly(!petFriendly)}
              >
                <MdOutlinePets
                  className={`h-5 w-5 ${
                    petFriendly ? "text-white" : "text-orange-600"
                  }`}
                />
                <span className="text-sm font-medium select-none">
                  เลี้ยงสัตว์ได้
                </span>
              </div>

              {/* Sort */}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[210px] h-12 py-[23px] rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="เรียงลำดับ" />
                </SelectTrigger>
                <SelectContent className="min-w-[210px]">
                  <SelectItem value="NEWEST">🆕 มาใหม่ล่าสุด</SelectItem>
                  <SelectItem value="PRICE_ASC">💰 ราคาน้อย → มาก</SelectItem>
                  <SelectItem value="PRICE_DESC">💎 ราคามาก → น้อย</SelectItem>
                  <SelectItem value="AREA_ASC">📐 พื้นที่น้อย → มาก</SelectItem>
                  <SelectItem value="AREA_DESC">
                    🏠 พื้นที่มาก → น้อย
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Button - Right Aligned */}
              <Button
                variant="outline"
                onClick={() => {
                  setKeyword("");
                  setType("ALL");
                  setListingType("ALL");
                  setMinPrice("");
                  setMaxPrice("");
                  setSort("NEWEST");
                  setArea("ALL");
                  setNearTrain(false);
                  setPetFriendly(false);
                  setBedrooms("ALL");
                }}
                className="ml-auto h-12 px-5 rounded-xl border-2 border-slate-200 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium shadow-sm bg-white"
              >
                <SlidersHorizontal className={`h-4 w-4 mr-2 text-rose-500`} />
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-8 pb-2">
        <nav
          className="flex items-center gap-2 text-sm text-slate-600"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          <Link
            href="/"
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="1" />
            <Home className="w-4 h-4" />
            <span itemProp="name">หน้าแรก</span>
            <meta itemProp="item" content="https://your-domain.com" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span
            className="text-blue-600 font-medium"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="2" />
            <span itemProp="name">ทรัพย์สิน</span>
            <meta
              itemProp="item"
              content="https://your-domain.com/properties"
            />
          </span>
        </nav>
      </div>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-10 px-4"
                  >
                    ก่อนหน้า
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, current, and adjacent pages
                        if (page === 1 || page === totalPages) return true;
                        if (page >= currentPage - 1 && page <= currentPage + 1)
                          return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        // Add ellipsis
                        const showEllipsisBefore =
                          idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsisBefore && (
                              <span className="px-2 text-slate-400">...</span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              onClick={() => setCurrentPage(page)}
                              className={`h-10 w-10 p-0 ${
                                currentPage === page
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : ""
                              }`}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-10 px-4"
                  >
                    ถัดไป
                  </Button>
                </div>

                {/* Page Info */}
                <div className="text-sm text-slate-500">
                  หน้า {currentPage} จาก {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
