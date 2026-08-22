"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useState, useEffect } from "react";
import type { RevenueChartData } from "@/features/dashboard/queries";

import { DashboardEmptyState } from "./DashboardEmptyState";
import { Wallet } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface RevenueChartProps {
  data: RevenueChartData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const isEn = language === "en";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data || data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <DashboardEmptyState
        icon={Wallet}
        title={isEn ? "No Revenue Data" : "ยังไม่มีข้อมูลรายได้"}
        description={isEn ? "No closed deals recorded for this period." : "ไม่พบข้อมูลยอดขายหรือเช่าที่ปิดงานได้ในช่วงเวลานี้ ข้อมูลจะแสดงเมื่อมีการบันทึกดีลสำเร็จ"}
      />
    );
  }

  return (
    <div className="h-[300px] w-full relative">
      <div className="h-[280px] w-full relative">
          {mounted ? (
            <ResponsiveContainer width="99%" height={280} minWidth={0}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <defs>
                  <linearGradient
                    id="revenueBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  dy={5}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `฿${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.05)", radius: 8 }}
                  contentStyle={{
                    borderRadius: "14px",
                    border: "none",
                    boxShadow:
                      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    padding: "12px 16px",
                  }}
                  formatter={(value: any) => [
                    <span key="val" className="font-bold text-slate-900">
                      ฿{value.toLocaleString()}
                    </span>,
                    <span key="label" className="text-slate-500">
                      {isEn ? "Revenue" : "รายได้"}
                    </span>,
                  ]}
                />
                <Bar
                  dataKey="total"
                  fill="url(#revenueBarGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full" />
          )}
        </div>
    </div>
  );
}
