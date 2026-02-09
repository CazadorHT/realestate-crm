"use client";

import Link from "next/link";
import { ArrowLeft, BadgeHelp, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  KeySellingPoints,
  KeySellingPoint,
} from "@/components/public/KeySellingPoints";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { cn } from "@/lib/utils";
import {
  PROPERTY_TYPE_TH,
  getOfficePrice,
  getTypeColor,
} from "@/lib/property-utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { useAddressLocalization } from "@/hooks/useAddressLocalization";

interface PropertyHeaderProps {
  property: {
    id: string;
    title: string;
    listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    rent_price_per_sqm?: number | null;
    price_per_sqm?: number | null;
    size_sqm?: number | null;
    min_contract_months: number | null;
    slug?: string | null;
    property_type?: string | null;
    province?: string | null;
    district?: string | null;
    subdistrict?: string | null;
    popular_area?: string | null;
    is_fully_furnished?: boolean | null;
    is_bare_shell?: boolean | null;
    floor?: number | null;
    is_pet_friendly?: boolean | null;
    is_corner_unit?: boolean | null;
    is_renovated?: boolean | null;
    has_city_view?: boolean | null;
    has_pool_view?: boolean | null;
    has_garden_view?: boolean | null;
    is_selling_with_tenant?: boolean | null;
    is_foreigner_quota?: boolean | null;
    is_tax_registered?: boolean | null;
    // Localized fields
    title_en?: string | null;
    title_cn?: string | null;
    province_en?: string | null;
    province_cn?: string | null;
    popular_area_en?: string | null;
    popular_area_cn?: string | null;
    district_en?: string | null;
    district_cn?: string | null;
    subdistrict_en?: string | null;
    subdistrict_cn?: string | null;
  };
  features?: Array<{
    id: string;
    name: string;
    name_en?: string | null;
    name_cn?: string | null;
    icon_key: string;
    category?: string | null;
  }>;
  className?: string;
  hideBreadcrumbs?: boolean;
  language?: "th" | "en" | "cn";
  locationParts?: string;
  keySellingPoints?: Array<{ name: string; icon: string }>;
}

export function PropertyHeader({
  property,
  features = [],
  className,
  locationParts: incomingLocationParts,
  hideBreadcrumbs = false,
  language: customLanguage,
  keySellingPoints: incomingKeySellingPoints,
}: PropertyHeaderProps) {
  const { language: globalLanguage, t } = useLanguage();
  const language = customLanguage || globalLanguage;

  const { localized, loading: locationLoading } = useAddressLocalization(
    property.province,
    property.district,
    property.subdistrict,
  );

  const displayProvince =
    getProvinceName(property.province || "", language) || localized.province;
  const displayDistrict = localized.district || property.district;
  const displaySubdistrict = localized.subdistrict || property.subdistrict;

  const locationParts = incomingLocationParts || [
    getLocaleValue(property, "popular_area", language),
    displaySubdistrict, // Use localized or fallback
    displayDistrict, // Use localized or fallback
    displayProvince, // Use localized or fallback
  ]
    .filter(Boolean)
    .join(", ");
  
  const unitSpecialFeatures = [
    property.is_pet_friendly && {
      name: t("property.badges.pet_friendly"),
      icon: "dog",
    },
    property.is_corner_unit && {
      name: t("property.badges.corner_unit"),
      icon: "layout",
    },
    property.is_renovated && {
      name: t("property.badges.renovated"),
      icon: "sparkles",
    },
    property.is_fully_furnished && {
      name: t("property.specs.fully_furnished"),
      icon: "armchair",
    },
    (property.floor || 0) > 15 && {
      name: `${t("property.badges.high_floor")} (${t("property.specs.floor")} ${property.floor})`,
      icon: "building-2",
    },
    property.has_city_view && {
      name: t("property.badges.city_view"),
      icon: "building-2",
    },
    property.has_pool_view && {
      name: t("property.badges.pool_view"),
      icon: "waves",
    },
    property.has_garden_view && {
      name: t("property.badges.garden_view"),
      icon: "trees",
    },
    property.is_selling_with_tenant && {
      name: t("property.badges.selling_with_tenant"),
      icon: "users-2",
    },
    property.is_foreigner_quota && {
      name: t("property.badges.foreigner_quota"),
      icon: "globe",
    },
    property.is_tax_registered && {
      name: t("property.badges.tax_registered"),
      icon: "file-check",
    },
  ].filter((f): f is { name: string; icon: string } => !!f);

  const finalKeySellingPoints = incomingKeySellingPoints || [
    ...unitSpecialFeatures,
    ...features
      .filter((f) => f.category === "คุณสมบัติพิเศษ")
      .map((f) => ({
        name: getLocaleValue(f, "name", language),
        icon: f.icon_key,
      })),
    ...features
      .filter((f) => f.category !== "คุณสมบัติพิเศษ")
      .map((f) => ({
        name: getLocaleValue(f, "name", language),
        icon: f.icon_key,
      })),
  ]
    .filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i)
    .slice(0, 6);

  // Office price override
  const officePrice = getOfficePrice(property);
  const typeColor = getTypeColor(property.property_type ?? null);

  const localizedTitle = getLocaleValue(property, "title", language);

  const formatPrice = (val: number | null) =>
    val
      ? new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(val)
      : "-";

  const renderPriceBlock = (
    price: number | null,
    originalPrice: number | null,
    label: string,
    isRent: boolean,
  ) => {
    // If office and we calculated a price, use it
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
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-sm text-slate-500 font-medium">{label}</span>
          )}
          <span className="text-xl md:text-2xl font-bold text-blue-600">
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">
              -{discountPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {label && (
              <span className="text-sm text-slate-500 font-medium">
                {label}
              </span>
            )}
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
      <div className="flex flex-col md:items-end gap-0.5">
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-sm text-slate-500 font-medium">{label}</span>
          )}
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

  return (
    <div
      className={cn(
        "pt-20 md:pt-24 px-5 md:px-6 lg:px-8 bg-white relative",
        className,
      )}
    >
      <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-8  mx-auto">
        <div className="flex flex-col gap-3 md:gap-4">
          {!hideBreadcrumbs && (
            <div className="mb-2">
              <AppBreadcrumbs
                items={[
                  { label: t("nav.home"), href: "/" },
                  { label: t("nav.properties"), href: "/properties" },
                  ...(property.property_type
                    ? [
                        {
                          label: t(
                            `property_types.${property.property_type.toLowerCase()}`,
                          ),
                          href: `/properties?property_type=${property.property_type}`,
                        },
                      ]
                    : []),
                  ...(property.province
                    ? [
                        {
                          label: displayProvince || property.province,
                          href: `/properties?province=${property.province}`,
                        },
                      ]
                    : []),
                  ...(displayDistrict // Link to district if available
                    ? [
                        {
                          label: displayDistrict,
                          href: `/properties?province=${property.province}&district=${property.district}`,
                        },
                      ]
                    : []),
                  ...(property.popular_area
                    ? [
                        {
                          label: getLocaleValue(
                            property,
                            "popular_area",
                            language,
                          ),
                          href: `/properties?popular_area=${property.popular_area}`,
                        },
                      ]
                    : []),
                  {
                    label: localizedTitle,
                    className:
                      "max-w-[150px] sm:max-w-[250px] md:max-w-[400px] truncate block",
                  },
                ]}
              />
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 grow min-w-0 max-w-[950px] ">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`rounded-full px-8 py-2 text-md font-medium  ${
                    property.listing_type === "SALE"
                      ? "bg-emerald-600 text-white"
                      : "bg-linear-to-r from-sky-500 to-blue-600 text-white"
                  }`}
                >
                  {property.listing_type === "SALE"
                    ? t("common.for_sale")
                    : t("common.for_rent")}
                </Badge>

                {property.property_type && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-4 py-2 text-white text-md font-medium border-transparent shadow-sm",
                      typeColor.bg,
                      typeColor.text,
                    )}
                  >
                    {t(
                      `property_types.${property.property_type.toLowerCase()}`,
                    )}
                  </Badge>
                )}

                {property.is_fully_furnished && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-2 text-md font-medium border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                  >
                    ✨ {t("property.specs.fully_furnished")}
                  </Badge>
                )}

                {property.is_bare_shell && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-2 text-md font-medium border-amber-200 bg-amber-50 text-amber-700 shadow-sm"
                  >
                    🏗️ {t("property.specs.bare_shell")}
                  </Badge>
                )}
              </div>

              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight line-clamp-2">
                {localizedTitle}
              </h2>

              <div className="flex items-center text-slate-600 gap-2 font-normal text-sm">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="line-clamp-1">
                  {locationParts || t("common.no_location")}
                </span>
              </div>

              <KeySellingPoints
                points={finalKeySellingPoints}
                listingType={property.listing_type || "SALE"}
              />
            </div>

            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 md:p-6">
              <div className="flex flex-col md:items-end gap-2">
                {(() => {
                  if (property.listing_type === "SALE_AND_RENT") {
                    return (
                      <>
                        {renderPriceBlock(
                          property.price,
                          property.original_price,
                          t("common.for_sale"),
                          false,
                        )}
                        {renderPriceBlock(
                          property.rental_price,
                          property.original_rental_price,
                          t("common.for_rent"),
                          true,
                        )}
                      </>
                    );
                  }

                  if (property.listing_type === "RENT") {
                    return renderPriceBlock(
                      property.rental_price,
                      property.original_rental_price,
                      t("common.for_rent"),
                      true,
                    );
                  }

                  return renderPriceBlock(
                    property.price,
                    property.original_price,
                    t("common.for_sale"),
                    false,
                  );
                })()}

                {(property.listing_type === "RENT" ||
                  property.listing_type === "SALE_AND_RENT") &&
                  property.min_contract_months && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-600">
                        {t("property.min_contract")}{" "}
                        <strong className="text-slate-900">
                          {property.min_contract_months} {t("common.month")}
                          {property.min_contract_months >= 12 &&
                            property.min_contract_months % 12 === 0 && (
                              <span className="text-slate-500 font-normal">
                                {" "}
                                {t("common.or")}{" "}
                                {property.min_contract_months / 12}{" "}
                                {t("common.year")}
                              </span>
                            )}
                        </strong>
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
