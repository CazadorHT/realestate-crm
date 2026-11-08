"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckSquare, Square, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import {
  HiMapPin,
  HiHome,
  HiBriefcase,
  HiBuildingStorefront,
  HiCircleStack,
  HiBuildingOffice2,
} from "react-icons/hi2";
import {
  MdWarehouse,
  MdLandscape,
  MdFactory,
  MdVilla,
  MdPool,
  MdApartment,
} from "react-icons/md";
import { getTypeColor, getSafeText } from "@/lib/property-utils";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName, PROVINCES } from "@/lib/utils/provinces";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FaTrainSubway, FaPersonWalking, FaCarSide } from "react-icons/fa6";
import { computeTransitTravelInfo, getTransitLogo } from "../map/map-price-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PROPERTY_TYPE_ICONS: Record<string, any> = {
  house: HiHome,
  condo: MdApartment,
  townhome: MdWarehouse,
  land: MdLandscape,
  office: HiBriefcase,
  office_building: HiBriefcase,
  warehouse: MdFactory,
  factory: MdFactory,
  villa: MdVilla,
  pool_villa: MdPool,
  commercial: HiBuildingStorefront,
  commercial_building: HiBuildingStorefront,
  home_office: HiBuildingOffice2,
  other: HiCircleStack,
};

interface PropertyCardInfoProps {
  property: PropertyCardProps;
  areaProvince: string;
  isInCompare?: boolean;
  onCompareClick?: (e: React.MouseEvent) => void;
  handleCardClick?: () => void;
}

export function PropertyCardInfo({
  property,
  areaProvince,
  isInCompare = false,
  onCompareClick,
  handleCardClick,
}: PropertyCardInfoProps) {
  const { language, t } = useLanguage();
  const langPrefix = language === "en" ? "/en" : language === "cn" ? "/zh" : language === "ru" ? "/ru" : "";
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const station = params.get("transit_station") || "";
      if (station) setSelectedStationFilter(station);
    }
  }, []);
  const typeColor = getTypeColor(property.property_type);

  // Property type localization
  const typeKey = property.property_type?.toLowerCase() || "other";
  const typeLabel = t(`property_types.${typeKey}`);
  const IconComponent = PROPERTY_TYPE_ICONS[typeKey] || HiCircleStack;
  const ProjectIconComponent =
    PROPERTY_TYPE_ICONS[typeKey] || HiBuildingOffice2;

  const localizedTitle = getLocaleValue(property, "title", language);

  const projectsObj = (property as any).projects;
  const nameEn = projectsObj?.name_en || (property as any).project_name_en || null;
  const nameTh = projectsObj?.name_th || (property as any).project_name_th || (property as any).project_name || null;

  // แสดงผลชื่อโครงการ: เลือกภาษาอังกฤษเป็นหลัก (ถ้าไม่มี fallback เป็นไทย หรือตาม locale ภาษาอื่น)
  const projectName = projectsObj
    ? (language === "cn" || language === "ru")
      ? getLocaleValue(projectsObj, "name", language) || projectsObj.name_en || projectsObj.name_th
      : projectsObj.name_en || projectsObj.name_th
    : (property as any).project_name_en || (property as any).project_name || null;
  const projectSlug =
    projectsObj?.slug || (property as any).project_slug || null;

  return (
    <div className="space-y-2 mb-1">
      {/* Top row: Badge and Compare button (outside detail links) */}
      <div className="flex justify-between items-center gap-4 mb-2">
        <span
          className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] md:text-xs font-semibold ${typeColor.text} ${typeColor.bg} px-2 py-0.5 md:py-1  rounded-lg uppercase tracking-wide shadow-xs`}
        >
          <IconComponent className="h-3.5 w-3.5 " />
          {typeLabel}
        </span>

        {/* Compare Checkbox - Optimized Touch Target */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onCompareClick) onCompareClick(e);
          }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border transition-all duration-200 cursor-pointer touch-manipulation min-h-[30px]! ${
            isInCompare
              ? "bg-blue-50 border-blue-200/60 text-blue-600 font-bold"
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          {isInCompare ? (
            <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
          ) : (
            <Square className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span className="text-[11px] sm:text-xs">{t("common.compare")}</span>
        </button>
      </div>

      {/* Title block link */}
      {(() => {
        const langPrefix = language === "en" ? "/en" : language === "cn" ? "/zh" : language === "ru" ? "/ru" : "";
        const propertyUrl = `${langPrefix}/properties/${property.slug || property.id}`;

        return (
          <Link
            href={propertyUrl}
            prefetch={false}
            className="block group-hover:text-blue-600 transition-colors"
            onClick={handleCardClick}
          >
            <h3 className="text-sm sm:text-base md:text-base font-semibold tracking-wide text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-800 transition-all duration-300 ease-in-out">
              {localizedTitle}
            </h3>
          </Link>
        );
      })()}

      {/* Location block link below the title */}
      <div className="flex flex-col gap-1 pt-1">
        {/* Row 1: Project Link (ถ้ามี) */}
        {projectName &&
          (() => {
            const projectTooltipContent = (() => {
              if (language === "th") {
                const th = nameTh?.trim();
                const en = nameEn?.trim();
                if (th && en && th.toLowerCase() !== en.toLowerCase()) {
                  return (
                    <div className="flex flex-col gap-0.5 text-left py-0.5">
                      <div className="font-semibold text-white leading-snug">
                        ดูโครงการ {th}
                      </div>
                      <div className="text-[11px] text-slate-300 font-normal leading-snug">
                        {en}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="text-left py-0.5 leading-snug">
                    ดูโครงการ {th || en || projectName}
                  </div>
                );
              }
              if (language === "cn") {
                return (
                  <div className="text-left py-0.5 leading-snug">
                    查看项目 {projectName}
                  </div>
                );
              }
              if (language === "ru") {
                return (
                  <div className="text-left py-0.5 leading-snug">
                    Посмотреть проект {projectName}
                  </div>
                );
              }
              return (
                <div className="text-left py-0.5 leading-snug">
                  View Project {nameEn || projectName}
                </div>
              );
            })();

            return (
              <div className="flex items-center min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={
                        projectSlug
                          ? `/projects/${projectSlug}`
                          : `${langPrefix}/properties/${property.slug || property.id}`
                      }
                      prefetch={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (handleCardClick) handleCardClick();
                      }}
                      className="group/proj inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-300 min-w-0 max-w-full"
                    >
                      <ProjectIconComponent className="w-3.5 h-3.5 text-blue-500 group-hover/proj:text-blue-700 transition-colors duration-300 shrink-0" />
                      <span className="truncate hover:underline transition-colors duration-300">
                        {projectName}
                      </span>
                      <ChevronRight className="w-3 h-3 text-blue-400 group-hover/proj:text-blue-600 group-hover/proj:translate-x-1 shrink-0 transition-all duration-300 ease-out" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={6}
                    align="start"
                    className="bg-slate-900 text-white border border-slate-700 text-xs px-3 py-1.5 rounded-lg shadow-2xl z-50 pointer-events-none w-max max-w-[360px] break-normal"
                  >
                    {projectTooltipContent}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })()}
        {/* row2 location */}
        {(() => {
          const areaSlug = property.popular_area_slug;
          const targetArea = property.popular_area;
          const localizedAreaName =
            getLocaleValue(property, "popular_area", language) || targetArea;
          const provinceParam = property.province
            ? (language !== "th" ? (PROVINCES[property.province]?.en || property.province) : property.province)
            : "";
          const locationHref = areaSlug
            ? `${langPrefix}/areas/${encodeURIComponent(areaSlug)}`
            : targetArea
              ? `${langPrefix}/properties?popular_area=${encodeURIComponent(targetArea)}`
              : property.province
                ? `${langPrefix}/properties?province=${encodeURIComponent(provinceParam)}`
                : `${langPrefix}/properties/${property.slug || property.id}`;

          const areaTooltip = localizedAreaName
            ? language === "en"
              ? `Properties in ${localizedAreaName}`
              : language === "cn"
                ? `查看 ${localizedAreaName} 的房源`
                : language === "ru"
                  ? `Недвижимость в ${localizedAreaName}`
                  : `ดูทรัพย์สินย่าน ${localizedAreaName}`
            : undefined;

          const locationLink = (
            <Link
              href={locationHref}
              prefetch={false}
              className="group/loc inline-flex items-center gap-1.5 text-stone-600 hover:text-blue-600 transition-colors duration-300 min-w-0 max-w-full w-fit"
              onClick={(e) => {
                e.stopPropagation();
                if (handleCardClick) handleCardClick();
              }}
            >
              <HiMapPin className="h-3.5 w-3.5 text-slate-500 group-hover/loc:text-blue-600 transition-colors duration-300 shrink-0" />
              <span className="text-xs truncate whitespace-nowrap text-stone-600 group-hover/loc:text-blue-600 group-hover/loc:underline transition-colors duration-300">
                {getSafeText(
                  areaProvince,
                  getProvinceName("กรุงเทพมหานคร", language),
                )}
              </span>
            </Link>
          );

          return (
            <div className="flex items-center min-w-0">
              {areaTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {locationLink}
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="bg-slate-800 text-white border border-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg shadow-md z-50 pointer-events-none"
                  >
                    {areaTooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                locationLink
              )}
            </div>
          );
        })()}

        {(() => {
          interface TransitCandidate {
            name: string;
            dbName: string;
            type: string;
            distance?: number | null;
            time?: string | number | null;
          }

          const candidates: TransitCandidate[] = [];

          // 1. Root level transit
          const rootStationName = getLocaleValue(
            property,
            "transit_station_name",
            language,
          );
          if (
            rootStationName &&
            property.transit_type &&
            property.transit_type !== "EXPRESSWAY" &&
            property.transit_type !== "MAIN_ROAD"
          ) {
            candidates.push({
              name: rootStationName,
              dbName: property.transit_station_name || "",
              type: property.transit_type,
              distance: property.transit_distance_meters,
              time: (property as any).transit_time || null,
            });
          }

          // 2. Nearby transits list
          if (Array.isArray(property.nearby_transits)) {
            property.nearby_transits.forEach((t: any) => {
              if (t && t.type !== "EXPRESSWAY" && t.type !== "MAIN_ROAD") {
                const name = getLocaleValue(t, "station_name", language);
                if (name) {
                  candidates.push({
                    name,
                    dbName: t.station_name || "",
                    type: t.type,
                    distance: t.distance_meters,
                    time: t.time || null,
                  });
                }
              }
            });
          }

          if (candidates.length === 0) return null;

          // Sort by distance ascending. Put null/undefined distance at the end.
          candidates.sort((a, b) => {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
          });

          const getNormalizedType = (type?: string | null): string => {
            if (!type) return "Transit";
            const t = type.toUpperCase();
            if (t === "BTS" || t === "GOLD") return "BTS";
            if (t.startsWith("MRT")) return "MRT";
            if (t === "ARL") return "ARL";
            if (t === "SRT_RED" || t === "SRT") return "SRT";
            if (t === "BRT") return "BRT";
            return t;
          };

          // Prioritize selected station filter if matches any candidate
          let chosen = candidates[0];
          if (selectedStationFilter) {
            const [filterName, filterType] = selectedStationFilter
              .toLowerCase()
              .split("|");
            const match = candidates.find((c) => {
              const matchesName =
                c.name.toLowerCase() === filterName ||
                c.dbName.toLowerCase() === filterName;
              if (!matchesName) return false;
              if (filterType) {
                return (
                  c.type.toLowerCase() === filterType ||
                  getNormalizedType(c.type).toLowerCase() === filterType
                );
              }
              return true;
            });
            if (match) {
              chosen = match;
            }
          }

          const transitStation = chosen.name;
          const rawTransitType = chosen.type;

          if (!transitStation) return null;

          const transitType = getNormalizedType(rawTransitType);

          const travel = computeTransitTravelInfo({
            distanceMeters: chosen.distance,
            explicitTime: chosen.time,
            language,
          });

          return (
            <div className="flex items-center gap-1 text-stone-500 min-w-0 mt-0.5 ml-0.5">
              {/* <FaTrainSubway className="h-3 w-3 text-blue-500 shrink-0" /> */}
              <span className="text-[11px] flex items-center gap-1.5 truncate">
                <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                  <Image
                    src={getTransitLogo(rawTransitType)}
                    alt={transitType}
                    width={16}
                    height={16}
                    className="object-contain w-4 h-4"
                  />
                </div>
                <span className="truncate font-medium text-stone-700 text-xs">
                  {transitStation.replace("_", " ")}
                </span>
                {travel.summaryLabel ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium shrink-0">
                    <span className="text-stone-300">•</span>
                    {travel.isWalk ? (
                      <FaPersonWalking className="w-3 h-3 text-emerald-600 shrink-0" title="เดิน" />
                    ) : (
                      <FaCarSide className="w-3 h-3 text-blue-600 shrink-0" title="รถ/วิน" />
                    )}
                    <span>{travel.summaryLabel}</span>
                  </span>
                ) : null}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
