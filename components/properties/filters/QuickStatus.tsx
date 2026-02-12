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

interface QuickStatusProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function QuickStatus({ value, onValueChange }: QuickStatusProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="สถานะ" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
        <SelectItem value="ALL">ทุกสถานะ</SelectItem>
        {PROPERTY_STATUS_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            {PROPERTY_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
