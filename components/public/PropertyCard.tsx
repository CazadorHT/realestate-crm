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
  ShieldCheck,
  PawPrint,
  CheckSquare,
  Square,
} from "lucide-react";
import { useEffect, useState, MouseEvent } from "react";
import { toggleCompareId, readCompareIds } from "@/lib/compare-store";
import { toggleFavoriteId, readFavoriteIds } from "@/lib/favorite-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import {
  getTypeLabel,
  getTypeColor,
  getListingBadge,
  PRICE_FORMATTER,
  getSafeText,
} from "@/lib/property-utils";
import { IoShieldCheckmark } from "react-icons/io5";

// Re-using types or defining subset
export type PropertyCardProps = {
  id: string;
  slug?: string | null;
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
  verified?: boolean;
  min_contract_months?: number | null;
  meta_keywords?: string[] | null;
  features?: { id: string; name: string; icon_key: string }[] | null;
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
    <div className="group relative isolate rounded-3xl w-full max-w-[350px] mx-auto bg-white overflow-hidden shadow-md h-full flex flex-col transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:outline-none focus-within:ring-2  before:content-[''] before:absolute before:inset-0 before:rounded-3xl  before:ring-inset  before:pointer-events-none before:z-10">
      <Link
        href={`/properties/${property.slug || property.id}`}
        className="flex flex-col h-full focus:outline-none"
        aria-label={`ดูรายละเอียดทรัพย์: ${property.title}`}
      >
        {/* Image Section */}

        <div className="relative aspect-square h-[300px]  w-full overflow-hidden rounded-t-3xl bg-slate-200 group-hover:after:bg-black/5  ">
          {property.image_url ? (
            <Image
              src={property.image_url}
              alt={`${
                property.listing_type === "SALE"
                  ? "ขาย"
                  : property.listing_type === "RENT"
                  ? "เช่า"
                  : "ขาย-เช่า"
              }${getTypeLabel(property.property_type)} - ${property.title}${
                areaProvince ? ` ทำเล${areaProvince}` : ""
              }`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover object-top  transform-gpu [will-change:transform] group-hover:scale-125 group:hover:object-contain transition-transform duration-1000 "
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
              ไม่มีรูปภาพ
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-t-3xl bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Verified Badge */}
          {property.verified && (
            <div className="group/verified absolute top-3 left-3 flex items-center bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-lg z-20 transition-all duration-300 hover:pr-3 cursor-default">
              {/* Icon stays visible */}
              <IoShieldCheckmark className="w-5 h-5" />

              {/* Text expands from 0 width */}
              <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 group-hover/verified:max-w-[100px] group-hover/verified:opacity-100 group-hover/verified:ml-1.5">
                VERIFIED
              </span>
            </div>
          )}

          {property.meta_keywords?.includes("Pet Friendly") && (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-20 ">
              <PawPrint className="w-5 h-5" />
              <span>Pet Friendly</span>
            </div>
          )}

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
        <div className="pt-2 pb-6 px-6 mt-3 gap-y-3 flex-grow min-h-[180px] flex flex-col">
          <div className="space-y-1 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span
                className={`text-xs font-medium ${
                  getTypeColor(property.property_type).text
                } ${
                  getTypeColor(property.property_type).bg
                } px-3 py-1 rounded-full uppercase tracking-wide`}
              >
                {getTypeLabel(property.property_type)}
              </span>
              <div className="flex items-center gap-1 text-stone-500">
                <MapPin className="h-3 w-3 text-blue-500" />
                <span className="text-xs">
                  {getSafeText(areaProvince, "กรุงเทพฯ")}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold tracking-wide text-slate-800 line-clamp-2 group-hover:text-blue-800 transition-all duration-300 ease-in-out">
              {property.title}
            </h3>
          </div>

          {/* Property Specs - ใช้สไตล์ Clean Minimal */}
          <div className="flex flex-wrap items-center text-xs text-slate-600 gap-x-4 gap-y-2 mt-auto  ">
            <div className="flex items-center gap-1.5 ">
              <BedDouble
                className="h-5 w-5 text-slate-400 strokeWidth={1.5}"
                strokeWidth={1.5}
              />
              <span className="text-sm font-semibold text-slate-600">
                {property.bedrooms || "-"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 ">
              <Bath
                className="h-5 w-5 text-slate-400 strokeWidth={1.5}"
                strokeWidth={1.5}
              />
              <span className="text-sm font-semibold text-slate-600">
                {property.bathrooms || "-"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 ">
              <Car
                className="h-5 w-5 text-slate-400 strokeWidth={1.5}"
                strokeWidth={1.5}
              />
              <span className="text-sm font-semibold text-slate-600">
                {property.parking_slots || "-"}
              </span>
            </div>

            <div className="flex items-center gap-1.5  ">
              <Expand
                className="h-5 w-5 text-slate-400 strokeWidth={1.5}"
                strokeWidth={1.5}
              />
              <span className="text-sm font-semibold text-slate-600  ">
                {property.size_sqm || "-"}
                <small className="text-[12px]">
                  {" "}
                  ม.
                  <small className="text-[10px] font-medium relative top-[-0.2em] ml-0.5">
                    2
                  </small>
                </small>
              </span>
            </div>
          </div>

          {/* Features Preview */}
          {property.features && property.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 h-6 overflow-hidden ">
              {property.features.slice(0, 3).map((f) => (
                <span
                  key={f.id}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 group-hover:bg-slate-100 duration-300 group-hover:text-slate-700"
                >
                  {f.name}
                </span>
              ))}
              {property.features.length > 3 && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md cursor-help hover:bg-slate-100 transition-colors  group-hover:text-slate-600">
                        +{property.features.length - 3}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-slate-900/95 backdrop-blur-sm text-slate-50 border-slate-800 p-3 shadow-xl z-50"
                    >
                      <div className="font-semibold text-[10px] mb-1.5 text-slate-400 uppercase tracking-wider">
                        เพิ่มเติม
                      </div>
                      <ul className="text-xs space-y-1 min-w-[120px]">
                        {property.features.slice(3, 8).map((f) => (
                          <li key={f.id} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0"></div>
                            <span className="truncate max-w-[150px]">
                              {f.name}
                            </span>
                          </li>
                        ))}
                        {property.features.length > 8 && (
                          <li className="text-slate-500 pl-3 text-[10px]">
                            ...และอีก {property.features.length - 8} รายการ
                          </li>
                        )}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          {/* Compare Checkbox Button */}
          <button
            onClick={handleCompareClick}
            className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${
              isInCompare
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {isInCompare ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            เปรียบเทียบ
          </button>
        </div>

        {/* Footer Section */}
        <div className="h-28 px-4 py-3 border-t border-slate-200 bg-white/60 flex flex-col justify-between gap-2">
          <div className="min-w-0">
            {property.listing_type === "SALE_AND_RENT" ? (
              <div className="flex items-center gap-3 divide-x divide-slate-200">
                {/* SALE PRICE BLOCK */}
                <div className="flex flex-col  ">
                  <span className="text-[9px] font-bold uppercase tracking-tight mb-0.5">
                    ขาย
                  </span>
                  {property.original_price &&
                  property.price &&
                  property.original_price > property.price ? (
                    <div className="flex flex-wrap items-baseline  ">
                      {/* Discount Label */}
                      <div className="order-2 flex items-center gap-1 ">
                        <span className="text-[10px] text-slate-400 line-through decoration-slate-400/50">
                          {PRICE_FORMATTER.format(property.original_price)}
                        </span>
                        <span className="text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 px-1 rounded-sm">
                          -
                          {Math.round(
                            ((property.original_price - property.price) /
                              property.original_price) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      {/* Current Price */}
                      <div className="order-1 text-xl font-bold text-rose-600">
                        {PRICE_FORMATTER.format(property.price)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-slate-900">
                      {property.price || property.original_price
                        ? PRICE_FORMATTER.format(
                            property.price || property.original_price!
                          )
                        : "สอบถามราคา"}
                    </div>
                  )}
                </div>

                {/* RENT PRICE BLOCK */}
                <div className="flex flex-col pl-3">
                  <span className="text-[9px] font-bold uppercase tracking-tight mb-0.5">
                    เช่า
                  </span>
                  {property.original_rental_price &&
                  property.rental_price &&
                  property.original_rental_price > property.rental_price ? (
                    <div className="flex flex-wrap items-baseline ">
                      {/* Discount Label */}
                      <div className="order-2 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 line-through decoration-slate-400/50">
                          {PRICE_FORMATTER.format(
                            property.original_rental_price
                          )}
                        </span>
                        <span className="text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-1 rounded-sm">
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
                      {/* Current Price */}
                      <div className="order-1 text-xl font-bold text-rose-600">
                        {PRICE_FORMATTER.format(property.rental_price)}
                        <span className="text-xs text-slate-500 font-normal ml-0.5">
                          /เดือน
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-slate-900">
                      {property.rental_price || property.original_rental_price
                        ? PRICE_FORMATTER.format(
                            property.rental_price ||
                              property.original_rental_price!
                          )
                        : "สอบถามค่าเช่า"}
                      <span className="text-xs text-slate-400 font-normal ml-0.5">
                        /เดือน
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
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
                          <span className="text-xs text-slate-400 font-bold line-through decoration-slate-400/70">
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
                          <span className="text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">
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
                          <span className="text-xl font-bold text-rose-600">
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
                          /เดือน
                        </span>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            {/* Min Contract Display (Left) */}
            {(property.listing_type === "RENT" ||
              property.listing_type === "SALE_AND_RENT") &&
              property.min_contract_months && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium italic  ">
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  สัญญาขั้นต่ำ {property.min_contract_months} เดือน
                </div>
              )}

            {/* Update Date (Right) */}
            <div className="text-[11px] text-stone-400 italic flex ">
              {property.updated_at ? (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="text-slate-400 font-normal ">
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
