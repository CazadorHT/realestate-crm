"use client";

import { Clock } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { PRICE_FORMATTER, getOfficePrice } from "@/lib/property-utils";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PropertyCardFooter({
  property,
  variant = "default",
}: {
  property: PropertyCardProps;
  variant?: "default" | "minimal";
}) {
  const { t, language } = useLanguage();
  const dateLocale = language === "th" ? th : enUS;

  if (variant === "minimal") {
    return (
      <div className="px-3 sm:px-4 py-3 border-t border-slate-100 bg-white flex flex-col gap-3">
        {/* Price Section */}
        <div className="flex items-start justify-between">
          {/* Sale Column */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
              {t("common.sale")}
            </span>
            <div className="text-base sm:text-lg font-extrabold text-[#1B263B]">
              {property.price || property.original_price
                ? PRICE_FORMATTER.format(
                    property.price || property.original_price!,
                  )
                : t("common.contact_for_price")}
            </div>
          </div>

          {/* Rent Column */}
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
              {t("common.rent")}
            </span>
            <div className="text-base sm:text-lg font-extrabold text-[#1B263B]">
              {property.rental_price || property.original_rental_price ? (
                <>
                  {PRICE_FORMATTER.format(
                    property.rental_price || property.original_rental_price!,
                  )}
                  <span className="text-[10px] text-slate-400 font-medium ml-0.5">
                    /{t("common.per_month")}
                  </span>
                </>
              ) : (
                t("common.contact_for_price")
              )}
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          {/* Contract */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>
              {t("common.contract")} {property.min_contract_months || 12}{" "}
              {t("common.months_short")}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Clock className="w-3 h-3" />
            <span>
              {property.updated_at
                ? format(new Date(property.updated_at), "d MMM yyyy", {
                    locale: dateLocale,
                  })
                : "-"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-auto sm:h-auto md:h-28 px-3 sm:px-3.5 md:px-4 py-2 sm:py-2.5 md:py-3 border-t border-slate-200 bg-white/60 flex flex-col justify-between gap-1 sm:gap-1.5 md:gap-2">
      <div className="min-w-0">
        {property.listing_type === "SALE_AND_RENT" ? (
          <div className="flex items-center divide-x divide-slate-200">
            {/* SALE PRICE BLOCK */}
            <div className="flex flex-col pr-3">
              <span className="text-[10px] sm:text-[11px] md:text-xs font-bold uppercase tracking-tight mb-0.5">
                {t("common.sale")}
              </span>
              {property.original_price &&
              property.price &&
              property.original_price > property.price ? (
                <div className="flex flex-wrap items-baseline">
                  {/* Discount Label */}
                  <div className="order-2 flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 line-through decoration-slate-400/50">
                      {PRICE_FORMATTER.format(property.original_price)}
                    </span>
                    <span className="text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 px-1 rounded-sm">
                      -
                      {Math.round(
                        ((property.original_price - property.price) /
                          property.original_price) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  {/* Current Price */}
                  <div className="order-1 text-base sm:text-lg md:text-xl font-bold text-rose-600">
                    {PRICE_FORMATTER.format(property.price)}
                  </div>
                </div>
              ) : (
                <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
                  {property.price || property.original_price
                    ? PRICE_FORMATTER.format(
                        property.price || property.original_price!,
                      )
                    : t("common.contact_for_price")}
                </div>
              )}
            </div>

            {/* RENT PRICE BLOCK */}
            <div className="flex flex-col pl-2 md:pl-3">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight mb-0.5">
                {t("common.rent")}
              </span>
              {property.original_rental_price &&
              property.rental_price &&
              property.original_rental_price > property.rental_price ? (
                <div className="flex flex-wrap items-baseline">
                  {/* Discount Label */}
                  <div className="order-2 flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 line-through decoration-slate-400/50">
                      {PRICE_FORMATTER.format(property.original_rental_price)}
                    </span>
                    <span className="text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-1 rounded-sm">
                      -
                      {Math.round(
                        ((property.original_rental_price -
                          property.rental_price) /
                          property.original_rental_price) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  {/* Current Price */}
                  <div className="order-1 text-base md:text-xl font-bold text-rose-600">
                    {PRICE_FORMATTER.format(property.rental_price)}
                    <span className="text-[10px] md:text-xs text-slate-500 font-normal ml-0.5">
                      /{t("common.per_month")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-base md:text-xl font-bold text-slate-900">
                  {property.rental_price || property.original_rental_price
                    ? PRICE_FORMATTER.format(
                        property.rental_price ||
                          property.original_rental_price!,
                      )
                    : t("common.contact_for_price")}
                  <span className="text-[10px] md:text-xs text-slate-400 font-normal ml-0.5">
                    /{t("common.per_month")}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-[10px] md:text-xs text-stone-400 uppercase tracking-tight">
              {property.listing_type === "RENT"
                ? t("common.rent_price")
                : t("common.sale_price")}
            </div>
            <div className="text-base md:text-xl font-bold text-[#1B263B] truncate flex items-baseline gap-1 md:gap-2">
              {/* SALE or RENT Discount Logic */}
              {(property.listing_type === "SALE"
                ? property.original_price
                : property.original_rental_price) &&
              (property.price || property.rental_price) &&
              (property.listing_type === "SALE"
                ? property.original_price!
                : property.original_rental_price!) >
                (property.listing_type === "SALE"
                  ? property.price!
                  : property.rental_price!) &&
              (property.listing_type === "SALE" ||
                property.listing_type === "RENT") ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold line-through decoration-slate-400/70">
                      {PRICE_FORMATTER.format(
                        property.listing_type === "SALE"
                          ? property.original_price!
                          : property.original_rental_price!,
                      )}
                    </span>
                    <span className="text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">
                      -
                      {Math.round(
                        (((property.listing_type === "SALE"
                          ? property.original_price!
                          : property.original_rental_price!) -
                          (property.listing_type === "SALE"
                            ? property.price!
                            : property.rental_price!)) /
                          (property.listing_type === "SALE"
                            ? property.original_price!
                            : property.original_rental_price!)) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base md:text-xl font-bold text-rose-600">
                      {getDisplayPrice(property, t)}
                    </span>
                    {property.listing_type === "RENT" && (
                      <span className="text-[10px] md:text-xs text-slate-500 font-normal">
                        /{t("common.per_month")}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {getDisplayPrice(property, t)}
                  {property.listing_type === "RENT" && (
                    <span className="text-[10px] md:text-xs text-slate-500 font-normal">
                      /{t("common.per_month")}
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
            <div className="flex items-center gap-1 text-[9px] md:text-[11px] text-slate-400 font-medium italic">
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              {t("common.contract")} {property.min_contract_months}{" "}
              {t("common.months_short")}
            </div>
          )}

        {/* Update Date (Right) */}
        <div className="text-[10px] md:text-[11px] text-stone-400 italic flex ml-auto">
          {property.updated_at ? (
            <>
              <Clock className="h-3 w-3 mr-1" />
              <span className="text-slate-400 font-normal">
                {format(new Date(property.updated_at), "d MMM yyyy", {
                  locale: dateLocale,
                })}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helpers
function getDisplayPrice(
  property: PropertyCardProps,
  t: (key: string) => string,
) {
  // Office price override
  const officePrice = getOfficePrice(property as any);

  const salePrice =
    property.price ??
    (officePrice?.isCalculated &&
    officePrice.sqmPrice === property.price_per_sqm
      ? officePrice.totalPrice
      : undefined);
  const rentPrice =
    property.rental_price ??
    (officePrice?.isCalculated &&
    officePrice.sqmPrice === property.rent_price_per_sqm
      ? officePrice.totalPrice
      : undefined);

  let value: number | undefined;
  let isRent = false;

  if (property.listing_type === "SALE") {
    value = salePrice ?? property.original_price ?? undefined;
  } else if (property.listing_type === "RENT") {
    value = rentPrice ?? property.original_rental_price ?? undefined;
    isRent = true;
  } else {
    value =
      salePrice ??
      rentPrice ??
      property.original_price ??
      property.original_rental_price ??
      undefined;

    const hasSale = !!(salePrice ?? property.original_price);
    const hasRent = !!(rentPrice ?? property.original_rental_price);

    if (!hasSale && hasRent) {
      isRent = true;
    }
  }

  if (!value) return t("common.contact_for_price");
  const formatted = PRICE_FORMATTER.format(value);
  return isRent ? `${formatted}` : formatted;
}
