"use client";

import { MapPin } from "lucide-react";
import { getTypeLabel, getTypeColor, getSafeText } from "@/lib/property-utils";
import type { PropertyCardProps } from "../PropertyCard";

interface PropertyCardInfoProps {
  property: PropertyCardProps;
  areaProvince: string;
}

export function PropertyCardInfo({
  property,
  areaProvince,
}: PropertyCardInfoProps) {
  const typeColor = getTypeColor(property.property_type);

  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span
          className={`text-[10px] sm:text-[11px] md:text-xs font-medium ${typeColor.text} ${typeColor.bg} px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-0.5 md:py-1 rounded-full uppercase tracking-wide`}
        >
          {getTypeLabel(property.property_type)}
        </span>
        <div className="flex items-center gap-1 text-stone-500">
          <MapPin className="h-3 w-3 text-blue-500" />
          <span className="text-xs">
            {getSafeText(areaProvince, "กรุงเทพฯ")}
          </span>
        </div>
      </div>
      <h3 className="text-sm sm:text-base md:text-lg font-semibold tracking-wide text-slate-800 line-clamp-2 group-hover:text-blue-800 transition-all duration-300 ease-in-out">
        {property.title}
      </h3>
    </div>
  );
}
