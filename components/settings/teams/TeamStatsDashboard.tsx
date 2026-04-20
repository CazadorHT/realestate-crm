"use client";

import React from "react";
import { Users, UserCheck, Briefcase } from "lucide-react";
import { m } from "framer-motion";

interface TeamStatsDashboardProps {
  stats: {
    totalTeams: number;
    totalAgents: number;
    totalLeads: number;
  };
}

export function TeamStatsDashboard({ stats }: TeamStatsDashboardProps) {
  const cards = [
    {
      title: "จำนวนทีมทั้งหมด",
      value: stats.totalTeams,
      icon: Users,
      gradient: "from-indigo-600 to-blue-500",
      label: "Teams Power",
    },
    {
      title: "เอเจนท์ในสังกัด",
      value: stats.totalAgents,
      icon: UserCheck,
      gradient: "from-amber-500 to-orange-400",
      label: "Active Force",
    },
    {
      title: "Leads ประจำสาขา",
      value: stats.totalLeads,
      icon: Briefcase,
      gradient: "from-emerald-500 to-teal-400",
      label: "Growth Engine",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, idx) => (
        <m.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="relative group overflow-hidden bg-white/50 backdrop-blur-md border border-white/40 p-6 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500"
        >
          {/* BG Gradient Glow */}
          <div
            className={`absolute -right-10 -top-10 w-32 h-32 bg-linear-to-br ${card.gradient} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`}
          />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[2px] mb-1">
                {card.title}
              </p>
              <h3 className="text-4xl font-semibold text-slate-900 tracking-tight">
                {card.value.toLocaleString()}
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-linear-to-r ${card.gradient}`}
                />
                {card.label}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl bg-linear-to-br ${card.gradient} shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-500`}
            >
              <card.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </m.div>
      ))}
    </div>
  );
}
