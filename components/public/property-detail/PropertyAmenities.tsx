"use client";

import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";
import { LuLayoutGrid } from "react-icons/lu";
import {
  useLanguage,
  dictionaries,
} from "@/components/providers/LanguageProvider";
import { getLocaleValue } from "@/lib/utils/locale-utils";

interface PropertyAmenitiesProps {
  features: {
    id: string;
    name: string;
    name_en?: string | null;
    name_cn?: string | null;
    icon_key: string;
    category?: string | null;
  }[];
  language?: "th" | "en" | "cn";
}

export function PropertyAmenities({
  features,
  language: customLanguage,
}: PropertyAmenitiesProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function for language override
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  if (!features || features.length === 0) return null;
  
  // S-Tier Grouping Logic with Localized Fallbacks
  const getCategoryLabel = (key: string, defaultLabel: string) => {
    const label = t(`property.amenities.${key}`);
    if (label !== `property.amenities.${key}`) return label;
    
    // Fallback dictionary for common categories
    const fallbacks: Record<string, Record<string, string>> = {
      unit: { th: "คุณสมบัติในห้อง", en: "Unit Features", cn: "室内设施" },
      facility: { th: "สิ่งอำนวยความสะดวก", en: "Facilities", cn: "公共设施" },
      others: { th: "คุณสมบัติอื่นๆ", en: "Other Features", cn: "其他特点" }
    };
    return fallbacks[key]?.[language] || defaultLabel;
  };

  const categories = {
    unit: {
      label: getCategoryLabel("unit", "Unit Features"),
      items: features.filter(f => 
        f.category === "unit" || 
        ["sofa", "fan", "utensils", "tv", "thermometer", "kitchen", "ac", "aircon"].some(k => f.icon_key?.toLowerCase().includes(k))
      )
    },
    facility: {
      label: getCategoryLabel("facility", "Facilities"),
      items: features.filter(f => 
        f.category === "building" || f.category === "facility" ||
        ["waves", "dumbbell", "shield-check", "camera", "tree-deciduous", "car", "security", "pool", "gym"].some(k => f.icon_key?.toLowerCase().includes(k))
      )
    },
    others: {
      label: getCategoryLabel("others", "Other Features"),
      items: features.filter(f => 
        !["unit", "building", "facility"].includes(f.category || "") &&
        !["sofa", "fan", "utensils", "tv", "thermometer", "kitchen", "ac", "aircon", "waves", "dumbbell", "shield-check", "camera", "tree-deciduous", "car", "security", "pool", "gym"].some(k => f.icon_key?.toLowerCase().includes(k))
      )
    }
  };

  return (
    <section className="space-y-8">
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-semibold text-blue-900! mb-2 flex items-center gap-2">
        <LuLayoutGrid className="w-5 h-5 text-blue-600" />{" "}
        {t("property.amenities")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {Object.entries(categories).map(([key, cat]) => {
          if (cat.items.length === 0) return null;
          return (
            <div key={key} className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
                {cat.label}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cat.items.map((item, i) => {
                  const Icon = ICON_MAP[item.icon_key] || DEFAULT_ICON;
                  const localizedName = getLocaleValue(item, "name", language);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 lg:gap-3 text-sm lg:text-base text-slate-600 group/amenity transition-all duration-300 hover:translate-x-1"
                    >
                      <div className="p-1.5 lg:p-2 rounded-full bg-blue-50 text-blue-600 transition-all duration-300 group-hover/amenity:bg-blue-600 group-hover/amenity:text-white group-hover/amenity:shadow-sm">
                        <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform duration-300 group-hover/amenity:scale-110" />
                      </div>
                      <span className="truncate group-hover/amenity:text-blue-900 group-hover/amenity:font-medium transition-colors">
                        {localizedName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
