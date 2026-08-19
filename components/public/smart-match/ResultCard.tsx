"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, Maximize2, Sparkles, Train } from "lucide-react";
import { PropertyMatch, PropertyType } from "@/features/smart-match/types";
import { getTypeColor } from "@/lib/property-utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { getDistrictName } from "@/lib/utils/provinces";

interface ResultCardProps {
  match: PropertyMatch;
  isRent: boolean;
  onSelect: () => void;
}

export function ResultCard({ match, isRent, onSelect }: ResultCardProps) {
  const { t, language } = useLanguage();

  const PROPERTY_TYPE_NAMES: Partial<Record<PropertyType, string>> = {
    CONDO: language === "th" ? "คอนโด" : "Condo",
    HOUSE: language === "th" ? "บ้านเดี่ยว" : "House",
    VILLA: language === "th" ? "วิลล่า" : "Villa",
    POOL_VILLA: language === "th" ? "พูลวิลล่า" : "Pool Villa",
    TOWNHOME: language === "th" ? "ทาวน์โฮม" : "Townhome",
    OFFICE_BUILDING: language === "th" ? "ออฟฟิศ" : "Office",
    HOME_OFFICE: language === "th" ? "โฮมออฟฟิศ" : "Home Office",
    LAND: language === "th" ? "ที่ดิน" : "Land",
    WAREHOUSE: language === "th" ? "โกดัง" : "Warehouse",
  };

  // If single house > 8M, display as VILLA. POOL_VILLA displays as POOL_VILLA (private pool house).
  const isLuxuryHouse =
    match.property_type === "HOUSE" &&
    ((!isRent && match.price >= 8000000) ||
     (!isRent && match.original_price && match.original_price >= 8000000) ||
     (isRent && match.price >= 60000));

  const displayType = isLuxuryHouse ? "VILLA" : match.property_type;

  const displayTitle =
    (language === "en"
      ? match.project_name_en || match.title_en
      : language === "cn"
        ? match.project_name_cn || match.title_cn
        : language === "ru"
          ? match.project_name_ru || match.title_ru
          : null) ||
    match.project_name ||
    (language !== "th" ? match.title_en : null) ||
    match.title;

  const rawTransitName =
    (language === "en"
      ? match.transit_station_name_en
      : language === "cn"
        ? match.transit_station_name_cn
        : language === "ru"
          ? match.transit_station_name_ru
          : null) || match.transit_station_name;

  // Format clean transit display (e.g. MRT_YELLOW -> MRT Yellow)
  const cleanTransitType = match.transit_type
    ? match.transit_type
        .replace(/_/g, " ")
        .replace(/\b([A-Z])([A-Z]+)\b/g, (match, p1, p2) => p1 + p2.toLowerCase())
    : "BTS/MRT";

  const rawLocation =
    (language === "en"
      ? match.popular_area_en
      : language === "cn"
        ? match.popular_area_cn
        : language === "ru"
          ? match.popular_area_ru
          : null) ||
    match.popular_area ||
    match.district ||
    match.province;

  const cleanRawLocation = rawLocation?.replace(/^(เขต|อำเภอ|อ\.)/, "").trim() || "";

  const locationDisplay =
    (language !== "th" && cleanRawLocation
      ? (match.popular_area_en && language === "en" ? match.popular_area_en : null) ||
        (match.popular_area_cn && language === "cn" ? match.popular_area_cn : null) ||
        (match.popular_area_ru && language === "ru" ? match.popular_area_ru : null) ||
        getDistrictName(cleanRawLocation, language) ||
        getDistrictName(rawLocation || "", language) ||
        cleanRawLocation
      : cleanRawLocation) || null;

  return (
    <div className="group relative bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
      <Link
        href={`/properties/${match.slug || match.id}`}
        target="_blank"
        className="block"
      >
        <div className="flex gap-3 sm:gap-4 items-stretch">
          {/* 1. Left Thumbnail with Badges Overlay */}
          <div className="w-32 sm:w-36 min-h-[112px] sm:min-h-[120px] rounded-xl overflow-hidden shrink-0 bg-slate-100 relative shadow-inner">
            <Image
              src={match.image_url}
              alt={displayTitle}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 128px, 144px"
            />

            {/* Top-Left: Property Type Pill */}
            {displayType && (
              <div className="absolute top-1.5 left-1.5 z-10">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-xs uppercase tracking-wider ${
                    getTypeColor(displayType).bg
                  } ${getTypeColor(displayType).text}`}
                >
                  {PROPERTY_TYPE_NAMES[displayType] ||
                    t(`home.property_types.${displayType.toLowerCase()}`)}
                </span>
              </div>
            )}

            {/* Bottom-Left: Match Score Pill on Image */}
            <div className="absolute bottom-1.5 left-1.5 z-10">
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-blue-800 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-xs border border-blue-100">
                <Sparkles className="h-2.5 w-2.5 text-blue-600 fill-blue-500/20" />
                {match.match_score}% {t("smart_match.match_score_label")}
              </span>
            </div>
          </div>

          {/* 2. Right Content (Refined typography and compact layout) */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            {/* Title */}
            <div>
              <h3
                className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors"
                title={displayTitle}
              >
                {displayTitle}
              </h3>

              {/* Price Row */}
              <div className="mt-0.5 flex items-baseline flex-wrap gap-1">
                {match.original_price && (
                  <span className="text-[10px] text-slate-400 line-through leading-none">
                    {t("common.baht_symbol")} {match.original_price.toLocaleString()}
                  </span>
                )}

                {match.price > 0 ? (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm sm:text-base font-extrabold text-blue-600 tracking-tight leading-none">
                      {t("common.baht_symbol")} {match.price.toLocaleString()}
                    </span>
                    {match.is_sqm_price ? (
                      <span className="text-[10px] font-medium text-slate-500">
                        / {t("common.sqm")}
                      </span>
                    ) : (
                      isRent && (
                        <span className="text-[10px] font-medium text-slate-500">
                          / {t("common.per_month")}
                        </span>
                      )
                    )}

                    {match.secondary_price && (
                      <span className="text-[9px] text-slate-400 font-normal ml-0.5">
                        ({t("common.baht_symbol")}{" "}
                        {match.secondary_price.toLocaleString()} /{" "}
                        {t("common.sqm")})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-700">
                    {t("common.contact_for_price")}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Row: Compact Specs & Location Badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {/* Bedroom & Bathroom */}
              {(match.bedrooms || match.bathrooms) && (
                <div className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                  {match.bedrooms ? (
                    <span className="flex items-center gap-0.5">
                      <Bed className="h-2.5 w-2.5 text-slate-500" />
                      {match.bedrooms} {t("smart_match.bed_short")}
                    </span>
                  ) : null}
                  {match.bedrooms && match.bathrooms ? (
                    <span className="text-slate-300">•</span>
                  ) : null}
                  {match.bathrooms ? (
                    <span className="flex items-center gap-0.5">
                      <Bath className="h-2.5 w-2.5 text-slate-500" />
                      {match.bathrooms} {t("smart_match.bath_short")}
                    </span>
                  ) : null}
                </div>
              )}

              {/* Floor Area */}
              {match.size_sqm && match.size_sqm > 0 ? (
                <div className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                  <Maximize2 className="h-2.5 w-2.5 text-slate-500" />
                  {match.size_sqm} {t("common.sqm")}
                </div>
              ) : null}

              {/* Location Tag */}
              {locationDisplay && (
                <div className="flex items-center gap-0.5 text-[10px] text-slate-700 font-medium bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded truncate max-w-[130px] shrink-0">
                  <MapPin className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                  <span className="truncate">{locationDisplay}</span>
                </div>
              )}

              {/* Transit Tag */}
              {match.near_transit && rawTransitName && (
                <div className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded truncate max-w-[160px] sm:max-w-[200px] shrink-0">
                  <Train className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {cleanTransitType} {rawTransitName}
                  </span>
                  {match.transit_distance_meters ? (
                    <span className="text-[9px] text-emerald-600/80 font-normal shrink-0">
                      ({match.transit_distance_meters > 1000
                        ? `${(match.transit_distance_meters / 1000).toFixed(1)}km`
                        : `${match.transit_distance_meters}m`})
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
