import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, TrendingUp, CheckCircle2 } from "lucide-react";
import type { DashboardStats } from "@/features/dashboard/queries";

interface StatsOverviewProps {
  stats: DashboardStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statItems = [
    {
      title: "รายได้เดือนนี้",
      value: `฿${stats.revenueThisMonth.toLocaleString()}`,
      change: stats.revenueChange,
      context: "ยอดขาย + เช่า (Sold/Rented)",
      icon: DollarSign,
    },
    {
      title: "Leads ทั้งหมด",
      value: stats.leadsThisMonth.toString(),
      change: stats.leadsChange,
      context: `รวม ${stats.leadsTotal} ราย`,
      icon: Briefcase,
    },
    {
      title: "ค่าคอมมิชชั่น",
      value: `฿${stats.totalCommission.toLocaleString()}`,
      change: stats.revenueChange, // Using revenue change as proxy for now, or add specific commission change later
      context: "รายได้ค่าคอมมิชชั่นรวม",
      icon: DollarSign,
      color: "text-yellow-600",
    },
    {
      title: "ปิดการขาย (Won)",
      value: stats.dealsWon.toString(),
      change: stats.dealsWonChange,
      context: `เป้าหมาย: ${stats.dealsTarget}`,
      icon: CheckCircle2,
      color: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat, index) => (
        <Card key={index} className="shadow-sm">
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
  );
}
