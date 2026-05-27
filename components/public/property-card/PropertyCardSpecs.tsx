"use client";

import { BedDouble, Bath, Car, Expand } from "lucide-react";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PiResize, PiResizeBold } from "react-icons/pi";

export function PropertyCardSpecs({
  property,
}: {
  property: PropertyCardProps;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center text-xs text-slate-600 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-1.5 sm:gap-y-2 mt-auto">
      {property.bedrooms ? (
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center justify-center h-4 w-4 md:h-5 md:w-5 shrink-0">
            <BedDouble
              className="h-full w-full text-slate-500"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-xs sm:text-xs md:text-sm font-semibold text-slate-600">
            {property.bedrooms}
          </span>
        </div>
      ) : null}

      {property.bathrooms ? (
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center justify-center h-4 w-4 md:h-5 md:w-5 shrink-0">
            <Bath
              className="h-full w-full text-slate-500"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.bathrooms}
          </span>
        </div>
      ) : null}

      {property.parking_slots ? (
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center justify-center h-4 w-4 md:h-5 md:w-5 shrink-0">
            <Car
              className="h-full w-full text-slate-500"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.parking_slots}
          </span>
        </div>
      ) : null}

      {property.size_sqm ? (
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center justify-center h-4 w-4 md:h-5 md:w-5 shrink-0">
            <Expand
              className="h-full w-full text-slate-500"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.size_sqm}
            <small className="text-[10px] md:text-[12px] ml-0.5 font-medium">
              {t("common.sqm_short")}
            </small>
          </span>
        </div>
      ) : null}

      {property.land_size_sqwah ? (
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center justify-center h-4 w-4 md:h-5 md:w-5 shrink-0 ">
            <PiResize
              className="h-full w-full text-slate-500"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-xs md:text-sm font-semibold text-slate-600">
            {property.land_size_sqwah}
            <small className="text-[10px] md:text-[12px] ml-0.5 font-medium">
              {t("common.sqwa_short")}
            </small>
          </span>
        </div>
      ) : null}
    </div>
  );
}
