"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BedDouble, Bath, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
  title: string;
  description: string | null;
  property_type: string | null;
  price: number | null;
  rental_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  popular_area: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  address_line1: string | null;
  created_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  image_url: string | null;
  location: string | null;
};

const FILTER_LABELS: Record<FilterType, string> = {
  ALL: "ทั้งหมด",
  HOUSE: "บ้าน",
  CONDO: "คอนโด",
  OFFICE: "ออฟฟิศ",
  TOWNHOME: "ทาวน์โฮม",
  WAREHOUSE: "โกดัง",
  COMMERCIAL: "อาคารพาณิชย์",
  LAND: "ที่ดิน",
  OTHER: "อื่นๆ",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "บ้าน",
  CONDO: "คอนโด",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  OFFICE_BUILDING: "ออฟฟิศ",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
  WAREHOUSE: "โกดัง",
  OTHER: "อื่นๆ",
};

const OFFICE_TYPES = new Set(["OFFICE_BUILDING"]);
const COMMERCIAL_TYPES = new Set(["COMMERCIAL_BUILDING"]);
const WAREHOUSE_TYPES = new Set(["WAREHOUSE"]);

const PRICE_FORMATTER = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const LOADING_ITEMS = Array.from({ length: 6 });
const MAX_VISIBLE = 8;

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

function getTypeLabel(propertyType: string | null) {
  if (!propertyType) return "อื่นๆ";
  return PROPERTY_TYPE_LABELS[propertyType] ?? "อื่นๆ";
}

function getDisplayPrice(property: ApiProperty) {
  const salePrice = property.price ?? undefined;
  const rentPrice = property.rental_price ?? undefined;

  let value: number | undefined;
  let isRent = false;

  if (property.listing_type === "SALE") {
    value = salePrice;
  } else if (property.listing_type === "RENT") {
    value = rentPrice;
    isRent = true;
  } else {
    value = salePrice ?? rentPrice;
    isRent = !salePrice && !!rentPrice;
  }

  if (!value) return "สอบถามราคา";

  const formatted = PRICE_FORMATTER.format(value);
  return isRent ? `${formatted}/เดือน` : formatted;
}

function getSafeText(value: string | null, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function getListingBadge(listingType: ApiProperty["listing_type"]) {
  if (listingType === "SALE")
    return { label: "ขาย", className: "bg-emerald-600" };
  if (listingType === "RENT")
    return { label: "เช่า", className: "bg-indigo-600" };
  if (listingType === "SALE_AND_RENT")
    return { label: "ขาย/เช่า", className: "bg-slate-900" };
  return null;
}

export function PropertyListingSection() {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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

  const filteredProperties = useMemo(() => {
    const items = properties.filter((item) => matchesFilter(item, filter));
    return [...items].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filter, properties]);

  const visibleProperties = useMemo(
    () => filteredProperties.slice(0, MAX_VISIBLE),
    [filteredProperties]
  );

  const hasMore = filteredProperties.length > MAX_VISIBLE;
  const resultCount = filteredProperties.length;

  function getAreaProvince(p: ApiProperty) {
    const parts = [p.popular_area, p.province].filter(
      (v) => v && v.trim()
    ) as string[];
    return parts.length ? parts.join(" • ") : null;
  }
  return (
    <section className="py-20 px-4 bg-white border-y border-slate-100">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-slate-900">
              แสดงทรัพย์จากดาต้าทั้งหมด
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              เลือกประเภททรัพย์ที่ต้องการ แล้วดูรายการแบบเรียงจากใหม่สุด
              พร้อมรายละเอียดครบถ้วนในรูปแบบการ์ด
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {!isLoading && !error && (
                <div className="text-sm text-slate-600 ">
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

          <div className="-mx-4 px-4">
            <div
              className="flex gap-2 overflow-x-auto whitespace-nowrap py-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
              role="tablist"
              aria-label="Property type filters"
            >
              {(Object.keys(FILTER_LABELS) as FilterType[]).map((type) => {
                const active = filter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    role="tab"
                    aria-selected={active}
                    aria-pressed={active}
                    className={`shrink-0 snap-start px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                      active
                        ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600"
                    }`}
                  >
                    {FILTER_LABELS[type]}
                  </button>
                );
              })}
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LOADING_ITEMS.map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm animate-pulse"
              >
                <div className="h-48 bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-2/3 bg-slate-200 rounded" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-24 bg-slate-200 rounded" />
                    <div className="h-10 w-28 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-slate-600">
            ยังไม่มีทรัพย์ในประเภทที่เลือก — ลองเปลี่ยนหมวด หรือดู “ทั้งหมด”
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {visibleProperties.map((property, index) => {
                const href = `/properties/${property.id}`;
                const badge = getListingBadge(property.listing_type);
                const areaProvince = getAreaProvince(property);
                return (
                  <div
                    key={property.id}
                    className="group relative isolate rounded-3xl bg-white overflow-hidden shadow-sm transform-gpu will-change-transform transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500
before:content-[''] before:absolute before:inset-0 before:rounded-3xl before:ring-1 before:ring-inset before:ring-slate-100 before:pointer-events-none before:z-10"
                  >
                    <Link
                      href={href}
                      className="block focus:outline-none "
                      aria-label={`ดูรายละเอียดทรัพย์: ${property.title}`}
                    >
                      <div className="relative h-52 overflow-hidden rounded-t-3xl bg-slate-200">
                        {property.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <Image
                            src={property.image_url}
                            alt={property.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-cover transform-gpu [will-change:transform] group-hover:scale-105 transition-transform duration-500"
                            priority={index === 0}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 flex items-center justify-center text-sm text-slate-400">
                            ไม่มีรูปภาพ
                          </div>
                        )}

                        {/* Overlay gradient ช่วยให้ badge/ข้อความอ่านง่าย */}
                        <div className="pointer-events-none absolute inset-0 rounded-t-3xl bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                        {index === 0 && (
                          <div className="pointer-events-none absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                            ใหม่สุด
                          </div>
                        )}

                        {badge && (
                          <div
                            className={`pointer-events-none absolute top-3 right-3 ${badge.className} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md`}
                          >
                            {badge.label}
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <div className="text-sm text-blue-600 font-semibold">
                            {getTypeLabel(property.property_type)}
                          </div>

                          <h3 className="text-xl font-bold text-slate-900 line-clamp-2">
                            {property.title}
                          </h3>

                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {getSafeText(areaProvince, "ไม่ระบุทำเล")}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {getSafeText(
                            property.description,
                            "ยังไม่มีรายละเอียด"
                          )}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200">
                            <BedDouble className="h-4 w-4 text-blue-600" />
                            {property.bedrooms || "-"} นอน
                          </div>
                          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200">
                            <Bath className="h-4 w-4 text-blue-600" />
                            {property.bathrooms || "-"} น้ำ
                          </div>
                        </div>
                      </div>
                      {/* Action zone: footer ของการ์ด (ไม่ซ้อน Link) */}
                      <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-white/60 backdrop-blur">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-xs text-slate-500">ราคา</div>
                            <div className="text-lg font-bold text-slate-900 truncate">
                              {getDisplayPrice(property)}
                            </div>
                          </div>
                          <div className="h-10 px-4 inline-flex items-center gap-2 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600">
                            ดูรายละเอียด
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
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
