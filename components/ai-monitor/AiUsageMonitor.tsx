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
        "flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100",
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          AI Monitor
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn("w-2 h-2 rounded-full animate-pulse", statusColor)}
          />
          <span className="text-slate-500">{statusText}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-slate-500">Speed (RPM)</span>
        <span className="font-mono font-medium">
          {stats.requestsLastMinute}{" "}
          <span className="text-slate-400">/ {stats.limitRPM}</span>
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
        <div
          className={cn(
            "h-full transition-all duration-500 rounded-full",
            statusColor,
          )}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <div className="text-[10px] text-slate-400 text-right mt-0.5">
        Reset in 60s
      </div>
    </div>
  );
}
