"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PropertyStatusBadgeProps {
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | string;
  className?: string;
  language?: "th" | "en" | "cn";
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
    ACTIVE:
      "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
    DRAFT: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200",
    ARCHIVED:
      "bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200",
    SOLD: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
    RENTED:
      "bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200",
  };

  const labels: Record<string, string> = {
    ACTIVE: t("property.status.active"),
    DRAFT: t("property.status.draft"),
    ARCHIVED: t("property.status.archived"),
    SOLD: t("property.status.sold"),
    RENTED: t("property.status.rented"),
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
