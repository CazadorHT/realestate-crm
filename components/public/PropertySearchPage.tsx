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
import { Home } from "lucide-react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
      const pA = a.price || a.rental_price || 0;
      const pB = b.price || b.rental_price || 0;
      return sort === "PRICE_ASC" ? pA - pB : pB - pA;
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
  ]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header / Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 space-y-4">
          {/* Top Row: Search + Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหา... (ชื่อ, ทำเล, รายละเอียด)"
                className="pl-10 h-10"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] h-10">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="เรียงลำดับ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEWEST">มาใหม่ล่าสุด</SelectItem>
                  <SelectItem value="PRICE_ASC">ราคา: น้อยไปมาก</SelectItem>
                  <SelectItem value="PRICE_DESC">ราคา: มากไปน้อย</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom Row: Detailed Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Property Type */}
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[160px] h-10">
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

            {/* Listing Type / Status */}
            <Select value={listingType} onValueChange={setListingType}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="SALE">ขาย</SelectItem>
                <SelectItem value="RENT">เช่า</SelectItem>
                <SelectItem value="SALE_AND_RENT">ขายและเช่า</SelectItem>
              </SelectContent>
            </Select>

            {/* Area Filter */}
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="เลือกย่าน/ทำเล" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกทำเล</SelectItem>
                {availableAreas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="ต่ำสุด"
                className="w-24 h-10"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="text-slate-400">-</span>
              <Input
                type="number"
                placeholder="สูงสุด"
                className="w-24 h-10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            {/* BTS/MRT Checkbox */}
            <div className="flex items-center space-x-2 border border-slate-200 rounded-md px-3 h-10 bg-white">
              <Checkbox
                id="near_train"
                checked={nearTrain}
                onCheckedChange={(c) => setNearTrain(!!c)}
              />
              <label
                htmlFor="near_train"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                ใกล้รถไฟฟ้า
              </label>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setKeyword("");
                setType("ALL");
                setListingType("ALL");
                setMinPrice("");
                setMaxPrice("");
                setSort("NEWEST");
                setArea("ALL");
                setNearTrain(false);
              }}
              className="text-slate-500 hover:text-red-600 px-3 ml-auto md:ml-0"
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </div>
      </div>
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
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="mb-6 text-slate-600 text-sm">
          พบทรัพย์ทั้งหมด{" "}
          <span className="font-bold text-blue-600">{filtered.length}</span>{" "}
          รายการ
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filtered.map((item, i) => (
              <PropertyCard key={item.id} property={item} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
