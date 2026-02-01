import {
  School,
  ShoppingBag,
  Map,
  Stethoscope,
  Bus,
  Building2,
  TrainFront,
} from "lucide-react";
import {
  TRANSIT_TYPE_LABELS,
  TRANSIT_TYPE_STYLES,
} from "@/features/properties/labels";
import { MdOutlineExplore } from "react-icons/md";

export interface NearbyPlaceItem {
  category: string;
  name: string;
  distance?: string;
  time?: string;
}

export interface TransitItem {
  type: string;
  station_name: string;
  distance_meters?: number;
  time?: string;
}

interface NearbyPlacesProps {
  location?: string;
  data?: NearbyPlaceItem[];
  transits?: TransitItem[];
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
  School: "สถานศึกษา",
  Mall: "ห้างสรรพสินค้า / ตลาด",
  Hospital: "โรงพยาบาล",
  Transport: "ทางด่วน",
  Park: "สวนสาธารณะ",
  Office: "อาคารสำนักงาน",
  Other: "สถานที่อื่นๆ",
};

export function NearbyPlaces({
  location,
  data = [],
  transits = [],
}: NearbyPlacesProps) {
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
      return `${Math.round(num * 1000)} ม.`;
    }
    return `${num} กม.`;
  };

  const categories = Object.keys(grouped);
  const transitTypes = Object.keys(groupedTransits);

  return (
    <div className="mt-10">
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
       <MdOutlineExplore className="w-5 h-5 text-blue-600" /> สถานที่สำคัญใกล้เคียง
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Nearby Places Categories (Transport = ทางด่วน) */}
        {categories.map((catKey) => {
          const items = grouped[catKey];
          const Icon = ICON_MAP[catKey] || Map;
          const label = CATEGORY_LABEL_MAP[catKey] || catKey;

          return (
            <div
              key={catKey}
              className="bg-slate-50 border border-slate-100 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold text-slate-700 text-sm">
                  {label}
                </h4>
              </div>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-start text-sm gap-2"
                  >
                    <span className="text-slate-600 mr-auto wrap-break-word leading-tight">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {item.distance && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100">
                          {formatDistance(item.distance)}
                        </span>
                      )}
                      {item.time && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100">
                          {item.time} นาที
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Transit - Single card called "รถไฟฟ้า" */}
        {transits.length > 0 && (
          <div className="bg-blue-50 border border-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrainFront className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-sm text-slate-700">รถไฟฟ้า</h4>
            </div>
            <ul className="space-y-2">
              {transits.map((transit, i) => {
                const typeLabel =
                  TRANSIT_TYPE_LABELS[
                    transit.type as keyof typeof TRANSIT_TYPE_LABELS
                  ] || transit.type;
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
                    className="flex justify-between items-start text-sm gap-2"
                  >
                    <div className="flex items-center gap-2 mr-auto">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${styles.bg} ${styles.text}`}
                      >
                        {typeLabel}
                      </span>
                      <span className="text-slate-600 leading-tight">
                        {transit.station_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {distanceKm && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100">
                          {formatDistance(distanceKm)}
                        </span>
                      )}
                      {transit.time && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-100">
                          {transit.time} นาที
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
