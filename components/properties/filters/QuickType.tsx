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

interface QuickTypeProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function QuickType({ value, onValueChange }: QuickTypeProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[190px]">
        <SelectValue placeholder="ประเภท" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
        <SelectItem value="ALL">ทุกประเภท</SelectItem>
        {PROPERTY_TYPE_ORDER.map((t) => (
          <SelectItem key={t} value={t}>
            {PROPERTY_TYPE_LABELS[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
