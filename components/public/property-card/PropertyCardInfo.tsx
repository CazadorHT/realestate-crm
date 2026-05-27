import Link from "next/link";
import { CheckSquare, Square } from "lucide-react";
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
  isInCompare?: boolean;
  onCompareClick?: (e: React.MouseEvent) => void;
  handleCardClick?: () => void;
}

export function PropertyCardInfo({
  property,
  areaProvince,
  isInCompare = false,
  onCompareClick,
  handleCardClick,
}: PropertyCardInfoProps) {
  const { language, t } = useLanguage();
  const typeColor = getTypeColor(property.property_type);

  // Property type localization
  const typeKey = property.property_type?.toLowerCase() || "other";
  const typeLabel = t(`property_types.${typeKey}`);
  const IconComponent = PROPERTY_TYPE_ICONS[typeKey] || HiCircleStack;

  const localizedTitle = getLocaleValue(property, "title", language);

  return (
    <div className="space-y-2 mb-3">
      {/* Top row: Badge and Compare button (outside detail links) */}
      <div className="flex justify-between items-center gap-4 mb-2">
        <span
          className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] md:text-xs font-semibold ${typeColor.text} ${typeColor.bg} px-2 py-0.5 md:py-1  rounded-lg uppercase tracking-wide shadow-xs`}
        >
          <IconComponent className="h-3.5 w-3.5 " />
          {typeLabel}
        </span>

        {/* Compare Checkbox - Optimized Touch Target */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onCompareClick) onCompareClick(e);
          }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border transition-all duration-200 cursor-pointer touch-manipulation min-h-[30px]! ${
            isInCompare 
              ? "bg-blue-50 border-blue-200/60 text-blue-600 font-bold" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          {isInCompare ? (
            <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
          ) : (
            <Square className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span className="text-[11px] sm:text-xs">{t("common.compare")}</span>
        </button>
      </div>

      {/* Title block link */}
      <Link 
        href={`/properties/${property.slug || property.id}`}
        className="block group-hover:text-blue-600 transition-colors"
        onClick={handleCardClick}
      >
        <h3 className="text-sm sm:text-base md:text-base font-semibold tracking-wide text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-800 transition-all duration-300 ease-in-out">
          {localizedTitle}
        </h3>
      </Link>

      {/* Location block link below the title */}
      <Link
        href={`/properties/${property.slug || property.id}`}
        className="flex items-center gap-1 text-stone-500 min-w-0"
        onClick={handleCardClick}
      >
        <HiMapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <span className="text-xs truncate whitespace-nowrap hover:text-blue-600 transition-colors">
          {getSafeText(
            areaProvince,
            getProvinceName("กรุงเทพมหานคร", language),
          )}
        </span>
      </Link>
    </div>
  );
}
