"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROPERTY_TYPE_ORDER,
  PROPERTY_TYPE_LABELS,
} from "@/features/properties/labels";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface QuickTypeProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function QuickType({ value, onValueChange }: QuickTypeProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[190px]">
        <SelectValue placeholder={isEn ? "Property Type" : "ประเภท"} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
        <SelectItem value="ALL">{isEn ? "All Property Types" : "ทุกประเภท"}</SelectItem>
        {PROPERTY_TYPE_ORDER.map((t) => (
          <SelectItem key={t} value={t}>
            {isEn ? PROPERTY_TYPE_LABELS[t].en : PROPERTY_TYPE_LABELS[t].th}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
