"use client";

import React, { memo } from "react";
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
import { useLanguage } from "@/lib/i18n/language-context";

interface ExecutiveChartsProps {
  data: any[];
}

// 🛡️ Elite Optimization: Wrapped with memo to prevent redundant re-renders
export const ExecutiveLeadsChart = memo(function ExecutiveLeadsChart({ data }: ExecutiveChartsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  
  return (
    <div className="h-[350px] w-full relative">
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
              padding: "12px",
            }}
            itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", paddingBottom: "20px" }} 
          />
          <Area
            type="monotone"
            dataKey="leadCount"
            name={isEn ? "Total Leads" : "จำนวนลีด"}
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorLeads)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export const ExecutiveDealsChart = memo(function ExecutiveDealsChart({ data }: ExecutiveChartsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="h-[350px] w-full relative">
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
              padding: "12px",
            }}
            itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", paddingBottom: "20px" }} 
          />
          <Area
            type="monotone"
            dataKey="dealCount"
            name={isEn ? "Won Deals" : "จำนวนดีลชนะ"}
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorDeals)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

