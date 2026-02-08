"use client";

import { BedDouble, Bath, Car, Maximize, Building2, Home } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertySpecsProps {
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  sizeSqm?: number | null;
  landSize?: number | null;
  floor?: number | null;
  type: string;
  language?: "th" | "en" | "cn";
}

export function PropertySpecs({
  bedrooms,
  bathrooms,
  parking,
  sizeSqm,
  landSize,
  floor,
  type: _type,
  language: customLanguage,
}: PropertySpecsProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function to use the selected language dictionary
  const t = (key: string) => {
    const { dictionaries } = require("@/components/providers/LanguageProvider");
    const dict = dictionaries[language];
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  const specs = [
    {
      label: t("property.specs.bedrooms"),
      value: bedrooms,
      suffix: t("property.specs.unit_room"),
      icon: <BedDouble className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: true,
    },
    {
      label: t("property.specs.bathrooms"),
      value: bathrooms,
      suffix: t("property.specs.unit_room"),
      icon: <Bath className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: true,
    },
    {
      label: t("property.specs.size_sqm"),
      value: sizeSqm,
      suffix: t("common.sqm_short"),
      icon: <Maximize className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!sizeSqm,
    },
    {
      label: t("property.specs.land_size"),
      value: landSize,
      suffix: t("common.sqwa_short"),
      icon: <Home className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!landSize,
    },
    {
      label: t("property.specs.parking"),
      value: parking,
      suffix: t("property.specs.unit_car"),
      icon: <Car className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!parking,
    },
    {
      label: t("property.specs.floor"),
      value: floor,
      suffix: t("property.specs.unit_floor"),
      icon: <Building2 className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!floor,
    },
  ].filter(
    (item) => item.show && item.value !== null && item.value !== undefined,
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
              <span className="text-[10px] md:text-sm font-medium text-slate-500 lowercase first-letter:uppercase">
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
