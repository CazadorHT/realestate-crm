"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutiveStats, QuarterlyRevenue } from "../../executive-queries";
import { formatThaiCurrency } from "@/lib/excel-export";

interface QuarterlyBreakdownProps {
  stats: ExecutiveStats;
  quarterlyData: QuarterlyRevenue[];
  className?: string;
}

export function QuarterlyBreakdown({
  stats,
  quarterlyData,
  className,
}: QuarterlyBreakdownProps) {
  return (
    <Card className={cn("border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-indigo-500" />
          สรุปรายไตรมาส (Quarterly)
        </CardTitle>
        <CardDescription>
          ผลงานแยกตามไตรมาสของปีปัจจุบัน
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-6">
          {quarterlyData.map((q) => (
            <div key={q.quarter} className="space-y-2">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-xs sm:text-sm">
                <span className="font-semibold text-slate-600 uppercase tracking-tight">
                  {q.quarter}
                </span>
                <span className="font-semibold text-slate-900">
                  {formatThaiCurrency(q.total)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((q.total / stats.totalRevenue) * 100, 100) || 0}%`,
                  }}
                />
              </div>
              <div className="flex flex-col xs:flex-row justify-between text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-tighter gap-1 xs:gap-0">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  Sales: {formatThaiCurrency(q.sales)}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  Rent: {formatThaiCurrency(q.rent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
