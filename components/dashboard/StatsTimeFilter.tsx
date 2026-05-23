"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, Layers, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Badge } from "@/components/ui/badge";

interface TimeRangeOption {
  label: string;
  value: string;
  icon: any;
  sublabel?: string;
}

const GENERAL_RANGES: TimeRangeOption[] = [
  { label: "ทั้งหมด", value: "all", icon: Clock },
  { label: "เดือนนี้", value: "this-month", icon: Calendar },
  { label: "6 เดือน", value: "6-months", icon: Calendar },
  { label: "1 ปี", value: "1-year", icon: Calendar },
];

const QUARTER_RANGES: TimeRangeOption[] = [
  { label: "ไตรมาส 1", sublabel: "(ม.ค. - มี.ค.)", value: "q1", icon: Layers },
  { label: "ไตรมาส 2", sublabel: "(เม.ย. - มิ.ย.)", value: "q2", icon: Layers },
  { label: "ไตรมาส 3", sublabel: "(ก.ค. - ก.ย.)", value: "q3", icon: Layers },
  { label: "ไตรมาส 4", sublabel: "(ต.ค. - ธ.ค.)", value: "q4", icon: Layers },
];

export function StatsTimeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("timeRange") || "all";

  const allOptions = [...GENERAL_RANGES, ...QUARTER_RANGES];
  const activeOption = allOptions.find((opt) => opt.value === currentRange) || GENERAL_RANGES[0];

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("timeRange");
    } else {
      params.set("timeRange", value);
    }
    const query = params.toString();
    router.push(query ? `?${query}` : window.location.pathname);
  };

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <ResponsiveDialog
        title="เลือกช่วงเวลาแสดงผล"
        trigger={
          <Button
            variant="outline"
            className="h-12 px-5 rounded-2xl bg-white border-slate-200 shadow-sm hover:border-blue-200 transition-all group flex items-center gap-3 active:scale-95"
          >
            <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100! transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start pr-4">
              <span className="text-[10px] font-semibolduppercase tracking-widest leading-none mb-1">
                ช่วงเวลาที่เลือก
              </span>
              <span className="text-sm font-semibold leading-none">
                {activeOption.label}{" "}
                {activeOption.sublabel && (
                  <span className="text-[10px] text-slate-400 font-medium">{activeOption.sublabel}</span>
                )}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Button>
        }
      >
        <div className="p-6 space-y-8 scroll-smooth overflow-y-auto no-scrollbar max-h-[80vh]">
          {/* General Ranges */}
          <div className="space-y-3">
             <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
               <Calendar className="h-3 w-3" /> ช่วงเวลาทั่วไป
             </span>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
               {GENERAL_RANGES.map((range) => {
                 const isActive = currentRange === range.value;
                 return (
                   <Button
                     key={range.value}
                     variant="ghost"
                     onClick={() => handleRangeChange(range.value)}
                     className={cn(
                       "h-14 justify-between px-4 rounded-xl border transition-all",
                       isActive 
                        ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm" 
                        : "text-slate-600 border-transparent hover:bg-slate-50"
                     )}
                   >
                     <div className="flex items-center gap-3">
                       <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isActive ? "bg-white" : "bg-slate-100")}>
                         <range.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-400")} />
                       </div>
                       <span className="font-semibold text-sm">{range.label}</span>
                     </div>
                     {isActive && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                   </Button>
                 );
               })}
             </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Quarter Ranges */}
          <div className="space-y-3 pb-8">
             <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
               <Layers className="h-3 w-3" /> แยกตามไตรมาส
             </span>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
               {QUARTER_RANGES.map((range) => {
                 const isActive = currentRange === range.value;
                 return (
                   <Button
                     key={range.value}
                     variant="ghost"
                     onClick={() => handleRangeChange(range.value)}
                     className={cn(
                       "h-16 justify-between px-4 rounded-xl border transition-all",
                       isActive 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" 
                        : "text-slate-600 border-transparent hover:bg-slate-50"
                     )}
                   >
                     <div className="flex items-center gap-3 text-left">
                       <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isActive ? "bg-white" : "bg-slate-100")}>
                         <range.icon className={cn("h-4 w-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                       </div>
                       <div className="flex flex-col">
                         <span className="font-semibold text-sm leading-tight">{range.label}</span>
                         <span className="text-[10px] font-medium opacity-60 leading-tight">{range.sublabel}</span>
                       </div>
                     </div>
                     {isActive && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                   </Button>
                 );
               })}
             </div>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
