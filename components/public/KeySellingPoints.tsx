import { Check, Star } from "lucide-react";
import { DynamicIcon } from "@/components/dynamic-icon";
import { useLanguage, dictionaries } from "@/components/providers/LanguageProvider";
import { type Language } from "@/lib/i18n";

export interface KeySellingPoint {
  name: string;
  icon?: string;
}

interface KeySellingPointsProps {
  points?: KeySellingPoint[];
  listingType: "SALE" | "RENT" | "SALE_AND_RENT";
  language?: Language;
  propertyType?: string | null;
}

export function KeySellingPoints({
  points = [],
  listingType,
  language: customLanguage,
  propertyType,
}: KeySellingPointsProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  // Get dynamic default points based on property type
  const getDefaultPoints = () => {
    const tLower = propertyType?.toLowerCase() || "";
    if (tLower.includes("office")) {
      return [
        { name: t("property.badges.good_location"), icon: "map-pin" },
        { name: t("property.badges.access_247"), icon: "check-circle-2" },
        { name: t("property.badges.fiber_optic"), icon: "wifi" },
      ];
    }
    if (tLower.includes("condo")) {
      return [
        { name: t("property.badges.good_location"), icon: "map-pin" },
        { name: t("property.badges.ready_to_move"), icon: "check-circle-2" },
        { name: t("property.badges.city_view"), icon: "building-2" },
      ];
    }
    if (tLower.includes("townhome") || tLower.includes("commercial")) {
      return [
        { name: t("property.badges.good_location"), icon: "map-pin" },
        { name: t("property.badges.ready_to_move"), icon: "check-circle-2" },
        { name: t("property.badges.multi_parking"), icon: "check-circle-2" },
      ];
    }
    // Default (HOUSE, VILLA, etc.)
    return [
      { name: t("property.badges.good_location"), icon: "map-pin" },
      { name: t("property.badges.ready_to_move"), icon: "check-circle-2" },
      { name: t("property.badges.family_friendly"), icon: "users" },
    ];
  };

  const defaultPoints = getDefaultPoints();

  const displayLimit = 4;
  const displayPoints = points.length > 0 ? points : defaultPoints;
  const visiblePoints = displayPoints.slice(0, displayLimit);
  const remainingCount = Math.max(0, displayPoints.length - displayLimit);



  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-6 items-center  ">
      {/* CLIENT DEBUG: log points (client-only effect) */}
      {/* useEffect placed above return prevents SSR markup change */}
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h3 className="font-semibold text-slate-800">
          {t("property.special_features")}
        </h3>
      </div>
      <div className="flex flex-row flex-wrap gap-x-6 gap-y-1">
        {visiblePoints.map((point, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-slate-700 text-xs lg:text-sm py-1.5"
          >
            {point.icon ? (
              <DynamicIcon
                name={point.icon}
                className="w-4 h-4 text-blue-500 shrink-0"
              />
            ) : (
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span className="line-clamp-1">{point.name}</span>
          </div>
        ))}
        {remainingCount > 0 && (
          <button
            onClick={() => {
              const element = document.getElementById(
                "property-badges-section",
              );
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                // Small delay to ensure scroll starts before highlight
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("trigger-badge-highlight"));
                }, 100);
              }
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors text-xs py-1.5 italic font-medium cursor-pointer group/more"
          >
            <span>
              ...{t("common.more")} {remainingCount} {t("search.items")}
            </span>
            <span className="hidden sm:inline bg-slate-200/50 group-hover/more:bg-blue-100 px-2 py-0.5 rounded-full text-[10px] not-italic transition-colors">
              {language === "th"
                ? "ดูเพิ่มเติมด้านล่าง"
                : language === "cn"
                  ? "查看下方更多"
                  : language === "ru"
                    ? "Смотреть ниже"
                    : "See more below"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
