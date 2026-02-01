"use client";

import { BedDouble, Bath, Car, Expand } from "lucide-react";
import type { PropertyCardProps } from "../PropertyCard";

export function PropertyCardSpecs({
  property,
}: {
  property: PropertyCardProps;
}) {
  return (
    <div className="flex flex-wrap items-center text-xs text-slate-600 gap-x-3 sm:gap-x-3.5 md:gap-x-4 gap-y-1 sm:gap-y-1.5 md:gap-y-2 mt-auto">
      <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5">
        <BedDouble
          className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-slate-400"
          strokeWidth={1.5}
        />
        <span className="text-xs sm:text-xs md:text-sm font-semibold text-slate-600">
          {property.bedrooms || "-"}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5">
        <Bath
          className="h-4 w-4 md:h-5 md:w-5 text-slate-400"
          strokeWidth={1.5}
        />
        <span className="text-xs md:text-sm font-semibold text-slate-600">
          {property.bathrooms || "-"}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5">
        <Car
          className="h-4 w-4 md:h-5 md:w-5 text-slate-400"
          strokeWidth={1.5}
        />
        <span className="text-xs md:text-sm font-semibold text-slate-600">
          {property.parking_slots || "-"}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5">
        <Expand
          className="h-4 w-4 md:h-5 md:w-5 text-slate-400"
          strokeWidth={1.5}
        />
        <span className="text-xs md:text-sm font-semibold text-slate-600">
          {property.size_sqm || "-"}
          <small className="text-[10px] md:text-[12px]">
            {" "}
            ม.
            <small className="text-[8px] md:text-[10px] font-medium relative top-[-0.2em] ml-0.5">
              2
            </small>
          </small>
        </span>
      </div>
    </div>
  );
}
