"use client";

import React from "react";
import { 
  Zap, 
  CheckCircle2, 
  BarChart3, 
  Bot, 
  FileText 
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend: string;
  color: "indigo" | "emerald" | "yellow" | "pink";
}

function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  color,
}: StatsCardProps) {
  const colorStyles = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100",
    yellow:
      "bg-yellow-50 text-yellow-600 border-yellow-100 group-hover:bg-yellow-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100 group-hover:bg-pink-100",
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-colors ${colorStyles[color].split(" ")[0].replace("-50", "-500")}`}
      />

      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3.5 rounded-2xl border transition-colors ${colorStyles[color]}`}
        >
          {icon}
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-100 shadow-xs ${colorStyles[color].split(" ")[1]}`}
        >
          {trend}
        </span>
      </div>

      <div>
        <div className="text-3xl font-semibold text-blue-700 tracking-tight mb-1">
          {value}
        </div>
        <div className="text-sm font-semibold text-slate-600">{title}</div>
        <div className="text-xs text-slate-400 mt-1.5">{description}</div>
      </div>
    </div>
  );
}

interface AiStatsGridProps {
  stats: {
    totalRequests: number;
    successRate: number;
    totalCostThb: number;
    chatbotUsage: number;
    blogUsage: number;
  };
}

export function AiStatsGrid({ stats }: AiStatsGridProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
      <StatsCard
        title={isEn ? "Total Requests" : "รวมคำขอ (Total Requests)"}
        value={stats.totalRequests.toLocaleString()}
        icon={<Zap className="w-6 h-6 text-yellow-600" />}
        description={isEn ? "Total interactions across system" : "จำนวนการโต้ตอบทั้งหมดในระบบ"}
        trend="Live"
        color="yellow"
      />
      <StatsCard
        title={isEn ? "Success Rate" : "อัตราสำเร็จ (Success Rate)"}
        value={`${stats.successRate}%`}
        icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
        description={isEn ? "System operational stability" : "ความเสถียรของการทำงาน (Operational)"}
        trend="Stable"
        color="emerald"
      />
      <StatsCard
        title={isEn ? "Accumulated Cost (AI Cost)" : "ค่าใช้จ่ายสะสม (AI Cost)"}
        value={`฿${stats.totalCostThb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
        description={isEn ? "Estimated total API budget (THB)" : "งบประมาณ API ทั้งหมด (THB)"}
        trend="Est."
        color="indigo"
      />
      <StatsCard
        title={isEn ? "Chatbot Usage" : "แชทบอท (Chatbot Usage)"}
        value={stats.chatbotUsage.toLocaleString()}
        icon={<Bot className="w-6 h-6 text-indigo-600" />}
        description={isEn ? "Property inquiries and chats" : "การสอบถามข้อมูลอสังหาฯ"}
        trend="+12%"
        color="indigo"
      />
      <StatsCard
        title={isEn ? "Content Generation" : "สร้างเนื้อหา (Content Gen)"}
        value={stats.blogUsage.toLocaleString()}
        icon={<FileText className="w-6 h-6 text-pink-600" />}
        description={isEn ? "Articles and SEO content optimization" : "บทความและการปรับปรุงเนื้อหา"}
        trend="Active"
        color="pink"
      />
    </div>
  );
}
