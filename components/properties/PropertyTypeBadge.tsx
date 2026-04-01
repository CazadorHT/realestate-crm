"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPE_GRADIENTS, PROPERTY_TYPE_LABELS, type PropertyType } from "@/features/properties/labels";

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
  const label = PROPERTY_TYPE_LABELS[type as PropertyType] || type;
  const gradient =
    (PROPERTY_TYPE_GRADIENTS as Record<string, string>)[type] ??
    "from-slate-400 to-slate-500";

  // หมายเหตุ: สีเหลืองกับตัวอักษรขาวอ่านยากนิดหน่อย → ใช้ text-slate-900 เฉพาะ WAREHOUSE
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
