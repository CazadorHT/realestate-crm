"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROPERTY_STATUS_ORDER,
  PROPERTY_STATUS_LABELS,
} from "@/features/properties/labels";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface QuickStatusProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function QuickStatus({ value, onValueChange }: QuickStatusProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={isEn ? "Status" : "สถานะ"} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
        <SelectItem value="ALL">{isEn ? "All Statuses" : "ทุกสถานะ"}</SelectItem>
        {PROPERTY_STATUS_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            {isEn ? PROPERTY_STATUS_LABELS[s].en : PROPERTY_STATUS_LABELS[s].th}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
