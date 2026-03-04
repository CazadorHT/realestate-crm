"use client";
import {
  School,
  ShoppingBag,
  Map,
  Stethoscope,
  Bus,
  Building2,
  TrainFront,
} from "lucide-react";
import { TRANSIT_TYPE_STYLES } from "@/features/properties/labels";
import { MdOutlineExplore } from "react-icons/md";
import {
  useLanguage,
  dictionaries,
} from "@/components/providers/LanguageProvider";

export interface NearbyPlaceItem {
  category: string;
  name: string;
  name_en?: string;
  name_cn?: string;
  distance?: string;
  time?: string;
}

export interface TransitItem {
  type: string;
  station_name: string;
  station_name_en?: string;
  station_name_cn?: string;
  distance_meters?: number;
  time?: string;
}

interface NearbyPlacesProps {
  location?: string;
  data?: NearbyPlaceItem[];
  transits?: TransitItem[];
  language?: "th" | "en" | "cn";
}

const ICON_MAP: Record<string, any> = {
  School: School,
  Mall: ShoppingBag,
  Hospital: Stethoscope,
  Transport: Bus,
  Park: Map,
  Office: Building2,
  Other: Map,
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  School: "property.categories.school",
  Mall: "property.categories.mall",
  Hospital: "property.categories.hospital",
  Transport: "property.categories.transport",
  Park: "property.categories.park",
  Office: "property.categories.office",
  Other: "property.categories.other",
};

export function NearbyPlaces({
  location,
  data = [],
  transits = [],
  language: customLanguage,
}: NearbyPlacesProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function for language override
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
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
        {/* Nearby Places Categories (Transport = à¸—à¸²à¸‡à¸”à¹ˆà¸§à¸™) */}
        {categories.map((catKey) => {
          const items = grouped[catKey];
          const Icon = ICON_MAP[catKey] || Map;
          const labelKey = CATEGORY_LABEL_MAP[catKey] || catKey;
          const label = labelKey.includes(".") ? t(labelKey) : labelKey;

          return (
            <div
              key={catKey}
              className="bg-slate-50 border border-slate-100 rounded-xl p-4 group hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-blue-100/40 via-blue-50/20 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0" />
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Icon className="w-5 h-5 text-blue-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <h4 className="font-semibold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">
                  {label}
                </h4>
              </div>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center text-sm gap-2 group/item hover:bg-blue-50/70 p-2.5 -mx-2.5 rounded-xl transition-all duration-200 cursor-default relative z-10"
                  >
                    <span className="text-slate-600 mr-auto wrap-break-word leading-tight group-hover/item:text-slate-800 transition-colors">
                      {(language === "en"
                        ? item.name_en
                        : language === "cn"
                          ? item.name_cn
                          : null) || item.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.distance && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100 group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                          {formatDistance(item.distance)}
                        </span>
                      )}
                      {item.time && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100 group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                          {item.time} {t("common.minutes_short")}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Transit - Single card called "à¸£à¸–à¹„à¸Ÿà¸Ÿà¹‰à¸²" */}
        {transits.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 group hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-blue-100/40 via-blue-50/20 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <TrainFront className="w-5 h-5 text-blue-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="font-semibold text-sm text-slate-700 group-hover:text-blue-700 transition-colors">
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
                const distanceKm = transit.distance_meters
                  ? transit.distance_meters / 1000
                  : null;
                return (
                  <li
                    key={i}
                    className="flex justify-between items-center text-sm gap-2 group/item hover:bg-blue-50/70 p-2.5 -mx-2.5 rounded-xl transition-all duration-200 cursor-default relative z-10"
                  >
                    <div className="flex items-center gap-2.5 mr-auto">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded transition-transform duration-300 group-hover/item:scale-105 ${styles.bg} ${styles.text}`}
                      >
                        {typeLabel}
                      </span>
                      <span className="text-slate-600 leading-tight group-hover/item:text-slate-800 transition-colors">
                        {(language === "en"
                          ? transit.station_name_en
                          : language === "cn"
                            ? transit.station_name_cn
                            : null) || transit.station_name}
                      </span>
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
