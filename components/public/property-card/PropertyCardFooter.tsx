"use client";
import React from "react";

import { Clock, CheckSquare, Square } from "lucide-react";
// Removed date-fns imports to reduce bundle size. Using native Intl API instead.
import { formatPrice, getOfficePrice } from "@/lib/property-utils";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getEffectivePrice } from "@/lib/property-hardened-utils";

export function PropertyCardFooter({
  property,
  variant = "default",
  isInCompare = false,
  onCompareClick,
}: {
  property: PropertyCardProps;
  variant?: "default" | "minimal";
  isInCompare?: boolean;
  onCompareClick?: (e: React.MouseEvent) => void;
}) {
  const { t, language } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const prices = getEffectivePrice(property);

  if (variant === "minimal") {
    return (
      <div className="px-3 sm:px-4 py-3 border-t border-slate-100 bg-white flex flex-col gap-3 rounded-b-2xl sm:rounded-b-2xl md:rounded-b-3xl">
        {/* Price Section */}
        <div className="flex items-start justify-between">
          {/* Sale Column */}
          {property.listing_type !== "RENT" && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
                {t("common.sale")}
              </span>
              <div className="text-base sm:text-xl font-extrabold text-[#1B263B]">
                {prices.salePrice > 0
                  ? formatPrice(prices.salePrice, language)
                  : t("common.contact_for_price")}
              </div>
            </div>
          )}

          {/* Rent Column */}
          {property.listing_type !== "SALE" && (
            <div className={`flex flex-col ${property.listing_type === "SALE_AND_RENT" ? "text-right" : "text-left"}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
                {t("common.rent")}
              </span>
              <div className="text-base sm:text-xl font-extrabold text-[#1B263B]">
                {prices.rentalPrice > 0 ? (
                  <>
                    {formatPrice(prices.rentalPrice, language)}
                    <span className="text-[10px] text-slate-400 font-medium ml-0.5">
                      {t("common.per_month_short")}
                    </span>
                  </>
                ) : (
                  t("common.contact_for_price")
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          {/* Contract */}
          {(property.listing_type === "RENT" ||
            property.listing_type === "SALE_AND_RENT") &&
            property.min_contract_months && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span>
                  {t("common.contract")} {property.min_contract_months}{" "}
                  {t("common.months_short")}
                </span>
              </div>
            )}

          {/* Date */}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Clock className="w-3 h-3" />
            <span className="min-w-[60px]">
              {mounted && property.updated_at
                ? new Intl.DateTimeFormat(
                    language === "th" ? "th-TH" : 
                    language === "cn" ? "zh-CN" : 
                    language === "ru" ? "ru-RU" : "en-US",
                    { day: "numeric", month: "short", year: "numeric" }
                  ).format(new Date(property.updated_at))
                : "-"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-auto sm:h-auto md:h-28 px-3 sm:px-3.5 md:px-4 py-2 sm:py-2.5 md:py-3 border-t border-slate-200 bg-white/60 flex flex-col justify-between gap-1 sm:gap-1.5 md:gap-2 rounded-b-2xl sm:rounded-b-2xl md:rounded-b-3xl">
      <div className="min-w-0">
        {property.listing_type === "SALE_AND_RENT" ? (
          <div className="flex w-full items-stretch divide-x divide-slate-200">
            {/* SALE PRICE BLOCK */}
            <div className="flex-1 flex flex-col pr-2 md:pr-3 min-w-0">
              <span className="text-[10px] sm:text-[11px] md:text-xs font-bold uppercase tracking-tight mb-0.5">
                {t("common.sale")}
              </span>
              {prices.hasSaleDiscount ? (
                <div className="flex flex-col">
                  <div className="text-base lg:text-md xl:text-xl font-bold text-rose-600">
                    {formatPrice(prices.salePrice, language)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold line-through decoration-slate-500/70">
                      {formatPrice(prices.originalPrice, language)}
                    </span>
                    <span className="text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 px-1 rounded-sm">
                      -{prices.saleDiscountPercent}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-base lg:text-md xl:text-xl font-bold text-slate-900">
                  {prices.salePrice > 0
                    ? formatPrice(prices.salePrice, language)
                    : t("common.contact_for_price")}
                </div>
              )}
            </div>

            {/* RENT PRICE BLOCK */}
            <div className="flex-1 flex flex-col pl-2 md:pl-3 min-w-0">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight mb-0.5">
                {t("common.rent")}
              </span>
              {prices.hasRentalDiscount ? (
                <div className="flex flex-col">
                  <div className="text-base lg:text-md xl:text-xl font-bold text-rose-600">
                    {formatPrice(prices.rentalPrice, language)}
                    <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                      {t("common.per_month_short")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold line-through decoration-slate-500/70">
                      {formatPrice(prices.originalRentalPrice, language)}
                    </span>
                    <span className="text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-1 rounded-sm">
                      -{prices.rentalDiscountPercent}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-baseline">
                  <div className="text-base lg:text-md xl:text-xl font-bold text-slate-900">
                    {prices.rentalPrice > 0
                      ? formatPrice(prices.rentalPrice, language)
                      : t("common.contact_for_price")}
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                      {t("common.per_month_short")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-[10px] md:text-xs text-slate-900 uppercase tracking-tight font-bold">
              {property.listing_type === "RENT"
                ? t("common.rent_price")
                : t("common.sale_price")}
            </div>
            <div className="text-base lg:text-md xl:text-xl font-bold text-[#1B263B] flex flex-wrap items-baseline gap-1 md:gap-2">
              {(property.listing_type === "SALE" && prices.hasSaleDiscount) || 
               (property.listing_type === "RENT" && prices.hasRentalDiscount) ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-extrabold line-through decoration-slate-500/80">
                      {formatPrice(
                        property.listing_type === "SALE" ? prices.originalPrice : prices.originalRentalPrice,
                        language,
                      )}
                    </span>
                    <span className="text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">
                      -{property.listing_type === "SALE" ? prices.saleDiscountPercent : prices.rentalDiscountPercent}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base md:text-xl font-bold text-rose-600">
                      {formatPrice(
                        property.listing_type === "SALE" ? prices.salePrice : prices.rentalPrice,
                        language,
                      )}
                    </span>
                    {property.listing_type === "RENT" && (
                      <span className="text-[10px] md:text-xs text-slate-500 font-normal">
                        {t("common.per_month_short")}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {property.listing_type === "SALE" 
                    ? (prices.salePrice > 0 ? formatPrice(prices.salePrice, language) : t("common.contact_for_price"))
                    : (prices.rentalPrice > 0 ? formatPrice(prices.rentalPrice, language) : t("common.contact_for_price"))
                  }
                  {property.listing_type === "RENT" && (
                    <span className="text-[10px] md:text-xs text-slate-500 font-normal">
                      {t("common.per_month_short")}
                    </span>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        {/* Min Contract Display (Left) */}
        {(property.listing_type === "RENT" ||
          property.listing_type === "SALE_AND_RENT") &&
          property.min_contract_months && (
            <div className="flex items-center gap-1 text-[9px] md:text-[11px] text-slate-400 font-semibold italic">
              <div className="w-1 h-1 rounded-full bg-emerald-300" />
              {t("common.contract")} {property.min_contract_months || 12 }{" "}
              {t("common.months_short")}
            </div>
          )}
          

        {/* Update Date (Right) */}
        <div className="text-[10px] md:text-[11px] text-stone-400 italic flex ml-auto">
          {property.updated_at ? (
            <>
              <Clock className="h-3 w-3 mr-1" />
              <span className="text-slate-400 font-normal min-w-[70px]">
                {mounted
                  ? new Intl.DateTimeFormat(
                      language === "th" ? "th-TH" : 
                      language === "cn" ? "zh-CN" : 
                      language === "ru" ? "ru-RU" : "en-US",
                      { day: "numeric", month: "short", year: "numeric" }
                    ).format(new Date(property.updated_at))
                  : ""}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helpers
