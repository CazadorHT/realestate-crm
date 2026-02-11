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

interface RevenueChartProps {
  initialData: RevenueChartData[];
}

export function RevenueChart({ initialData }: RevenueChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>("6months");
  const [data, setData] = useState<RevenueChartData[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Generate year options (current year and 2 years back)
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/revenue?year=${selectedYear}`);
        if (res.ok) {
          const result = await res.json();
          setData(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedYear !== "6months") {
      fetchData();
    } else {
      setData(initialData);
    }
  }, [selectedYear, initialData]);

  const title =
    selectedYear === "all"
      ? "รายได้ทั้งหมด (แบ่งตามปี)"
      : selectedYear === "month"
        ? "รายได้เดือนนี้"
        : selectedYear === "6months"
          ? "รายได้ 6 เดือนล่าสุด"
          : selectedYear === "year"
            ? `รายได้ปี ${currentYear}`
            : `รายได้ปี ${selectedYear}`;

  return (
    <Card className="shadow-lg border-none bg-white dark:bg-slate-900 overflow-hidden group h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              {title}
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium ml-3.5">
              แสดงข้อมูลรายได้ตามช่วงเวลาที่กำหนด
            </p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-semibold focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl border-slate-100">
              <SelectItem value="month" className="rounded-lg">
                เดือนนี้
              </SelectItem>
              <SelectItem value="6months" className="rounded-lg">
                6 เดือนล่าสุด
              </SelectItem>
              <SelectItem value="year" className="rounded-lg">
                ปีนี้
              </SelectItem>
              {yearOptions.map((year) => (
                <SelectItem
                  key={year}
                  value={year.toString()}
                  className="rounded-lg"
                >
                  ปี {year}
                </SelectItem>
              ))}
              <SelectItem value="all" className="rounded-lg">
                ทั้งหมด
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px] w-full relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent shadow-lg"></div>
            </div>
          )}

          {!data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 text-sm font-medium">
                ไม่มีข้อมูลรายได้ในช่วงนี้
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 20, bottom: 20 }}
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
                  dy={10}
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
                      รายได้
                    </span>,
                  ]}
                />
                <Bar
                  dataKey="total"
                  fill="url(#revenueBarGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={data.length > 7 ? 20 : 35}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
