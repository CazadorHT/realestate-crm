"use client";

import React from "react";
import { type AiLogRecord } from "@/features/ai-monitor/actions";
import { FeatureBadge, StatusBadge } from "./AiBadges";
import { CopyErrorButton } from "@/components/ai-monitor/CopyErrorButton";
import { AlertCircle, Zap, Search } from "lucide-react";

interface AiActivityCardProps {
  logs: AiLogRecord[];
}

export function AiActivityCard({ logs }: AiActivityCardProps) {
  return (
    <div className="lg:hidden divide-y divide-slate-100 italic">
      {logs.map((log: AiLogRecord) => (
        <div key={log.id} className="p-5 space-y-5 bg-white hover:bg-slate-50/50 transition-colors">
          {/* Top Bar: Time & Feature */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                {new Date(log.created_at).toLocaleString("th-TH", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <FeatureBadge feature={log.feature} />
            </div>
            <StatusBadge status={log.status} />
          </div>

          {/* Middle Section: User & Model */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs border border-white shadow-sm">
                  {log.user?.full_name?.substring(0, 2).toUpperCase() || "??"}
               </div>
               <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-700">{log.user?.full_name || "Unknown"}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{log.user?.email}</span>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter mb-0.5">Model Engine</p>
               <p className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-xs">
                {log.model}
               </p>
            </div>
          </div>

          {/* Bottom Section: Message or Stats */}
          <div className="space-y-3">
            {log.status === "error" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500/80">System Exception</span>
                   {log.error_message && <CopyErrorButton text={log.error_message} />}
                </div>
                <div className="max-h-[100px] overflow-y-auto custom-scrollbar flex items-start gap-2 p-3 rounded-2xl bg-red-50/50 border border-red-100 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs font-mono font-semibold break-all">
                    {log.error_message || "Unknown error occurred"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-slate-500">Operation completed successfully</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                   <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-semibold text-slate-500">{log.prompt_tokens + log.completion_tokens} tokens consumed</span>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-white border border-slate-100 shadow-xs text-[11px] font-semibold text-emerald-600">
                     ฿{log.cost_thb.toFixed(4)}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="py-20 text-center">
          <Search className="w-12 h-12 mb-4 mx-auto text-slate-200" />
          <p className="text-slate-500 font-semibold">No activity logs recorded</p>
        </div>
      )}
    </div>
  );
}
