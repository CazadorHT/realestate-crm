"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Trophy, BarChart2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentPerformanceData } from "@/features/dashboard/queries";

interface AgentPerformanceProps {
  data: AgentPerformanceData[];
}

export function AgentPerformance({ data }: AgentPerformanceProps) {
  return (
    <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold text-slate-800">Agent Performance</CardTitle>
        </div>
        <CardDescription>ผู้นำด้านการจัดการ Lead และปิดการขาย (Leaderboard)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mt-4">
          {data.map((agent, index) => (
            <div 
              key={agent.name}
              className={cn(
                "relative p-4 rounded-2xl flex items-center justify-between group transition-all hover:bg-white hover:shadow-sm border border-transparent",
                index === 0 ? "bg-amber-50/50 border-amber-100/50" : "bg-slate-50/50"
              )}
            >
              {index === 0 && (
                <div className="absolute -top-1.5 -left-1.5 bg-amber-500 text-white p-1 rounded-lg shadow-lg rotate-[-15deg]">
                  <Star className="h-3 w-3 fill-white" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-inner">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{agent.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">BRANCH ASSIGNED AGENT</p>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">LEADS</p>
                  <p className="text-sm font-bold text-blue-600">{agent.leads_count}</p>
                </div>
                <div className="h-8 w-px bg-slate-200/50" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">DEALS</p>
                  <p className="text-sm font-bold text-emerald-600">{agent.deals_count}</p>
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
               <User className="h-10 w-10 text-slate-200 mb-2" />
               <p className="text-sm text-slate-400 italic">— ยังไม่มีข้อมูลเจ้าหน้าที่สาขาในระบบขณะนี้ —</p>
            </div>
          )}
          
          <div className="mt-2 text-center">
              <button className="text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1 mx-auto">
                 <BarChart2 className="h-3 w-3" /> View All Agents
              </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
