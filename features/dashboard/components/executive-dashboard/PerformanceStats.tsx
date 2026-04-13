"use client";

import React from "react";
import { StatsCard } from "./StatsCard";
import { DollarSign, TrendingUp, Briefcase, PieChart as PieChartIcon } from "lucide-react";
import { ExecutiveStats } from "../../executive-queries";

interface PerformanceStatsProps {
  stats: ExecutiveStats;
  compareStats?: ExecutiveStats | null;
  allBranches: { id: string; name: string }[];
  compareTenantId?: string | null;
}

import { 
  calculateTrendPercentage, 
  calculateWeightedEfficiencyScore, 
  getComparisonDisplayLabel 
} from "../../executive-utils";

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
  // BI Logic Delegation
  const compareLabel = getComparisonDisplayLabel(compareTenantId, allBranches);
  
  const revenueTrend = calculateTrendPercentage(stats.totalRevenue, compareStats?.totalRevenue, compareLabel);
  const commissionTrend = calculateTrendPercentage(stats.totalCommission, compareStats?.totalCommission, compareLabel);
  const dealsTrend = calculateTrendPercentage(stats.totalDeals, compareStats?.totalDeals, compareLabel);
  
  const scoreData = calculateWeightedEfficiencyScore(stats, compareStats);

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="ยอดขายรวม (Revenue)"
        value={stats.totalRevenue}
        icon={DollarSign}
        description="รวมยอดขายและยอดเช่าทั้งหมด"
        trend={revenueTrend.text}
        trendValue={revenueTrend.value}
        color="blue"
        compareValue={compareStats?.totalRevenue}
      />
      <StatsCard
        title="ค่าคอมมิชชั่นรวม"
        value={stats.totalCommission}
        icon={TrendingUp}
        description="รายได้จริงจากค่าคอมมิชชั่น"
        trend={commissionTrend.text}
        trendValue={commissionTrend.value}
        color="emerald"
        compareValue={compareStats?.totalCommission}
      />
      <StatsCard
        title="จำนวนธุรกรรมรวม"
        value={stats.totalDeals}
        icon={Briefcase}
        description={`ยอดขาย ${stats.salesCount} | ยอดเช่า ${stats.rentalCount}`}
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
        description="ดัชนีชี้วัดประสิทธิภาพรายปี"
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
