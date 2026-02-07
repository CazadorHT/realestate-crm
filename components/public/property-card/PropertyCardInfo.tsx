"use client";

import { MapPin } from "lucide-react";
import { getTypeColor, getSafeText } from "@/lib/property-utils";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertyCardInfoProps {
  property: PropertyCardProps;
  areaProvince: string;
}

export function PropertyCardInfo({
  property,
  areaProvince,
}: PropertyCardInfoProps) {
  const { language, t } = useLanguage();
  const typeColor = getTypeColor(property.property_type);

  // Property type localization
  const typeLabel = t(
    `property_types.${property.property_type?.toLowerCase() || "other"}`,
  );

  const localizedTitle = getLocaleValue(property, "title", language);

  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span
          className={`text-[10px] sm:text-[11px] md:text-xs font-medium ${typeColor.text} ${typeColor.bg} px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-0.5 md:py-1 rounded-full uppercase tracking-wide`}
        >
          {typeLabel}
        </span>
        <div className="flex items-center gap-1 text-stone-500">
          <MapPin className="h-3 w-3 text-blue-500" />
          <span className="text-xs">
            {getSafeText(
              areaProvince,
              t("nav.home").includes("Home") ? "Bangkok" : "กรุงเทพฯ",
            )}
          </span>
        </div>
      </div>
      <h3 className="text-sm sm:text-base md:text-lg font-semibold tracking-wide text-slate-800 line-clamp-2 group-hover:text-blue-800 transition-all duration-300 ease-in-out">
        {localizedTitle}
      </h3>
    </div>
  );
}
