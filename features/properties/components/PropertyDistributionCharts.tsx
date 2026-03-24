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
import { Building2, TrendingUp } from "lucide-react";

interface PropertyDistributionChartsProps {
  typeData: any[];
  statusData: any[];
  handleTypeClick: (data: any) => void;
  handleStatusClick: (data: any) => void;
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
}: PropertyDistributionChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Type Distribution - Pie Chart */}
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-linear-to-br from-white to-slate-50">
        <CardHeader className="pb-2 border-b border-slate-100/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                สัดส่วนประเภททรัพย์
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                คลิกที่กราฟเพื่อกรองตามประเภท
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              debounce={50}
            >
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
                      <stop
                        offset="0%"
                        stopColor={entry.color}
                        stopOpacity={1}
                      />
                      <stop
                        offset="100%"
                        stopColor={entry.color}
                        stopOpacity={0.7}
                      />
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
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    <span key="val" className="font-bold">
                      {value} รายการ
                    </span>,
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
                    <span className="text-sm text-slate-600 font-medium ml-1">
                      {value}
                    </span>
                  )}
                  wrapperStyle={{ paddingTop: "16px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution - Bar Chart */}
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-linear-to-br from-white to-slate-50">
        <CardHeader className="pb-2 border-b border-slate-100/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                สถานะทรัพย์สิน
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                คลิกที่แท่งกราฟเพื่อกรองตามสถานะ
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              debounce={50}
            >
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
                      <stop
                        offset="0%"
                        stopColor={entry.color}
                        stopOpacity={0.85}
                      />
                      <stop
                        offset="100%"
                        stopColor={entry.color}
                        stopOpacity={1}
                      />
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
                    <span key="val" className="font-bold">
                      {value} รายการ
                    </span>,
                    "จำนวน",
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
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
