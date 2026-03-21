"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

const RANGES = [
  { label: "ทั้งหมด", value: "all" },
  { label: "เดือนนี้", value: "this-month" },
  { label: "6 เดือน", value: "6-months" },
  { label: "1 ปี", value: "1-year" },
  { label: "Q1", value: "q1" },
  { label: "Q2", value: "q2" },
  { label: "Q3", value: "q3" },
  { label: "Q4", value: "q4" },
];

export function StatsTimeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("timeRange") || "all";

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("timeRange");
    } else {
      params.set("timeRange", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex items-center gap-2 text-slate-500 mr-2">
        <Calendar className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider">ช่วงเวลา:</span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
        {RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => handleRangeChange(range.value)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200",
              currentRange === range.value
                ? "bg-white text-blue-600 shadow-sm border border-slate-200 ring-1 ring-slate-100"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
