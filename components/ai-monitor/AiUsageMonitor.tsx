"use client";

import useSWR from "swr";
import React from "react";
import type { AiUsageStats } from "@/features/ai-monitor/actions";
import { Loader2, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type LocalStats = AiUsageStats & { totalCostThb?: number };

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Network error");
  return r.json();
});

export function AiUsageMonitor({ className }: { className?: string }) {
  const { data: stats, error, isValidating } = useSWR<LocalStats>('/api/ai-monitor/usage', fetcher, { refreshInterval: 30000 });

  if (isValidating && !stats) {
    return (
      <div className={cn("text-xs text-muted-foreground flex items-center gap-2", className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading stats...
      </div>
    );
  }

  if (error) {
    console.error('AiUsageMonitor fetch error:', error);
    return (
      <div className={cn("text-xs text-muted-foreground flex items-center gap-2 text-red-500", className)}>
        <span>Failed to load AI stats</span>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const usagePercent = Math.min((stats.requestsLastMinute / stats.limitRPM) * 100, 100);

  let statusColor = "bg-green-500";
  let statusText = "Ready";

  if (usagePercent > 80) {
    statusColor = "bg-red-500";
    statusText = "Rate Limit Risk";
  } else if (usagePercent > 50) {
    statusColor = "bg-yellow-500";
    statusText = "High Usage";
  }

  return (
    <div className={cn("flex flex-col gap-2 p-3.5 rounded-[20px] bg-white border border-slate-100 shadow-sm overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] md:text-xs shrink-0">
          <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          AI Performance
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 shrink-0">
          <span className={cn("w-1 h-1 rounded-full animate-pulse", statusColor)} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{statusText}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-0.5 overflow-hidden">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight shrink-0">Speed (RPM)</span>
        <span className="text-xs font-bold tabular-nums text-slate-900 truncate">{stats.requestsLastMinute} <span className="text-slate-300 font-medium">/ {stats.limitRPM}</span></span>
      </div>

      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-700 rounded-full bg-linear-to-r",
          statusColor === "bg-green-500"
            ? "from-emerald-400 to-emerald-600"
            : statusColor === "bg-yellow-500"
              ? "from-amber-400 to-amber-600"
              : "from-rose-400 to-rose-600",
        )} style={{ width: `${usagePercent}%` }} />
      </div>

      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50 overflow-hidden">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight shrink-0">Total Investment</span>
        <span className="text-[11px] font-bold text-indigo-600 truncate">฿{stats.totalCostThb?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div className="flex justify-between items-center mt-0.5 overflow-hidden">
        <div className="flex items-center gap-1 shrink-0">
          <Zap className="w-2.5 h-2.5 text-amber-500" />
          <span className="text-[8px] md:text-[9px] text-slate-400 font-medium truncate uppercase tracking-tighter">Gemini Intelligence</span>
        </div>
        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter shrink-0">Sync: 30s</div>
      </div>
    </div>
  );
}
