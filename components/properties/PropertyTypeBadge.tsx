"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPE_GRADIENTS, PROPERTY_TYPE_LABELS, type PropertyType } from "@/features/properties/labels";
import { type Language } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertyTypeBadgeProps {
  type: string;
  className?: string;
  language?: Language;
}

export function PropertyTypeBadge({
  type,
  className,
  language: customLanguage,
}: PropertyTypeBadgeProps) {
  const { language: globalLanguage } = useLanguage();
  const activeLanguage = customLanguage || globalLanguage || "th";
  const labelObj = PROPERTY_TYPE_LABELS[type as PropertyType];
  const label = labelObj ? (labelObj[activeLanguage] || labelObj.en || labelObj.th) : type;
  const gradient =
    (PROPERTY_TYPE_GRADIENTS as Record<string, string>)[type] ??
    "from-slate-400 to-slate-500";

  const textClass = "text-white";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-0 px-4! py-1 text-[11px] font-semibold tracking-tight shadow-sm",
        `bg-linear-to-r ${gradient} ${textClass}`,
        className,
      )}
      title={type}
    >
      {label}
    </Badge>
  );
}

