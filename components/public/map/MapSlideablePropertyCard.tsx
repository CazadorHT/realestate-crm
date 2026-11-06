"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  X,
  BedDouble,
  Bath,
  Maximize2,
  Building2,
  TrainFront,
  ExternalLink,
  Layers,
  Car,
  Scale,
  Heart,
} from "lucide-react";
import { FaAirbnb, FaPersonWalking, FaCarSide, FaTrainSubway } from "react-icons/fa6";
import { PiFireFill } from "react-icons/pi";
import { getEffectivePrice } from "@/lib/property-hardened-utils";
import { formatPrice, getOfficePrice } from "@/lib/property-utils";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { isInCompare, toggleCompareId } from "@/lib/compare-store";
import { isFavorite, toggleFavoriteId } from "@/lib/favorite-store";
import type { MapLocationGroup } from "./useMapClusters";
import {
  computeTransitTravelInfo,
  getPinProjectOrPropertyHeadline,
  getTransitLogo,
} from "./map-price-utils";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

interface MapSlideablePropertyCardProps {
  group: MapLocationGroup;
  initialUnitId?: string | null;
  onClose: () => void;
  onFocusProjectGroup?: (group: MapLocationGroup) => void;
  className?: string;
}

export function MapSlideablePropertyCard({
  group,
  initialUnitId,
  onClose,
  onFocusProjectGroup,
  className = "",
}: MapSlideablePropertyCardProps) {
  const { language, langPrefix, t } = useLanguage();
  const units = group.units;
  const total = units.length;

  const [index, setIndex] = useState<number>(() => {
    if (initialUnitId) {
      const found = units.findIndex((u) => u.id === initialUnitId);
      if (found >= 0) return found;
    }
    return 0;
  });

  const [imgError, setImgError] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialUnitId) {
      const found = units.findIndex((u) => u.id === initialUnitId);
      setIndex(found >= 0 ? found : 0);
    } else {
      setIndex(0);
    }
    setImgError(false);
  }, [group.groupId, initialUnitId, units]);

  const safeIndex = index >= 0 && index < total ? index : 0;
  const current = units[safeIndex];

  useEffect(() => {
    if (!current?.id) return;
    const check = () => setInCompare(isInCompare(current.id));
    check();
    window.addEventListener("compare-updated", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("compare-updated", check);
      window.removeEventListener("storage", check);
    };
  }, [current?.id]);

  useEffect(() => {
    if (!current?.id) return;
    const checkFav = () => setFavorited(isFavorite(current.id));
    checkFav();
    window.addEventListener("favorite-updated", checkFav);
    window.addEventListener("storage", checkFav);
    return () => {
      window.removeEventListener("favorite-updated", checkFav);
      window.removeEventListener("storage", checkFav);
    };
  }, [current?.id]);

  if (!current) return null;

  const prices = getEffectivePrice(current);
  const officeInfo = getOfficePrice(current);

  const effectiveSalePrice =
    prices.salePrice ||
    (officeInfo?.isCalculated && current.listing_type !== "RENT"
      ? officeInfo.totalPrice || 0
      : 0);

  const effectiveRentalPrice =
    prices.rentalPrice ||
    (officeInfo?.isCalculated && current.listing_type !== "SALE"
      ? officeInfo.totalPrice || 0
      : 0);

  const { primaryTitle, secondarySubtitle, isProjectHeadline } =
    getPinProjectOrPropertyHeadline(current, language);

  // Dynamic cover image for the active slide unit -> fallback to project cover -> fallback placeholder
  const activeCoverSrc = imgError
    ? current.project_image_url || FALLBACK_IMG
    : current.image_url || current.project_image_url || FALLBACK_IMG;

  const detailHref = `${langPrefix || ""}/properties/${current.slug || current.id}`;
  const projectHref = current.project_slug
    ? `${langPrefix || ""}/projects/${current.project_slug}`
    : null;

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImgError(false);
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImgError(false);
    setIndex((prev) => (prev + 1) % total);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current == null || total <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  const transitLabel =
    (language === "en" && current.transit_station_name_en) ||
    (language === "cn" && current.transit_station_name_cn) ||
    (language === "ru" && current.transit_station_name_ru) ||
    current.transit_station_name;

  // Exact user-entered transit distance and time from property details / nearby_transits
  const travelInfo = useMemo(() => {
    let explicitDist = current.transit_distance_meters || null;
    let explicitTime: string | null = null;

    if (Array.isArray(current.nearby_transits)) {
      const match = (current.nearby_transits as any[]).find((t: any) => {
        if (!t) return false;
        const name = (t.station_name || "").trim().toLowerCase();
        const main = (current.transit_station_name || "").trim().toLowerCase();
        return main && (name.includes(main) || main.includes(name));
      });
      if (match) {
        if (match.distance_meters != null && match.distance_meters > 0) {
          explicitDist = Number(match.distance_meters);
        }
        if (match.time && typeof match.time === "string" && match.time.trim()) {
          explicitTime = match.time.trim();
        }
      }
    }

    if (!explicitDist) return null;

    return computeTransitTravelInfo({
      distanceMeters: explicitDist,
      explicitTime,
      language,
    });
  }, [current, language]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "w-[300px] sm:w-[328px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-900 select-none animate-in fade-in zoom-in-95 duration-150",
        className
      )}
    >
      {/* Dynamic Unit Cover Photo Header */}
      <div className="relative h-56 sm:h-60 w-full bg-slate-100 overflow-hidden">
        <Image
          key={current.id}
          src={activeCoverSrc}
          alt={primaryTitle}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 328px"
          onError={() => setImgError(true)}
          className="object-cover transition-transform duration-300 hover:scale-105"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-black/25 pointer-events-none" />

        {/* Top-left Badges (Hot Deal / Listing Type) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap max-w-[75%]">
          {current.is_hot_deal && (
            <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              <PiFireFill className="w-3 h-3" />
              <span>Hot Deal</span>
            </span>
          )}
          {total > 1 && (
            <span className="inline-flex items-center gap-1 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/15">
              <span>
                {language === "th"
                  ? `ยูนิต ${safeIndex + 1} / ${total}`
                  : language === "cn"
                    ? `第 ${safeIndex + 1} / ${total} 套`
                    : language === "ru"
                      ? `Юнит ${safeIndex + 1} / ${total}`
                      : `Unit ${safeIndex + 1} / ${total}`}
              </span>
            </span>
          )}
        </div>

        {/* Top-right Favorite, Compare & Close Controls */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
          {/* Favorite Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteId(current.id);
            }}
            className={cn(
              "w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md",
              favorited
                ? "bg-rose-500 text-white shadow-rose-500/30 scale-105"
                : "bg-black/60 hover:bg-black/80 text-white"
            )}
            title={
              favorited
                ? language === "th"
                  ? "ยกเลิกบันทึกที่ชอบ"
                  : "Remove from favorites"
                : language === "th"
                  ? "บันทึกที่ชอบ"
                  : "Save to favorites"
            }
            aria-label="Favorite button"
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                favorited ? "fill-white text-white scale-110" : "text-white"
              )}
            />
          </button>

          {/* Compare Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const willAdd = !inCompare;
              toggleCompareId(current.id);
              // Auto-close card so user can easily browse the next project on the map
              if (willAdd) {
                setTimeout(() => {
                  onClose();
                }, 180);
              }
            }}
            className={cn(
              "h-7 px-2.5 rounded-full backdrop-blur-md flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-md",
              inCompare
                ? "bg-blue-600 text-white ring-2 ring-white/60"
                : "bg-black/60 hover:bg-black/80 text-white"
            )}
            title={inCompare ? "นำออกจากการเปรียบเทียบ" : "เพิ่มเพื่อเปรียบเทียบโครงการ"}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>
              {inCompare
                ? language === "th"
                  ? "เลือกแล้ว"
                  : "Selected"
                : language === "th"
                  ? "+ เทียบ"
                  : "+ Compare"}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close preview"
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Left / Right Slide Arrows when multiple units exist in this project/location */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous unit"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next unit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Bottom Overlay: Slide Dots (when multiple units in project) */}
        {total > 1 && total <= 8 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/45 backdrop-blur-xs px-2 py-1 rounded-full z-10">
            {units.map((u, idx) => (
              <button
                key={u.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImgError(false);
                  setIndex(idx);
                }}
                aria-label={`Unit ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === safeIndex ? "w-3.5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Body: Project Name Primary Headline (or Property Title Fallback) */}
      <div className="p-3.5 space-y-2.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-extrabold text-sm text-[#1B263B] line-clamp-1 leading-snug">
              {primaryTitle}
            </h4>
            {isProjectHeadline && projectHref && (
              <Link
                href={projectHref}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 shrink-0"
              >
                <Building2 className="w-3 h-3" />
                <span>
                  {language === "th"
                    ? "ดูโครงการ"
                    : language === "cn"
                      ? "查看楼盘"
                      : language === "ru"
                        ? "Проект"
                        : "Project"}
                </span>
              </Link>
            )}
          </div>
          {secondarySubtitle && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {secondarySubtitle}
            </p>
          )}
        </div>

        {/* Unit Specs Row */}
        {(() => {
          const effectiveFloor =
            current.floor != null
              ? current.floor
              : (current.amenities as any)?.floor != null &&
                  !isNaN(Number((current.amenities as any)?.floor))
                ? Number((current.amenities as any)?.floor)
                : null;

          const effectiveParking =
            current.parking_slots != null
              ? current.parking_slots
              : (current.amenities as any)?.parking_slots != null &&
                  !isNaN(Number((current.amenities as any)?.parking_slots))
                ? Number((current.amenities as any)?.parking_slots)
                : null;

          return (
            <div className="flex items-center flex-wrap gap-3 text-xs text-slate-600 font-medium pt-0.5">
              {current.bedrooms != null && current.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                  <span>{current.bedrooms}</span>
                </span>
              )}
              {current.bathrooms != null && current.bathrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-slate-400" />
                  <span>{current.bathrooms}</span>
                </span>
              )}
              {(current.size_sqm || current.land_size_sqwah) && (
                <span className="inline-flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {current.size_sqm
                      ? `${current.size_sqm} ${
                          language === "th"
                            ? "ตร.ม."
                            : language === "cn"
                              ? "㎡"
                              : language === "ru"
                                ? "м²"
                                : "sqm"
                        }`
                      : `${current.land_size_sqwah} ${
                          language === "th"
                            ? "ตร.ว."
                            : language === "cn"
                              ? "平方哇"
                              : language === "ru"
                                ? "кв.ва"
                                : "sq.w"
                        }`}
                  </span>
                </span>
              )}
              {effectiveFloor != null && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {language === "th"
                      ? `ชั้น ${effectiveFloor}`
                      : language === "cn"
                        ? `${effectiveFloor}层`
                        : language === "ru"
                          ? `эт. ${effectiveFloor}`
                          : `Fl. ${effectiveFloor}`}
                  </span>
                </span>
              )}
              {effectiveParking != null && effectiveParking > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {effectiveParking}{" "}
                    {language === "th"
                      ? "คัน"
                      : language === "cn"
                        ? "车位"
                        : language === "ru"
                          ? "авто"
                          : "cars"}
                  </span>
                </span>
              )}
            </div>
          );
        })()}

        {/* Transit Access Badge with Official Transit Line Logo under Room Specs */}
        {transitLabel && (
          <div className="flex items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 bg-slate-50/90 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-slate-200/70 max-w-full">
              <div className="relative w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                <Image
                  src={getTransitLogo(current.transit_type)}
                  alt={current.transit_type || "Transit"}
                  width={14}
                  height={14}
                  className="object-contain w-3.5 h-3.5"
                />
              </div>
              <span className="text-slate-700 font-semibold truncate">{transitLabel}</span>
              {travelInfo && travelInfo.summaryLabel ? (
                <span className="inline-flex items-center gap-1 text-slate-500 font-normal shrink-0 text-[10px]">
                  <span className="text-slate-300">•</span>
                  {travelInfo.isWalk ? (
                    <FaPersonWalking className="w-3 h-3 text-emerald-600 shrink-0" title="เดิน" />
                  ) : (
                    <FaCarSide className="w-3 h-3 text-blue-600 shrink-0" title="รถ/วิน" />
                  )}
                  <span>{travelInfo.summaryLabel}</span>
                </span>
              ) : null}
            </div>
          </div>
        )}

        {/* Full Price Block (Matches PropertyCardFooter: Normal + Original Strike-Through + Discount % + Airbnb) */}
        <div className="pt-2 border-t border-slate-100">
          {current.listing_type === "SALE_AND_RENT" ? (
            <div className="grid grid-cols-2 gap-2 divide-x divide-slate-200">
              <div className="pr-1 min-w-0">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  {t("common.sale") || (language === "th" ? "ขาย" : "Sale")}
                </div>
                {prices.hasSaleDiscount ? (
                  <div>
                    <div className="text-sm font-extrabold text-rose-600 truncate">
                      {formatPrice(effectiveSalePrice, language)}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPrice(prices.originalPrice, language)}
                      </span>
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-1 rounded">
                        -{prices.saleDiscountPercent}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-extrabold text-[#1B263B] truncate">
                    {effectiveSalePrice > 0
                      ? formatPrice(effectiveSalePrice, language)
                      : t("common.contact_for_price")}
                  </div>
                )}
              </div>

              <div className="pl-2 min-w-0">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  {t("common.rent") || (language === "th" ? "เช่า" : "Rent")}
                </div>
                {prices.hasRentalDiscount ? (
                  <div>
                    <div className="text-sm font-extrabold text-rose-600 truncate">
                      {formatPrice(effectiveRentalPrice, language)}
                      <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                        {t("common.per_month_short")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPrice(prices.originalRentalPrice, language)}
                      </span>
                      <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-1 rounded">
                        -{prices.rentalDiscountPercent}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-extrabold text-[#1B263B] truncate">
                    {effectiveRentalPrice > 0 ? (
                      <>
                        {formatPrice(effectiveRentalPrice, language)}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                          {t("common.per_month_short")}
                        </span>
                      </>
                    ) : (
                      t("common.contact_for_price")
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  {current.listing_type === "RENT"
                    ? t("common.rent_price") || (language === "th" ? "ราคาเช่า" : "Rent")
                    : t("common.sale_price") || (language === "th" ? "ราคาขาย" : "Sale")}
                </div>
                {(current.listing_type === "SALE" && prices.hasSaleDiscount) ||
                (current.listing_type === "RENT" && prices.hasRentalDiscount) ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold line-through">
                        {formatPrice(
                          current.listing_type === "SALE"
                            ? prices.originalPrice
                            : prices.originalRentalPrice,
                          language
                        )}
                      </span>
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded">
                        -
                        {current.listing_type === "SALE"
                          ? prices.saleDiscountPercent
                          : prices.rentalDiscountPercent}
                        %
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-rose-600">
                      {formatPrice(
                        current.listing_type === "SALE"
                          ? effectiveSalePrice
                          : effectiveRentalPrice,
                        language
                      )}
                      {current.listing_type === "RENT" && (
                        <span className="text-xs text-slate-500 font-normal ml-0.5">
                          {t("common.per_month_short")}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-base font-extrabold text-[#1B263B]">
                    {current.listing_type === "SALE" ? (
                      effectiveSalePrice > 0 ? (
                        formatPrice(effectiveSalePrice, language)
                      ) : (
                        t("common.contact_for_price")
                      )
                    ) : effectiveRentalPrice > 0 ? (
                      <>
                        {formatPrice(effectiveRentalPrice, language)}
                        <span className="text-xs text-slate-400 font-normal ml-0.5">
                          {t("common.per_month_short")}
                        </span>
                      </>
                    ) : (
                      t("common.contact_for_price")
                    )}
                  </div>
                )}
              </div>

              {current.allow_airbnb && current.airbnb_daily_price && (
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF5A5F]">
                    <FaAirbnb className="w-3 h-3" />
                    <span>Airbnb</span>
                  </div>
                  <div className="text-xs font-extrabold text-[#FF5A5F]">
                    {formatPrice(current.airbnb_daily_price, language)}
                    <span className="text-[10px] text-slate-400 font-normal">
                      {t("common.per_day_short")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action CTA Buttons */}
        <div className="flex flex-col gap-1.5 pt-1">
          {total > 1 && onFocusProjectGroup && (
            <button
              type="button"
              onClick={() => {
                onFocusProjectGroup(group);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 px-3 rounded-xl border border-blue-200/80 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                {language === "th"
                  ? `ดูทั้ง ${total} ยูนิตในโครงการนี้ (ในแผงข้าง)`
                  : language === "cn"
                    ? `在侧栏查看全部 ${total} 套房源`
                    : `View all ${total} units in this building`}
              </span>
            </button>
          )}

          <Link
            href={detailHref}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-xs"
          >
            <span>
              {language === "th"
                ? "ดูรายละเอียดทรัพย์นี้"
                : language === "cn"
                  ? "查看房源详情"
                  : language === "ru"
                    ? "Подробнее об объекте"
                    : "View Property Details"}
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
