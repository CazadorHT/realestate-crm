"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { AuditLogEntry } from "@/features/audit/types";

interface PriceHistoryChartProps {
  logs: AuditLogEntry[];
}

export function PriceHistoryChart({ logs }: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    // 1. Extract price points from logs
    // We want to see how the price changed over time.
    // Each log entry represents a point in time (created_at) and a value (new_state.price)
    
    const points = logs
      .filter((log: AuditLogEntry) => {
        const metadata = log.metadata || {};
        return (metadata.new_state?.price !== undefined || metadata.new_state?.rental_price !== undefined);
      })
      .map((log: AuditLogEntry) => {
        const metadata = log.metadata || {};
        const price = metadata.new_state?.price || 0;
        const rentalPrice = metadata.new_state?.rental_price || 0;
        
        return {
          timestamp: new Date(log.created_at).getTime(),
          date: format(new Date(log.created_at), "d MMM", { locale: th }),
          fullDate: format(new Date(log.created_at), "PPP", { locale: th }),
          price: price > 0 ? price : undefined,
          rentalPrice: rentalPrice > 0 ? rentalPrice : undefined,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by time ascending for the chart

    return points;
  }, [logs]);

  if (chartData.length < 2) {
    return null; // Don't show chart if we don't have enough history
  }

  const formatYAxis = (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return "฿0";
    if (num >= 1000000) return `฿${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `฿${(num / 1000).toFixed(0)}k`;
    return `฿${num}`;
  };

  return (
    <div className="mb-8 w-full">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">แนวโน้มราคา (Price History)</h4>
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          {chartData.some(d => d.price) && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>ราคาขาย</span>
            </div>
          )}
          {chartData.some(d => d.rentalPrice) && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>ราคาเช่า</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-[200px] w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRental" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={formatYAxis}
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
              formatter={(value: any) => [formatYAxis(value), ""]}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
            />
            {chartData.some(d => d.price) && (
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            )}
            {chartData.some(d => d.rentalPrice) && (
              <Area 
                type="monotone" 
                dataKey="rentalPrice" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRental)" 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
