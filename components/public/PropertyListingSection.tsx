"use client";
//property listing section
import { useEffect, useMemo, useState, useRef, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { PropertyCard } from "./PropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";
import AOS from "aos";
import "aos/dist/aos.css";

type FilterType =
  | "ALL"
  | "HOUSE"
  | "CONDO"
  | "TOWNHOME"
  | "LAND"
  | "OFFICE"
  | "WAREHOUSE"
  | "COMMERCIAL"
  | "OTHER";

type ApiProperty = {
  id: string;
  slug?: string | null;
  title: string;
  description: string | null;
  property_type: string | null;
  price: number | null;
  rental_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  popular_area: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  address_line1: string | null;
  created_at: string;
  updated_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  image_url: string | null;
  location: string | null;
  original_price: number | null;
  original_rental_price: number | null;
  features?: { id: string; name: string; icon_key: string }[];
};

const FILTER_LABELS: Record<FilterType, string> = {
  ALL: "🏡 ทั้งหมด",
  HOUSE: "🏠 บ้าน",
  CONDO: "🏢 คอนโด",
  OFFICE: "👔 ออฟฟิศ",
  TOWNHOME: "🏡 ทาวน์โฮม",
  WAREHOUSE: "🏭 โกดัง",
  COMMERCIAL: "🏪 อาคารพาณิชย์",
  LAND: "🌳 ที่ดิน",
  OTHER: "🔹 อื่นๆ",
};

const OFFICE_TYPES = new Set(["OFFICE_BUILDING"]);
const COMMERCIAL_TYPES = new Set(["COMMERCIAL_BUILDING"]);
const WAREHOUSE_TYPES = new Set(["WAREHOUSE"]);

const MAX_VISIBLE = 8;
const LOADING_ITEMS = Array.from({ length: MAX_VISIBLE });

function matchesFilter(item: ApiProperty, filter: FilterType) {
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

// Inside component:
export function PropertyListingSection() {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [provinceFilter, setProvinceFilter] = useState<string>("");

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

  // Initialize AOS
  useEffect(() => {
    // Delay AOS init to prevent hydration mismatch
    const timer = setTimeout(() => {
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: false,
        mirror: false,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProperties() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/public/properties", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to load properties (${res.status})`);
        }

        const data = (await res.json()) as ApiProperty[];
        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setError("ไม่สามารถโหลดข้อมูลทรัพย์ได้ในขณะนี้");
      } finally {
        setIsLoading(false);
      }
    }

    loadProperties();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const area = (searchParams.get("area") ?? "").trim();
    const prov = (searchParams.get("province") ?? "").trim();
    const type = (searchParams.get("type") ?? "").trim();

    setAreaFilter(area);
    setProvinceFilter(prov);

    // sync type -> FilterType (รองรับ OFFICE_BUILDING / COMMERCIAL_BUILDING / WAREHOUSE)
    if (type) {
      const mapped =
        type === "OFFICE_BUILDING"
          ? "OFFICE"
          : type === "COMMERCIAL_BUILDING"
          ? "COMMERCIAL"
          : type === "WAREHOUSE"
          ? "WAREHOUSE"
          : (type as FilterType);

      if ((Object.keys(FILTER_LABELS) as string[]).includes(mapped)) {
        setFilter(mapped as FilterType);
      }
    }
  }, [searchParams]);

  const filteredProperties = useMemo(() => {
    let items = properties.filter((item) => matchesFilter(item, filter));

    if (areaFilter) {
      items = items.filter((p) => (p.popular_area ?? "").includes(areaFilter));
    }
    if (provinceFilter) {
      items = items.filter((p) => (p.province ?? "").includes(provinceFilter));
    }

    return [...items].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [filter, properties, areaFilter, provinceFilter]);

  const visibleProperties = useMemo(
    () => filteredProperties.slice(0, MAX_VISIBLE),
    [filteredProperties]
  );

  const hasMore = filteredProperties.length > MAX_VISIBLE;
  const resultCount = filteredProperties.length;

  // Schema.org ItemList for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ประกาศขายเช่าอสังหาริมทรัพย์ล่าสุด",
    description:
      "รวมประกาศซื้อ ขาย เช่า บ้าน คอนโด ที่ดิน ทาวน์โฮม และอสังหาริมทรัพย์ทุกประเภท",
    numberOfItems: visibleProperties.length,
    itemListElement: visibleProperties.slice(0, 8).map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: property.title,
        description: property.description || "ทรัพย์สินคุณภาพ",
        image: property.image_url,
        offers: {
          "@type": "Offer",
          price:
            property.listing_type === "RENT"
              ? property.rental_price
              : property.price,
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "PriceSpecification",
            price:
              property.listing_type === "RENT"
                ? property.rental_price
                : property.price,
            priceCurrency: "THB",
          },
        },
        url: `https://your-domain.com/properties/${
          property.slug || property.id
        }`,
      },
    })),
  };

  return (
    <section
      id="latest-properties"
      className="py-20 px-4 bg-white border-y border-slate-100"
    >
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          {/* SEO-Optimized Header */}
          <div className="space-y-3" data-aos="fade-right">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
                บ้าน คอนโด สำนักงานออฟฟิศ
              </span>
              <br />
              <span className="text-slate-600 text-2xl md:text-3xl font-semibold">
                ซื้อ · ขาย · เช่า
              </span>{" "}
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
              รวมประกาศ{" "}
              <span className="font-semibold text-slate-900">
                บ้านเดี่ยว คอนโดมิเนียม สำนักงานออฟฟิศ ทาวน์โฮม
              </span>{" "}
              และ อสังหาริมทรัพย์ทุกประเภท ตรวจสอบข้อมูลแล้ว 100%
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {!isLoading && !error && (
                <div className="text-sm text-slate-600">
                  หมวด:{" "}
                  <span className="font-semibold text-blue-600">
                    {FILTER_LABELS[filter]}
                  </span>{" "}
                  • พบ{" "}
                  <span className="font-semibold text-blue-600">
                    {resultCount.toLocaleString("th-TH")}
                  </span>{" "}
                  รายการ
                </div>
              )}
            </div>
          </div>

          {/* เลือกประเภททรัพย์ (Scrollable with Arrows) */}
          <div
            className="w-full lg:w-auto flex flex-col items-end gap-4 text-sm"
            data-aos="fade-left"
          >
            <div className="flex justify-end">
              <Button
                asChild
                variant="outline"
                className="h-11 px-6 text-base "
              >
                <Link href="/properties">
                  ดูทรัพย์เพิ่มเติม
                  {hasMore && <ArrowRight className="h-4 w-4" />}
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-14">
              {(areaFilter || provinceFilter) && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">ทรัพย์ในย่านทำเล :</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700">
                    {[areaFilter, provinceFilter].filter(Boolean).join(" • ")}
                    <button
                      onClick={() => {
                        // Clear filters and stay at current position using hash
                        router.push("/#latest-properties");
                      }}
                      className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-rose-400 hover:text-white duration-300 transition-colors"
                      title="ลบตัวกรอง"
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

              <div className="relative group max-w-[400px] lg:max-w-[400px] select-none">
                <div
                  id="filter-scroll-container"
                  ref={scrollContainerRef}
                  className={`flex gap-2 overflow-x-auto whitespace-nowrap py-1 scroll-smooth snap-x snap-mandatory px-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab active:cursor-grabbing ${
                    isDragging ? "snap-none scroll-auto" : ""
                  }`}
                  role="tablist"
                  aria-label="Property type filters"
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  {(Object.keys(FILTER_LABELS) as FilterType[]).map((type) => {
                    const active = filter === type;
                    return (
                      <button
                        key={type}
                        onClick={(e) => {
                          // ถ้ามีการลาก ไม่ให้ถือว่าคลิก (prevent click triggering after drag)
                          if (isDragClick.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          setFilter(type);
                        }}
                        role="tab"
                        aria-selected={active}
                        aria-pressed={active}
                        className={`shrink-0 snap-start px-4 py-2 rounded-full border text-sm font-semibold transition-all pointer-events-auto ${
                          active
                            ? "bg-slate-900 text-white border-slate-900 shadow-md"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600"
                        }`}
                      >
                        {FILTER_LABELS[type]}
                      </button>
                    );
                  })}
                </div>

                {/* Prev Button */}
                <button
                  onClick={() => {
                    const el = document.getElementById(
                      "filter-scroll-container"
                    );
                    if (el) el.scrollBy({ left: -200, behavior: "smooth" });
                  }}
                  className="absolute -left-12 top-1/2 -translate-y-1/2  bg-white/80 backdrop-blur border border-slate-200 rounded-full p-2 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900 focus:outline-none z-10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
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
                      "filter-scroll-container"
                    );
                    if (el) el.scrollBy({ left: 200, behavior: "smooth" });
                  }}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur border border-slate-200 rounded-full p-2 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900 focus:outline-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </div>
          </div>
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
                ลองใหม่
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {LOADING_ITEMS.map((_, index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-slate-600">
            ยังไม่มีทรัพย์ในประเภทที่เลือก — ลองเปลี่ยนหมวด หรือดู “ทั้งหมด”
          </div>
        ) : (
          <div className="space-y-8 align-center">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 gap-y-8">
              {visibleProperties.map((property, index) => {
                const hasDiscount =
                  (property.original_price &&
                    property.price &&
                    property.original_price > property.price) ||
                  (property.original_rental_price &&
                    property.rental_price &&
                    property.original_rental_price > property.rental_price);

                return (
                  <div
                    key={property.id}
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                    className="relative group"
                  >
                    {hasDiscount && (
                      <div className="absolute -top-6 -left-6 z-30">
                        <div className="relative">
                          <div className="absolute inset-0 bg-red-500 blur-md opacity-50 rounded-full animate-pulse"></div>
                          <div className="relative bg-gradient-to-br from-red-500 to-orange-600 text-white p-2.5 rounded-full shadow-[0_4px_12px_rgba(239,68,68,0.4)] transform -rotate-12 group-hover:rotate-0  group-hover:scale-110 transition-all duration-300 ">
                            <Sparkles className="h-6 w-6 fill-yellow-200" />
                          </div>
                        </div>
                      </div>
                    )}
                    <PropertyCard property={property} priority={index === 0} />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button
                asChild
                variant="outline"
                className="h-11 px-6 text-base "
              >
                <Link href="/properties">
                  ดูทรัพย์เพิ่มเติม
                  {hasMore && <ArrowRight className="h-4 w-4" />}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
