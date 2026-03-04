"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TopAgent } from "@/features/dashboard/queries";
import { Trophy, Medal, Target, TrendingUp, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CommissionLeaderboardProps {
  data: TopAgent[];
  title?: string;
}

export function CommissionLeaderboard({
  data,
  title = "Agent Leaderboard",
}: CommissionLeaderboardProps) {
  // Find highest commission for progress bar scaling
  const maxCommission =
    data.length > 0 ? Math.max(...data.map((a) => a.total_commission)) : 1;

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-linear-to-br from-yellow-400 via-yellow-500 to-amber-600 text-white shadow-yellow-200 ring-4 ring-yellow-100";
      case 1:
        return "bg-linear-to-br from-slate-300 via-slate-400 to-slate-500 text-white shadow-slate-200 ring-4 ring-slate-100";
      case 2:
        return "bg-linear-to-br from-orange-300 via-orange-400 to-amber-600 text-white shadow-orange-200 ring-4 ring-orange-100";
      default:
        return "bg-slate-100 text-slate-500 border border-slate-200";
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-yellow-600 drop-shadow-sm" />;
      case 1:
        return <Medal className="h-4 w-4 text-slate-400" />;
      case 2:
        return <Trophy className="h-4 w-4 text-orange-400" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden relative group">
      {/* Decorative gradients */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-700" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-700" />

      <CardHeader className="pb-4 px-6 relative z-10 border-b border-slate-100/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
                <Trophy className="h-5 w-5" />
              </span>
              {title}
            </CardTitle>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-11">
              สะสมคอมมิชชั่นสุทธิ (เดือนนี้)
            </p>
          </div>
          <div className="flex flex-col items-end">
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px] px-2 py-0.5 rounded-full"
            >
              LIVE RANKING
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-6 relative z-10">
        <div className="space-y-6">
          {data.map((agent, index) => (
            <div key={agent.id} className="relative group/item">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  {/* Rank Circle */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black text-sm transition-transform duration-300 group-hover/item:scale-110 shadow-md ${getRankStyle(index)}`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md transition-transform duration-300 group-hover/item:-translate-y-1">
                        <AvatarImage src={agent.avatar_url || ""} />
                        <AvatarFallback className="bg-linear-to-br from-slate-100 to-slate-200 font-bold text-slate-500">
                          {agent.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {index <= 2 && (
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-slate-100 animate-bounce-subtle">
                          {getRankIcon(index)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-black text-slate-800 truncate leading-none">
                          {agent.name}
                        </p>
                        {index === 0 && (
                          <span className="text-[10px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm animate-pulse-slow">
                            MVP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                        <Target className="h-3 w-3 text-slate-300" />
                        {agent.deals_count} ดีลสำเร็จ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-emerald-600 font-black text-lg leading-none">
                    <TrendingUp className="h-4 w-4" />฿
                    {agent.total_commission.toLocaleString()}
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                    NET COMMISSION
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pl-13 pr-1">
                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-0 transition-all duration-1000 ease-out rounded-full ${
                      index === 0
                        ? "bg-linear-to-r from-yellow-400 to-amber-500"
                        : index === 1
                          ? "bg-linear-to-r from-slate-300 to-slate-400"
                          : index === 2
                            ? "bg-linear-to-r from-orange-300 to-orange-400"
                            : "bg-linear-to-r from-indigo-200 to-indigo-300"
                    }`}
                    style={{
                      width: `${(agent.total_commission / maxCommission) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Trophy className="h-10 w-10" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-300">
                  ยังไม่มีข้อมูลยอดขาย
                </p>
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  START CLOSING DEALS TO RANK UP!
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 relative z-10 flex items-center justify-between">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          อัปเดตแบบเรียลไทม์
        </p>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 uppercase">
            ACTIVE
          </span>
        </div>
      </div>
    </Card>
  );
}
