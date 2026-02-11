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
        <p className="text-sm text-slate-500 dark:text-slate-400">
          แสดงข้อมูล:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {timeRangeLabels[timeRange]}
          </span>
        </p>
        <button
          onClick={cycleTimeRange}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline"
        >
          เปลี่ยนช่วงเวลา →
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 group cursor-pointer ${
                loading ? "opacity-60" : ""
              }`}
              onClick={cycleTimeRange}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-2.5 rounded-xl ${
                      index === 0
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : index === 1
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                          : index === 2
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      stat.change.startsWith("+")
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                    }`}
                  >
                    {stat.change}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                    {stat.title}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">
                    {stat.context}
                  </p>
                </div>

                {/* Decorative subtle background icon */}
                <Icon className="absolute -bottom-2 -right-2 h-16 w-16 text-slate-100 dark:text-slate-800/50 opacity-10 group-hover:scale-110 transition-transform duration-500" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading && (
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 animate-pulse">
          กำลังโหลดข้อมูล...
        </p>
      )}
    </div>
  );
}
