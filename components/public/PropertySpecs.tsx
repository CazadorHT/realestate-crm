"use client";

import { BedDouble, Bath, Car, Maximize, Building2, Home } from "lucide-react";

interface PropertySpecsProps {
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  sizeSqm?: number | null;
  landSize?: number | null;
  floor?: number | null;
  type: string;
}

export function PropertySpecs({
  bedrooms,
  bathrooms,
  parking,
  sizeSqm,
  landSize,
  floor,
  type: _type,
}: PropertySpecsProps) {
  const specs = [
    {
      label: "ห้องนอน",
      value: bedrooms,
      suffix: "ห้อง",
      icon: <BedDouble className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: true,
    },
    {
      label: "ห้องน้ำ",
      value: bathrooms,
      suffix: "ห้อง",
      icon: <Bath className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: true,
    },
    {
      label: "พื้นที่ใช้สอย",
      value: sizeSqm,
      suffix: "ตร.ม.",
      icon: <Maximize className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!sizeSqm,
    },
    {
      label: "ขนาดที่ดิน",
      value: landSize,
      suffix: "ตร.วา",
      icon: <Home className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!landSize,
    },
    {
      label: "ที่จอดรถ",
      value: parking,
      suffix: "คัน",
      icon: <Car className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!parking,
    },
    {
      label: "ชั้นที่",
      value: floor,
      suffix: "",
      icon: <Building2 className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!floor,
    },
  ].filter(
    (item) => item.show && item.value !== null && item.value !== undefined
  );

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
      {specs.map((spec, index) => (
        <div
          key={index}
          className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-blue-50/50 transition-colors"
        >
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 text-blue-600">
            {spec.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm md:text-lg font-bold text-slate-900 truncate">
              {spec.value}{" "}
              <span className="text-[10px] md:text-sm font-medium text-slate-500">
                {spec.suffix}
              </span>
            </div>
            <div className="text-[9px] md:text-xs text-slate-400 font-medium uppercase tracking-wide truncate">
              {spec.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
