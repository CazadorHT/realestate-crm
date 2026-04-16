"use client";

import { AgentKpiStats } from "@/features/analytics/agent-kpis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatThaiCurrency } from "@/lib/excel-export";
import { Trophy, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentPerformanceTableProps {
  agents: AgentKpiStats[];
}

export function AgentPerformanceTable({ agents }: AgentPerformanceTableProps) {
  // Sort by revenue for leaderboard
  const sortedAgents = [...agents].sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  );

  return (
    <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            อันดับผลงานตัวแทน
          </CardTitle>
          <CardDescription>
            การจัดอันดับตามประสิทธิภาพและการปิดดีล
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 bg-yellow-50 text-yellow-700 border-yellow-200 rounded-full font-semibold"
        >
          ปี {new Date().getFullYear() + 543}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/50 tracking-widest font-semibold">
              <tr>
                <th className="px-6 py-4 text-center w-16">Rank</th>
                <th className="px-6 py-4">ตัวแทน</th>
                <th className="px-6 py-4 text-center">Leads</th>
                <th className="px-6 py-4 text-center">Deals</th>
                <th className="px-6 py-4 text-center">Conversion</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAgents.map((agent, index) => (
                <tr
                  key={agent.agentId}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 text-center">
                    <RankBadge rank={index + 1} />
                  </td>
                  <td className="px-6 py-4">
                    <AgentInfo agent={agent} />
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-600">
                    {agent.leadCount}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DealsSummary agent={agent} />
                  </td>
                  <td className="px-6 py-4">
                    <ConversionProgress rate={agent.conversionRate} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RevenueSummary agent={agent} />
                  </td>
                  <td className="px-4 py-4">
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (S, M, L) */}
        <div className="lg:hidden divide-y divide-slate-100">
          {sortedAgents.map((agent, index) => (
            <div
              key={agent.agentId}
              className="p-4 sm:p-6 hover:bg-slate-50/50 active:bg-slate-50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <RankBadge rank={index + 1} size="sm" />
                  </div>
                  <AgentInfo agent={agent} isMobile />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 bg-slate-50/50 p-2.5 sm:p-3 rounded-2xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    สะสมยอดขาย (Revenue)
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {formatThaiCurrency(agent.totalRevenue)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    Commission
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600">
                    {formatThaiCurrency(agent.totalCommission)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        ปิดดีลคนสำเร็จ
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {agent.totalDeals} ดีล (S:{agent.salesCount} | R:
                        {agent.rentCount})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Conversion
                    </span>
                    <span className="text-xs font-semibold text-indigo-600">
                      {agent.conversionRate}%
                    </span>
                  </div>
                </div>
                <Progress value={agent.conversionRate} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>

        {sortedAgents.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>ไม่พบข้อมูลผลงานตัวแทนในช่วงเวลานี้</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-components for cleaner code
function RankBadge({ rank, size = "md" }: { rank: number; size?: "sm" | "md" }) {
  const isTop3 = rank <= 3;
  const classes = cn(
    "flex items-center justify-center font-semibold rounded-full shadow-sm",
    size === "md" ? "h-9 w-9 text-sm" : "h-7 w-7 text-[10px]",
    rank === 1
      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
      : rank === 2
        ? "bg-slate-100 text-slate-700 border border-slate-200"
        : rank === 3
          ? "bg-orange-100 text-orange-700 border border-orange-200"
          : "bg-slate-50 text-slate-400 border border-slate-100",
  );

  return <span className={classes}>{rank}</span>;
}

function AgentInfo({
  agent,
  isMobile = false,
}: {
  agent: AgentKpiStats;
  isMobile?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        className={cn(
          "border-2 border-white shadow-sm",
          isMobile ? "h-10 w-10" : "h-11 w-11",
        )}
      >
        <AvatarImage src={agent.avatarUrl || ""} />
        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold text-xs">
          {agent.fullName?.substring(0, 2).toUpperCase() || "AG"}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-slate-900 truncate tracking-tight">
          {agent.fullName || "Unnamed Agent"}
        </span>
        <span className="text-[10px] text-slate-400 truncate tracking-tighter uppercase font-medium">
          {agent.email}
        </span>
      </div>
    </div>
  );
}

function DealsSummary({ agent }: { agent: AgentKpiStats }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-semibold text-slate-900 text-sm">
        {agent.totalDeals}
      </span>
      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-tighter">
        S:{agent.salesCount} | R:{agent.rentCount}
      </span>
    </div>
  );
}

function ConversionProgress({ rate }: { rate: number }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex justify-between text-[11px] font-semibold">
        <span className={cn(rate > 20 ? "text-emerald-600" : "text-amber-600")}>
          {rate}%
        </span>
      </div>
      <Progress value={rate} className="h-1.5 bg-slate-100" />
    </div>
  );
}

function RevenueSummary({ agent }: { agent: AgentKpiStats }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-slate-900">
        {formatThaiCurrency(agent.totalRevenue)}
      </span>
      <span className="text-[10px] text-emerald-600 font-semibold">
        Com: {formatThaiCurrency(agent.totalCommission)}
      </span>
    </div>
  );
}
