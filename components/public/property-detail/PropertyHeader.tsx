"use client";

import Link from "next/link";
import { 
  BadgeHelp, 
  MapPin, 
  Building2, 
  Home, 
  Warehouse, 
  Briefcase, 
  Factory, 
  Store,
  ChevronRight
} from "lucide-react";
import { MdApartment, MdVilla, MdPool, MdLandscape } from "react-icons/md";
import { Badge } from "@/components/ui/badge";
import {
  KeySellingPoints,
} from "@/components/public/KeySellingPoints";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { cn } from "@/lib/utils";

const PROPERTY_TYPE_ICONS: Record<string, any> = {
  house: Home,
  condo: MdApartment,
  townhome: Warehouse,
  land: MdLandscape,
  office: Briefcase,
  office_building: Briefcase,
  warehouse: Factory,
  factory: Factory,
  villa: MdVilla,
  pool_villa: MdPool,
  commercial: Store,
  commercial_building: Store,
};
import {
  getOfficePrice,
  getTypeColor,
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

import { getUnitSpecialFeatures } from "./helpers/badge-helpers";
import { PropertyPricingSection } from "./PropertyPricingSection";

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
    popular_area_slug?: string | null;
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
    project?: {
      id: string;
      slug: string;
      name: any;
    } | null;
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

  const t = (key: string, params?: Record<string, string | number>): string => {
    if (!customLanguage) return globalT(key, params);
    const dict = dictionaries[language as keyof typeof dictionaries] as Record<
      string,
      unknown
    >;

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
      displaySubdistrict,
      displayDistrict,
      displayProvince,
    ]
      .filter(Boolean)
      .join(", ");

  const unitSpecialFeatures = getUnitSpecialFeatures(property, t);
  const finalKeySellingPoints = incomingKeySellingPoints || unitSpecialFeatures;

  const officePrice = getOfficePrice(property);
  const typeColor = getTypeColor(property.property_type ?? null);
  const localizedTitle = getLocaleValue(property, "title", language);

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
                            href: property.popular_area_slug
                              ? `/areas/${property.popular_area_slug}`
                              : `/properties?popular_area=${encodeURIComponent(
                                  typeof property.popular_area === "object"
                                    ? property.popular_area?.th || ""
                                    : property.popular_area || ""
                                )}`,
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

            <div className="flex flex-col lg:items-start gap-4 lg:gap-0">
              <div className="flex lg:flex-row flex-col gap-4 w-full justify-between lg:items-end items-start">
                <div className="space-y-3 grow min-w-0 w-full xl:max-w-[1000px]">
                  <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar flex-nowrap py-1">
                    <Badge
                      className={`rounded-full px-4 md:px-8 py-1.5 md:py-2 text-[11px] md:text-sm font-bold shadow-sm whitespace-nowrap overflow-hidden transition-all ${
                        property.listing_type === "SALE"
                          ? "bg-emerald-600 text-white"
                          : property.listing_type === "RENT"
                            ? "bg-linear-to-r from-sky-500 to-blue-600 text-white"
                            : "bg-linear-to-r from-emerald-500 via-teal-500 to-blue-600 text-white"
                      }`}
                    >
                      {property.listing_type === "SALE"
                        ? t("common.for_sale")
                        : property.listing_type === "RENT"
                          ? t("common.for_rent")
                          : t("common.for_sale_rent")}
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

                  {property.project && (() => {
                    const typeKey = property.property_type?.toLowerCase() || "other";
                    const ProjectIcon = PROPERTY_TYPE_ICONS[typeKey] || Building2;
                    const projectName = getLocaleValue(property.project, "name", language);

                    return (
                      <div className="mb-3">
                        <Link 
                          href={`/projects/${property.project.slug}`}
                          className="group/proj  inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold text-blue-700 bg-linear-to-r from-blue-50 to-indigo-50/70 hover:from-blue-600 hover:to-indigo-600 hover:text-white border border-blue-200/80 hover:border-blue-600 shadow-2xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation"
                          title={`ดูโครงการ ${projectName}`}
                        >
                          <ProjectIcon className="w-4 h-4 text-blue-500 group-hover/proj:text-white shrink-0 transition-colors" />
                          <span className="font-semibold">{projectName}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover/proj:text-white group-hover/proj:translate-x-0.5 shrink-0 transition-transform" />
                        </Link>
                      </div>
                    );
                  })()}

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
                
                <PropertyPricingSection
                  property={property}
                  language={language}
                  t={t}
                  officePrice={officePrice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
