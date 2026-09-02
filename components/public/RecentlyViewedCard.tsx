import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, Sparkles } from "lucide-react";
import { RecentProperty } from "@/lib/recent-properties";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { getTypeColor, formatPrice as utilFormatPrice } from "@/lib/property-utils";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { getCardPrice } from "./RecentlyViewedUtils";
import { m } from "framer-motion";

interface RecentlyViewedCardProps {
  item: RecentProperty;
  language: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  isDragging: boolean;
  disableAos?: boolean;
}

export function RecentlyViewedCard({
  item,
  language,
  t,
  isDragging,
  disableAos = false,
}: RecentlyViewedCardProps) {
  const cardContent = (
    <Link
      href={item.slug ? `/properties/${item.slug}` : `/properties/${item.id}`}
      className="block w-full h-full bg-white rounded-[1.5rem] md:rounded-4xl border border-slate-100 overflow-hidden hover:shadow-md hover:shadow-blue-500/10 transition-all! duration-500! group relative isolate hover:-translate-y-1"
      onClick={(e) => {
        if (isDragging) e.preventDefault();
      }}
    >

      {/* Image Section */}
      <div className="relative h-36 md:h-44 bg-slate-100 overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={getLocaleValue(item, "title", language)}
            fill
            sizes="300px"
            className="object-cover group-hover:scale-110 transition-transform duration-700!"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Sparkles className="h-8 w-8 opacity-20" />
          </div>
        )}

        {/* Hot Deal / Discount Badge */}
        {((item.original_price && item.price && item.original_price > item.price) ||
          (item.original_rental_price &&
            item.rental_price &&
            item.original_rental_price > item.rental_price) ||
          item.price_text?.includes("(-")) && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
            🔥 HOT DEAL
          </div>
        )}

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            propertyId={item.id}
            propertyTitle={getLocaleValue(item, "title", language)}
            className="bg-white/70 backdrop-blur-sm rounded-full p-2 hover:bg-white/80"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 md:p-5">
        {/* Price Info Container */}
        <div className="flex flex-col gap-0.5 mb-3">
          {item.listing_type === "SALE" &&
            item.original_price &&
            item.price &&
            item.original_price > item.price && (
              <span className="text-xs text-slate-400 line-through decoration-slate-400/70">
                {utilFormatPrice(item.original_price, language)}
              </span>
            )}
          {item.listing_type === "RENT" &&
            item.original_rental_price &&
            item.rental_price &&
            item.original_rental_price > item.rental_price && (
              <span className="text-xs text-slate-400 line-through decoration-slate-400/70">
                {utilFormatPrice(item.original_rental_price, language)}
              </span>
            )}
          {item.listing_type === "SALE_AND_RENT" && (
            <div className="flex gap-2">
              {item.original_price && item.price && item.original_price > item.price && (
                <span className="text-[10px] text-slate-400 line-through decoration-slate-400/70">
                  {utilFormatPrice(item.original_price, language)}
                </span>
              )}
              {item.original_rental_price &&
                item.rental_price &&
                item.original_rental_price > item.rental_price && (
                  <span className="text-[10px] text-slate-400 line-through decoration-slate-400/70">
                    {utilFormatPrice(item.original_rental_price, language)}
                  </span>
                )}
            </div>
          )}
          <span className={`text-base md:text-lg font-extrabold ${
            (item.original_price && item.price && item.original_price > item.price) ||
            (item.original_rental_price &&
              item.rental_price &&
              item.original_rental_price > item.rental_price) ||
            item.price_text?.includes("(-")
              ? "text-rose-600"
              : "text-blue-600"
          }`}>
            {getCardPrice(item, t, language)}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 truncate mb-2 group-hover:text-blue-600 transition-colors">
          {getLocaleValue(item, "title", language)}
        </h3>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          {item.property_type && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                getTypeColor(item.property_type).bg
              } ${getTypeColor(item.property_type).text}`}
            >
              {t(
                `property_types.${
                  item.property_type.toLowerCase() === "commercial_building"
                    ? "commercial_building"
                    : item.property_type.toLowerCase()
                }`,
              )}
            </span>
          )}
          {item.listing_type && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                item.listing_type === "SALE"
                  ? "bg-green-600 text-white"
                  : item.listing_type === "RENT"
                    ? "bg-orange-600 text-white"
                    : "bg-blue-600 text-white"
              }`}
            >
              {item.listing_type === "SALE"
                ? t("common.sale")
                : item.listing_type === "RENT"
                  ? t("common.rent")
                  : `${t("common.sale")}/${t("common.rent")}`}
            </span>
          )}
        </div>

        {/* Features Preview */}
        {item.features && item.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 h-5 overflow-hidden">
            {item.features.slice(0, 3).map((f) => (
              <span
                key={f.id}
                className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 truncate max-w-[80px]"
              >
                {getLocaleValue(f, "name", language)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
          <MapPin className="h-3 w-3 mr-1.5 text-blue-500" />
          <span className="truncate">
            {[
              getLocaleValue(item, "popular_area", language),
              getProvinceName(item.province || "", language),
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-blue-600/50 uppercase tracking-widest">
            {t("recently_viewed.view_details")}
          </span>
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
        </div>
      </div>
    </Link>
  );

  if (disableAos) {
    return (
      <div className="min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] snap-start shrink-0">
        {cardContent}
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] snap-start shrink-0"
    >
      {cardContent}
    </m.div>
  );
}
