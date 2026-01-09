"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BedDouble,
  Bath,
  MapPin,
  ArrowRight,
  Scale,
  Maximize,
  Expand,
  Car,
  Pen,
  Clock,
  Heart,
} from "lucide-react";
import { useEffect, useState, MouseEvent } from "react";
import { toggleCompareId, readCompareIds } from "@/lib/compare-store";
import { toggleFavoriteId, readFavoriteIds } from "@/lib/favorite-store";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import {
  getTypeLabel,
  getTypeColor,
  getListingBadge,
  PRICE_FORMATTER,
  getSafeText,
} from "@/lib/property-utils";

// Re-using types or defining subset
export type PropertyCardProps = {
  id: string;
  title: string;
  description?: string | null;
  property_type: string | null;
  price?: number | null;
  rental_price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  popular_area?: string | null;
  province?: string | null;
  created_at: string;
  updated_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  image_url?: string | null;
  location?: string | null;
  size_sqm?: number | null;
  parking_slots?: number | null;
  floor?: number | null;
  original_price?: number | null;
  original_rental_price?: number | null;
};

export function PropertyCard({
  property,
  priority = false,
}: {
  property: PropertyCardProps;
  priority?: boolean;
}) {
  const [isInCompare, setIsInCompare] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Sync with compare store
  useEffect(() => {
    const check = () => {
      const ids = readCompareIds();
      setIsInCompare(ids.includes(property.id));
    };
    check();
    window.addEventListener("compare-updated", check);
    return () => window.removeEventListener("compare-updated", check);
  }, [property.id]);

  // Sync with favorite store
  useEffect(() => {
    const check = () => {
      const ids = readFavoriteIds();
      setIsFavorite(ids.includes(property.id));
    };
    check();
    window.addEventListener("favorite-updated", check);
    return () => window.removeEventListener("favorite-updated", check);
  }, [property.id]);

  const [isAnimating, setIsAnimating] = useState(false);

  const handleCompareClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompareId(property.id);
  };

  const handleFavoriteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    toggleFavoriteId(property.id);
  };

  const badge = getListingBadge(property.listing_type);
  const areaProvince = [property.popular_area, property.province]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="group relative isolate rounded-3xl bg-white overflow-hidden shadow-sm h-full flex flex-col transform-gpu will-change-transform transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 before:content-[''] before:absolute before:inset-0 before:rounded-3xl before:ring-1 before:ring-inset before:ring-slate-100 before:pointer-events-none before:z-10">
      <Link
        href={`/properties/${property.id}`}
        className="flex flex-col h-full focus:outline-none"
        aria-label={`ดูรายละเอียดทรัพย์: ${property.title}`}
      >
        {/* Image Section */}

        <div className="relative h-52 overflow-hidden rounded-t-3xl bg-slate-200 group-hover:after:bg-black/5 ">
          {property.image_url ? (
            <Image
              src={property.image_url}
              alt={[
                property.title,
                property.property_type,
                property.popular_area,
              ].join(" - ")}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover  transform-gpu [will-change:transform] group-hover:scale-105 transition-transform duration-500"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 flex items-center justify-center text-sm text-slate-400">
              ไม่มีรูปภาพ
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-t-3xl bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          {/* Compare Button */}
          <button
            onClick={handleCompareClick}
            className={`absolute top-3 left-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
              isInCompare
                ? "bg-blue-600 text-white"
                : "bg-white/80 text-[#1B263B] hover:bg-blue-600 hover:text-white"
            }`}
          >
            <Scale className="h-4 w-4" />
          </button>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300  ${
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-white/40 text-[#1B263B] hover:bg-red-500 hover:text-white"
            } ${isAnimating ? "scale-125" : "scale-100"}`}
          >
            <Heart
              className={`h-4 w-4 transition-all duration-500 ${
                isFavorite ? "fill-current scale-110" : "scale-100"
              } ${isAnimating ? "animate-pulse" : ""}`}
              style={{
                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </button>

          {badge && (
            <div
              // className={`pointer-events-none absolute top-3 right-3 ${badge.className} text-white text-xs font-medium px-4 py-1 rounded-full shadow-md`}
              className={`absolute bottom-3 right-3 bg-white/90 backdrop-blur-md border border-white/30 text-[#12213b] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider`}
            >
              {badge.label}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4 flex-grow">
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-3">
              <span
                className={`text-xs font-bold ${
                  getTypeColor(property.property_type).text
                } ${
                  getTypeColor(property.property_type).bg
                } px-3 py-1 rounded-full uppercase tracking-wide`}
              >
                {getTypeLabel(property.property_type)}
              </span>
              <div className="flex items-center gap-1 text-stone-500">
                <MapPin className="h-3 w-3" />
                <span className="text-xs">
                  {getSafeText(areaProvince, "กรุงเทพฯ")}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 line-clamp-2 group-hover:text-blue-700 transition-all duration-300 ">
              {property.title}
            </h3>
          </div>

          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 min-h-[65px]">
            {getSafeText(property.description, "ยังไม่มีรายละเอียด")}
          </p>
          {/* Property Specs - ใช้สไตล์ Clean Minimal */}
          <div className="flex flex-wrap items-center text-xs text-slate-600 gap-4 pt-6">
            <div className="flex items-center gap-1.5 ">
              <BedDouble className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-[#1B263B]">
                {property.bedrooms || "-"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 ">
              <Bath className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-[#1B263B]">
                {property.bathrooms || "-"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 ">
              <Car className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-[#1B263B]">
                {property.parking_slots || "-"}
              </span>
            </div>

            <div className="flex items-center gap-1.5  ">
              <Expand className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-[#1B263B]  ">
                {property.size_sqm || "-"}
                <small className="text-[12px]">
                  {" "}
                  ม.
                  <small className="text-[10px] relative top-[-0.2em] ml-0.5">
                    2
                  </small>
                </small>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-6 pb-6   pt-4 border-t border-slate-100 bg-white/60 backdrop-blur">
          <div className="flex items-end justify-between gap-4  ">
            <div className="min-w-0 ">
              {property.listing_type === "SALE_AND_RENT" ? (
                <div className="flex flex-col justify-center  ">
                  {property.original_price &&
                  property.price &&
                  property.original_price > property.price ? (
                    <>
                      <div className="flex items-center gap-2 ">
                        <span className="text-xs text-slate-400 font-normal line-through decoration-slate-400/70">
                          {PRICE_FORMATTER.format(property.original_price)}
                        </span>
                        <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-md">
                          -
                          {Math.round(
                            ((property.original_price - property.price) /
                              property.original_price) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="text-lg font-bold text-red-600 truncate leading-tight">
                        {property.price
                          ? PRICE_FORMATTER.format(property.price)
                          : "สอบถามราคา"}
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-bold text-[#1B263B] truncate leading-tight">
                      {property.price
                        ? PRICE_FORMATTER.format(property.price)
                        : "สอบถามราคา"}
                    </div>
                  )}
                  {property.original_rental_price &&
                  property.rental_price &&
                  property.original_rental_price > property.rental_price ? (
                    <>
                      <div className="flex items-center gap-2 ">
                        <span className="text-xs text-slate-400 font-normal line-through decoration-slate-400/70">
                          {PRICE_FORMATTER.format(
                            property.original_rental_price
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-md">
                          -
                          {Math.round(
                            ((property.original_rental_price -
                              property.rental_price) /
                              property.original_rental_price) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="text-sm font-medium text-red-600 truncate leading-tight">
                        เช่า{" "}
                        {property.rental_price
                          ? PRICE_FORMATTER.format(property.rental_price)
                          : "-"}
                        <span className="text-xs text-red-400 font-normal">
                          /เดือน
                        </span>
                      </div>
                    </>
                  ) : (
                    // กรณีไม่มีราคาเช่า
                    <div className="text-sm font-medium text-[#1B263B] truncate leading-tight">
                      เช่า{" "}
                      {property.rental_price
                        ? PRICE_FORMATTER.format(property.rental_price)
                        : "-"}
                      <span className="text-xs text-slate-400 font-normal">
                        /เดือน
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* กรณีขาย/เช่า และมีส่วนลด */}
                  <div className="text-xs text-stone-400 uppercase tracking-tight">
                    ราคาเริ่มต้น
                  </div>
                  <div className="text-xl font-bold text-[#1B263B] truncate flex items-baseline gap-2">
                    {/* SALE or RENT Discount Logic */}
                    {(property.listing_type === "SALE"
                      ? property.original_price
                      : property.original_rental_price) &&
                    (property.price || property.rental_price) &&
                    (property.listing_type === "SALE"
                      ? property.original_price!
                      : property.original_rental_price!) >
                      (property.listing_type === "SALE"
                        ? property.price!
                        : property.rental_price!) &&
                    (property.listing_type === "SALE" ||
                      property.listing_type === "RENT") ? (
                      <>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-normal line-through decoration-slate-400/70">
                              {new Intl.NumberFormat("th-TH", {
                                style: "currency",
                                currency: "THB",
                                maximumFractionDigits: 0,
                              }).format(
                                property.listing_type === "SALE"
                                  ? property.original_price!
                                  : property.original_rental_price!
                              )}
                            </span>
                            <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-md">
                              -
                              {Math.round(
                                (((property.listing_type === "SALE"
                                  ? property.original_price!
                                  : property.original_rental_price!) -
                                  (property.listing_type === "SALE"
                                    ? property.price!
                                    : property.rental_price!)) /
                                  (property.listing_type === "SALE"
                                    ? property.original_price!
                                    : property.original_rental_price!)) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-red-600">
                              {getDisplayPrice(property)}
                            </span>
                            {property.listing_type === "RENT" && (
                              <span className="text-xs text-slate-500 font-normal">
                                /เดือน
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {getDisplayPrice(property)}
                        {property.listing_type === "RENT" && (
                          <span className="text-xs text-slate-500 font-normal">
                            {" "}
                            /เดือน
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="text-[10px] text-stone-400 italic flex ">
              {property.updated_at ? (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="text-slate-600 font-medium ">
                    {format(new Date(property.updated_at), "d MMM yyyy", {
                      locale: th,
                    })}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Helpers
function getDisplayPrice(property: PropertyCardProps) {
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
  return isRent ? `${formatted}` : formatted;
}
