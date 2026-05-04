"use client";

import { m } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Target, 
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentDashboardStats } from "../../queries/agent-dashboard";

interface AgentStatsCardsProps {
  stats: AgentDashboardStats;
}

export function AgentStatsCards({ stats }: AgentStatsCardsProps) {
  const cards = [
    {
      title: "รายได้ค่าคอมฯ เดือนนี้",
      value: `฿${stats.revenueThisMonth.toLocaleString()}`,
      change: stats.revenueChange,
      icon: CircleDollarSign,
      color: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-200",
    },
    {
      title: "Lead ใหม่ในมือ",
      value: stats.leadsThisMonth,
      change: stats.leadsChange,
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-200",
    },
    {
      title: "ปิดการขาย (Deals)",
      value: stats.dealsWon,
      change: stats.dealsWonChange,
      icon: Target,
      color: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-200",
    },
    {
      title: "อัตราการปิดดีล",
      value: `${stats.conversionRate}%`,
      change: "+0.5%",
      icon: TrendingUp,
      color: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const isPositive = !card.change.startsWith("-");
        const Icon = card.icon;

        return (
          <m.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "relative overflow-hidden p-5 rounded-4xl bg-white border border-slate-100 shadow-xl",
              card.shadow
            )}
          >
            {/* Background Glow */}
            <div className={cn(
              "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 rounded-full bg-linear-to-br",
              card.color
            )} />

            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-3 rounded-2xl bg-linear-to-br text-white shadow-lg",
                card.color
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider",
                isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.change}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {card.value}
              </h3>
            </div>
          </m.div>
        );
      })}
    </div>
  );
}
