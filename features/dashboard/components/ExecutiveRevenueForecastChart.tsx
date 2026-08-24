"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import { ForecastData } from "@/features/analytics/market-intelligence";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ExecutiveRevenueForecastChartProps {
  data: ForecastData[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-xl shadow-blue-900/5 min-w-[200px]">
        <p className="text-sm font-bold text-slate-800 mb-2 border-b pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-700">
                ฿{Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
          {payload[1] && (
            <div className="mt-2 pt-2 border-t border-dashed flex items-center justify-between">
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Confidence</span>
              <span className="text-xs font-bold text-blue-600">
                {Math.round((payload[1].payload as ForecastData).confidenceScore * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const ExecutiveRevenueForecastChart = ({ data }: ExecutiveRevenueForecastChartProps) => {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 35, right: 30, left: 25, bottom: 10 }}
      >
        <defs>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke="#f1f5f9" 
        />
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          dy={10}
        />
        <YAxis 
          width={65}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickFormatter={(value) => `฿${value / 1000}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
        
        {/* Actual Revenue Line */}
        <Area
          name={isEn ? "Actual Revenue" : "รายได้จริง"}
          type="monotone"
          dataKey="actualRevenue"
          stroke="#3b82f6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorActual)"
          activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
        />
        
        {/* Predicted Revenue Line */}
        <Area
          name={isEn ? "Predicted Revenue (AI)" : "รายได้ทำนาย (AI)"}
          type="monotone"
          dataKey="predictedRevenue"
          stroke="#8b5cf6"
          strokeWidth={3}
          strokeDasharray="5 5"
          fillOpacity={1}
          fill="url(#colorPredict)"
          activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
        />

        {/* Reference Line for Current Month */}
        <ReferenceLine 
          x={data[6]?.month} 
          stroke="#ef4444" 
          strokeDasharray="3 3"
          label={{ 
            position: 'top', 
            value: isEn ? 'Current' : 'ปัจจุบัน', 
            fill: '#ef4444', 
            fontSize: 10,
            fontWeight: 'bold'
          }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ExecutiveRevenueForecastChart;
