"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export function AnalyticsFilters() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const ranges = [
    { label: isEn ? "All Time" : "ทั้งหมด (All)", value: "all" },
    { label: isEn ? "Last 7 Days" : "7 วันล่าสุด", value: "7" },
    { label: isEn ? "Last 14 Days" : "14 วันล่าสุด", value: "14" },
    { label: isEn ? "Last 30 Days" : "30 วันล่าสุด", value: "30" },
    { label: isEn ? "Last 90 Days" : "90 วันล่าสุด", value: "90" },
  ];

  const listingTypes = [
    { label: isEn ? "All Types" : "ทั้งหมด", value: "all" },
    { label: isEn ? "For Sale" : "เพื่อขาย", value: "SALE" },
    { label: isEn ? "For Rent" : "เพื่อเช่า", value: "RENT" },
  ];

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "all";
  const currentListingType = searchParams.get("listingType") || "all";
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const activeRange = ranges.find((r) => r.value === currentRange) || ranges[0];

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Always reset to page 1 when filtering
    params.delete("page");
    setIsNavigating(true);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={isEn ? "Analytics Filters" : "ตัวกรองข้อมูลวิเคราะห์"}
        trigger={
          <Button
            variant="outline"
            className="w-full lg:w-[180px] h-12 bg-white border-slate-200 justify-between font-medium hover:bg-slate-50 hover:text-blue-600 transition-all rounded-xl shadow-sm"
            disabled={isNavigating}
          >
            <div className="flex items-center gap-2 truncate">
              {isNavigating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              ) : (
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span className="truncate hidden md:block">{activeRange.label}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
          </Button>
        }
      >
        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {isEn ? "Timeframe" : "ช่วงเวลา"}
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {ranges.map((range) => {
                const isActive = currentRange === range.value;
                return (
                  <Button
                    key={range.value}
                    variant="ghost"
                    className={cn(
                      "w-full justify-between font-medium h-10 rounded-lg px-3 transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                    onClick={() => updateFilters("range", range.value)}
                  >
                    <span className="">{range.label}</span>
                    {isActive && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {isEn ? "Deal Type" : "ประเภทดีล"}
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {listingTypes.map((type) => {
                const isActive = currentListingType === type.value;
                return (
                  <Button
                    key={type.value}
                    variant="ghost"
                    className={cn(
                      "w-full justify-between font-medium h-10 rounded-lg px-3 transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                    onClick={() => updateFilters("listingType", type.value)}
                  >
                    <span>{type.label}</span>
                    {isActive && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                  </Button>
                );
              })}
            </div>
          </div>

          <Button 
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mt-4"
            onClick={() => setIsOpen(false)}
          >
            {isEn ? "Apply Filters" : "ตกลง"}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}

