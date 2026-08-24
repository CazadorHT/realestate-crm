"use client";

import React from "react";
import { StatsCard } from "./StatsCard";
import { DollarSign, TrendingUp, Briefcase, PieChart as PieChartIcon } from "lucide-react";
import { ExecutiveStats } from "../../executive-queries";
import { 
  calculateTrendPercentage, 
  calculateWeightedEfficiencyScore, 
  getComparisonDisplayLabel 
} from "../../executive-utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PerformanceStatsProps {
  stats: ExecutiveStats;
  compareStats?: ExecutiveStats | null;
  allBranches: { id: string; name: string }[];
  compareTenantId?: string | null;
}

export function PerformanceStats({ 
  stats, 
  compareStats, 
  allBranches, 
  compareTenantId 
}: PerformanceStatsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  // BI Logic Delegation
  const compareLabel = getComparisonDisplayLabel(compareTenantId, allBranches, isEn);
  
  const revenueTrend = calculateTrendPercentage(stats.totalRevenue, compareStats?.totalRevenue, compareLabel);
  const commissionTrend = calculateTrendPercentage(stats.totalCommission, compareStats?.totalCommission, compareLabel);
  const dealsTrend = calculateTrendPercentage(stats.totalDeals, compareStats?.totalDeals, compareLabel);
  
  const scoreData = calculateWeightedEfficiencyScore(stats, compareStats);

  return (
    <div id="tour-stats" className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title={isEn ? "Total Revenue" : "ยอดขายรวม (Revenue)"}
        value={stats.totalRevenue}
        icon={DollarSign}
        description={isEn ? `Gross sales & leases combined (${stats.totalDeals} deals)` : `รวมยอดขายและยอดเช่าทั้งหมด (${stats.totalDeals} ดีล)`}
        trend={revenueTrend.text}
        trendValue={revenueTrend.value}
        color="blue"
        compareValue={compareStats?.totalRevenue}
      />
      <StatsCard
        title={isEn ? "Total Commission" : "ค่าคอมมิชชั่นรวม"}
        value={stats.totalCommission}
        icon={TrendingUp}
        description={isEn ? "Net earned agency commission" : "รายได้จริงจากค่าคอมมิชชั่น"}
        trend={commissionTrend.text}
        trendValue={commissionTrend.value}
        color="emerald"
        compareValue={compareStats?.totalCommission}
      />
      <StatsCard
        title={isEn ? "Total Transactions" : "จำนวนธุรกรรมรวม"}
        value={stats.totalDeals}
        icon={Briefcase}
        description={isEn ? `Sales: ${stats.salesCount} | Leases: ${stats.rentalCount}` : `ยอดขาย ${stats.salesCount} | ยอดเช่า ${stats.rentalCount}`}
        trend={dealsTrend.text}
        trendValue={dealsTrend.value}
        color="indigo"
        isCurrency={false}
        compareValue={compareStats?.totalDeals}
      />
      <StatsCard
        title="Performance Score"
        value={scoreData.score}
        icon={PieChartIcon}
        description={isEn ? "Annual executive efficiency index" : "ดัชนีชี้วัดประสิทธิภาพรายปี"}
        trend={scoreData.trend}
        trendValue={scoreData.value}
        color="amber"
        isCurrency={false}
        suffix="%"
        compareValue={compareStats ? scoreData.score : null}
      />
    </div>
  );
}
