"use client";

import React, { memo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { CommissionLeaderboard } from "../CommissionLeaderboard";
import { MonthlyRevenue } from "../../executive-queries";
import { TopAgent } from "../../queries";

const ExecutiveRevenueAreaChart = dynamic(
  () => import("../ExecutiveRevenueAreaChart").then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-xl" />
    ),
  },
);

interface RevenueChartSectionProps {
  monthlyData: MonthlyRevenue[];
  compareMonthlyData?: MonthlyRevenue[] | null;
  topAgents: TopAgent[];
  mounted: boolean;
}

export const RevenueChartSection = memo(function RevenueChartSection({
  monthlyData,
  compareMonthlyData,
  topAgents,
  mounted,
}: RevenueChartSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      {/* Monthly Revenue Chart */}
      <Card className="lg:col-span-4 border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            แนวโน้มรายได้ (Sale vs Rent)
          </CardTitle>
          <CardDescription className="text-xs">
            การเปรียบเทียบยอดขายและยอดเช่าในแต่ละเดือน
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[400px] px-2 sm:px-6 relative">
          {mounted ? (
            <ExecutiveRevenueAreaChart
              monthlyData={monthlyData}
              compareMonthlyData={compareMonthlyData}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col justify-end p-6 gap-4 animate-pulse">
              <div className="h-full w-full bg-slate-100/50 rounded-2xl relative overflow-hidden">
                {/* Horizontal Grid Line Skeletons */}
                <div className="absolute inset-0 flex flex-col justify-around py-4 opacity-30">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-px w-full bg-slate-200" />
                  ))}
                </div>
                {/* Bar/Area Chart Skeletons */}
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-linear-to-t from-blue-100/50 to-transparent flex items-end justify-around px-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="w-[12%] bg-blue-100/80 rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Leaderboard (Gamified) */}
      <div className="lg:col-span-3 h-full">
        <CommissionLeaderboard
          data={topAgents}
          title="🏆 Agent Ranking"
        />
      </div>
    </div>
  );
});
