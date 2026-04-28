"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_STYLES,
} from "@/features/properties/labels";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { type Language } from "@/lib/i18n";

interface PropertyStatusBadgeProps {
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | string;
  className?: string;
  language?: Language;
}

export function PropertyStatusBadge({
  status,
  className,
  language: customLanguage,
}: PropertyStatusBadgeProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const { dictionaries } = require("@/components/providers/LanguageProvider");
    const dict = dictionaries[language];
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  const styles: Record<string, string> = {
    ACTIVE: cn(
      PROPERTY_STATUS_STYLES.ACTIVE.bg,
      PROPERTY_STATUS_STYLES.ACTIVE.border,
    ),
    DRAFT: cn(
      PROPERTY_STATUS_STYLES.DRAFT.bg,
      PROPERTY_STATUS_STYLES.DRAFT.border,
    ),
    ARCHIVED: cn(
      PROPERTY_STATUS_STYLES.ARCHIVED.bg,
      PROPERTY_STATUS_STYLES.ARCHIVED.border,
    ),
    SOLD: cn(
      PROPERTY_STATUS_STYLES.SOLD.bg,
      PROPERTY_STATUS_STYLES.SOLD.border,
    ),
    RENTED: cn(
      PROPERTY_STATUS_STYLES.RENTED.bg,
      PROPERTY_STATUS_STYLES.RENTED.border,
    ),
    UNDER_OFFER: cn(
      PROPERTY_STATUS_STYLES.UNDER_OFFER.bg,
      PROPERTY_STATUS_STYLES.UNDER_OFFER.border,
    ),
    RESERVED: cn(
      PROPERTY_STATUS_STYLES.RESERVED.bg,
      PROPERTY_STATUS_STYLES.RESERVED.border,
    ),
  };

  const labels: Record<string, string> = {
    ACTIVE: t("property.status.active"),
    DRAFT: t("property.status.draft"),
    ARCHIVED: t("property.status.archived"),
    SOLD: t("property.status.sold"),
    RENTED: t("property.status.rented"),
    UNDER_OFFER: PROPERTY_STATUS_LABELS.UNDER_OFFER,
    RESERVED: PROPERTY_STATUS_LABELS.RESERVED,
  };

  const normalizedStatus = status.toUpperCase();
  const currentStyle =
    styles[normalizedStatus] || "bg-gray-100 text-gray-700 border-gray-200";
  const label = labels[normalizedStatus] || status;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium border shadow-sm", currentStyle, className)}
    >
      {label}
    </Badge>
  );
}
