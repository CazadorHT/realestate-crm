"use client";

import type { PipelineData } from "@/features/dashboard/queries";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PipelineSummaryProps {
  data: PipelineData[];
}

export function PipelineSummary({ data = [] }: PipelineSummaryProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  if (!data || data.length === 0) {
    return (
      <DashboardEmptyState
        icon={TrendingUp}
        title={isEn ? "No Pipeline Data" : "ยังไม่มีข้อมูล Pipeline"}
        description={isEn ? "No active pipeline stages found. Metrics will appear once deals progress." : "ไม่พบข้อมูลขั้นตอนงานในช่วงเวลานี้ ข้อมูลจะเริ่มแสดงเมื่อมีการบันทึกสถานะงาน"}
      />
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="flex flex-col justify-between h-full min-h-[320px] py-2">
      <div className="flex-1 flex flex-col justify-around gap-4 overflow-y-auto pr-1 custom-scrollbar">
        {data.map((stage) => {
          const percentage =
            total > 0 ? Math.round((stage.count / total) * 100) : 0;

          const bgClass = stage.color.includes("bg-")
            ? stage.color
            : `bg-${stage.color}`;

          return (
            <div key={stage.stage} className="space-y-2.5 group cursor-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {stage.label}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 shadow-xs">
                    {percentage}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold text-slate-900 tabular-nums leading-none">
                    {stage.count}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">
                    {isEn ? "deals" : "รายการ"}
                  </span>
                </div>
              </div>

              <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50">
                <div
                  className={`h-full ${bgClass} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{isEn ? "Current Pipeline" : "สถานะปัจจุบัน"}</span>
          <span className="text-xs font-semibold text-slate-500">{isEn ? "Real-time updates" : "ข้อมูลอัปเดตเรียลไทม์"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/50">
           <span className="text-[10px] text-indigo-400 uppercase font-semibold">{isEn ? "Total" : "รวม"}</span>
           {total.toLocaleString()} {isEn ? "deals" : "รายการ"}
        </div>
      </div>
    </div>
  );
}
