"use client";

import { Wallet, Briefcase, TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertySuitabilityProps {
  listingType: "SALE" | "RENT" | "SALE_AND_RENT";
  price: number | null;
  rentalPrice: number | null;
  propertyType?: string | null;
  language?: "th" | "en" | "cn";
}

export function PropertySuitability({
  listingType,
  price,
  rentalPrice,
  propertyType,
  language: customLanguage,
}: PropertySuitabilityProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    const { dictionaries } = require("@/components/providers/LanguageProvider");
    const dict = dictionaries[language];
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  // Logic for rental yield if both prices exist
  const rentalYield =
    price && rentalPrice ? ((rentalPrice * 12) / price) * 100 : null;

  // Determine if this is an office/commercial property
  const isOffice =
    propertyType?.toLowerCase().includes("office") ||
    propertyType?.toLowerCase().includes("commercial");

  const rentDesc = isOffice
    ? t("property.suitability.rent_desc_office")
    : t("property.suitability.rent_desc_residential");

  const saleDesc = isOffice
    ? t("property.suitability.sale_desc_office")
    : t("property.suitability.sale_desc_residential");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 text-lg">
        {t("property.suitability.title")}
      </h3>

      <div className="flex flex-col gap-4">
        {/* For Renters */}
        {(listingType === "RENT" || listingType === "SALE_AND_RENT") && (
          <div className="flex gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-blue-700 text-sm mb-1">
                {t("property.suitability.rent_title")}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {rentDesc}
              </p>
            </div>
          </div>
        )}

        {/* For Buyers */}
        {(listingType === "SALE" || listingType === "SALE_AND_RENT") && (
          <div className="flex gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <div className="bg-emerald-100 p-2 rounded-lg h-fit text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700 text-sm mb-1">
                {t("property.suitability.sale_title")}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {saleDesc}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Yield Calculation */}
      {rentalYield && (
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm">
              {t("property.suitability.investment_title")}
            </p>
            <p className="text-xs text-slate-500">
              {t("property.suitability.yield_prefix")}฿
              {rentalPrice?.toLocaleString()}
              {t("property.suitability.yield_middle")}
              <span className="font-bold text-amber-600">
                ~{rentalYield.toFixed(1)}%
              </span>{" "}
              {t("property.suitability.yield_suffix")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
