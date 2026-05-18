"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LISTING_TYPE_ORDER,
  LISTING_TYPE_LABELS,
} from "@/features/properties/labels";

interface QuickListingProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function QuickListing({ value, onValueChange }: QuickListingProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="ขาย/เช่า" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
        <SelectItem value="ALL">ขาย & เช่า</SelectItem>
        {LISTING_TYPE_ORDER.map((t) => (
          <SelectItem key={t} value={t}>
            {LISTING_TYPE_LABELS[t].th}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
