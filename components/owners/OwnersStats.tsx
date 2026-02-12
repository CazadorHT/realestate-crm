"use client";

import { Users, UserPlus, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OwnersStatsProps {
  stats: {
    totalOwners: number;
    newOwnersMonth: number;
    totalPropertiesLinked: number;
  };
}

export function OwnersStats({ stats }: OwnersStatsProps) {
  const statItems = [
    {
      title: "เจ้าของทั้งหมด",
      value: stats.totalOwners,
      icon: Users,
      desc: "Total Owners",
      color: "text-blue-600",
      bgConfig: "bg-blue-100",
    },
    {
      title: "เจ้าของใหม่ (เดือนนี้)",
      value: `+${stats.newOwnersMonth}`,
      icon: UserPlus,
      desc: "New This Month",
      color: "text-emerald-600",
      bgConfig: "bg-emerald-100",
    },
    {
      title: "ทรัพย์สินที่ดูแล",
      value: stats.totalPropertiesLinked,
      icon: Building2,
      desc: "Linked Properties",
      color: "text-purple-600",
      bgConfig: "bg-purple-100",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3">
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
