"use client";

import { BedDouble, Bath, Car, Expand } from "lucide-react";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PropertyCardSpecs({
  property,
}: {
  property: PropertyCardProps;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center text-xs text-slate-600 gap-x-3 sm:gap-x-3.5 md:gap-x-3 gap-y-1 sm:gap-y-1.5 md:gap-y-2 mt-auto">
      {property.bedrooms ? (
        <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5">
          <BedDouble
            className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-slate-400"
            strokeWidth={1.5}
          />
          <span className="text-xs sm:text-xs md:text-sm font-semibold text-slate-600">
            {property.bedrooms}
          </span>
        </div>
      ) : null}

      {property.bathrooms ? (
        <div className="flex items-center gap-1 md:gap-1.5">
          <Bath
            className="h-4 w-4 md:h-5 md:w-5 text-slate-400"
            strokeWidth={1.5}
          />
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.bathrooms}
          </span>
        </div>
      ) : null}

      {property.parking_slots ? (
        <div className="flex items-center gap-1 md:gap-1.5">
          <Car
            className="h-4 w-4 md:h-5 md:w-5 text-slate-400"
            strokeWidth={1.5}
          />
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.parking_slots}
          </span>
        </div>
      ) : null}

      {property.size_sqm ? (
        <div className="flex items-center gap-1 md:gap-1.5">
          <Expand
            className="h-4 w-4 md:h-5 md:w-5 text-slate-400"
            strokeWidth={1.5}
          />
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.size_sqm}
            <small className="text-[10px] md:text-[12px] ml-0.5">
              {t("common.sqm_short")}
            </small>
          </span>
        </div>
      ) : null}

      {property.land_size_sqwah ? (
        <div className="flex items-center gap-1 md:gap-1.5">
          <Expand
            className="h-4 w-4 md:h-3 md:w-3 text-slate-400 rotate-45"
            strokeWidth={1.5}
          />
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.land_size_sqwah}
            <small className="text-[10px] md:text-[12px] ml-0.5">
              {t("common.sqwa_short")}
            </small>
          </span>
        </div>
      ) : null}
    </div>
  );
}
