"use client";

import { Wallet, Briefcase, TrendingUp, Sparkles } from "lucide-react";
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

  const t = (key: string): string => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language] as any;
    const value = key.split(".").reduce((prev, curr) => prev?.[curr], dict);
    return typeof value === "string" ? value : key;
  };

  const isRentListing =
    listingType === "RENT" || listingType === "SALE_AND_RENT";
  const isSaleListing =
    listingType === "SALE" || listingType === "SALE_AND_RENT";

  // 1. Standard Rental Yield
  const showInvestmentYield = isSaleListing && price && rentalPrice;
  const rentalYield = showInvestmentYield
    ? ((rentalPrice * 12) / price) * 100
    : null;

  // 2. Airbnb Base Setup
  const baseRentalEstimation =
    rentalPrice || (price ? (price * 0.05) / 12 : null);

  // ราคาต่อวัน และ ราคาต่อเดือนเหมาจ่ายบน Airbnb
  const finalDailyPrice =
    airbnbDailyPrice ||
    (isSaleListing && baseRentalEstimation
      ? Math.round(baseRentalEstimation / 15)
      : null);
  const finalMonthlyPrice =
    airbnbMonthlyPrice ||
    (isSaleListing && baseRentalEstimation
      ? Math.round(baseRentalEstimation * 1.35)
      : null);

  const DAILY_OCCUPANCY = 0.6; // อัตราเข้าพักรายวันเฉลี่ย 60%

  // ปรับสูตร Yield รายเดือน: คิดจากราคารวมรายเดือนตรงๆ โดยไม่ต้องคูณตัวคูณซ้ำซ้อน เพื่อให้ตัวเลขสะท้อนความเป็นจริงในแผ่นดีไซน์
  const airbnbDailyYield =
    price && finalDailyPrice
      ? ((finalDailyPrice * 30 * DAILY_OCCUPANCY * 12) / price) * 100
      : null;
  const airbnbMonthlyYield =
    price && finalMonthlyPrice
      ? ((finalMonthlyPrice * 12) / price) * 100
      : null;

  const showAirbnbYield =
    isSaleListing && price && (finalDailyPrice || finalMonthlyPrice);

  const isProjectedDaily =
    !airbnbDailyPrice && isSaleListing && !!baseRentalEstimation;
  const isProjectedMonthly =
    !airbnbMonthlyPrice && isSaleListing && !!baseRentalEstimation;

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
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm  hover:shadow-md transition-all duration-200  space-y-4">
      <div className="flex items-center gap-2.5 pb-1">
        <div className="text-slate-700/80">
          {/* คุณสามารถเปลี่ยนเป็น <UserCheck className="w-5 h-5" /> ได้ตามความชอบครับ */}
          <Sparkles className="w-5 h-5 fill-slate-700/10" />
        </div>
        <h3 className="font-semibold text-slate-700 text-lg italic">
          {t("property.suitability.title")}
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {/* สำหรับผู้เช่า */}
        {isRentListing && (
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

        {/* ข้อดีเพิ่มเติมสำหรับกรณีเช่าอย่างเดียว */}
        {listingType === "RENT" && (
          <div className="flex gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <div className="bg-amber-100 p-2 rounded-lg h-fit text-amber-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-700 text-sm mb-1">
                {t("property.suitability.rent_highlight_title")}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("property.suitability.rent_highlight_desc")}
              </p>
            </div>
          </div>
        )}

        {/* Airbnb สำหรับฝั่งผู้เช่าช่วง */}
        {allowAirbnb && isRentListing && (
          <div className="flex gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
            <div className="bg-[#FF5A5F]/10 p-2 rounded-lg h-fit text-[#FF5A5F] shrink-0">
              <FaAirbnb className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-[#FF5A5F]/90 text-sm mb-1">
                {t("property.suitability.airbnb_rent_title")}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("property.suitability.airbnb_rent_desc")}
                {airbnbMinContract &&
                  ` (${t("property.suitability.min_contract")}: ${airbnbMinContract})`}
              </p>
            </div>
          </div>
        )}

        {/* สำหรับผู้ซื้อ */}
        {isSaleListing && (
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

      {/* คำนวณ Yield ปล่อยเช่าสัญญารายปีปกติ */}
      {showInvestmentYield && rentalYield && (
        <div className="flex items-center gap-3 bg-amber-50/50 p-3 rounded-xl border border-slate-100">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shadow-sm shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="w-full">
            <p className="font-semibold text-amber-600 text-sm">
              {t("property.suitability.investment_title")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("property.suitability.yield_prefix")}
              {t("common.baht_symbol")}
              {rentalPrice?.toLocaleString()}
              {t("property.suitability.yield_middle")}
              <span className="font-bold text-amber-500 ml-1">
                ~{rentalYield.toFixed(1)}%
              </span>{" "}
              {t("property.suitability.yield_suffix")}
            </p>
          </div>
        </div>
      )}

      {/* กล่อง Airbnb ปรับดีไซน์ตามแผ่นดีไซน์ image_a2d7fc.png แบบพิกเซลเป๊ะๆ */}
      {showAirbnbYield && (
        <div className="bg-rose-50/30 p-5 rounded-2xl border border-rose-100/60 mt-3 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="text-[#FF5A5F]">
              <FaAirbnb className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[#FF5A5F] text-sm">
              {t("property.suitability.airbnb_investment_title")}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {/* รายวัน */}
            {finalDailyPrice && (
              <div className="flex justify-between items-center text-sm border-b border-rose-100/40 pb-3">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-600 flex items-center gap-2">
                    {t("property.suitability.airbnb_daily_label")}
                    {isProjectedDaily && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        {t("property.suitability.projected")}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    {t("property.suitability.airbnb_daily_sub")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-[#FF5A5F] text-base">
                    ~
                    {airbnbDailyYield ? `${airbnbDailyYield.toFixed(1)}%` : "-"}
                  </span>
                  <p className="text-slate-400 text-xs mt-0.5">
                    (฿{finalDailyPrice.toLocaleString()}
                    {t("property.suitability.per_day_label") || "/วัน"})
                  </p>
                </div>
              </div>
            )}

            {/* รายเดือน */}
            {finalMonthlyPrice && (
              <div className="flex justify-between items-center text-sm">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-600 flex items-center gap-2">
                    {t("property.suitability.airbnb_monthly_label")}
                    {isProjectedMonthly && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        {t("property.suitability.projected")}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    {t("property.suitability.airbnb_monthly_sub")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-600 text-base">
                    ~
                    {airbnbMonthlyYield
                      ? `${airbnbMonthlyYield.toFixed(1)}%`
                      : "-"}
                  </span>
                  <p className="text-slate-400 text-xs mt-0.5">
                    (฿{finalMonthlyPrice.toLocaleString()}
                    {t("property.suitability.per_month_label") || "/เดือน"})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
