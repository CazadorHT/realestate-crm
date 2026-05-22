"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ViewsTrendData } from "@/features/dashboard/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface AnalyticsTrendProps {
  data: ViewsTrendData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl">
        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-blue-600">
          {payload[0].value.toLocaleString()} Views
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsTrend({ data }: AnalyticsTrendProps) {
  // Format date for display
  const chartData = data.map((d) => ({
    ...d,
    formattedDate: format(new Date(d.date), "d MMM", { locale: th }),
  }));

  return (
    <Card className="border-none shadow-soft overflow-hidden bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">แนวโน้มการเข้าชม (Interest Trend)</CardTitle>
        <CardDescription>สถิติการเข้าชมรายวันในช่วงเวลาที่เลือก</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorViews)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
