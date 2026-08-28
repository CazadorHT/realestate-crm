"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { FaAirbnb } from "react-icons/fa6";
import { parseAirbnbMinContract } from "@/lib/property-utils";

interface PropertyPricingSectionProps {
  property: any;
  language: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  officePrice: any;
}

export function PropertyPricingSection({
  property,
  language,
  t,
  officePrice,
}: PropertyPricingSectionProps) {
  const formatPrice = (val: number | null) =>
    val
      ? `฿ ${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(val)}`
      : "-";

  const renderPriceBlock = (
    price: number | null,
    originalPrice: number | null,
    label: string,
    isRent: boolean,
  ) => {
    const effectivePrice =
      officePrice?.isCalculated &&
      ((isRent && officePrice.sqmPrice === property.rent_price_per_sqm) ||
        (!isRent && officePrice.sqmPrice === property.price_per_sqm))
        ? officePrice.totalPrice
        : price;

    const displayPrice = effectivePrice ?? originalPrice;

    if (
      displayPrice === null ||
      displayPrice === undefined ||
      displayPrice === 0
    ) {
      return (
        <div className="flex flex-col items-end gap-1">
          {label && (
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</span>
          )}
          <span className="text-xl md:text-2xl font-semibold text-blue-600">
            {isRent ? t("property.inquiry_rent") : t("property.inquiry_price")}
          </span>
        </div>
      );
    }

    const hasDiscount =
      price !== null && originalPrice !== null && originalPrice > price;

    if (hasDiscount) {
      const discountPercent = Math.round(
        ((originalPrice! - price!) / originalPrice!) * 100,
      );

      return (
        <div className="flex flex-col items-end gap-1">
          {label && (
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              {label}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">
              -{discountPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-bold text-rose-600">
              {formatPrice(price)}
              {isRent && (
                <span className="text-sm font-normal text-slate-500">
                  /{t("common.month")}
                </span>
              )}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end gap-0.5">
        {label && (
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            {label}
          </span>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-xl md:text-2xl font-bold text-slate-900">
            {formatPrice(displayPrice)}
            {isRent && (
              <span className="text-sm font-normal text-slate-500">
                /{t("common.month")}
              </span>
            )}
          </span>
        </div>
        {officePrice?.isCalculated && (
          <span className="text-[10px] text-slate-400 font-medium">
            (฿ {officePrice.sqmPrice?.toLocaleString()} / {t("common.sqm")})
          </span>
        )}
      </div>
    );
  };

    const renderMinContract = () => {
      if (!property.min_contract_months) return null;
      const months = property.min_contract_months;
      const isYearDivisible = months >= 12 && months % 12 === 0;

      return (
        <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 justify-end">
          <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
          <span>
            {t("property.min_contract")}{" "}
            <strong className="text-slate-900">
              {isYearDivisible ? (
                <>
                  {months / 12} {t("common.year")}{" "}
                  <span className="text-slate-500 font-normal">
                    ({months} {t("common.month")})
                  </span>
                </>
              ) : (
                <>
                  {months} {t("common.month")}
                </>
              )}
            </strong>
          </span>
        </div>
      );
    };

    return (
      <div className="bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-4 lg:mt-4 items-end lg:items-end lg:w-[350px] w-full">
        <div className="flex flex-col items-end gap-2">
          {(() => {
            if (property.listing_type === "SALE_AND_RENT") {
              return (
                <div className="flex flex-col gap-3 w-full items-end">
                  {renderPriceBlock(
                    property.price,
                    property.original_price,
                    t("common.sale_price"),
                    false,
                  )}
                  <div className="w-full border-t border-slate-200 my-1" />
                  <div className="flex flex-col items-end w-full">
                    {renderPriceBlock(
                      property.rental_price,
                      property.original_rental_price,
                      t("common.rent_price"),
                      true,
                    )}
                    {renderMinContract()}
                  </div>
                </div>
              );
            }

            if (property.listing_type === "RENT") {
              return (
                <div className="flex flex-col items-end w-full">
                  {renderPriceBlock(
                    property.rental_price,
                    property.original_rental_price,
                    t("common.rent_price"),
                    true,
                  )}
                  {renderMinContract()}
                </div>
              );
            }

            return renderPriceBlock(
              property.price,
              property.original_price,
              t("common.sale_price"),
              false,
            );
          })()}

        {property.allow_airbnb && (property.airbnb_daily_price || property.airbnb_monthly_price) && (
          <div className="flex flex-col items-end gap-1 mt-2 pt-2 border-t border-slate-200 w-full animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5A5F] uppercase tracking-wider">
              <FaAirbnb className="w-4 h-4 text-[#FF5A5F]" />
              <span>{t("property.badges.allow_airbnb") || "รองรับ Airbnb"}</span>
            </div>
            {property.airbnb_daily_price && (
              <div className="text-2xl font-bold text-[#FF5A5F] flex items-baseline gap-1">
                {formatPrice(property.airbnb_daily_price)}
                <span className="text-xs font-normal text-slate-500">
                  {t("common.per_day_short") || "/วัน"}
                </span>
              </div>
            )}
            {property.airbnb_monthly_price && property.airbnb_monthly_price !== property.rental_price && (
              <div className="text-sm text-slate-600 flex items-baseline gap-1 mt-0.5">
                <span className="text-slate-400">{t("common.rent") || "รายเดือน"}:</span>
                <span className="font-semibold text-slate-800">
                  {formatPrice(property.airbnb_monthly_price)}
                </span>
                <span className="text-slate-500">
                  {t("common.per_month_short") || "/ด."}
                </span>
              </div>
            )}
            {property.airbnb_min_contract && (() => {
              const parsed = parseAirbnbMinContract(property.airbnb_min_contract);
              if (!parsed.number) {
                return (
                  <div className="text-sm text-slate-600 flex items-baseline gap-1 mt-1">
                    <span className="text-slate-500">{t("property.min_contract") || "สัญญาขั้นต่ำ"}:</span>
                    <span className="font-semibold text-[#FF5A5F]">
                      {property.airbnb_min_contract}
                    </span>
                  </div>
                );
              }
              
              let unitLabel = parsed.unit;
              if (language === "th") {
                unitLabel = parsed.unit === "day" ? "วัน" : parsed.unit === "week" ? "สัปดาห์" : "เดือน";
              } else if (language === "cn") {
                unitLabel = parsed.unit === "day" ? "天" : parsed.unit === "week" ? "周" : "个月";
              } else if (language === "ru") {
                unitLabel = parsed.unit === "day" ? "день" : parsed.unit === "week" ? "неделя" : "месяц";
              } else {
                unitLabel = parsed.number === "1" ? parsed.unit : `${parsed.unit}s`;
              }

              return (
                <div className="text-sm text-slate-600 flex items-baseline gap-1 mt-1">
                  <span className="text-slate-500">{t("property.min_contract") || "สัญญาขั้นต่ำ"}:</span>
                  <span className="font-semibold text-[#FF5A5F]">
                    {parsed.number} {unitLabel}
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
