"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ExecutiveChartsProps {
  data: any[];
}

export function ExecutiveLeadsChart({ data }: ExecutiveChartsProps) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
        debounce={50}
      >
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="tenantName"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Area
            type="monotone"
            dataKey="leadCount"
            name="จำนวนลีด"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorLeads)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExecutiveDealsChart({ data }: ExecutiveChartsProps) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
        debounce={50}
      >
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="tenantName"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Area
            type="monotone"
            dataKey="dealCount"
            name="จำนวนดีลชนะ"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorDeals)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
