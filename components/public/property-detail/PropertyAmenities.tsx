"use client";

import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";
import { LuLayoutGrid } from "react-icons/lu";
import { useLanguage } from "@/components/providers/LanguageProvider";
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
  const { language: globalLanguage, t } = useLanguage();
  const language = customLanguage || globalLanguage;
  if (!features || features.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-bold text-blue-900! mb-6 flex items-center gap-2">
        <LuLayoutGrid className="w-5 h-5 text-blue-600" />{" "}
        {t("property.amenities")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-y-4 lg:gap-x-8">
        {features.map((item, i) => {
          const Icon = ICON_MAP[item.icon_key] || DEFAULT_ICON;
          const localizedName = getLocaleValue(item, "name", language);
          return (
            <div
            key={i}
            className="flex items-center gap-2 lg:gap-3 text-sm lg:text-base text-slate-600"
          >
            <div className="p-1.5 lg:p-2 rounded-full bg-blue-50 text-blue-600">
              <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </div>
              <span className="truncate">{localizedName}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
