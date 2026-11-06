"use client";

import Image from "next/image";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { CompareProperty } from "./types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocalizedField } from "@/lib/i18n";
import { formatMoney } from "./utils";

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
  const title =
    getLocalizedField<string>(property, "title", language) || "Property";
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
    <div className="p-2.5 sm:p-3 relative group flex items-center justify-between gap-2.5 bg-white">
      {/* Mini Thumbnail */}
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-2xs">
        <Image
          src={coverSrc}
          alt={title}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>

      {/* Info: Title & Price */}
      <div className="min-w-0 flex-1">
        <h4
          className="font-extrabold text-xs text-slate-900 line-clamp-1 leading-snug"
          title={property.project_name || title}
        >
          {property.project_name || title}
        </h4>
        <div className="text-[11px] font-extrabold text-blue-600 truncate mt-0.5">
          {salePrice ? (
            formatMoney(salePrice, locale)
          ) : rentPrice ? (
            <span>
              {formatMoney(rentPrice, locale)}
              <span className="text-[9px] text-slate-400 font-normal">/ด.</span>
            </span>
          ) : (
            <span className="text-slate-400 font-normal">-</span>
          )}
        </div>
      </div>

      {/* Quick Action & Remove Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={detailHref}
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-blue-600 text-white font-bold text-[11px] transition-colors"
          title="ดูทรัพย์"
        >
          <span>{language === "th" ? "ดู" : "View"}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </Link>

        <button
          type="button"
          onClick={() => onRemove(property.id)}
          className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title={t("compare_bar.clear") || "Remove"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
