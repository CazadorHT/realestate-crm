"use client";

import { BedDouble, Bath, Car, Maximize, Building2, Home, Users } from "lucide-react";
import {
  useLanguage,
  dictionaries,
} from "@/components/providers/LanguageProvider";

import { type Language } from "@/lib/i18n";

interface PropertySpecsProps {
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  office_capacity?: number | null;
  sizeSqm?: number | null;
  landSize?: number | null;
  floor?: number | null;
  type: string;
  language?: Language;
}

export function PropertySpecs({
  bedrooms,
  bathrooms,
  parking,
  office_capacity,
  sizeSqm,
  landSize,
  floor,
  type: _type,
  language: customLanguage,
}: PropertySpecsProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Translation helper for potential language override
  const t = (key: string): string => {
    if (!customLanguage) return globalT(key);

    const dict = dictionaries[language] as any;
    const value = key.split(".").reduce((prev, curr) => prev?.[curr], dict);
    return typeof value === "string" ? value : key;
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
    {
      label: t("property.specs.capacity"),
      value: office_capacity,
      suffix: t("property.specs.unit_desk"),
      icon: <Users className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />,
      show: !!office_capacity,
    },
  ].filter(
    (item) => item.show && item.value !== null && item.value !== undefined,
  );

  return (
    <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
      {specs.map((spec, index) => (
        <div
          key={index}
          className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-blue-200/50 duration-300 group transition-colors"
        >
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 text-blue-600 group-hover:scale-110  duration-300 transition-all">
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

