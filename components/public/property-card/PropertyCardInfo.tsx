"use client";

import { 
  HiMapPin, 
  HiHome, 
  HiBriefcase, 
  HiBuildingStorefront,
  HiCircleStack
} from "react-icons/hi2";
import { 
  MdWarehouse, 
  MdLandscape, 
  MdFactory, 
  MdVilla,
  MdPool,
  MdApartment
} from "react-icons/md";
import { getTypeColor, getSafeText } from "@/lib/property-utils";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";

const PROPERTY_TYPE_ICONS: Record<string, any> = {
  house: HiHome,
  condo: MdApartment,
  townhome: MdWarehouse,
  land: MdLandscape,
  office: HiBriefcase,
  office_building: HiBriefcase,
  warehouse: MdFactory,
  factory: MdFactory,
  villa: MdVilla,
  pool_villa: MdPool,
  commercial: HiBuildingStorefront,
  commercial_building: HiBuildingStorefront,
  other: HiCircleStack,
};

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
  const typeKey = property.property_type?.toLowerCase() || "other";
  const typeLabel = t(`property_types.${typeKey}`);
  const IconComponent = PROPERTY_TYPE_ICONS[typeKey] || HiCircleStack;

  const localizedTitle = getLocaleValue(property, "title", language);

  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center gap-4 mb-2">
        <span
          className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] md:text-xs font-semibold ${typeColor.text} ${typeColor.bg} px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-0.5 md:py-1 rounded-full uppercase tracking-wide shadow-xs`}
        >
          <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {typeLabel}
        </span>
        <div className="flex items-center gap-1 text-stone-500 min-w-0 flex-1 justify-end">
          <HiMapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs truncate whitespace-nowrap">
            {getSafeText(
              areaProvince,
              getProvinceName("กรุงเทพมหานคร", language),
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
