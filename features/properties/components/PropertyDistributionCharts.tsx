"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertyDistributionChartsProps {
  typeData: any[];
  statusData: any[];
  handleTypeClick: (data: any) => void;
  handleStatusClick: (data: any) => void;
  isEn?: boolean;
}

const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-bold pointer-events-none"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function PropertyDistributionCharts({
  typeData,
  statusData,
  handleTypeClick,
  handleStatusClick,
  isEn: propIsEn,
}: PropertyDistributionChartsProps) {
  const { language } = useLanguage();
  const isEn = propIsEn !== undefined ? propIsEn : language === "en";
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[400px] animate-pulse bg-slate-50" />
        <Card className="h-[400px] animate-pulse bg-slate-50" />
      </div>
    );
  }

  const hasTypeData = typeData && typeData.length > 0 && typeData.some(item => item.value > 0);
  const hasStatusData = statusData && statusData.length > 0 && statusData.some(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Type Distribution - Pie Chart */}
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-linear-to-br from-white to-slate-50 min-w-0">
        <CardHeader className="pb-2 border-b border-slate-100/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                {isEn ? "Property Type Distribution" : "สัดส่วนประเภททรัพย์"}
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isEn ? "Click chart slices to filter by type" : "คลิกที่กราฟเพื่อกรองตามประเภท"}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {hasTypeData ? (
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="99%" height={300}>
                <PieChart>
                  <defs>
                    {typeData.map((entry, index) => (
                      <linearGradient
                        key={`gradient-${index}`}
                        id={`colorGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                    onClick={handleTypeClick}
                    className="cursor-pointer outline-none drop-shadow-md"
                    stroke="none"
                  >
                    {typeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#colorGradient-${index})`}
                        className="hover:opacity-90 transition-all duration-200 hover:drop-shadow-lg"
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      <span key="val" className="font-bold">{value} {isEn ? "listings" : "รายการ"}</span>,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      padding: "12px 16px",
                      background: "white",
                    }}
                    itemStyle={{ color: "#334155", fontWeight: 500 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-sm text-slate-600 font-medium ml-1">{value}</span>
                    )}
                    wrapperStyle={{ paddingTop: "16px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 text-center animate-in fade-in duration-300">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-3 shadow-inner">
                <PieChartIcon className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">{isEn ? "No Property Type Data" : "ยังไม่มีข้อมูลประเภททรัพย์"}</h4>
              <p className="text-xs text-slate-500 max-w-xs">{isEn ? "No properties match your current filters or selected period." : "ไม่พบรายการอสังหาริมทรัพย์สำหรับตัวกรองหรือช่วงเวลาที่คุณเลือกในขณะนี้"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution - Bar Chart */}
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-linear-to-br from-white to-slate-50 min-w-0">
        <CardHeader className="pb-2 border-b border-slate-100/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                {isEn ? "Property Status" : "สถานะทรัพย์สิน"}
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isEn ? "Click bar to filter by status" : "คลิกที่แท่งกราฟเพื่อกรองตามสถานะ"}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {hasStatusData ? (
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="99%" height={300}>
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ left: 10, right: 24, top: 8, bottom: 8 }}
                  onClick={handleStatusClick}
                  className="cursor-pointer"
                >
                  <defs>
                    {statusData.map((entry, index) => (
                      <linearGradient
                        key={`bar-gradient-${index}`}
                        id={`barGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59, 130, 246, 0.05)", radius: 8 }}
                    formatter={(value: any) => [
                      <span key="val" className="font-bold">{value} {isEn ? "listings" : "รายการ"}</span>,
                      isEn ? "Count" : "จำนวน",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      padding: "12px 16px",
                      background: "white",
                    }}
                    itemStyle={{ color: "#334155", fontWeight: 500 }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    barSize={28}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-status-${index}`}
                        fill={`url(#barGradient-${index})`}
                        className="hover:brightness-110 transition-all duration-200"
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 text-center animate-in fade-in duration-300">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-3 shadow-inner">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">{isEn ? "No Property Status Data" : "ยังไม่มีข้อมูลสถานะทรัพย์สิน"}</h4>
              <p className="text-xs text-slate-500 max-w-xs">{isEn ? "No property status records found for your current filters." : "ไม่พบการระบุสถานะทรัพย์สินสำหรับตัวกรองหรือช่วงเวลาที่คุณเลือกในขณะนี้"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
