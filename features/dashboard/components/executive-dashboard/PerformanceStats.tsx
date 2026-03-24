"use client";

import React from "react";
import { StatsCard } from "./StatsCard";
import { DollarSign, TrendingUp, Briefcase, PieChart as PieChartIcon } from "lucide-react";
import { ExecutiveStats } from "../../executive-queries";

interface PerformanceStatsProps {
  stats: ExecutiveStats;
  compareStats?: ExecutiveStats | null;
}

export function PerformanceStats({ stats, compareStats }: PerformanceStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="ยอดขายรวม (Revenue)"
        value={stats.totalRevenue}
        icon={DollarSign}
        description="รวมยอดขายและยอดเช่าทั้งหมด"
        trend="+12.5% vs last year"
        color="blue"
        compareValue={compareStats?.totalRevenue}
      />
      <StatsCard
        title="ค่าคอมมิชชั่นรวม"
        value={stats.totalCommission}
        icon={TrendingUp}
        description="รายได้จริงจากค่าคอมมิชชั่น"
        trend="+8.2% vs last year"
        color="emerald"
        compareValue={compareStats?.totalCommission}
      />
      <StatsCard
        title="จำนวนธุรกรรมรวม"
        value={stats.totalDeals}
        icon={Briefcase}
        description={`ยอดขาย ${stats.salesCount} | ยอดเช่า ${stats.rentalCount}`}
        trend={`${stats.totalDeals} Deals Closed`}
        color="indigo"
        isCurrency={false}
        compareValue={compareStats?.totalDeals}
      />
      <StatsCard
        title="Performance Score"
        value={85}
        icon={PieChartIcon}
        description="ประสิทธิภาพเทียบกับเป้าหมาย"
        trend="+5.4% vs last month"
        color="amber"
        isCurrency={false}
        suffix="%"
        compareValue={compareStats ? 85 : null}
      />
    </div>
  );
}
