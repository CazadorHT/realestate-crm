"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { CompareProperty } from "./types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocalizedField } from "@/lib/i18n";

interface ComparePropertyHeaderProps {
  property: CompareProperty;
  onRemove: (id: string) => void;
}

export function ComparePropertyHeader({
  property,
  onRemove,
}: ComparePropertyHeaderProps) {
  const { t, language } = useLanguage();
  const title = getLocalizedField<string>(property, "title", language);

  return (
    <div className="p-3 md:p-6 relative group">
      <button
        onClick={() => onRemove(property.id)}
        className="absolute top-1 right-1 md:top-2 md:right-2 p-1.5 md:p-2 bg-white shadow-sm border border-slate-100 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-10"
        title={t("compare_bar.clear")}
      >
        <X className="h-3 w-3 md:h-4 md:w-4" />
      </button>
      <div className="relative aspect-4/3 rounded-xl md:rounded-2xl overflow-hidden bg-slate-100 mb-2 md:mb-4 border border-slate-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            {t("common.no_image")}
          </div>
        )}
      </div>
    </div>
  );
}
