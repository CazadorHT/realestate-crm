import { Check, Star } from "lucide-react";
import { DynamicIcon } from "@/components/dynamic-icon";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface KeySellingPoint {
  name: string;
  icon?: string;
}

interface KeySellingPointsProps {
  points?: KeySellingPoint[];
  listingType: "SALE" | "RENT" | "SALE_AND_RENT";
}

export function KeySellingPoints({
  points = [],
  listingType,
}: KeySellingPointsProps) {
  const { t } = useLanguage();

  // Default points if none provided (Fallbacks for now)
  const defaultPoints: KeySellingPoint[] = [
    { name: t("property.highlights.great_location"), icon: "map-pin" },
    { name: t("property.highlights.ready_to_move"), icon: "armchair" },
    { name: t("property.highlights.family_friendly"), icon: "users" },
  ];

  const displayPoints = points.length > 0 ? points : defaultPoints;

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-6 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h3 className="font-semibold text-slate-800">
          {t("property.special_features")}
        </h3>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-2">
        {displayPoints.map((point, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-slate-700 text-sm py-2"
          >
            {point.icon ? (
              <DynamicIcon
                name={point.icon}
                className="w-4 h-4 text-blue-500 shrink-0"
              />
            ) : (
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>{point.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
