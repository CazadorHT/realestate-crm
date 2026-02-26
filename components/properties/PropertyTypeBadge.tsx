"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPE_GRADIENTS } from "@/features/properties/labels";
import type { PropertyType } from "@/features/properties/labels";

interface PropertyTypeBadgeProps {
  type: string;
  className?: string;
  language?: "th" | "en" | "cn";
}

export function PropertyTypeBadge({
  type,
  className,
  language: customLanguage,
}: PropertyTypeBadgeProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const { dictionaries } = require("@/components/providers/LanguageProvider");
    const dict = dictionaries[language];
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  const label = t(`property_types.${type.toLowerCase()}`);
  const gradient =
    (PROPERTY_TYPE_GRADIENTS as Record<string, string>)[type] ??
    "from-slate-400 to-slate-500";

  // หมายเหตุ: สีเหลืองกับตัวอักษรขาวอ่านยากนิดหน่อย → ใช้ text-slate-900 เฉพาะ WAREHOUSE
  const textClass =
    type === ("WAREHOUSE" as PropertyType) ? "text-slate-900" : "text-white";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-0 px-3 py-1 text-[11px] font-semibold tracking-tight shadow-sm",
        `bg-linear-to-r ${gradient} ${textClass}`,
        className,
      )}
      title={type}
    >
      {label}
    </Badge>
  );
}
