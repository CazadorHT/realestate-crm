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
    <Card className="shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="6months">6 เดือนล่าสุด</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  ปี {year}
                </SelectItem>
              ))}
              <SelectItem value="all">ทั้งหมด</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          )}
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={0}
            minWidth={0}
          >
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `฿${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: any) => [
                  `฿${value.toLocaleString()}`,
                  "รายได้",
                ]}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
