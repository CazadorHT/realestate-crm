"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

interface QuickSortProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function QuickSort({ value, onValueChange }: QuickSortProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <ArrowUpDown className="h-4 w-4 mr-2" />
        <SelectValue placeholder="เรียงตาม" />
      </SelectTrigger>
      <SelectContent className="overflow-y-auto bg-white">
        <SelectItem value="created_at-desc">ใหม่ล่าสุด</SelectItem>
        <SelectItem value="created_at-asc">เก่าสุด</SelectItem>
        <SelectItem value="updated_at-desc">อัปเดตล่าสุด</SelectItem>
        <SelectItem value="updated_at-asc">อัปเดตเก่าสุด</SelectItem>
        <SelectItem value="price-desc">ราคาสูงสุด</SelectItem>
        <SelectItem value="price-asc">ราคาต่ำสุด</SelectItem>
        <SelectItem value="rental_price-desc">ค่าเช่าสูงสุด</SelectItem>
        <SelectItem value="rental_price-asc">ค่าเช่าต่ำสุด</SelectItem>
        <SelectItem value="title-asc">ชื่อ A-Z</SelectItem>
        <SelectItem value="title-desc">ชื่อ Z-A</SelectItem>
        <SelectItem value="bedrooms-desc">ห้องนอนมากสุด</SelectItem>
      </SelectContent>
    </Select>
  );
}
