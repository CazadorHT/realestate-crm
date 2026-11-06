"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  MapPin,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Car,
  Compass,
  ArrowUpToLine,
  Sofa,
  Globe2,
  CalendarDays,
  FileCheck2,
  Receipt,
  PawPrint,
} from "lucide-react";
import { FaPersonWalking, FaCarSide, FaAirbnb } from "react-icons/fa6";
import DOMPurify from "isomorphic-dompurify";
import { CompareProperty, ComparisonRow } from "./types";
import {
  formatMoney,
  getListingTypeKey,
  getListingTypeLabel,
  getPropertyTypeLabel,
  isPetFriendly,
} from "./utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocalizedField } from "@/lib/i18n";
import { useAddressLocalization } from "@/hooks/useAddressLocalization";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import {
  TRANSIT_TYPE_LABELS,
  TRANSIT_TYPE_STYLES,
  TransitType,
} from "@/features/properties/labels";
import {
  getTransitLogo,
  computeTransitTravelInfo,
  detectTransitType,
} from "../map/map-price-utils";
import { isWithinThailandBounds } from "@/lib/utils/google-maps-coords";

interface CompareRowProps {
  row: ComparisonRow;
  properties: CompareProperty[];
  idx: number;
}

export function CompareRow({ row, properties, idx }: CompareRowProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const locale =
    language === "th"
      ? "th-TH"
      : language === "cn"
        ? "zh-CN"
        : language === "ru"
          ? "ru-RU"
          : "en-US";

  // Minimum transit distance among compared properties to badge the winner
  const minTransitDist = useMemo(() => {
    let min = Infinity;
    for (const p of properties) {
      if (typeof p.transit_distance_meters === "number" && p.transit_distance_meters > 0) {
        if (p.transit_distance_meters < min) min = p.transit_distance_meters;
      }
    }
    return min < Infinity ? min : null;
  }, [properties]);

  // Lowest Sale and Rent prices among compared properties to badge best deals
  const { minSalePrice, minRentPrice } = useMemo(() => {
    let minSale = Infinity;
    let minRent = Infinity;
    for (const p of properties) {
      const s = p.price || p.original_price;
      if (s && s > 0 && s < minSale) minSale = s;
      const r = p.rental_price || p.original_rental_price;
      if (r && r > 0 && r < minRent) minRent = r;
    }
    return {
      minSalePrice: minSale < Infinity ? minSale : null,
      minRentPrice: minRent < Infinity ? minRent : null,
    };
  }, [properties]);

  // Minimum Price Per Sqm among compared properties
  const minPricePerSqm = useMemo(() => {
    let min = Infinity;
    for (const p of properties) {
      let pps = p.price_per_sqm;
      if (!pps && p.size_sqm && (p.price || p.original_price)) {
        pps = Math.round((p.price || p.original_price)! / p.size_sqm);
      }
      if (pps && pps > 0 && pps < min) min = pps;
    }
    return min < Infinity ? min : null;
  }, [properties]);

  // Maximum Ceiling Height among compared properties
  const maxCeilingHeight = useMemo(() => {
    let max = 0;
    for (const p of properties) {
      const h = parseFloat(String(p.ceiling_height || (p.amenities as any)?.ceiling_height || 0));
      if (!isNaN(h) && h > max) max = h;
    }
    return max > 0 ? max : null;
  }, [properties]);

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
      property.subdistrict
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
            .join(", ") || "-"}
        </span>
      </div>
    );
  }

  // Calculation for max value to highlight Winner for numeric specs
  const isNumericCompare = [
    "property_size",
    "land_size_sqwah",
    "bedrooms",
    "bathrooms",
    "parking_slots",
  ].includes(row.key);

  let maxValue = -1;
  if (isNumericCompare) {
    maxValue = Math.max(
      ...properties.map((p) => {
        if (row.key === "property_size") return p.size_sqm || 0;
        if (row.key === "land_size_sqwah") return p.land_size_sqwah || 0;
        if (row.key === "bedrooms") return p.bedrooms || 0;
        if (row.key === "bathrooms") return p.bathrooms || 0;
        if (row.key === "parking_slots") return p.parking_slots || 0;
        return 0;
      })
    );
  }

  // Determine if a property's cell in this row is the "winner" / best choice to highlight with green bg
  const checkIsWinner = (p: CompareProperty): boolean => {
    if (properties.length <= 1) return false;

    if (row.key === "price") {
      const salePrice = p.price || p.original_price;
      const rentPrice = p.rental_price || p.original_rental_price;
      const isLowestSale =
        Boolean(salePrice) &&
        minSalePrice !== null &&
        salePrice === minSalePrice &&
        properties.filter((x) => Boolean(x.price || x.original_price)).length > 1;
      const isLowestRent =
        Boolean(rentPrice) &&
        minRentPrice !== null &&
        rentPrice === minRentPrice &&
        properties.filter((x) => Boolean(x.rental_price || x.original_rental_price)).length > 1;
      return isLowestSale || isLowestRent;
    }

    if (row.key === "price_per_sqm") {
      let pps = p.price_per_sqm;
      if (!pps && p.size_sqm && (p.price || p.original_price)) {
        pps = Math.round((p.price || p.original_price)! / p.size_sqm);
      }
      return Boolean(
        pps &&
        minPricePerSqm !== null &&
        pps === minPricePerSqm &&
        properties.filter((x) => {
          const val = x.price_per_sqm || (x.size_sqm && (x.price || x.original_price) ? (x.price || x.original_price)! / x.size_sqm : null);
          return val && val > 0;
        }).length > 1
      );
    }

    if (row.key === "transportation") {
      return Boolean(
        minTransitDist !== null &&
        p.transit_distance_meters === minTransitDist &&
        properties.filter((x) => typeof x.transit_distance_meters === "number" && x.transit_distance_meters > 0).length > 1
      );
    }

    if (row.key === "foreigner_quota") {
      return Boolean(p.is_foreigner_quota);
    }

    if (row.key === "petFriendly") {
      const petOk = Boolean(
        p.is_pet_friendly || p.pet_friendly || (p as any).petFriendly || (p.amenities as any)?.pet_friendly
      );
      const hasVariation = properties.some((x) => !x.is_pet_friendly && !x.pet_friendly && !(x.amenities as any)?.pet_friendly);
      return petOk && hasVariation;
    }

    if (row.key === "allow_airbnb") {
      const airbnbOk = Boolean(p.allow_airbnb || (p.amenities as any)?.allow_airbnb);
      const hasVariation = properties.some((x) => !x.allow_airbnb && !(x.amenities as any)?.allow_airbnb);
      return airbnbOk && hasVariation;
    }

    if (row.key === "furnishing") {
      const hasVariation = properties.some((x) => !x.is_fully_furnished);
      return Boolean(p.is_fully_furnished) && hasVariation;
    }

    if (row.key === "ceiling_height") {
      const h = parseFloat(String(p.ceiling_height || (p.amenities as any)?.ceiling_height || 0));
      return Boolean(maxCeilingHeight && h === maxCeilingHeight && properties.length > 1);
    }

    if (isNumericCompare) {
      let val = 0;
      if (row.key === "property_size") val = p.size_sqm || 0;
      if (row.key === "land_size_sqwah") val = p.land_size_sqwah || 0;
      if (row.key === "bedrooms") val = p.bedrooms || 0;
      if (row.key === "bathrooms") val = p.bathrooms || 0;
      if (row.key === "parking_slots") val = p.parking_slots || 0;

      const hasVariation = properties.some((x) => {
        let v = 0;
        if (row.key === "property_size") v = x.size_sqm || 0;
        if (row.key === "land_size_sqwah") v = x.land_size_sqwah || 0;
        if (row.key === "bedrooms") v = x.bedrooms || 0;
        if (row.key === "bathrooms") v = x.bathrooms || 0;
        if (row.key === "parking_slots") v = x.parking_slots || 0;
        return v !== maxValue;
      });

      return maxValue > 0 && val === maxValue && hasVariation;
    }

    return false;
  };

  const inquireLabel =
    t("compare_page.values.inquire_info") ||
    (language === "th"
      ? "สอบถามได้"
      : language === "cn"
        ? "详询"
        : language === "ru"
          ? "Уточняйте"
          : "Inquire");

  const renderFallback = () => (
    <span className="text-slate-400 font-normal text-xs italic">
      {inquireLabel}
    </span>
  );

  const renderPriceCell = (p: CompareProperty) => {
    const salePrice = p.price || p.original_price;
    const rentPrice = p.rental_price || p.original_rental_price;

    const showSale = !!salePrice;
    const showRent = !!rentPrice;

    const isLowestSale =
      showSale &&
      minSalePrice !== null &&
      salePrice === minSalePrice &&
      properties.filter((x) => Boolean(x.price || x.original_price)).length > 1;

    const isLowestRent =
      showRent &&
      minRentPrice !== null &&
      rentPrice === minRentPrice &&
      properties.filter((x) => Boolean(x.rental_price || x.original_rental_price)).length > 1;

    const saleContent =
      showSale && salePrice ? (
        <div className="block mb-1.5">
          {isLowestSale && (
            <div className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mb-1 shadow-2xs">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              <span>
                {t("compare_page.values.lowest_sale_price") ||
                  (language === "th"
                    ? "ราคาขายต่ำสุด"
                    : language === "cn"
                      ? "最低售价"
                      : language === "ru"
                        ? "Мин. цена продажи"
                        : "Lowest Sale Price")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
              {language === "th" ? "ขาย" : language === "cn" ? "售价" : language === "ru" ? "Продажа" : "Sale"}
            </span>
            {p.price && p.original_price && p.original_price > p.price && (
              <span className="text-[10px] md:text-xs text-slate-400 line-through mr-1">
                {formatMoney(p.original_price, locale)}
              </span>
            )}
            <span
              className={
                isLowestSale
                  ? "text-emerald-600 font-extrabold text-sm md:text-base"
                  : "text-amber-600 font-bold text-sm md:text-base"
              }
            >
              {formatMoney(salePrice, locale)}
            </span>
          </div>
        </div>
      ) : null;

    const rentContent =
      showRent && rentPrice ? (
        <div className="block">
          {isLowestRent && (
            <div className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mb-1 shadow-2xs">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              <span>
                {t("compare_page.values.lowest_rent_price") ||
                  (language === "th"
                    ? "ค่าเช่าต่ำสุด"
                    : language === "cn"
                      ? "最低租金"
                      : language === "ru"
                        ? "Мин. аренда"
                        : "Lowest Rent")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
              {language === "th" ? "เช่า" : language === "cn" ? "租金" : language === "ru" ? "Аренда" : "Rent"}
            </span>
            {p.rental_price &&
              p.original_rental_price &&
              p.original_rental_price > p.rental_price && (
                <span className="text-[10px] md:text-xs text-slate-400 line-through mr-1">
                  {formatMoney(p.original_rental_price, locale)}
                </span>
              )}
            <span
              className={
                isLowestRent
                  ? "text-emerald-600 font-extrabold text-sm md:text-base"
                  : "text-blue-600 font-bold text-sm md:text-base"
              }
            >
              {formatMoney(rentPrice, locale)}{" "}
              <span className="text-xs font-normal text-slate-400">
                {t("compare_page.values.rent_per_month")}
              </span>
            </span>
          </div>
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
        idx % 2 === 0 ? "bg-slate-50/40" : "bg-white"
      }`}
      style={{
        gridTemplateColumns: `var(--compare-label-w, 105px) repeat(${properties.length}, minmax(145px, 1fr))`,
      }}
    >
      {/* Sticky Left Label Column */}
      <div className="sticky left-0 bg-white z-10 px-2 sm:px-3.5 py-2 sm:py-3 text-[11px] sm:text-xs md:text-sm font-semibold text-slate-700 flex flex-col justify-center items-start gap-1 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
          <row.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
          <span className="leading-tight text-[11px] sm:text-xs font-bold text-slate-800 break-words">
            {t(`compare_page.labels.${row.key}`) || row.label}
          </span>
        </div>

        {row.key === "description" && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 mt-1 cursor-pointer font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> {t("compare_page.values.show_less") || (language === "th" ? "ย่อข้อความ" : "Show less")}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> {t("compare_page.values.read_more") || (language === "th" ? "ดูทั้งหมด" : "Read more")}
              </>
            )}
          </button>
        )}
      </div>

      {/* Property Data Columns */}
      {properties.map((p) => {
        const isWinner = checkIsWinner(p);

        return (
          <div
            key={p.id}
            className={`p-2.5 sm:p-3.5 md:p-4 text-xs md:text-sm text-slate-700 leading-relaxed transition-colors min-w-0 overflow-hidden break-words ${
              isWinner ? "bg-emerald-50/70 font-medium" : ""
            }`}
          >
            {row.key === "price" ? (
              renderPriceCell(p)
            ) : row.key === "price_per_sqm" ? (
              (() => {
                let pps = p.price_per_sqm;
                if (!pps && p.size_sqm && (p.price || p.original_price)) {
                  pps = Math.round((p.price || p.original_price)! / p.size_sqm);
                }
                if (!pps) return renderFallback();

                const isLowestPps =
                  minPricePerSqm !== null &&
                  pps === minPricePerSqm &&
                  properties.filter((x) => Boolean(x.price_per_sqm || (x.size_sqm && (x.price || x.original_price)))).length > 1;

                return (
                  <div className="flex flex-col items-start gap-1">
                    {isLowestPps && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shadow-2xs">
                        <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        <span>
                          {language === "th"
                            ? "ราคาเฉลี่ยต่ำสุด"
                            : language === "cn"
                              ? "最低均价"
                              : language === "ru"
                                ? "Мин. цена/м²"
                                : "Lowest Price/sqm"}
                        </span>
                      </div>
                    )}
                    <span className={isLowestPps ? "font-extrabold text-emerald-600 text-sm md:text-base" : "font-bold text-slate-800"}>
                      ฿{Math.round(pps).toLocaleString()} / {t("compare_page.values.sqm")}
                    </span>
                  </div>
                );
              })()
            ) : row.key === "min_contract_months" ? (
              p.min_contract_months ? (
                <span>
                  {p.min_contract_months}{" "}
                  {language === "th"
                    ? "เดือน"
                    : language === "cn"
                      ? "个月"
                      : language === "ru"
                        ? "мес."
                        : "months"}
                </span>
              ) : p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT" ? (
                <span>{t("compare_page.values.standard_1_year") || (language === "th" ? "1 ปี (มาตรฐาน)" : "1 Year (Standard)")}</span>
              ) : (
                renderFallback()
              )
            ) : row.key === "deposit_advance" ? (
              p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT" || p.rental_price ? (
                <span className="text-slate-700 font-medium">
                  {t("compare_page.values.deposit_2_plus_1") ||
                    (language === "th"
                      ? "ประกัน 2 เดือน + ล่วงหน้า 1 เดือน"
                      : language === "cn"
                        ? "押二付一"
                        : "2 months deposit + 1 month advance")}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "common_fee" ? (
              p.common_fee ? (
                <span>
                  ฿{p.common_fee} / {t("compare_page.values.sqm")}
                  {t("compare_page.values.rent_per_month")}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "verified" ? (
              p.verified ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>{t("compare_page.values.verified")}</span>
                </div>
              ) : (
                renderFallback()
              )
            ) : row.key === "features" ? (
              /* Features & Amenities Merge */
              (() => {
                const featureList = (p.features || []).map((f) =>
                  getLocalizedField<string>(f, "name", language) || f.name
                );

                // Also inspect amenities JSON boolean keys if available with multi-lang dictionary
                const amenitiesObj = p.amenities || {};
                const amenityDict: Record<string, { th: string; en: string; cn: string; ru: string }> = {
                  swimming_pool: { th: "สระว่ายน้ำ", en: "Swimming Pool", cn: "游泳池", ru: "Бассейн" },
                  fitness: { th: "ห้องฟิตเนส", en: "Fitness Gym", cn: "健身房", ru: "Фитнес" },
                  garden: { th: "สวนส่วนกลาง", en: "Garden", cn: "花园", ru: "Сад" },
                  security_24h: { th: "รปภ. 24 ชม.", en: "24h Security", cn: "24小时安保", ru: "Охрана 24ч" },
                  cctv: { th: "กล้อง CCTV", en: "CCTV", cn: "监控", ru: "Видеонаблюдение" },
                  keycard_access: { th: "คีย์การ์ด", en: "Keycard Access", cn: "门禁卡", ru: "Электронный ключ" },
                  ev_charger: { th: "จุดชาร์จ EV", en: "EV Charger", cn: "充电桩", ru: "Зарядка EV" },
                  digital_door_lock: { th: "Digital Door Lock", en: "Digital Door Lock", cn: "智能门锁", ru: "Электронный замок" },
                  coworking_space: { th: "Co-working Space", en: "Co-working Space", cn: "共享办公空间", ru: "Коворкинг" },
                  sauna: { th: "ห้องซาวน่า", en: "Sauna", cn: "桑拿房", ru: "Сауна" },
                };

                const currentLangKey = (language === "cn" ? "cn" : language === "ru" ? "ru" : language === "en" ? "en" : "th") as "th" | "en" | "cn" | "ru";

                Object.entries(amenityDict).forEach(([key, labels]) => {
                  if (amenitiesObj[key]) {
                    const localizedName = labels[currentLangKey] || labels.en;
                    if (!featureList.includes(localizedName)) {
                      featureList.push(localizedName);
                    }
                  }
                });

                if (featureList.length === 0) {
                  return renderFallback();
                }

                return (
                  <div className="flex flex-wrap gap-1.5">
                    {featureList.slice(0, 14).map((name, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 bg-slate-100/80 border border-slate-200/80 rounded-md text-slate-700 font-medium"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                );
              })()
            ) : row.key === "zone" ? (
              (language !== "th" ? p.popular_area_en : p.popular_area) ||
              getLocalizedField<string>(p, "popular_area", language) ||
              p.district || renderFallback()
            ) : row.key === "google_maps_link" ? (
              (() => {
                const lat = p.latitude;
                const lng = p.longitude;
                const hasCoords = typeof lat === "number" && typeof lng === "number" && isWithinThailandBounds(lat, lng);

                const embedQuery = hasCoords
                  ? `${lat},${lng}`
                  : encodeURIComponent(`${p.project_name || p.title} ${p.popular_area || p.province || "Bangkok"}`);

                const mapsUrl =
                  p.google_maps_link ||
                  (hasCoords
                    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${embedQuery}`);

                return (
                  <div className="flex flex-col gap-1.5 sm:gap-2 w-full min-w-0">
                    {/* Embedded Google Map (กางแผนที่ให้เห็นชัดๆ) */}
                    <div className="relative w-full h-28 sm:h-36 md:h-44 rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100">
                      <iframe
                        title={`Map ${p.project_name || p.title}`}
                        src={`https://maps.google.com/maps?q=${embedQuery}&hl=${language}&z=15&output=embed`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span>
                        {t("compare_page.values.open_map") ||
                          (language === "th"
                            ? "เปิดพิกัด Google Maps"
                            : language === "cn"
                              ? "在谷歌地图中打开"
                              : "Open Google Maps")}
                      </span>
                      <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                    </a>
                  </div>
                );
              })()
            ) : row.key === "nearby_places" ? (
              (() => {
                let places: any[] = [];
                try {
                  places =
                    typeof p.nearby_places === "string"
                      ? JSON.parse(p.nearby_places)
                      : p.nearby_places || [];
                } catch {
                  places = [];
                }

                if (!Array.isArray(places) || places.length === 0) {
                  return renderFallback();
                }

                return (
                  <div className="flex flex-col gap-2">
                    {places.map((place: any, i: number) => {
                      const placeName =
                        (language !== "th" ? (place.name_en || place.title_en) : null) ||
                        place.name ||
                        place.name_th ||
                        place.title;

                      const distNum =
                        typeof place.distance_meters === "number" && place.distance_meters > 0
                          ? place.distance_meters
                          : typeof place.distance === "number" && place.distance > 0
                            ? place.distance
                            : parseFloat(String(place.distance || "").replace(/[^0-9.]/g, ""));

                      const travel = computeTransitTravelInfo({
                        distanceMeters: !isNaN(distNum) && distNum > 0 ? distNum : null,
                        explicitTime: place.time || place.duration || place.minutes,
                        language,
                      });

                      const infoParts: string[] = [];
                      if (travel.distLabel) {
                        infoParts.push(travel.distLabel);
                      } else if (place.distance) {
                        infoParts.push(String(place.distance));
                      }

                      if (place.time) {
                        const timeStr =
                          String(place.time).includes("นาที") || String(place.time).includes("min")
                            ? String(place.time)
                            : `${place.time} ${language === "th" ? "นาที" : "mins"}`;
                        infoParts.push(timeStr);
                      } else if (travel.summaryLabel) {
                        infoParts.push(travel.summaryLabel);
                      }

                      const infoText = infoParts.join(" • ");

                      return (
                        <div key={i} className="text-xs flex items-start gap-1.5 text-slate-700 min-w-0 w-full">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <div className="flex flex-col min-w-0 flex-1 leading-snug">
                            <span className="font-semibold text-slate-800 text-[11px] sm:text-xs line-clamp-2 break-words">
                              {placeName}
                            </span>
                            {infoText && (
                              <span className="text-slate-500 text-[10px] sm:text-[11px] font-normal leading-tight mt-0.5 break-words">
                                ({infoText})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : row.key === "property_size" ? (
              p.size_sqm ? (
                <div className="flex flex-col items-start gap-1">
                  {isWinner && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shadow-2xs">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                      <span>
                        {language === "th"
                          ? "พื้นที่มากที่สุด"
                          : language === "cn"
                            ? "面积最大"
                            : language === "ru"
                              ? "Наиб. площадь"
                              : "Largest Area"}
                      </span>
                    </div>
                  )}
                  <span className={isWinner ? "text-emerald-700 font-extrabold text-sm md:text-base" : "font-medium"}>
                    {p.size_sqm} {t("compare_page.values.sqm")}
                  </span>
                </div>
              ) : (
                renderFallback()
              )
            ) : row.key === "land_size_sqwah" ? (
              p.land_size_sqwah ? (
                <div className="flex flex-col items-start gap-1">
                  {isWinner && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shadow-2xs">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                      <span>
                        {language === "th"
                          ? "ที่ดินกว้างสุด"
                          : language === "cn"
                            ? "地皮最大"
                            : language === "ru"
                              ? "Наиб. участок"
                              : "Largest Land"}
                      </span>
                    </div>
                  )}
                  <span className={isWinner ? "text-emerald-700 font-extrabold text-sm md:text-base" : "font-medium"}>
                    {p.land_size_sqwah} {t("compare_page.values.sqwa")}
                  </span>
                </div>
              ) : (
                renderFallback()
              )
            ) : row.key === "petFriendly" ? (
              (() => {
                const petOk = Boolean(
                  p.is_pet_friendly ||
                    p.pet_friendly ||
                    (p as any).petFriendly ||
                    (p.amenities as any)?.pet_friendly
                );

                return petOk ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                    <PawPrint className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t("compare_page.values.pet_friendly")}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">{t("compare_page.values.no_pets")}</span>
                );
              })()
            ) : row.key === "allow_airbnb" ? (
              (() => {
                const airbnbOk = Boolean(p.allow_airbnb || (p.amenities as any)?.allow_airbnb);
                return airbnbOk ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    <Check className="h-3.5 w-3.5 text-rose-600 stroke-[3]" />
                    <FaAirbnb className="h-3.5 w-3.5 text-rose-600" />
                    <span>{t("compare_page.values.airbnb_allowed")}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">{t("compare_page.values.not_allowed")}</span>
                );
              })()
            ) : row.key === "foreigner_quota" ? (
              p.is_foreigner_quota ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                  <Globe2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{t("compare_page.values.foreigner_quota_avail") || (language === "th" ? "รับชาวต่างชาติ / โควต้าต่างชาติ (ซื้อได้)" : "Foreigner Quota (Available)")}</span>
                </div>
              ) : (
                <span className="text-slate-500">{t("compare_page.values.thai_quota")}</span>
              )
            ) : row.key === "ceiling_height" ? (
              p.ceiling_height || (p.amenities as any)?.ceiling_height ? (
                <span className="font-semibold text-slate-800">
                  {p.ceiling_height || (p.amenities as any)?.ceiling_height}{" "}
                  {language === "th" ? "เมตร" : language === "cn" ? "米" : language === "ru" ? "м" : "m"}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "direction" ? (
              (() => {
                let raw =
                  p.direction ||
                  p.orientation ||
                  (p.amenities as any)?.direction;

                if (!raw) {
                  if (p.facing_north) raw = "NORTH";
                  else if (p.facing_south) raw = "SOUTH";
                  else if (p.facing_east) raw = "EAST";
                  else if (p.facing_west) raw = "WEST";
                }

                if (!raw) return renderFallback();

                const r = String(raw).toUpperCase().trim();
                const dirMap: Record<string, { th: string; en: string; cn: string; ru: string }> = {
                  NORTH: { th: "ทิศเหนือ", en: "North", cn: "朝北", ru: "Север" },
                  SOUTH: { th: "ทิศใต้", en: "South", cn: "朝南", ru: "Юг" },
                  EAST: { th: "ทิศตะวันออก", en: "East", cn: "朝东", ru: "Восток" },
                  WEST: { th: "ทิศตะวันตก", en: "West", cn: "朝西", ru: "Запад" },
                  NORTHEAST: { th: "ทิศตะวันออกเฉียงเหนือ", en: "North-East", cn: "东北", ru: "Северо-восток" },
                  NORTHWEST: { th: "ทิศตะวันตกเฉียงเหนือ", en: "North-West", cn: "西北", ru: "Северо-запад" },
                  SOUTHEAST: { th: "ทิศตะวันออกเฉียงใต้", en: "South-East", cn: "东南", ru: "Юго-восток" },
                  SOUTHWEST: { th: "ทิศตะวันตกเฉียงใต้", en: "South-West", cn: "西南", ru: "Юго-запад" },
                };

                const currentLangKey = (language === "cn" ? "cn" : language === "ru" ? "ru" : language === "en" ? "en" : "th") as "th" | "en" | "cn" | "ru";

                let displayDir = raw;
                if (r.includes("เหนือ") && r.includes("ออก")) displayDir = dirMap.NORTHEAST[currentLangKey] || dirMap.NORTHEAST.en;
                else if (r.includes("เหนือ") && r.includes("ตก")) displayDir = dirMap.NORTHWEST[currentLangKey] || dirMap.NORTHWEST.en;
                else if (r.includes("ใต้") && r.includes("ออก")) displayDir = dirMap.SOUTHEAST[currentLangKey] || dirMap.SOUTHEAST.en;
                else if (r.includes("ใต้") && r.includes("ตก")) displayDir = dirMap.SOUTHWEST[currentLangKey] || dirMap.SOUTHWEST.en;
                else if (r.includes("เหนือ") || r === "NORTH") displayDir = dirMap.NORTH[currentLangKey] || dirMap.NORTH.en;
                else if (r.includes("ใต้") || r === "SOUTH") displayDir = dirMap.SOUTH[currentLangKey] || dirMap.SOUTH.en;
                else if (r.includes("ออก") || r === "EAST") displayDir = dirMap.EAST[currentLangKey] || dirMap.EAST.en;
                else if (r.includes("ตก") || r === "WEST") displayDir = dirMap.WEST[currentLangKey] || dirMap.WEST.en;

                return <span className="font-medium text-slate-800">{displayDir}</span>;
              })()
            ) : row.key === "furnishing" ? (
              p.is_fully_furnished ? (
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {t("compare_page.values.fully_furnished")}
                </span>
              ) : p.is_bare_shell ? (
                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                  {t("compare_page.values.bare_shell")}
                </span>
              ) : p.furnishing_status ? (
                <span className="text-slate-700 font-medium">{p.furnishing_status}</span>
              ) : (
                renderFallback()
              )
            ) : row.key === "listing_type" ? (
              <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                {getListingTypeLabel(p.listing_type, t)}
              </span>
            ) : row.key === "floor" ? (
              p.floor ? (
                <span className="font-semibold text-slate-800">
                  {t("compare_page.values.floor_prefix")} {p.floor}
                  {p.total_floors
                    ? ` (${
                        language === "th"
                          ? `จาก ${p.total_floors} ชั้น`
                          : language === "cn"
                            ? `共 ${p.total_floors} 层`
                            : language === "ru"
                              ? `из ${p.total_floors}`
                              : `out of ${p.total_floors}`
                      })`
                    : ""}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "parking_slots" ? (
              p.parking_slots ? (
                <span className={isWinner ? "text-emerald-700 font-bold" : "font-semibold"}>
                  {p.parking_slots} {t("compare_page.values.parking_unit")}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "bedrooms" ? (
              p.bedrooms != null ? (
                <span className="font-bold text-slate-800">
                  {`${p.bedrooms} ${
                    language === "th"
                      ? "ห้องนอน"
                      : language === "cn"
                        ? "间卧室"
                        : language === "ru"
                          ? "спальн."
                          : p.bedrooms === 1
                            ? "Bedroom"
                            : "Bedrooms"
                  }`}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "bathrooms" ? (
              p.bathrooms != null ? (
                <span className="font-bold text-slate-800">
                  {`${p.bathrooms} ${
                    language === "th"
                      ? "ห้องน้ำ"
                      : language === "cn"
                        ? "间卫浴"
                        : language === "ru"
                          ? "ванн."
                          : p.bathrooms === 1
                            ? "Bathroom"
                            : "Bathrooms"
                  }`}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "description" ? (
              <div
                className={`${
                  isExpanded ? "" : "line-clamp-6"
                } text-xs text-slate-600 prose prose-slate prose-compact max-w-none transition-all duration-300 leading-relaxed`}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    getLocalizedField<string>(p, "description", language) ||
                      p.description ||
                      "-"
                  ),
                }}
              />
            ) : row.key === "property_type" ? (
              p.property_type ? (
                <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                  {getPropertyTypeLabel(p.property_type, language)}
                </span>
              ) : (
                renderFallback()
              )
            ) : row.key === "location" ? (
              <CompareLocationCell property={p} language={language} />
            ) : row.key === "province" ? (
              p.province ? (
                getProvinceName(p.province, language)
              ) : (
                renderFallback()
              )
            ) : row.key === "transportation" ? (
              (() => {
                const hasTransit = Boolean(
                  (p.near_transit && (p.transit_station_name || p.transit_station_name_en)) ||
                  (Array.isArray(p.nearby_transits) && p.nearby_transits.length > 0)
                );

                if (!hasTransit) return renderFallback();

                const isClosest =
                  minTransitDist !== null &&
                  p.transit_distance_meters === minTransitDist &&
                  properties.length > 1;

                const travel = computeTransitTravelInfo({
                  distanceMeters: p.transit_distance_meters ?? null,
                  language,
                });

                const primaryStation =
                  getLocalizedField<string>(
                    p,
                    "transit_station_name",
                    language
                  ) || p.transit_station_name;
                const detectedPrimary = detectTransitType(p.transit_type, primaryStation);
                const transitType = detectedPrimary || (p.transit_type && p.transit_type !== "OTHER" ? p.transit_type : null);
                const style =
                  transitType && TRANSIT_TYPE_STYLES[transitType as TransitType]
                    ? TRANSIT_TYPE_STYLES[transitType as TransitType]
                    : null;

                const otherTransits = Array.isArray(p.nearby_transits)
                  ? p.nearby_transits.filter(
                      (item: any) =>
                        item.station_name &&
                        item.station_name !== p.transit_station_name
                    )
                  : [];

                return (
                  <div className="flex flex-col gap-2 items-start text-left w-full min-w-0">
                    <div className="flex flex-col gap-1 items-start w-full min-w-0">
                      {isClosest && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mb-0.5 shadow-2xs">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>
                            {t("compare_page.values.closest_transit") ||
                              (language === "th"
                                ? "ใกล้รถไฟฟ้าที่สุด"
                                : language === "cn"
                                  ? "地铁最近"
                                  : "Closest to transit")}
                          </span>
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap w-full min-w-0">
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <Image
                            src={getTransitLogo(transitType || "BTS")}
                            alt={transitType || "Transit"}
                            width={16}
                            height={16}
                            className="object-contain"
                          />
                        </div>
                        {transitType && transitType !== "OTHER" && style && (
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${style.bg} ${style.text} border-slate-100 uppercase shrink-0`}
                          >
                            {transitType}
                          </span>
                        )}
                        <span className="font-bold text-xs sm:text-sm text-slate-800 break-words line-clamp-2">
                          {primaryStation}
                        </span>
                      </div>

                      {travel.summaryLabel && (
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 font-medium pl-0.5 whitespace-nowrap">
                          {travel.isWalk ? (
                            <FaPersonWalking className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <FaCarSide className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span className="font-semibold whitespace-nowrap">{travel.summaryLabel}</span>
                        </div>
                      )}
                    </div>

                    {otherTransits.length > 0 && (
                      <div className="w-full pt-2 border-t border-slate-100 flex flex-col gap-2">
                        {otherTransits.map((item: any, idx: number) => {
                          const rawType = item.type || item.transit_type;
                          const stationName = item[`station_name_${language}`] || item.station_name;
                          const detectedType = detectTransitType(rawType, stationName);
                          const itemStyle =
                            detectedType && TRANSIT_TYPE_STYLES[detectedType]
                              ? TRANSIT_TYPE_STYLES[detectedType]
                              : null;
                          const itemTravel = computeTransitTravelInfo({
                            distanceMeters: item.distance_meters ?? null,
                            explicitTime: item.time,
                            language,
                          });

                          return (
                            <div key={idx} className="flex flex-col gap-0.5 text-xs text-slate-700 w-full min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap w-full min-w-0">
                                <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                                  <Image
                                    src={getTransitLogo(detectedType || "BTS")}
                                    alt={detectedType || "Transit"}
                                    width={14}
                                    height={14}
                                    className="object-contain"
                                  />
                                </div>
                                {detectedType && itemStyle && (
                                  <span
                                    className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold border ${itemStyle.bg} ${itemStyle.text} border-slate-100 uppercase shrink-0`}
                                  >
                                    {detectedType}
                                  </span>
                                )}
                                <span
                                  className="font-semibold text-xs text-slate-800 break-words line-clamp-2"
                                  title={stationName}
                                >
                                  {stationName}
                                </span>
                              </div>

                              {itemTravel.summaryLabel && (
                                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium pl-0.5 whitespace-nowrap">
                                  {itemTravel.isWalk ? (
                                    <FaPersonWalking className="w-3 h-3 text-emerald-600 shrink-0" />
                                  ) : (
                                    <FaCarSide className="w-3 h-3 text-blue-600 shrink-0" />
                                  )}
                                  <span className="whitespace-nowrap">{itemTravel.summaryLabel}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : row.key === "updated_at" ? (
              new Date(p.updated_at).toLocaleDateString(locale)
            ) : (
              (p as any)[row.key] || renderFallback()
            )}
          </div>
        );
      })}
    </div>
  );
}
