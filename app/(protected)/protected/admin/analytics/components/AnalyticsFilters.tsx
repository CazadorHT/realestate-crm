"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

const RANGES = [
  { label: "ทั้งหมด (All Time)", value: "all" },
  { label: "อาทิตย์นี้", value: "7" },
  { label: "2 อาทิตย์นี้", value: "14" },
  { label: "เดือนนี้", value: "30" },
  { label: "6 เดือนนี้", value: "180" },
  { label: "ปีนี้", value: "365" },
];

export function AnalyticsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "all";

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("range");
    } else {
      params.set("range", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm mr-2">
        <Calendar className="h-4 w-4" />
        <span>ช่วงเวลา:</span>
      </div>
      <Select value={currentRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px] h-9 bg-white border-slate-200">
          <SelectValue placeholder="เลือกช่วงเวลา" />
        </SelectTrigger>
        <SelectContent>
          {RANGES.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
