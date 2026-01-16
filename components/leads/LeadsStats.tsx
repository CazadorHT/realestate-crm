"use client";

import { Users, UserPlus, Percent, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_SOURCE_LABELS } from "@/features/leads/labels";

interface LeadsStatsProps {
  stats: {
    totalLeads: number;
    activeLeads: number;
    newLeadsMonth: number;
    byStage: Record<string, number>;
    bySource: Record<string, number>;
  };
}

export function LeadsStats({ stats }: LeadsStatsProps) {
  // Calculate top source
  const topSource = Object.entries(stats.bySource).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const topSourceLabel = topSource
    ? LEAD_SOURCE_LABELS[topSource[0] as keyof typeof LEAD_SOURCE_LABELS] ||
      topSource[0]
    : "-";

  const statItems = [
    {
      title: "ลีดทั้งหมด",
      value: stats.totalLeads,
      icon: Users,
      desc: "Total Leads",
      color: "text-blue-600",
      bgConfig: "bg-blue-100",
    },
    {
      title: "ลีดใหม่เดือนนี้",
      value: `+${stats.newLeadsMonth}`,
      icon: UserPlus,
      desc: "New This Month",
      color: "text-emerald-600",
      bgConfig: "bg-emerald-100",
    },
    {
      title: "กำลังดำเนินการ",
      value: stats.activeLeads,
      icon: Percent,
      desc: "Active (Not Closed)",
      color: "text-amber-600",
      bgConfig: "bg-amber-100",
    },
    {
      title: "ที่มาสูงสุด",
      value: topSourceLabel,
      icon: Megaphone,
      desc: topSource ? `${topSource[1]} รายการ` : "No Data",
      color: "text-purple-600",
      bgConfig: "bg-purple-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, index) => (
        <Card key={index} className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {item.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${item.bgConfig}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
