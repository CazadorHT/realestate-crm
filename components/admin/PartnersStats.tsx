"use client";

import { Users, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PartnersStatsProps {
  stats: {
    totalPartners: number;
    activePartners: number;
    inactivePartners: number;
  };
}

export function PartnersStats({ stats }: PartnersStatsProps) {
  const statItems = [
    {
      title: "พาร์ทเนอร์ทั้งหมด",
      value: stats.totalPartners,
      icon: Users,
      desc: "Total Partners",
      color: "text-blue-600",
      bgConfig: "bg-blue-100",
    },
    {
      title: "กำลังใช้งาน",
      value: stats.activePartners,
      icon: CheckCircle,
      desc: "Active",
      color: "text-emerald-600",
      bgConfig: "bg-emerald-100",
    },
    {
      title: "ปิดใช้งาน",
      value: stats.inactivePartners,
      icon: XCircle,
      desc: "Inactive",
      color: "text-slate-600",
      bgConfig: "bg-slate-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
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
