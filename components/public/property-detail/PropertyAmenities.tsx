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

  return (
    <section>
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-semibold text-blue-900! mb-6 flex items-center gap-2">
        <LuLayoutGrid className="w-5 h-5 text-blue-600" />{" "}
        {t("property.amenities")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-y-4 lg:gap-x-4">
        {features.map((item, i) => {
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
    </section>
  );
}
