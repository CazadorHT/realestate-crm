"use client";

import Image from "next/image";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { CompareProperty } from "./types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatMoney, getCompareDisplayTitle } from "./utils";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

interface ComparePropertyHeaderProps {
  property: CompareProperty;
  onRemove: (id: string) => void;
}

export function ComparePropertyHeader({
  property,
  onRemove,
}: ComparePropertyHeaderProps) {
  const { t, language, langPrefix } = useLanguage();
  const title = getCompareDisplayTitle(property, language);
  const locale =
    language === "th"
      ? "th-TH"
      : language === "cn"
        ? "zh-CN"
        : language === "ru"
          ? "ru-RU"
          : "en-US";

  const salePrice = property.price || property.original_price;
  const rentPrice = property.rental_price || property.original_rental_price;
  const coverSrc = property.image_url || FALLBACK_IMG;
  const detailHref = `${langPrefix || ""}/properties/${property.slug || property.id}`;

  return (
    <div className="p-2 sm:p-3.5 md:p-4 relative group flex flex-col bg-white h-full justify-between gap-1.5 sm:gap-2.5">
      {/* Large Property Image Preview */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-2xs group/img">
        <Image
          src={coverSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover/img:scale-105 transition-transform duration-300"
        />

        {/* Floating Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(property.id)}
          className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1 sm:p-1.5 rounded-full bg-slate-900/75 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-md z-10"
          title={t("compare_bar.clear") || "Remove"}
        >
          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* Info: Title & Price & Quick Action */}
      <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 justify-between">
        <div>
          <h4
            className="font-extrabold text-[11px] sm:text-xs md:text-sm text-slate-900 line-clamp-2 leading-snug hover:text-blue-600 transition-colors"
            title={title}
          >
            <Link href={detailHref} target="_blank">
              {title}
            </Link>
          </h4>
          {/* Unified Price Labels & Colors: เช่า = น้ำเงิน, ขาย = ส้ม */}
          <div className="mt-1 flex flex-col gap-1 min-w-0">
            {salePrice ? (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs md:text-sm font-extrabold text-amber-600 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                  {language === "th" ? "ขาย" : language === "cn" ? "售价" : language === "ru" ? "Продажа" : "Sale"}
                </span>
                <span className="truncate">{formatMoney(salePrice, locale)}</span>
              </div>
            ) : null}

            {rentPrice ? (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs md:text-sm font-extrabold text-blue-600 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                  {language === "th" ? "เช่า" : language === "cn" ? "租金" : language === "ru" ? "Аренда" : "Rent"}
                </span>
                <span className="truncate">
                  {formatMoney(rentPrice, locale)}
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal">
                    {" "}{t("compare_page.values.rent_per_month")}
                  </span>
                </span>
              </div>
            ) : null}

            {!salePrice && !rentPrice && (
              <span className="text-slate-400 font-normal text-xs">-</span>
            )}
          </div>
        </div>

        {/* View Details Link */}
        <Link
          href={detailHref}
          target="_blank"
          className="inline-flex items-center justify-center gap-1 w-full py-1 sm:py-1.5 px-1.5 sm:px-3 rounded-md sm:rounded-lg bg-slate-900 hover:bg-blue-600 text-white font-bold text-[10px] sm:text-xs transition-colors shadow-2xs mt-1"
        >
          <span>{language === "th" ? "ดูข้อมูล" : language === "cn" ? "查看详情" : language === "ru" ? "Подробнее" : "View"}</span>
          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </Link>
      </div>
    </div>
  );
}
