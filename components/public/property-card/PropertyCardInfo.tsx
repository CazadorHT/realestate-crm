import Link from "next/link";
import { CheckSquare, Square } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { 
  HiMapPin, 
  HiHome, 
  HiBriefcase, 
  HiBuildingStorefront,
  HiCircleStack
} from "react-icons/hi2";
import { 
  MdWarehouse, 
  MdLandscape, 
  MdFactory, 
  MdVilla,
  MdPool,
  MdApartment
} from "react-icons/md";
import { getTypeColor, getSafeText } from "@/lib/property-utils";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FaTrainSubway } from "react-icons/fa6";

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
  const searchParams = useSearchParams();
  const selectedStationFilter = searchParams ? (searchParams.get("transit_station") || "") : "";
  const typeColor = getTypeColor(property.property_type);

  // Property type localization
  const typeKey = property.property_type?.toLowerCase() || "other";
  const typeLabel = t(`property_types.${typeKey}`);
  const IconComponent = PROPERTY_TYPE_ICONS[typeKey] || HiCircleStack;

  const localizedTitle = getLocaleValue(property, "title", language);

  return (
    <div className="space-y-2 mb-3">
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
      <Link 
        href={`/properties/${property.slug || property.id}`}
        className="block group-hover:text-blue-600 transition-colors"
        onClick={handleCardClick}
      >
        <h3 className="text-sm sm:text-base md:text-base font-semibold tracking-wide text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-800 transition-all duration-300 ease-in-out">
          {localizedTitle}
        </h3>
      </Link>

      {/* Location block link below the title */}
      <div className="flex flex-col gap-1">
        <Link
          href={`/properties/${property.slug || property.id}`}
          className="flex items-center gap-1 text-stone-600 min-w-0"
          onClick={handleCardClick}
        >
          <HiMapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs truncate whitespace-nowrap hover:text-blue-600 transition-colors">
            {getSafeText(
              areaProvince,
              getProvinceName("กรุงเทพมหานคร", language),
            )}
          </span>
        </Link>

        {(() => {
          interface TransitCandidate {
            name: string;
            dbName: string;
            type: string;
            distance?: number | null;
          }

          const candidates: TransitCandidate[] = [];

          // 1. Root level transit
          const rootStationName = getLocaleValue(property, "transit_station_name", language);
          if (rootStationName && property.transit_type && property.transit_type !== "EXPRESSWAY" && property.transit_type !== "MAIN_ROAD") {
            candidates.push({
              name: rootStationName,
              dbName: property.transit_station_name || "",
              type: property.transit_type,
              distance: property.transit_distance_meters,
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

          const getTypeBadgeClass = (type?: string | null): string => {
            const norm = getNormalizedType(type);
            switch (norm) {
              case "BTS":
                return "bg-emerald-600";
              case "MRT":
                return "bg-blue-800";
              case "ARL":
                return "bg-rose-600";
              case "SRT":
                return "bg-red-700";
              case "BRT":
                return "bg-teal-600";
              default:
                return "bg-slate-500";
            }
          };

          // Prioritize selected station filter if matches any candidate
          let chosen = candidates[0];
          if (selectedStationFilter) {
            const [filterName, filterType] = selectedStationFilter.toLowerCase().split("|");
            const match = candidates.find(c => {
              const matchesName = c.name.toLowerCase() === filterName ||
                c.dbName.toLowerCase() === filterName;
              if (!matchesName) return false;
              if (filterType) {
                return c.type.toLowerCase() === filterType || getNormalizedType(c.type).toLowerCase() === filterType;
              }
              return true;
            });
            if (match) {
              chosen = match;
            }
          }

          const transitStation = chosen.name;
          const rawTransitType = chosen.type;
          const transitDistance = chosen.distance;

          if (!transitStation) return null;

          const transitType = getNormalizedType(rawTransitType);
          const badgeClass = getTypeBadgeClass(rawTransitType);

          const formatDistance = (meters: number): string => {
            if (meters >= 1000) {
              const km = (meters / 1000).toFixed(1).replace(/\.0$/, "");
              const unit = language === "en" 
                ? "km" 
                : language === "cn" 
                  ? "公里" 
                  : language === "ru" 
                    ? "км" 
                    : "กม.";
              return `${km} ${unit}`;
            }
            const unit = language === "en" 
              ? "m" 
              : language === "cn" 
                ? "米" 
                : language === "ru" 
                  ? "м" 
                  : "ม.";
            return `${meters} ${unit}`;
          };

          return (
            <div className="flex items-center gap-1 text-stone-500 min-w-0 mt-0.5 ml-0.5">
              {/* <FaTrainSubway className="h-3 w-3 text-blue-500 shrink-0" /> */}
              <span className="text-[11px] flex items-center gap-1 truncate">
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md leading-none text-white shrink-0 ${badgeClass}`}>
                  {transitType}
                </span>
                <span className="truncate font-medium text-stone-600 text-xs">
                  {transitStation.replace("_", " ")}
                </span>
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
