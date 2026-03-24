"use client";

import React from "react";
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

export function RevenueChartSection({
  monthlyData,
  compareMonthlyData,
  topAgents,
  mounted,
}: RevenueChartSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      {/* Monthly Revenue Chart */}
      <Card className="lg:col-span-4 border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            แนวโน้มรายได้รายเดือน (Sale vs Rent)
          </CardTitle>
          <CardDescription>
            การเปรียบเทียบยอดขายและยอดเช่าในแต่ละเดือน
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {mounted && (
            <ExecutiveRevenueAreaChart
              monthlyData={monthlyData}
              compareMonthlyData={compareMonthlyData}
            />
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
}
