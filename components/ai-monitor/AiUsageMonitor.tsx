"use client";

import { useEffect, useState } from "react";
import { AiUsageStats, getAiUsageStats } from "@/features/ai-monitor/actions";
import { Loader2, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiUsageMonitor({ className }: { className?: string }) {
  const [stats, setStats] = useState<AiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await getAiUsageStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch AI stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "text-xs text-muted-foreground flex items-center gap-2",
          className,
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading stats...
      </div>
    );
  }

  if (!stats) return null;

  const usagePercent = Math.min(
    (stats.requestsLastMinute / stats.limitRPM) * 100,
    100,
  );

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
    <div
      className={cn(
        "flex flex-col gap-2 p-3.5 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px] md:text-xs shrink-0">
          <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          AI Performance
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
          <span
            className={cn("w-1 h-1 rounded-full animate-pulse", statusColor)}
          />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {statusText}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-0.5 overflow-hidden">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight shrink-0">
          Speed (RPM)
        </span>
        <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100 truncate">
          {stats.requestsLastMinute}{" "}
          <span className="text-slate-300 font-medium">/ {stats.limitRPM}</span>
        </span>
      </div>

      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-700 rounded-full bg-linear-to-r",
            statusColor === "bg-green-500"
              ? "from-emerald-400 to-emerald-600"
              : statusColor === "bg-yellow-500"
                ? "from-amber-400 to-amber-600"
                : "from-rose-400 to-rose-600",
          )}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-0.5 overflow-hidden">
        <div className="flex items-center gap-1 shrink-0">
          <Zap className="w-2.5 h-2.5 text-amber-500" />
          <span className="text-[8px] md:text-[9px] text-slate-400 font-medium truncate uppercase tracking-tighter">
            Gemini Intelligence
          </span>
        </div>
        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter shrink-0">
          Sync: 30s
        </div>
      </div>
    </div>
  );
}
