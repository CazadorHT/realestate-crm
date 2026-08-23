"use client";

import { Users, UserPlus, Percent, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leadSourceLabelNullable } from "@/features/leads/labels";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const isEn = language === "en";

  // Calculate top source
  const topSource = Object.entries(stats.bySource).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const topSourceLabel = topSource
    ? leadSourceLabelNullable(topSource[0], language)
    : "-";

  const statItems = [
    {
      title: isEn ? "Total Leads" : "ลีดทั้งหมด",
      value: stats.totalLeads,
      icon: Users,
      desc: isEn ? "All leads in system" : "ลีดทั้งหมดในระบบ",
      color: "text-blue-600",
      bgConfig: "bg-blue-100",
    },
    {
      title: isEn ? "New This Month" : "ลีดใหม่เดือนนี้",
      value: `+${stats.newLeadsMonth}`,
      icon: UserPlus,
      desc: isEn ? "Created this month" : "สร้างในเดือนนี้",
      color: "text-emerald-600",
      bgConfig: "bg-emerald-100",
    },
    {
      title: isEn ? "In Progress" : "กำลังดำเนินการ",
      value: stats.activeLeads,
      icon: Percent,
      desc: isEn ? "Active pipeline" : "อยู่ระหว่างดำเนินการ",
      color: "text-amber-600",
      bgConfig: "bg-amber-100",
    },
    {
      title: isEn ? "Top Source" : "ที่มาสูงสุด",
      value: topSourceLabel,
      icon: Megaphone,
      desc: topSource
        ? isEn
          ? `${topSource[1]} leads`
          : `${topSource[1]} รายการ`
        : isEn
          ? "No Data"
          : "ไม่มีข้อมูล",
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
            <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
