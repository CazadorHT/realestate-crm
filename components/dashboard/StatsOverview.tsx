import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, TrendingUp, CheckCircle2 } from "lucide-react";
import { KPIS_SUMMARY } from "@/lib/dashboard-data";

export function StatsOverview() {
  const stats = [
    {
      title: "รายได้เดือนนี้",
      value: `฿${KPIS_SUMMARY.revenueThisMonth.toLocaleString()}`,
      change: KPIS_SUMMARY.revenueChange,
      context: "เป้า: ฿1.5M",
      icon: DollarSign,
    },
    {
      title: "Leads ทั้งหมด",
      value: KPIS_SUMMARY.leadsThisMonth.toString(),
      change: KPIS_SUMMARY.leadsChange,
      context: `รวม ${KPIS_SUMMARY.leadsTotal} ราย`,
      icon: Briefcase,
    },
    {
      title: "Conversion Rate",
      value: `${KPIS_SUMMARY.conversionRate}%`,
      change: KPIS_SUMMARY.conversionChange,
      context: KPIS_SUMMARY.conversionBase,
      icon: TrendingUp,
    },
    {
      title: "ปิดการขาย (Won)",
      value: "8",
      change: "+2 จากเดือนก่อน",
      context: "เป้าหมาย: 10",
      icon: CheckCircle2,
      color: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color || "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-xs text-green-600 font-medium">{stat.change}</p>
               <span className="text-muted-foreground text-[10px]">•</span>
               <p className="text-xs text-muted-foreground">{stat.context}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
