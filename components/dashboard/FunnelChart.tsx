"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { FunnelData } from "@/features/dashboard/queries";
import {
  Tooltip as ShcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DashboardEmptyState } from "./DashboardEmptyState";
import { BarChart3 } from "lucide-react";

interface FunnelChartProps {
  data: FunnelData[];
}

const stepTranslation: Record<string, string> = {
  "Leads": "ลีดใหม่",
  "Lead": "ลีดใหม่",
  "Contacted": "ติดต่อแล้ว",
  "Contact": "ติดต่อแล้ว",
  "Interested": "สนใจ/นัดชม",
  "Viewed": "นัดชม/พาชม",
  "Viewing": "พาชมทรัพย์",
  "Negotiating": "เจรจาต่อรอง",
  "Negotiation": "เจรจาต่อรอง",
  "Closed Won": "ปิดการขาย",
  "Closed": "ปิดการขาย",
  "Won": "ปิดการขาย",
};

export function FunnelChart({ data }: FunnelChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!data || data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <DashboardEmptyState
        icon={BarChart3}
        title="ยังไม่มีกิจกรรมในระบบ"
        description="ไม่พบข้อมูลลีดหรือความคืบหน้าในช่วงเวลานี้ ข้อมูลจะแสดงเมื่อมีการเพิ่มลีดหรือเปลี่ยนสถานะงาน"
      />
    );
  }

  return (
    <div className="h-[350px] w-full flex gap-4 relative">
        <div className="flex-1 min-w-0 h-full">
                {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="step"
                type="category"
                width={85}
                tickFormatter={(value) => stepTranslation[value] || value}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.02)" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                  padding: "12px",
                }}
                formatter={(value: any, name: any, props: any) => [
                  <span key="count" className="font-black text-indigo-600">{value} รายการ</span>,
                  <span key="label" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stepTranslation[props.payload.step] || props.payload.step}</span>,
                ]}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={35}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    fillOpacity={0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {/* Drop-off Stats - สถิติการหลุดออก */}
      <div className="w-[110px] shrink-0 flex flex-col h-full border-l border-slate-100 bg-slate-50/30 rounded-r-2xl overflow-hidden">
        {/* รายการที่ 1: ลีดใหม่ เพื่อให้ขนานกับแท่งที่ 1 */}
        <div className="h-1/5 flex flex-col items-end justify-center px-4 border-b border-slate-100/50">
          <div className="flex flex-col items-end">
            <span className="font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 text-[11px]">
              {data[0].count}
            </span>
            <span className="opacity-70 text-[9px] mt-1 font-medium text-right leading-tight">
              ★ ลีดใหม่
            </span>
          </div>
        </div>

        {/* รายการที่ 2-5: อัตราการหลุดออก */}
        {data.slice(1).map((step, index) => {
          const prev = data[index];
          const drop = prev.count - step.count;
          const dropRate = prev.count > 0 ? Math.round((drop / prev.count) * 100) : 0;

          return (
            <div
              key={step.step}
              className="h-1/5 flex flex-col items-end justify-center px-4 border-b border-slate-100/50 last:border-0"
            >
              <TooltipProvider>
                <ShcnTooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-end cursor-help">
                      <span className="font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 text-[11px]">
                        {dropRate === 0 ? "0%" : `-${dropRate}%`}
                      </span>
                      <span className="opacity-70 text-[9px] mt-1 font-medium truncate max-w-full text-right leading-tight">
                        ↓ {stepTranslation[step.step] || step.step}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-rose-900 text-white border-rose-800">
                    <p className="font-bold text-rose-100">อัตราการหลุดออก (Drop-off)</p>
                    <p className="text-[10px] opacity-80">มีลูกค้า {drop} ราย ไม่ได้ไปต่อในขั้นตอนนี้</p>
                  </TooltipContent>
                </ShcnTooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </div>
    </div>
  );
}
