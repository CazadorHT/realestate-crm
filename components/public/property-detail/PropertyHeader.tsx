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
  parseAirbnbMinContract,
} from "@/lib/property-utils";
import {
  useLanguage,
  dictionaries,
  type Language,
} from "@/components/providers/LanguageProvider";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { useAddressLocalization } from "@/hooks/useAddressLocalization";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { FaAirbnb } from "react-icons/fa6";

interface PropertyHeaderProps {
  property: {
    id: string;
    title: { th?: string; en?: string; cn?: string; ru?: string } | string;
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
    province?:
      | { th?: string; en?: string; cn?: string; ru?: string }
      | string
      | null;
    district?:
      | { th?: string; en?: string; cn?: string; ru?: string }
      | string
      | null;
    subdistrict?:
      | { th?: string; en?: string; cn?: string; ru?: string }
      | string
      | null;
    popular_area?:
      | { th?: string; en?: string; cn?: string; ru?: string }
      | string
      | null;
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
    has_private_pool?: boolean | null;
    near_transit?: boolean | null;
    has_river_view?: boolean | null;
    has_unblocked_view?: boolean | null;
    allow_smoking?: boolean | null;
    allow_airbnb?: boolean | null;
    airbnb_daily_price?: number | null;
    airbnb_monthly_price?: number | null;
    airbnb_min_contract?: string | null;
    is_high_ceiling?: boolean | null;
    is_column_free?: boolean | null;
    is_exclusive?: boolean | null;
    is_grade_a?: boolean | null;
    is_grade_b?: boolean | null;
    is_grade_c?: boolean | null;
    has_raised_floor?: boolean | null;
    is_central_air?: boolean | null;
    is_split_air?: boolean | null;
    has_247_access?: boolean | null;
    has_fiber_optic?: boolean | null;
    has_multi_parking?: boolean | null;
    facing_east?: boolean | null;
    facing_north?: boolean | null;
    facing_south?: boolean | null;
    facing_west?: boolean | null;
    is_hot_deal?: boolean | null;
    verified?: boolean | null;
    is_cbd?: boolean | null;
    meta_keywords?: string[] | string | null;
    is_never_lived_in?: boolean | null;
    is_smart_home?: boolean | null;
    has_private_elevator?: boolean | null;
    is_high_floor?: boolean | null;
    is_handicapped_friendly?: boolean | null;
    bedrooms?: number | null;
    is_green_building?: boolean | null;
    has_flexible_lease?: boolean | null;
    is_fully_fitted?: boolean | null;
    created_at?: string | null;
  };
  features?: Array<{
    id: string;
    name: string;
    name_en?: string | null;
    name_cn?: string | null;
    name_ru?: string | null;
    icon_key: string;
    category?: string | null;
  }>;
  className?: string;
  hideBreadcrumbs?: boolean;
  language?: Language;
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
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function with explicit string return to prevent unknown propagation
  const t = (key: string, params?: Record<string, string | number>): string => {
    if (!customLanguage) return globalT(key, params);
    const dict = dictionaries[language as keyof typeof dictionaries] as Record<
      string,
      unknown
    >;

    // Safely traverse the dictionary object
    const value = key.split(".").reduce((prev: unknown, curr) => {
      if (
        prev &&
        typeof prev === "object" &&
        curr in (prev as Record<string, unknown>)
      ) {
        return (prev as Record<string, unknown>)[curr];
      }
      return undefined;
    }, dict);

    let result = typeof value === "string" ? value : key;

    if (params && typeof result === "string") {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
    }
    return result;
  };

  const provinceStr = getLocaleValue(property, "province", language);
  const districtStr = getLocaleValue(property, "district", language);
  const subdistrictStr = getLocaleValue(property, "subdistrict", language);

  const { localized, loading: locationLoading } = useAddressLocalization(
    provinceStr,
    districtStr,
    subdistrictStr,
    language,
  );

  const displayProvince =
    getProvinceName(provinceStr || "", language) || localized.province;
  const displayDistrict = localized.district || districtStr;
  const displaySubdistrict = localized.subdistrict || subdistrictStr;

  const locationParts =
    incomingLocationParts ||
    [
      getLocaleValue(property, "popular_area", language),
      displaySubdistrict, // Use localized or fallback
      displayDistrict, // Use localized or fallback
      displayProvince, // Use localized or fallback
    ]
      .filter(Boolean)
      .join(", ");

  const unitSpecialFeatures = [
    property.is_hot_deal && {
      name: t("property.badges.hot_deal"),
      icon: "flame",
    },
    property.verified && {
      name: t("property.badges.verified"),
      icon: "check-circle",
    },
    property.is_exclusive && {
      name: t("property.badges.exclusive"),
      icon: "shield-check",
    },
    property.is_cbd && { name: t("property.badges.cbd"), icon: "navigation" },
    (property.near_transit ||
      (typeof property.meta_keywords === "string"
        ? property.meta_keywords.includes("ทำเลดี เดินทางสะดวก")
        : Array.isArray(property.meta_keywords) &&
          property.meta_keywords.includes("ทำเลดี เดินทางสะดวก"))) && {
      name: t("property.badges.good_location"),
      icon: "map-pin",
    },
    (!property.is_bare_shell ||
      (typeof property.meta_keywords === "string"
        ? property.meta_keywords.includes("พร้อมเข้าอยู่")
        : Array.isArray(property.meta_keywords) &&
          property.meta_keywords.includes("พร้อมเข้าอยู่"))) && {
      name: t("property.badges.ready_to_move"),
      icon: "check-circle-2",
    },
    property.is_never_lived_in && {
      name: t("property.badges.new_listing"),
      icon: "zap",
    },
    property.is_smart_home && {
      name: t("property.badges.smart_home"),
      icon: "cpu",
    },
    property.is_high_ceiling && {
      name: t("property.badges.high_ceiling"),
      icon: "move-up",
    },
    property.has_private_elevator && {
      name: t("property.badges.private_elevator"),
      icon: "arrow-up-circle",
    },
    property.is_high_floor && {
      name: t("property.badges.high_floor"),
      icon: "building-2",
    },
    property.is_pet_friendly && {
      name: t("property.badges.pet_friendly"),
      icon: "paw-print",
    },
    property.is_handicapped_friendly && {
      name: t("property.badges.accessible"),
      icon: "accessibility",
    },
    ((property.bedrooms || 0) >= 2 ||
      (typeof property.meta_keywords === "string"
        ? property.meta_keywords.includes("เหมาะสำหรับครอบครัว")
        : Array.isArray(property.meta_keywords) &&
          property.meta_keywords.includes("เหมาะสำหรับครอบครัว"))) && {
      name: t("property.badges.family_friendly"),
      icon: "users",
    },
    property.is_foreigner_quota && {
      name: t("property.badges.foreigner_quota"),
      icon: "globe",
    },
    property.is_renovated && {
      name: t("property.badges.renovated"),
      icon: "sparkles",
    },
    property.is_corner_unit && {
      name: t("property.badges.corner_unit"),
      icon: "layout-dashboard",
    },
    property.is_fully_furnished && {
      name: t("property.badges.fully_furnished"),
      icon: "package-check",
    },
    property.has_private_pool && {
      name: t("property.badges.private_pool"),
      icon: "waves",
    },
    property.is_selling_with_tenant && {
      name: t("property.badges.investment_ready"),
      icon: "star",
    },
    property.has_river_view && {
      name: t("property.badges.river_view"),
      icon: "sunset",
    },
    property.has_city_view && {
      name: t("property.badges.city_view"),
      icon: "building-2",
    },
    property.has_garden_view && {
      name: t("property.badges.garden_view"),
      icon: "leaf",
    },
    property.has_unblocked_view && {
      name: t("property.badges.unblocked_view"),
      icon: "eye",
    },
    property.allow_smoking && {
      name: t("property.badges.allow_smoking"),
      icon: "cigarette",
    },
    property.allow_airbnb && {
      name: t("property.badges.allow_airbnb"),
      icon: "airbnb",
    },
    property.is_column_free && {
      name: t("property.badges.column_free"),
      icon: "maximize",
    },
    property.is_bare_shell && {
      name: t("property.badges.bare_shell"),
      icon: "box",
    },
    property.is_grade_a && { name: t("property.badges.grade_a"), icon: "star" },
    property.is_tax_registered && {
      name: t("property.badges.tax_registered"),
      icon: "shield-check",
    },
    property.has_pool_view && {
      name: t("property.badges.pool_view"),
      icon: "waves",
    },
    property.facing_east && {
      name: t("property.badges.facing_east"),
      icon: "compass",
    },
    property.facing_north && {
      name: t("property.badges.facing_north"),
      icon: "compass",
    },
    property.facing_south && {
      name: t("property.badges.facing_south"),
      icon: "wind",
    },
    property.facing_west && {
      name: t("property.badges.facing_west"),
      icon: "sunset",
    },
    property.is_grade_b && {
      name: t("property.badges.grade_b"),
      icon: "medal",
    },
    property.is_grade_c && {
      name: t("property.badges.grade_c"),
      icon: "medal",
    },
    property.has_raised_floor && {
      name: t("property.badges.raised_floor"),
      icon: "layers",
    },
    property.is_central_air && {
      name: t("property.badges.central_air"),
      icon: "wind",
    },
    property.is_split_air && {
      name: t("property.badges.split_air"),
      icon: "wind",
    },
    property.has_247_access && {
      name: t("property.badges.access_247"),
      icon: "check-circle-2",
    },
    property.has_fiber_optic && {
      name: t("property.badges.fiber_optic"),
      icon: "wifi",
    },
    property.has_multi_parking && {
      name: t("property.badges.multi_parking"),
      icon: "check-circle-2",
    },
    property.is_green_building && {
      name: t("property.badges.green_building"),
      icon: "leaf",
    },
    property.has_flexible_lease && {
      name: t("property.badges.flexible_lease"),
      icon: "calendar-range",
    },
    property.is_fully_fitted && {
      name: t("property.badges.fully_fitted"),
      icon: "layout",
    },
  ].filter((f): f is { name: string; icon: string } => !!f);

  const finalKeySellingPoints = incomingKeySellingPoints || unitSpecialFeatures;

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

  return (
    <div className={cn("pt-20 lg:pt-24 bg-white relative", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 xs:px-6 sm:px-10 md:px-10 lg:px-12 xl:px-14 2xl:px-8">
        <div>
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
                            label: displayProvince || provinceStr || "...",
                            href: `/properties?province=${provinceStr}`,
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
                      label:
                        localizedTitle?.length && localizedTitle.length > 40
                          ? `${localizedTitle.slice(0, 40)}...`
                          : localizedTitle,
                      className:
                        "text-slate-600 font-medium pointer-events-none",
                    },
                  ]}
                />
              </div>
            )}

            <div className="flex flex-col  lg:items-start  gap-4 lg:gap-0">
              {/* Property Type */}
              <div className="flex lg:flex-row flex-col gap-4 w-full justify-between lg:items-end items-start">
                <div className="space-y-3 grow min-w-0 w-full xl:max-w-[1000px] ">
                  <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar flex-nowrap py-1">
                    <Badge
                      className={`rounded-full px-4 md:px-8 py-1.5 md:py-2 text-[11px] md:text-sm font-bold shadow-sm whitespace-nowrap overflow-hidden transition-all ${
                        property.listing_type === "SALE"
                          ? "bg-emerald-600 text-white"
                          : property.listing_type === "RENT"
                            ? "bg-linear-to-r from-sky-500 to-blue-600 text-white"
                            : "bg-linear-to-r from-emerald-500 via-teal-500 to-blue-600 text-white" // ไล่สี เขียว -> ฟ้า -> น้ำเงิน สำหรับ SALE & RENT
                      }`}
                    >
                      {property.listing_type === "SALE"
                        ? t("common.for_sale")
                        : property.listing_type === "RENT"
                          ? t("common.for_rent")
                          : t("common.for_sale_rent")}{" "}
                      {/* อย่าลืมเพิ่มคีย์แปลภาษาในไฟล์ i18n เช่น "ขาย/เช่า" */}
                    </Badge>

                    {property.property_type && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 md:px-4 py-1.5 md:py-2 text-white text-[11px] md:text-sm font-bold border-transparent shadow-sm whitespace-nowrap",
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
                        className="rounded-full px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-bold border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm whitespace-nowrap"
                      >
                        ✨ {t("property.specs.fully_furnished")}
                      </Badge>
                    )}

                    {property.is_bare_shell && (
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-bold border-amber-200 bg-amber-50 text-amber-700 shadow-sm whitespace-nowrap"
                      >
                        🏗️ {t("property.specs.bare_shell")}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight line-clamp-2">
                    {localizedTitle}
                  </h1>

                  <div className="flex items-center text-slate-600 gap-4 font-normal text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="line-clamp-1">
                        {locationParts || t("common.no_location")}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(property.id);
                        toast.success(t("common.id_copied") || "ID Copied");
                        try {
                          pushToDataLayer(GTM_EVENTS.COPY_PROPERTY_ID, {
                            platform: "copy_ref_id",
                            item_id: property.id,
                            item_name: localizedTitle,
                          });
                          updateAIScore(10);
                        } catch (e) {}
                      }}
                      className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors group/copy cursor-pointer"
                      title="Copy Property ID"
                    >
                      <Copy className="w-3.5 h-3.5 group-hover/copy:scale-110 transition-transform" />
                      <span className="text-xs font-mono lowercase">
                        ref: {property.id.slice(0, 8)}
                      </span>
                    </button>
                  </div>
                  <KeySellingPoints
                    points={finalKeySellingPoints}
                    listingType={property.listing_type || "SALE"}
                    language={language}
                    propertyType={property.property_type}
                  />
                </div>
                {/* Price */}
                <div className="bg-slate-50/50 border border-slate-200  rounded-xl px-4 py-4 lg:mt-4 items-end  lg:items-end lg:w-[350px] w-full">
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
                              {property.min_contract_months && (
                                <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 justify-end">
                                  <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                                  <span>
                                    {t("property.min_contract")}{" "}
                                    <strong className="text-slate-900">
                                      {property.min_contract_months} {t("common.month")}
                                      {property.min_contract_months >= 12 &&
                                        property.min_contract_months % 12 === 0 && (
                                          <span className="text-slate-500 font-normal">
                                            {" "}{t("common.or")}{" "}
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
                            {property.min_contract_months && (
                              <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 justify-end">
                                <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                                <span>
                                  {t("property.min_contract")}{" "}
                                  <strong className="text-slate-900">
                                    {property.min_contract_months} {t("common.month")}
                                    {property.min_contract_months >= 12 &&
                                      property.min_contract_months % 12 === 0 && (
                                        <span className="text-slate-500 font-normal">
                                          {" "}{t("common.or")}{" "}
                                          {property.min_contract_months / 12}{" "}
                                          {t("common.year")}
                                        </span>
                                      )}
                                  </strong>
                                </span>
                              </div>
                            )}
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
              </div>
              {/* Key Selling Points */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
