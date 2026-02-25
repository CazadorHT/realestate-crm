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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            ตารางอันดับผลงานตัวแทน (Agent Leaderboard)
          </CardTitle>
          <CardDescription>
            การจัดอันดับตามยอดขายรวมและประสิทธิภาพการปิดดีล
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          ปี {new Date().getFullYear() + 543}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-16">
                  อันดับ
                </th>
                <th className="px-6 py-4 font-semibold">ตัวแทน</th>
                <th className="px-6 py-4 font-semibold text-center">
                  ลูกค้า (Leads)
                </th>
                <th className="px-6 py-4 font-semibold text-center">ปิดดีล</th>
                <th className="px-6 py-4 font-semibold text-center">
                  อัตราการปิดดีล
                </th>
                <th className="px-6 py-4 font-semibold text-right">
                  รายได้ที่สร้างได้
                </th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAgents.map((agent, index) => (
                <tr
                  key={agent.agentId}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 text-center">
                    {index === 0 ? (
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-700 font-bold">
                        1
                      </span>
                    ) : index === 1 ? (
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold">
                        2
                      </span>
                    ) : index === 2 ? (
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-700 font-bold">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">
                        {index + 1}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={agent.avatarUrl || ""} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                          {agent.fullName?.substring(0, 2).toUpperCase() ||
                            "AG"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {agent.fullName || "Unnamed Agent"}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                          {agent.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-600">
                    {agent.leadCount}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-900">
                        {agent.totalDeals}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        S:{agent.salesCount} | R:{agent.rentCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span
                          className={cn(
                            agent.conversionRate > 20
                              ? "text-emerald-600"
                              : "text-amber-600",
                          )}
                        >
                          {agent.conversionRate}%
                        </span>
                      </div>
                      <Progress
                        value={agent.conversionRate}
                        className="h-1.5"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col">
                      <span className="text-md font-bold text-slate-900">
                        {formatThaiCurrency(agent.totalRevenue)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Commission: {formatThaiCurrency(agent.totalCommission)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedAgents.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>ไม่พบข้อมูลผลงานตัวแทนในช่วงเวลานี้</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
