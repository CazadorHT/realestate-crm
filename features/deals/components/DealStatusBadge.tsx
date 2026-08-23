"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function DealStatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const styleMap: Record<string, { bg: string; text: string }> = {
    NEGOTIATING: { bg: "bg-blue-50", text: "text-blue-700 border-blue-200" },
    SIGNED: { bg: "bg-purple-50", text: "text-purple-700 border-purple-200" },
    CLOSED_WIN: { bg: "bg-green-50", text: "text-green-700 border-green-200" },
    CLOSED_LOSS: { bg: "bg-red-50", text: "text-red-700 border-red-200" },
    CANCELLED: { bg: "bg-slate-50", text: "text-slate-700 border-slate-200" },
  };

  const labelMapTh: Record<string, string> = {
    NEGOTIATING: "กำลังต่อรอง",
    SIGNED: "เซ็นสัญญา",
    CLOSED_WIN: "สำเร็จ",
    CLOSED_LOSS: "ไม่สำเร็จ",
    CANCELLED: "ยกเลิก",
  };

  const labelMapEn: Record<string, string> = {
    NEGOTIATING: "Negotiating",
    SIGNED: "Signed",
    CLOSED_WIN: "Closed Won",
    CLOSED_LOSS: "Closed Lost",
    CANCELLED: "Cancelled",
  };

  const style = styleMap[status] || {
    bg: "bg-slate-50",
    text: "text-slate-700 border-slate-200",
  };

  const currentLabelMap = isEn ? labelMapEn : labelMapTh;

  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} font-medium whitespace-nowrap`}
    >
      {currentLabelMap[status] || status}
    </Badge>
  );
}

