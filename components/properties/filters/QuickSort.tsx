"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface QuickSortProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function QuickSort({ value, onValueChange }: QuickSortProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <ArrowUpDown className="h-4 w-4 mr-2" />
        <SelectValue placeholder={isEn ? "Sort by" : "เรียงตาม"} />
      </SelectTrigger>
      <SelectContent className="overflow-y-auto bg-white">
        <SelectItem value="created_at-desc">{isEn ? "Newest First" : "ใหม่ล่าสุด"}</SelectItem>
        <SelectItem value="created_at-asc">{isEn ? "Oldest First" : "เก่าสุด"}</SelectItem>
        <SelectItem value="updated_at-desc">{isEn ? "Recently Updated" : "อัปเดตล่าสุด"}</SelectItem>
        <SelectItem value="updated_at-asc">{isEn ? "Least Recently Updated" : "อัปเดตเก่าสุด"}</SelectItem>
        <SelectItem value="price-desc">{isEn ? "Price: High to Low" : "ราคาสูงสุด"}</SelectItem>
        <SelectItem value="price-asc">{isEn ? "Price: Low to High" : "ราคาต่ำสุด"}</SelectItem>
        <SelectItem value="rental_price-desc">{isEn ? "Rent: High to Low" : "ค่าเช่าสูงสุด"}</SelectItem>
        <SelectItem value="rental_price-asc">{isEn ? "Rent: Low to High" : "ค่าเช่าต่ำสุด"}</SelectItem>
        <SelectItem value="title-asc">{isEn ? "Title: A-Z" : "ชื่อ A-Z"}</SelectItem>
        <SelectItem value="title-desc">{isEn ? "Title: Z-A" : "ชื่อ Z-A"}</SelectItem>
        <SelectItem value="bedrooms-desc">{isEn ? "Most Bedrooms" : "ห้องนอนมากสุด"}</SelectItem>
      </SelectContent>
    </Select>
  );
}
