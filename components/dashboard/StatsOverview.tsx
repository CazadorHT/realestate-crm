"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, TrendingUp, CheckCircle2 } from "lucide-react";
import type { DashboardStats } from "@/features/dashboard/queries";
import { useState, useEffect } from "react";

interface StatsOverviewProps {
  initialStats: DashboardStats;
}

type TimeRange = "month" | "6months" | "year" | "all";

const timeRangeLabels: Record<TimeRange, string> = {
  month: "เดือนนี้",
  "6months": "6 เดือนนี้",
  year: "ปีนี้",
  all: "ทั้งหมด",
};

export function StatsOverview({ initialStats }: StatsOverviewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (timeRange === "month") {
        setStats(initialStats);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/stats?range=${timeRange}`);
        if (res.ok) {
          const result = await res.json();
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange, initialStats]);

  const cycleTimeRange = () => {
    const ranges: TimeRange[] = ["month", "6months", "year", "all"];
    const currentIndex = ranges.indexOf(timeRange);
    const nextIndex = (currentIndex + 1) % ranges.length;
    setTimeRange(ranges[nextIndex]);
  };

  const getTitleSuffix = () => {
    switch (timeRange) {
      case "month":
        return "เดือนนี้";
      case "6months":
        return " 6 เดือนนี้";
      case "year":
        return "ปีนี้";
      case "all":
        return "ทั้งหมด";
    }
  };

  const statItems = [
    {
      title: `รายได้${getTitleSuffix()}`,
      value: `฿${stats.revenueThisMonth.toLocaleString()}`,
      change: stats.revenueChange,
      context: "ยอดขาย + เช่า (Sold/Rented)",
      icon: DollarSign,
    },
    {
      title: `Leads ${getTitleSuffix()}`,
      value: stats.leadsThisMonth.toString(),
      change: stats.leadsChange,
      context: `รวม ${stats.leadsTotal} ราย`,
      icon: Briefcase,
    },
    {
      title: `คอมมิชชั่น${getTitleSuffix()}`,
      value: `฿${stats.totalCommission.toLocaleString()}`,
      change: stats.revenueChange,
      context: "รายได้ค่าคอมมิชชั่นรวม",
      icon: DollarSign,
      color: "text-yellow-600",
    },
    {
      title: `ปิดการขาย${getTitleSuffix()}`,
      value: stats.dealsWon.toString(),
      change: stats.dealsWonChange,
      context: `เป้าหมาย: ${stats.dealsTarget}`,
      icon: CheckCircle2,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Time Range Indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          แสดงข้อมูล:{" "}
          <span className="font-semibold text-slate-700">
            {timeRangeLabels[timeRange]}
          </span>
        </p>
        <button
          onClick={cycleTimeRange}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          เปลี่ยนช่วงเวลา →
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, index) => (
          <Card
            key={index}
            className={`shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
              loading ? "opacity-50" : ""
            }`}
            onClick={cycleTimeRange}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${stat.color || "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <p
                  className={`text-xs font-medium ${
                    stat.change.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stat.change}
                </p>
                <span className="text-muted-foreground text-[10px]">•</span>
                <p className="text-xs text-muted-foreground">{stat.context}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-center text-slate-400 animate-pulse">
          กำลังโหลดข้อมูล...
        </p>
      )}
    </div>
  );
}
