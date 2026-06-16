"use client";

import { Wallet, Briefcase, TrendingUp } from "lucide-react";
import { FaAirbnb } from "react-icons/fa6";
import {
  useLanguage,
  dictionaries,
} from "@/components/providers/LanguageProvider";

import { type Language } from "@/lib/i18n";

interface PropertySuitabilityProps {
  listingType: "SALE" | "RENT" | "SALE_AND_RENT";
  price: number | null;
  rentalPrice: number | null;
  propertyType?: string | null;
  language?: Language;
  allowAirbnb?: boolean | null;
  airbnbDailyPrice?: number | null;
  airbnbMonthlyPrice?: number | null;
  airbnbMinContract?: string | null;
}

export function PropertySuitability({
  listingType,
  price,
  rentalPrice,
  propertyType,
  language: customLanguage,
  allowAirbnb,
  airbnbDailyPrice,
  airbnbMonthlyPrice,
  airbnbMinContract,
}: PropertySuitabilityProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Translation helper for potential language override
  const t = (key: string): string => {
    if (!customLanguage) return globalT(key);

    const dict = dictionaries[language] as any;
    const value = key.split(".").reduce((prev, curr) => prev?.[curr], dict);
    return typeof value === "string" ? value : key;
  };

  // Logic for rental yield if both prices exist
  const rentalYield =
    price && rentalPrice ? ((rentalPrice * 12) / price) * 100 : null;

  // Logic for Airbnb yields if prices exist, or project them from rentalPrice for SALE listings
  const isSaleListing = listingType === "SALE" || listingType === "SALE_AND_RENT";
  
  const finalMonthlyPrice = airbnbMonthlyPrice || (isSaleListing && rentalPrice ? rentalPrice * 1.25 : null);
  const finalDailyPrice = airbnbDailyPrice || (isSaleListing && rentalPrice ? Math.round(rentalPrice / 15) : null);

  const airbnbMonthlyYield =
    price && finalMonthlyPrice ? ((finalMonthlyPrice * 12) / price) * 100 : null;

  const airbnbDailyYield =
    price && finalDailyPrice ? ((finalDailyPrice * 30 * 0.7 * 12) / price) * 100 : null;

  const isProjectedMonthly = !airbnbMonthlyPrice && isSaleListing && !!rentalPrice;
  const isProjectedDaily = !airbnbDailyPrice && isSaleListing && !!rentalPrice;

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
            <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600 shrink-0">
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

        {/* Airbnb Rent Suitability */}
        {allowAirbnb && (listingType === "RENT" || listingType === "SALE_AND_RENT") && (
          <div className="flex gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
            <div className="bg-[#FF5A5F]/10 p-2 rounded-lg h-fit text-[#FF5A5F] shrink-0">
              <FaAirbnb className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-[#FF5A5F] text-sm mb-1">
                {t("property.suitability.airbnb_rent_title")}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("property.suitability.airbnb_rent_desc")}
              </p>
            </div>
          </div>
        )}

        {/* For Buyers */}
        {(listingType === "SALE" || listingType === "SALE_AND_RENT") && (
          <div className="flex gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <div className="bg-emerald-100 p-2 rounded-lg h-fit text-emerald-600 shrink-0">
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
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shadow-xs shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm">
              {t("property.suitability.investment_title")}
            </p>
            <p className="text-xs text-slate-500">
              {t("property.suitability.yield_prefix")}
              {t("common.baht_symbol")}
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

      {/* Airbnb Yield Calculation */}
      {(allowAirbnb || isSaleListing) && (airbnbMonthlyYield || airbnbDailyYield) && (
        <div className="flex gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="bg-[#FF5A5F]/10 p-2 rounded-lg h-fit text-[#FF5A5F] shrink-0">
            <FaAirbnb className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 w-full min-w-0">
            <p className="font-bold text-[#FF5A5F] text-sm flex justify-between items-center">
              <span>{t("property.suitability.airbnb_investment_title")}</span>
              {airbnbMonthlyYield && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#FF5A5F] border border-rose-200">
                  Yield ~{airbnbMonthlyYield.toFixed(1)}%
                </span>
              )}
            </p>
            <div className="space-y-2 mt-2">
              {finalDailyPrice && (
                <div className="flex justify-between items-center text-xs border-b border-rose-100/50 pb-1.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    {t("property.suitability.airbnb_daily_yield_label")}
                    {isProjectedDaily && (
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1 rounded-sm border border-slate-200">
                        {t("property.suitability.projected") || "ประมาณการ"}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-slate-700">
                    ~{airbnbDailyYield ? `${airbnbDailyYield.toFixed(1)}%` : "-"}
                    <span className="text-slate-400 font-normal ml-1">
                      (฿{finalDailyPrice.toLocaleString()}{t("common.per_day_short")})
                    </span>
                  </span>
                </div>
              )}
              {finalMonthlyPrice && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    {t("property.suitability.airbnb_monthly_yield_label")}
                    {isProjectedMonthly && (
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1 rounded-sm border border-slate-200">
                        {t("property.suitability.projected") || "ประมาณการ"}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-slate-700">
                    ~{airbnbMonthlyYield ? `${airbnbMonthlyYield.toFixed(1)}%` : "-"}
                    <span className="text-slate-400 font-normal ml-1">
                      (฿{finalMonthlyPrice.toLocaleString()}{t("common.per_month_short")})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
