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
import { formatMoney } from "./utils";
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
      {/* Apple-Style Grid of Property Showcase Cards */}
      <div
        className={cn(
          "grid gap-4 sm:gap-6",
          properties.length === 1
            ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
            : properties.length === 2
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : properties.length === 3
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {properties.map((property) => {
          const title =
            getLocalizedField<string>(property, "title", language) || "Property";
          const salePrice = property.price || property.original_price;
          const rentPrice =
            property.rental_price || property.original_rental_price;
          const transitType = property.transit_type || "BTS";
          const transitName =
            (language === "en" && property.transit_station_name_en) ||
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
                "relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 bg-white border",
                isClosest
                  ? "border-emerald-300/80 shadow-lg ring-2 ring-emerald-400/20"
                  : "border-slate-200/90 shadow-sm hover:shadow-md"
              )}
            >
              {/* Apple-Style Remove Button */}
              <button
                type="button"
                onClick={() => onRemove(property.id)}
                className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                title="ลบออกจากการเปรียบเทียบ"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div>
                {/* Elevated Image Container with subtle reflection/shadow */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-100 group">
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
                        {language === "th"
                          ? "ใกล้รถไฟฟ้าที่สุด"
                          : language === "cn"
                            ? "地铁最近"
                            : "Closest to transit"}
                      </span>
                    </div>
                  )}

                  {/* Type badge */}
                  {property.listing_type && (
                    <span className="absolute bottom-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold">
                      {property.listing_type}
                    </span>
                  )}
                </div>

                {/* Project Title (Apple typography) */}
                <h3 className="text-base sm:text-lg font-extrabold text-[#1B263B] tracking-tight line-clamp-1 mb-1">
                  {property.project_name || title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                  {property.popular_area || property.location || property.province || "-"}
                </p>

                {/* Price Display */}
                <div className="mb-4 pb-3.5 border-b border-slate-100">
                  {salePrice && (
                    <div className="text-lg sm:text-xl font-extrabold text-blue-600 tracking-tight leading-tight">
                      {formatMoney(salePrice, locale)}
                    </div>
                  )}
                  {rentPrice && (
                    <div className="text-base sm:text-lg font-extrabold text-amber-600 tracking-tight leading-tight">
                      {formatMoney(rentPrice, locale)}
                      <span className="text-xs text-slate-400 font-normal ml-1">/เดือน</span>
                    </div>
                  )}
                  {!salePrice && !rentPrice && (
                    <div className="text-sm font-semibold text-slate-400">
                      {t("common.contact_for_price") || "สอบถามราคา"}
                    </div>
                  )}
                </div>

                {/* Apple-Style Quick Highlights Grid (4 Key Metrics) */}
                <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                  {/* Metric 1: Transit */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">รถไฟฟ้า</span>
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
                          ? `${property.transit_distance_meters} ม.`
                          : transitName || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Metric 2: Area */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">พื้นที่</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {property.size_sqm ? `${property.size_sqm} ตร.ม.` : "-"}
                    </span>
                  </div>

                  {/* Metric 3: Bedrooms */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">ห้องพัก</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {property.bedrooms ? `${property.bedrooms} นอน` : "-"}
                      {property.bathrooms ? ` • ${property.bathrooms} น้ำ` : ""}
                    </span>
                  </div>

                  {/* Metric 4: Floor */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">ชั้น</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {property.floor ? `ชั้น ${property.floor}` : "-"}
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
                  <span>{language === "th" ? "ดูรายละเอียดทรัพย์" : "View Details"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`${detailHref}#contact`}
                  target="_blank"
                  className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-1"
                >
                  {language === "th" ? "ติดต่อสอบถาม / นัดชม" : "Inquire / Schedule Tour"}
                </Link>
              </div>
            </div>
          );
        })}

        {/* Apple-Style Dashed Placeholder Card to Add Another Property (up to 4) */}
        {canAddMore && (
          <Link
            href={`${langPrefix || ""}/map`}
            className="rounded-3xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white/60 hover:bg-blue-50/40 p-6 flex flex-col items-center justify-center gap-3 text-center transition-all group min-h-[360px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-2xs">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600">
                {language === "th" ? "+ เพิ่มทรัพย์เพื่อเปรียบเทียบ" : "+ Add Property to Compare"}
              </div>
              <div className="text-xs text-slate-400 mt-1 max-w-[180px]">
                {language === "th"
                  ? "เลือกโครงการจากแผนที่หรือหน้ารายการ (สูงสุด 4 รายการ)"
                  : "Select from map or listings (up to 4 properties)"}
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
