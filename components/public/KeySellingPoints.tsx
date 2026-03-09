import { Check, Star } from "lucide-react";
import { DynamicIcon } from "@/components/dynamic-icon";
import { useLanguage, dictionaries } from "@/components/providers/LanguageProvider";

export interface KeySellingPoint {
  name: string;
  icon?: string;
}

interface KeySellingPointsProps {
  points?: KeySellingPoint[];
  listingType: "SALE" | "RENT" | "SALE_AND_RENT";
  language?: "th" | "en" | "cn";
}

export function KeySellingPoints({
  points = [],
  listingType,
  language: customLanguage,
}: KeySellingPointsProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  // Default points if none provided (Fallbacks for now)
  const defaultPoints: KeySellingPoint[] = [
    { name: t("property.highlights.great_location"), icon: "map-pin" },
    { name: t("property.highlights.ready_to_move"), icon: "armchair" },
    { name: t("property.highlights.family_friendly"), icon: "users" },
  ];

  const displayLimit = 4;
  const displayPoints = points.length > 0 ? points : defaultPoints;
  const visiblePoints = displayPoints.slice(0, displayLimit);
  const remainingCount = Math.max(0, displayPoints.length - displayLimit);

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-6 items-center  ">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h3 className="font-semibold text-slate-800">
          {t("property.special_features")}
        </h3>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-1">
        {visiblePoints.map((point, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-slate-700 text-sm py-1.5"
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
                  : "See more below"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
