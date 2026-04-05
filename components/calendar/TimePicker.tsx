"use client";

import { useState, useMemo } from "react";
import {
  Clock,
  ChevronRight,
  Sun,
  CloudSun,
  Moon,
  Check,
} from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
}

// Generate all 15-min slots
const ALL_SLOTS = Array.from({ length: 96 }).map((_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const time = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
  
  let period: "MORNING" | "AFTERNOON" | "EVENING" = "MORNING";
  if (hour >= 12 && hour < 17) period = "AFTERNOON";
  if (hour >= 17 || hour < 6) period = "EVENING";

  return { time, hour, minute, period };
});

const PERIODS = [
  { id: "MORNING", label: "เช้า (06:00 - 12:00)", icon: CloudSun, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "AFTERNOON", label: "บ่าย (12:00 - 17:00)", icon: Sun, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "EVENING", label: "เย็น/ค่ำ (17:00 - 06:00)", icon: Moon, color: "text-indigo-600", bg: "bg-indigo-50" },
] as const;

export function TimePicker({ value, onChange, name, required }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<typeof PERIODS[number]["id"]>(() => {
    if (!value) return "MORNING";
    const hour = parseInt(value.split(":")[0]);
    if (hour >= 12 && hour < 17) return "AFTERNOON";
    if (hour >= 17 || hour < 6) return "EVENING";
    return "MORNING";
  });

  const filteredSlots = useMemo(() => {
    return ALL_SLOTS.filter(s => s.period === activePeriod);
  }, [activePeriod]);

  const handleSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  const trigger = (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full h-11 justify-start px-3 rounded-xl border-slate-200 transition-all font-bold",
          value ? "text-slate-900 bg-purple-50/30 border-purple-100" : "text-slate-400 font-normal"
        )}
      >
        <Clock className={cn("mr-2 h-4 w-4", value ? "text-purple-600" : "text-slate-300")} />
        {value ? `${value} น.` : "เลือกเวลา..."}
        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
      </Button>
      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="เลือกเวลา"
      description="แบ่งตามช่วงเวลาเพื่อให้ค้นหาได้ง่ายขึ้น"
      className="sm:max-w-[500px]"
      trigger={trigger}
    >
      <div className="flex flex-col h-full bg-slate-50/30">
        {/* Period Tabs */}
        <div className="flex p-2 gap-1 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
          {PERIODS.map((p) => {
            const isActive = activePeriod === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePeriod(p.id)}
                className={cn(
                  "flex-1 min-w-[100px] flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all border",
                  isActive 
                    ? cn("bg-white shadow-sm border-slate-200", p.color)
                    : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                )}
              >
                <p.icon className={cn("h-5 w-5", isActive ? p.color : "opacity-50")} />
                <span className="text-[10px] font-bold uppercase tracking-tight">{p.label.split(" (")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Time Slots Grid */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[50vh] min-h-[300px]">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredSlots.map((slot) => {
              const isSelected = value === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => handleSelect(slot.time)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 group relative",
                    isSelected
                      ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100 z-10"
                      : "bg-white border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 text-slate-600"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold tracking-tight",
                    isSelected ? "text-white" : "group-hover:text-purple-600 transition-colors"
                  )}>
                    {slot.time}
                  </span>
                  <span className={cn(
                    "text-[8px] font-medium opacity-60 uppercase",
                    isSelected ? "text-white/80" : "text-slate-400"
                  )}>
                    นัดหมาย
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-2 w-2 text-white" strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Summary Footer (Sticky) */}
        {value && (
          <div className="bg-white border-t border-slate-100 p-4 sticky bottom-0">
            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border border-purple-100">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">เวลาที่เลือก</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight">{value} น.</p>
                  </div>
               </div>
               <Button onClick={() => setOpen(false)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
                 ยืนยัน
               </Button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
