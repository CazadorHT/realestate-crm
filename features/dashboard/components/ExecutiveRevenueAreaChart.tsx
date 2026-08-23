"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  TooltipValueType,
} from "recharts";
import { formatThaiCurrency } from "@/lib/excel-export";
import { MonthlyRevenue } from "../executive-queries";
import { useLanguage } from "@/lib/i18n/language-context";

interface ExecutiveRevenueAreaChartProps {
  monthlyData: MonthlyRevenue[];
  compareMonthlyData?: MonthlyRevenue[] | null;
}

export default function ExecutiveRevenueAreaChart({
  monthlyData,
  compareMonthlyData,
}: ExecutiveRevenueAreaChartProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <AreaChart
        data={monthlyData.map((m, i) => ({
          ...m,
          salesCompare: compareMonthlyData
            ? compareMonthlyData[i]?.sales
            : undefined,
          rentCompare: compareMonthlyData
            ? compareMonthlyData[i]?.rent
            : undefined,
        }))}
      >
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
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
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 10 }}
          dy={10}
          interval="preserveStartEnd"
          minTickGap={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 10 }}
          tickFormatter={(val) => `฿${(val / 1000000).toFixed(1)}M`}
          width={45}
        />
        <RechartsTooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          }}
          formatter={(val: TooltipValueType | undefined) => [
            formatThaiCurrency(Number(val || 0)),
            "",
          ]}
        />
        <Legend verticalAlign="top" height={36} />
        <Area
          type="monotone"
          dataKey="sales"
          name={isEn ? "Sales Revenue" : "ยอดขาย"}
          stroke="#3b82f6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorSales)"
        />
        {compareMonthlyData && (
          <Area
            type="monotone"
            dataKey="salesCompare"
            name={isEn ? "Sales Revenue (Compare)" : "ยอดขาย (เปรียบเทียบ)"}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="transparent"
          />
        )}
        <Area
          type="monotone"
          dataKey="rent"
          name={isEn ? "Rental Revenue" : "ยอดเช่า"}
          stroke="#10b981"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorRent)"
        />
        {compareMonthlyData && (
          <Area
            type="monotone"
            dataKey="rentCompare"
            name={isEn ? "Rental Revenue (Compare)" : "ยอดเช่า (เปรียบเทียบ)"}
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="transparent"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

