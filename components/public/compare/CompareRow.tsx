"use client";

import { ShieldCheck, MapPin, Check } from "lucide-react";
import { CompareProperty, ComparisonRow } from "./types";
import { formatMoney, getListingTypeKey, isPetFriendly } from "./utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocalizedField } from "@/lib/i18n";
import { useAddressLocalization } from "@/hooks/useAddressLocalization";
import { getLocaleValue } from "@/lib/utils/locale-utils";

interface CompareRowProps {
  row: ComparisonRow;
  properties: CompareProperty[];
  idx: number;
}

export function CompareRow({ row, properties, idx }: CompareRowProps) {
  const { t, language } = useLanguage();
  const locale =
    language === "th" ? "th-TH" : language === "cn" ? "zh-CN" : "en-US";

  function CompareLocationCell({
    property,
    language,
  }: {
    property: CompareProperty;
    language: any;
  }) {
    const { localized } = useAddressLocalization(
      property.province,
      property.district,
      property.subdistrict,
    );

    const displayProvince =
      getProvinceName(property.province || "", language) || localized.province;
    const displayDistrict = localized.district || property.district;
    const displaySubdistrict = localized.subdistrict || property.subdistrict;

    return (
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2">
          {[
            getLocaleValue(property, "address_line1", language),
            displaySubdistrict,
            displayDistrict,
            displayProvince,
          ]
            .filter(Boolean)
            .join(", ")}
        </span>
      </div>
    );
  }

  // Calculation for max value to highlight Winner
  const isNumericCompare = [
    "property_size",
    "bedrooms",
    "bathrooms",
    "parking_slots",
  ].includes(row.key);

  let maxValue = -1;
  if (isNumericCompare) {
    maxValue = Math.max(
      ...properties.map((p) => {
        if (row.key === "property_size") return p.size_sqm || 0;
        if (row.key === "bedrooms") return p.bedrooms || 0;
        if (row.key === "bathrooms") return p.bathrooms || 0;
        if (row.key === "parking_slots") return p.parking_slots || 0;
        return 0;
      }),
    );
  }

  const renderPriceCell = (p: CompareProperty) => {
    const salePrice = p.price || p.original_price;
    const rentPrice = p.rental_price || p.original_rental_price;

    const showSale = !!salePrice;
    const showRent = !!rentPrice;

    const saleContent =
      showSale && salePrice ? (
        <div className="block mb-1">
          {p.price && p.original_price && p.original_price > p.price && (
            <span className="text-[10px] md:text-xs text-slate-400 line-through mr-1 md:mr-2 block sm:inline">
              {formatMoney(p.original_price, locale)}
            </span>
          )}
          <span className="text-blue-600 font-bold text-sm md:text-base">
            {formatMoney(salePrice, locale)}
          </span>
        </div>
      ) : null;

    const rentContent =
      showRent && rentPrice ? (
        <div className="block">
          {p.rental_price &&
            p.original_rental_price &&
            p.original_rental_price > p.rental_price && (
              <span className="text-[10px] md:text-xs text-slate-400 line-through mr-1 md:mr-2 block sm:inline">
                {formatMoney(p.original_rental_price, locale)}{" "}
                {t("compare_page.values.rent_per_month")}
              </span>
            )}
          <span className="text-orange-600 font-bold text-sm md:text-base">
            {formatMoney(rentPrice, locale)}{" "}
            {t("compare_page.values.rent_per_month")}
          </span>
        </div>
      ) : null;

    if (!saleContent && !rentContent)
      return <span className="text-slate-400">-</span>;

    return (
      <div className="flex flex-col">
        {saleContent}
        {rentContent}
      </div>
    );
  };

  return (
    <div
      className={`grid divide-x divide-slate-100 ${
        idx % 2 === 0 ? "bg-slate-50/50" : "bg-white/50"
      }`}
      style={{
        gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
      }}
    >
      <div className="p-2 md:p-4 text-xs md:text-sm font-semibold text-slate-600 flex items-center gap-1 md:gap-2">
        <row.icon className="h-3 w-3 md:h-4 md:w-4 text-slate-400 shrink-0" />
        <span className="truncate">{t(`compare_page.labels.${row.key}`)}</span>
      </div>
      {properties.map((p) => {
        // Check overlap Winner
        let val = 0;
        if (row.key === "property_size") val = p.size_sqm || 0;
        if (row.key === "bedrooms") val = p.bedrooms || 0;
        if (row.key === "bathrooms") val = p.bathrooms || 0;
        if (row.key === "parking_slots") val = p.parking_slots || 0;

        const isWinner = isNumericCompare && maxValue > 0 && val === maxValue;

        return (
          <div
            key={p.id}
            className={`p-2 md:p-4 text-xs md:text-sm text-slate-700 leading-relaxed transition-colors duration-500 ${
              isWinner ? "bg-green-50/60 font-medium" : ""
            }`}
          >
            {row.key === "price" ? (
              renderPriceCell(p)
            ) : row.key === "verified" ? (
              p.verified ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                  <ShieldCheck className="h-3 w-3" />{" "}
                  {t("compare_page.values.verified")}
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "features" ? (
              p.features && p.features.length > 0 ? (
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {p.features.map((f) => (
                    <div
                      key={f.id}
                      className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-slate-100 rounded text-slate-600 whitespace-nowrap"
                    >
                      {getLocalizedField<string>(f, "name", language)}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "zone" ? (
              getLocalizedField<string>(p, "popular_area", language) ||
              p.district || <span className="text-slate-300">-</span>
            ) : row.key === "google_maps_link" ? (
              p.google_maps_link ? (
                <a
                  href={p.google_maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  <MapPin className="h-3 w-3" />{" "}
                  {t("compare_page.values.open_map")}
                </a>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "property_size" ? (
              p.size_sqm ? (
                <span className={isWinner ? "text-green-700 font-bold" : ""}>
                  {p.size_sqm} {t("compare_page.values.sqm")}
                </span>
              ) : (
                "-"
              )
            ) : row.key === "petFriendly" ? (
              isPetFriendly(p) ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                  <Check className="h-3 w-3" />{" "}
                  {t("compare_page.values.pet_friendly")}
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "listing_type" ? (
              <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-600">
                {(() => {
                  const key = getListingTypeKey(p.listing_type);
                  if (key) return t(key);
                  // Resilient check for Thai leaking from DB
                  if (p.listing_type === "เช่า") return t("common.for_rent");
                  if (p.listing_type === "ขาย") return t("common.for_sale");
                  return p.listing_type || "-";
                })()}
              </span>
            ) : row.key === "updated_at" ? (
              new Date(p.updated_at).toLocaleDateString(locale)
            ) : row.key === "floor" ? (
              p.floor ? (
                `${t("compare_page.values.floor_prefix")} ${p.floor}`
              ) : (
                "-"
              )
            ) : row.key === "parking_slots" ? (
              p.parking_slots ? (
                <span className={isWinner ? "text-green-700 font-bold" : ""}>
                  {p.parking_slots} {t("compare_page.values.parking_unit")}
                </span>
              ) : (
                "-"
              )
            ) : row.key === "bedrooms" || row.key === "bathrooms" ? (
              <span className={isWinner ? "text-green-700 font-bold" : ""}>
                {(p as any)[row.key] || "-"}
              </span>
            ) : row.key === "description" ? (
              <div className="line-clamp-3 text-[10px] md:text-xs">
                {getLocalizedField<string>(p, "description", language) || "-"}
              </div>
            ) : row.key === "property_type" ? (
              p.property_type ? (
                <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-600">
                  {(() => {
                    const pt = p.property_type.toLowerCase();
                    // Basic fallback to handle potential raw or slightly off enums
                    const key = `property_types.${pt}`;
                    const translated = t(key);
                    if (translated !== key) return translated;
                    // Extra fallback if key is missing in dict
                    if (pt === "office_building" || pt === "ออฟฟิศ")
                      return t("property_types.office_building");
                    return p.property_type;
                  })()}
                </span>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "title" ? (
              <span className="font-semibold text-slate-900">
                {getLocalizedField<string>(p, "title", language)}
              </span>
            ) : row.key === "location" ? (
              <CompareLocationCell property={p} language={language} />
            ) : row.key === "province" ? (
              p.province ? (
                getProvinceName(p.province, language)
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "nearby_places" ? (
              p.nearby_places ? (
                <div className="flex flex-col gap-1.5">
                  {(() => {
                    try {
                      const places =
                        typeof p.nearby_places === "string"
                          ? JSON.parse(p.nearby_places)
                          : p.nearby_places;

                      if (Array.isArray(places) && places.length > 0) {
                        return places
                          .slice(0, 5)
                          .map((place: any, i: number) => (
                            <div
                              key={i}
                              className="text-[10px] md:text-xs flex items-center gap-1.5 text-slate-600"
                            >
                              <span className="line-clamp-1">
                                • {getLocalizedField(place, "name", language)}
                              </span>
                            </div>
                          ));
                      }
                      return <span className="text-slate-300">-</span>;
                    } catch (e) {
                      return <span className="text-slate-300">-</span>;
                    }
                  })()}
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "transportation" ? (
              <div className="flex flex-col gap-2">
                {/* Primary Transit */}
                {p.near_transit &&
                (p.transit_station_name ||
                  p.transit_station_name_en ||
                  p.transit_station_name_cn) ? (
                  <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] md:text-xs font-bold border border-indigo-100 uppercase">
                      {p.transit_type}{" "}
                      {getLocalizedField<string>(
                        p,
                        "transit_station_name",
                        language,
                      )}
                    </span>
                    {p.transit_distance_meters && (
                      <span className="text-[10px] md:text-xs text-slate-500 pl-1">
                        {t("compare_page.values.distance_meters", {
                          distance: p.transit_distance_meters,
                        })}
                      </span>
                    )}
                  </div>
                ) : null}

                {/* Other Transits (JSON) */}
                {p.nearby_transits &&
                  (() => {
                    try {
                      const transits =
                        typeof p.nearby_transits === "string"
                          ? JSON.parse(p.nearby_transits)
                          : p.nearby_transits;

                      if (Array.isArray(transits) && transits.length > 0) {
                        return (
                          <div className="flex flex-col gap-1 border-t border-slate-50 pt-1 mt-1">
                            {transits
                              .slice(0, 3)
                              .map((item: any, i: number) => (
                                <div
                                  key={i}
                                  className="text-[10px] text-slate-500"
                                >
                                  •{" "}
                                  {getLocalizedField(
                                    item,
                                    "station_name",
                                    language,
                                  )}{" "}
                                  ({item.distance_meters}m)
                                </div>
                              ))}
                          </div>
                        );
                      }
                    } catch (e) {}
                    return null;
                  })()}

                {!p.near_transit && !p.nearby_transits && (
                  <span className="text-slate-300">-</span>
                )}
              </div>
            ) : (
              (p as any)[row.key] || <span className="text-slate-300">-</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
