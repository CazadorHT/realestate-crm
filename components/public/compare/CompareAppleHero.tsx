"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ExternalLink,
  Plus,
  BedDouble,
  Bath,
  Maximize2,
  Layers,
  Sparkles,
  MapPin,
} from "lucide-react";
import { FaPersonWalking } from "react-icons/fa6";
import { CompareProperty } from "./types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocalizedField } from "@/lib/i18n";
import { formatMoney, getCompareDisplayTitle, getListingTypeLabel } from "./utils";
import {
  getTransitLogo,
  getTransitTypeLabel,
  computeTransitTravelInfo,
} from "../map/map-price-utils";
import { cn } from "@/lib/utils";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

interface CompareAppleHeroProps {
  properties: CompareProperty[];
  onRemove: (id: string) => void;
}

export function CompareAppleHero({
  properties,
  onRemove,
}: CompareAppleHeroProps) {
  const { t, language, langPrefix } = useLanguage();
  const locale =
    language === "th"
      ? "th-TH"
      : language === "cn"
        ? "zh-CN"
        : language === "ru"
          ? "ru-RU"
          : "en-US";

  // Find minimum transit distance to identify the winner
  const minTransitDistance = React.useMemo(() => {
    let min = Infinity;
    for (const p of properties) {
      if (typeof p.transit_distance_meters === "number" && p.transit_distance_meters > 0) {
        if (p.transit_distance_meters < min) min = p.transit_distance_meters;
      }
    }
    return min < Infinity ? min : null;
  }, [properties]);

  const canAddMore = properties.length < 4;
  const totalSlots = Math.min(4, Math.max(properties.length + (canAddMore ? 1 : 0), 2));

  return (
    <section className="mb-8">
      {/* Apple-Style Grid of Property Showcase Cards: 2 cols on mobile, 4 cols on large screen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
        {properties.map((property) => {
          const title = getCompareDisplayTitle(property, language);
          const salePrice = property.price || property.original_price;
          const rentPrice =
            property.rental_price || property.original_rental_price;
          const transitType = property.transit_type || "BTS";
          const transitName =
            (language !== "th" && property.transit_station_name_en) ||
            property.transit_station_name ||
            null;

          const travel = computeTransitTravelInfo({
            distanceMeters: property.transit_distance_meters ?? null,
            language,
          });

          const isClosest =
            minTransitDistance !== null &&
            property.transit_distance_meters === minTransitDistance &&
            properties.length > 1;

          const coverSrc = property.image_url || FALLBACK_IMG;
          const detailHref = `${langPrefix || ""}/properties/${property.slug || property.id}`;

          return (
            <div
              key={property.id}
              className={cn(
                "relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 md:p-5 flex flex-col justify-between transition-all duration-300 bg-white border",
                isClosest
                  ? "border-emerald-300/80 shadow-lg ring-2 ring-emerald-400/20"
                  : "border-slate-200/90 shadow-sm hover:shadow-md"
              )}
            >
              {/* Apple-Style Remove Button */}
              <button
                type="button"
                onClick={() => onRemove(property.id)}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                title={language === "th" ? "ลบออกจากการเปรียบเทียบ" : "Remove"}
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              <div>
                {/* Elevated Image Container with subtle reflection/shadow */}
                <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 mb-2.5 sm:mb-4 border border-slate-100 group">
                  <Image
                    src={coverSrc}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Closest transit winner badge */}
                  {isClosest && (
                    <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                      <Sparkles className="w-3 h-3 fill-white" />
                      <span>
                        {t("compare_page.values.closest_transit") ||
                          (language === "th"
                            ? "ใกล้รถไฟฟ้าที่สุด"
                            : language === "cn"
                              ? "地铁最近"
                              : "Closest to transit")}
                      </span>
                    </div>
                  )}

                  {/* Type badge */}
                  {property.listing_type && (
                    <span className="absolute bottom-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold">
                      {getListingTypeLabel(property.listing_type, t)}
                    </span>
                  )}
                </div>

                {/* Project Title (Apple typography - Clean and no Thai mixed in when non-Thai) */}
                <h3 className="text-xs sm:text-base md:text-lg font-extrabold text-[#1B263B] tracking-tight line-clamp-1 mb-0.5 sm:mb-1" title={title}>
                  {title}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 mb-2 sm:mb-3">
                  {(language !== "th" ? property.popular_area_en : property.popular_area) ||
                    property.location ||
                    property.province ||
                    "-"}
                </p>

                {/* Price Display with Unified Labels & Colors */}
                <div className="mb-2.5 sm:mb-4 pb-2 sm:pb-3.5 border-b border-slate-100 flex flex-col gap-1 sm:gap-1.5">
                  {salePrice && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                        {language === "th" ? "ขาย" : language === "cn" ? "售价" : language === "ru" ? "Продажа" : "Sale"}
                      </span>
                      <span className="text-sm sm:text-lg md:text-xl font-extrabold text-blue-600 tracking-tight leading-tight">
                        {formatMoney(salePrice, locale)}
                      </span>
                    </div>
                  )}
                  {rentPrice && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                        {language === "th" ? "เช่า" : language === "cn" ? "租金" : language === "ru" ? "Аренда" : "Rent"}
                      </span>
                      <span className="text-xs sm:text-base md:text-lg font-extrabold text-amber-600 tracking-tight leading-tight">
                        {formatMoney(rentPrice, locale)}
                        <span className="text-[10px] sm:text-xs text-slate-400 font-normal ml-0.5 sm:ml-1">
                          {t("compare_page.values.rent_per_month")}
                        </span>
                      </span>
                    </div>
                  )}
                  {!salePrice && !rentPrice && (
                    <div className="text-xs sm:text-sm font-semibold text-slate-400">
                      {t("common.contact_for_price") || "สอบถามราคา"}
                    </div>
                  )}
                </div>

                {/* Apple-Style Quick Highlights Grid (4 Key Metrics) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mb-3 sm:mb-4 bg-slate-50/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-100">
                  {/* Metric 1: Transit */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {t("compare_page.labels.transportation") || "รถไฟฟ้า"}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5 truncate">
                      <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                        <Image
                          src={getTransitLogo(transitType)}
                          alt={transitType}
                          width={14}
                          height={14}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {property.transit_distance_meters
                          ? property.transit_distance_meters >= 1000
                            ? `${(property.transit_distance_meters / 1000).toFixed(1).replace(/\.0$/, "")} ${language === "th" ? "กม." : "km"}`
                            : `${property.transit_distance_meters} ${language === "th" ? "ม." : "m"}`
                          : transitName || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Metric 2: Area */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {t("compare_page.labels.property_size") || "พื้นที่"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {property.size_sqm
                        ? `${property.size_sqm} ${t("compare_page.values.sqm")}`
                        : "-"}
                    </span>
                  </div>

                  {/* Metric 3: Bedrooms */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {t("compare_page.labels.bedrooms") || "ห้องพัก"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {property.bedrooms != null
                        ? `${property.bedrooms} ${language === "th" ? "นอน" : "bed"}`
                        : "-"}
                      {property.bathrooms != null
                        ? ` • ${property.bathrooms} ${language === "th" ? "น้ำ" : "bath"}`
                        : ""}
                    </span>
                  </div>

                  {/* Metric 4: Floor */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {t("compare_page.labels.floor") || "ชั้น"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {property.floor
                        ? `${t("compare_page.values.floor_prefix")} ${property.floor}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Apple-Style Pill CTA Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={detailHref}
                  target="_blank"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#1B263B] hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-xs active:scale-98"
                >
                  <span>{t("compare_page.view_details") || (language === "th" ? "ดูรายละเอียดทรัพย์" : "View Details")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`${detailHref}#contact`}
                  target="_blank"
                  className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-1"
                >
                  {language === "th"
                    ? "ติดต่อสอบถาม / นัดชม"
                    : language === "cn"
                      ? "在线咨询 / 预约看房"
                      : language === "ru"
                        ? "Связаться / Записаться на просмотр"
                        : "Inquire / Schedule Tour"}
                </Link>
              </div>
            </div>
          );
        })}

        {/* Apple-Style Dashed Placeholder Card to Add Another Property (up to 4) */}
        {canAddMore && (
          <Link
            href={`${langPrefix || ""}/map`}
            className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/40 p-3 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 text-center transition-all group min-h-[220px] sm:min-h-[320px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white group-hover:bg-blue-600 group-hover:text-white text-slate-500 flex items-center justify-center transition-colors shadow-2xs border border-slate-200 group-hover:border-blue-600">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-blue-600">
                {language === "th" ? "+ เพิ่มทรัพย์เพื่อเปรียบเทียบ" : "+ Add Property to Compare"}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 mt-1 max-w-[160px] mx-auto">
                {language === "th"
                  ? "เลือกโครงการจากแผนที่ (สูงสุด 4 รายการ)"
                  : "Select from map (up to 4 properties)"}
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
