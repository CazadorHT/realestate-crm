"use client";

import Image from "next/image";
import Link from "next/link";
import { X, ExternalLink, MapPin } from "lucide-react";
import { CompareProperty } from "./types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocalizedField } from "@/lib/i18n";
import { formatMoney } from "./utils";
import { getTransitLogo, getTransitTypeLabel } from "../map/map-price-utils";

interface ComparePropertyHeaderProps {
  property: CompareProperty;
  onRemove: (id: string) => void;
}

export function ComparePropertyHeader({
  property,
  onRemove,
}: ComparePropertyHeaderProps) {
  const { t, language, langPrefix } = useLanguage();
  const title = getLocalizedField<string>(property, "title", language) || "Untitled Property";
  const locale =
    language === "th" ? "th-TH" : language === "cn" ? "zh-CN" : language === "ru" ? "ru-RU" : "en-US";

  const salePrice = property.price || property.original_price;
  const rentPrice = property.rental_price || property.original_rental_price;
  const transitType = property.transit_type || "BTS";
  const transitName =
    (language === "en" && property.transit_station_name_en) ||
    property.transit_station_name ||
    null;

  return (
    <div className="p-3 sm:p-5 relative group flex flex-col justify-between h-full bg-white">
      {/* Remove button */}
      <button
        onClick={() => onRemove(property.id)}
        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 shadow-xs border border-slate-200/90 rounded-full transition-all z-20 cursor-pointer"
        title={t("compare_bar.clear") || "Remove"}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div>
        {/* Cover Image */}
        <div className="relative aspect-video max-h-[140px] sm:max-h-[160px] rounded-xl overflow-hidden bg-slate-100 mb-2.5 border border-slate-100 shadow-inner group-hover:scale-[1.01] transition-transform duration-300">
          {property.image_url ? (
            <Image
              src={property.image_url}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              {t("common.no_image")}
            </div>
          )}

          {/* Listing type badge */}
          {property.listing_type && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
              {property.listing_type}
            </span>
          )}
        </div>

        {/* Title / Project */}
        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-tight mb-1.5" title={title}>
          {property.project_name || title}
        </h3>

        {/* Transit Chip if present */}
        {transitName && (
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium max-w-full truncate mb-2">
            <div className="w-3 h-3 shrink-0 flex items-center justify-center">
              <Image
                src={getTransitLogo(transitType)}
                alt={transitType}
                width={12}
                height={12}
                className="object-contain"
              />
            </div>
            <span className="truncate">
              {transitName}
              {property.transit_distance_meters ? ` (${property.transit_distance_meters} ม.)` : ""}
            </span>
          </div>
        )}

        {/* Price Tag */}
        <div className="mb-3 space-y-0.5">
          {salePrice && (
            <div className="text-xs sm:text-sm font-extrabold text-blue-600 truncate">
              {formatMoney(salePrice, locale)}
            </div>
          )}
          {rentPrice && (
            <div className="text-xs sm:text-sm font-extrabold text-amber-600 truncate">
              {formatMoney(rentPrice, locale)}{" "}
              <span className="text-[10px] text-slate-400 font-normal">/ด.</span>
            </div>
          )}
          {!salePrice && !rentPrice && (
            <div className="text-xs text-slate-400">-</div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href={`${langPrefix || ""}/properties/${property.slug || property.id}`}
        target="_blank"
        className="w-full inline-flex items-center justify-center gap-1 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs py-2 px-2.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
      >
        <span>{t("compare_page.view_details") || "ดูทรัพย์"}</span>
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
