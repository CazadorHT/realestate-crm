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
import { formatThaiCurrency } from "@/lib/excel-export";
import { ExecutiveStats, QuarterlyRevenue } from "../../executive-queries";

interface QuarterlyBreakdownProps {
  stats: ExecutiveStats;
  quarterlyData: QuarterlyRevenue[];
}

export function QuarterlyBreakdown({
  stats,
  quarterlyData,
}: QuarterlyBreakdownProps) {
  return (
    <Card className="lg:col-span-3 border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-indigo-500" />
          สรุปรายไตรมาส (Quarterly)
        </CardTitle>
        <CardDescription>
          ผลงานแยกตามไตรมาสของปีปัจจุบัน
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {quarterlyData.map((q) => (
            <div key={q.quarter} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  {q.quarter}
                </span>
                <span className="font-bold text-slate-900">
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
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Sales: {formatThaiCurrency(q.sales)}</span>
                <span>Rent: {formatThaiCurrency(q.rent)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
