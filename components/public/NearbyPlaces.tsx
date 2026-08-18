"use client";
import {
  School,
  ShoppingBag,
  Map,
  Stethoscope,
  Bus,
  Building2,
  TrainFront,
  Plane,
} from "lucide-react";
import Link from "next/link";
import { TRANSIT_TYPE_STYLES } from "@/features/properties/labels";
import { MdOutlineExplore } from "react-icons/md";
import { type Language } from "@/lib/i18n";
import {
  useLanguage,
  dictionaries,
} from "@/components/providers/LanguageProvider";
import { useEffect } from "react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { getLocaleValue } from "@/lib/utils/locale-utils";

export interface NearbyPlaceItem {
  category: string;
  name: { th?: string; en?: string; cn?: string; ru?: string } | string;
  distance?: string;
  time?: string;
}

export interface TransitItem {
  type: string;
  station_name: { th?: string; en?: string; cn?: string; ru?: string } | string;
  distance_meters?: number;
  time?: string;
  slug?: string;
}

interface NearbyPlacesProps {
  location?: { th?: string; en?: string; cn?: string; ru?: string } | string;
  propertyId?: string;
  propertyTitle?: string;
  data?: NearbyPlaceItem[];
  transits?: TransitItem[];
  language?: Language;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  School: School,
  Mall: ShoppingBag,
  Hospital: Stethoscope,
  Airport: Plane,
  Transport: Bus,
  Park: Map,
  Office: Building2,
  Other: Map,
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  School: "property.categories.school",
  Mall: "property.categories.mall",
  Hospital: "property.categories.hospital",
  Airport: "property.categories.airport",
  Transport: "property.categories.transport",
  Park: "property.categories.park",
  Office: "property.categories.office",
  Other: "property.categories.other",
};

export function NearbyPlaces({
  location,
  propertyId,
  propertyTitle,
  data = [],
  transits = [],
  language: customLanguage,
}: NearbyPlacesProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  useEffect(() => {
    try {
      if (data.length > 0 || transits.length > 0) {
        pushToDataLayer(GTM_EVENTS.VIEW_NEARBY, {
          places_count: data.length,
          transits_count: transits.length,
          item_id: propertyId,
          item_name: propertyTitle,
        });
        updateAIScore(5);
      }
    } catch (e) {}
  }, [data.length, transits.length, propertyId, propertyTitle]);

  // Custom t function with explicit string return
  const t = (key: string): string => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as Record<string, unknown>;
    
    const value = key.split(".").reduce((prev: unknown, curr) => {
      if (prev && typeof prev === "object" && curr in (prev as Record<string, unknown>)) {
        return (prev as Record<string, unknown>)[curr];
      }
      return undefined;
    }, dict);

    return typeof value === "string" ? value : key;
  };

  // Group nearby places by category (NOT including transits)
  const grouped = data.reduce(
    (acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, NearbyPlaceItem[]>,
  );

  // Group transits by type (BTS, MRT, etc.) - SEPARATE from nearby_places
  const groupedTransits = transits.reduce(
    (acc, item) => {
      const type = item.type || "OTHER";
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    },
    {} as Record<string, TransitItem[]>,
  );

  const hasNearbyPlaces = data.length > 0;
  const hasTransits = transits.length > 0;

  if (!hasNearbyPlaces && !hasTransits) {
    return null;
  }

  // Helper to format distance
  const formatDistance = (val?: string | number) => {
    if (!val) return null;
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return String(val);

    if (num < 1) {
      return `${Math.round(num * 1000)} ${t("common.meters_short")}`;
    }
    return `${num} ${t("common.km_short")}`;
  };

  const categories = Object.keys(grouped);
  const transitTypes = Object.keys(groupedTransits);

  return (
    <div className="mt-10">
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-semibold text-blue-900! mb-6 flex items-center gap-2">
        <MdOutlineExplore className="w-5 h-5 text-blue-600" />{" "}
        {t("property.nearby_places")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nearby Places Categories */}
        {categories.map((catKey) => {
          const items = grouped[catKey];
          const Icon = ICON_MAP[catKey] || Map;
          const labelKey = CATEGORY_LABEL_MAP[catKey] || catKey;
          const label = labelKey.includes(".") ? t(labelKey) : labelKey;

          return (
            <div
              key={catKey}
              className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:bg-white group/card"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-blue-500 transition-transform duration-300 group-hover/card:scale-120 group-hover/card:rotate-6" />
                <h4 className="font-semibold text-slate-700 text-sm transition-colors group-hover/card:text-blue-700">
                  {label}
                </h4>
              </div>
              <ul className="space-y-2">
                {items.map((item, i) => {
                  // --- ส่วนที่แก้ไข: แปลงค่าระยะทางก่อนแสดงผล ---
                  // ลองรับทั้ง key: distance_meters (ถ้า DB เก็บชื่อนี้) หรือ distance
                  const rawDistanceMeters = Number(
                    (item as any).distance_meters !== undefined 
                      ? (item as any).distance_meters 
                      : item.distance
                  );
                  
                  // แปลงเป็นกิโลเมตร (ถ้าใน DB คุณเก็บเป็นเมตร)
                  // ถ้าระบบคุณเก็บค่า Nearby เป็น กิโลเมตรอยู่แล้ว ให้ลบ / 1000 ออก
                  const distanceKm = !isNaN(rawDistanceMeters) && rawDistanceMeters > 0 
                    ? rawDistanceMeters / 1000 
                    : null;
                  // ---------------------------------------------

                  return (
                    <li
                      key={i}
                      className="flex justify-between items-start text-sm gap-2 p-1.5 -mx-1.5 rounded-lg transition-colors hover:bg-white/50 group/item"
                    >
                      <span className="text-xs lg:text-sm text-slate-600 mr-auto wrap-break-word leading-tight group-hover/item:text-slate-800 transition-colors">
                        {getLocaleValue(item, "name", language)}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* ใช้ distanceKm ที่คำนวณแล้ว */}
                        {distanceKm !== null && (
                          <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100 group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                            {formatDistance(distanceKm)}
                          </span>
                        )}
                        {item.time && (
                          <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100 group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                            {item.time} {t("common.minutes_short")}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* Transit - Single card called "รถไฟฟ้า" */}
        {transits.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:bg-white group/card">
            <div className="flex items-center gap-2 mb-3">
              <TrainFront className="w-5 h-5 text-blue-500 transition-transform duration-300 group-hover/card:scale-120 group-hover/card:rotate-6" />
              <h4 className="font-semibold text-sm text-slate-700 transition-colors group-hover/card:text-blue-700">
                {t("property.transit")}
              </h4>
            </div>
            <ul className="space-y-2">
              {transits.map((transit, i) => {
                const typeLabel = t(`property.transit_types.${transit.type}`);
                const styles =
                  TRANSIT_TYPE_STYLES[
                    transit.type as keyof typeof TRANSIT_TYPE_STYLES
                  ] || TRANSIT_TYPE_STYLES.OTHER;
                const rawDistanceMeters = Number(transit.distance_meters);
                const distanceKm = !isNaN(rawDistanceMeters) && rawDistanceMeters > 0
                 ? rawDistanceMeters / 1000
                  : null;

                const type = (transit.type || "").toUpperCase();
                const stationNameEn = getLocaleValue(transit, "station_name", "en");
                const cleanName = stationNameEn
                  ? stationNameEn
                      .toLowerCase()
                      .trim()
                      .replace(/[\s_/]+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")
                  : "";

                const isValidSlug = type && cleanName && cleanName.replace(/-/g, "").length > 0;
                const slugPrefix = type.toLowerCase().replace(/_/g, "-");

                const targetHref = transit.slug
                  ? `/near-station/${transit.slug}`
                  : isValidSlug
                    ? `/near-station/${slugPrefix}-${cleanName}`
                    : `/properties?transit_station=${encodeURIComponent(
                        getLocaleValue(transit, "station_name", language)
                      )}`;

                return (
                  <li
                    key={i}
                    className="flex justify-between items-start text-sm gap-2 p-1.5 -mx-1.5 rounded-lg transition-colors hover:bg-white/50 group/item"
                  >
                    <div className="flex items-center gap-2.5 mr-auto">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded transition-transform duration-300 group-hover/item:scale-105 ${styles.bg} ${styles.text}`}
                      >
                        {typeLabel}
                      </span>
                      <Link
                        href={targetHref}
                        className="text-xs lg:text-sm text-slate-600 leading-tight hover:text-blue-600 hover:underline transition-colors decoration-blue-300 underline-offset-4"
                      >
                        {getLocaleValue(transit, "station_name", language)}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {distanceKm && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100 group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                          {formatDistance(distanceKm)}
                          
                        </span>
                      )}
                      {transit.time && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100 group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                          {transit.time} {t("common.minutes_short")}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
