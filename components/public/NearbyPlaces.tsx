import {
  School,
  ShoppingBag,
  Map,
  Stethoscope,
  Bus,
  Building2,
} from "lucide-react";

export interface NearbyPlaceItem {
  category: string;
  name: string;
  distance?: string;
  time?: string;
}

interface NearbyPlacesProps {
  location?: string;
  data?: NearbyPlaceItem[];
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
  Transport: "การเดินทาง / ขนส่ง",
  Park: "สวนสาธารณะ",
  Office: "อาคารสำนักงาน",
  Other: "สถานที่อื่นๆ",
};

export function NearbyPlaces({ location, data = [] }: NearbyPlacesProps) {
  // Group data by category
  const grouped = data.reduce(
    (acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, NearbyPlaceItem[]>,
  );

  const hasRealData = data.length > 0;

  // Use real data if available, otherwise show empty or fallback (user wanted "Real Data", so let's stick to real)
  if (!hasRealData) {
    // Optional: Return null or keep mock?
    // Plan said "Replace hardcoded mock data".
    // But if empty, maybe better to hide section?
    // Let's hide if empty to be clean.
    return null;
  }

  // Helper to format distance behavior
  const formatDistance = (val?: string) => {
    if (!val) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return val; // Return original if not a number

    if (num < 1) {
      // Less than 1 km -> convert to meters (e.g. 0.5 -> 500 ม.)
      return `${Math.round(num * 1000)} ม.`;
    }
    // 1 km or more -> show as km (e.g. 1.2 -> 1.2 กม.)
    return `${num} กม.`;
  };

  // Sort categories by predefined order or just keys
  const categories = Object.keys(grouped);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        สถานที่สำคัญใกล้เคียง
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                    <span className="text-slate-600 mr-auto break-words leading-tight">
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
      </div>
    </div>
  );
}
