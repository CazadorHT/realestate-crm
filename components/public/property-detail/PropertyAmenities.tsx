"use client";

import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";
import { LuLayoutGrid } from "react-icons/lu";

interface PropertyAmenitiesProps {
  features: {
    id: string;
    name: string;
    icon_key: string;
    category?: string | null;
  }[];
}

export function PropertyAmenities({ features }: PropertyAmenitiesProps) {
  if (!features || features.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <LuLayoutGrid className="w-5 h-5 text-blue-600" /> สิ่งอำนวยความสะดวก</h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-y-4 md:gap-x-8">
        {features.map((item, i) => {
          const Icon = ICON_MAP[item.icon_key] || DEFAULT_ICON;
          return (
            <div
              key={i}
              className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-slate-600"
            >
              <div className="p-1.5 md:p-2 rounded-full bg-blue-50 text-blue-600">
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <span className="truncate">{item.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
