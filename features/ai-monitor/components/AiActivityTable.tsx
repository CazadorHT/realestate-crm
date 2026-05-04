"use client";

import React from "react";
import { type AiLogRecord } from "@/features/ai-monitor/actions";
import { FeatureBadge, StatusBadge } from "./AiBadges";
import { CopyErrorButton } from "@/components/ai-monitor/CopyErrorButton";
import { AlertCircle, Zap, Search } from "lucide-react";

interface AiActivityTableProps {
  logs: AiLogRecord[];
}

export function AiActivityTable({ logs }: AiActivityTableProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Feature
            </th>
            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Model
            </th>
            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
              Message/Error
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.map((log: AiLogRecord) => (
            <tr
              key={log.id}
              className="group hover:bg-slate-50/80 transition-all duration-200"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 group-hover:text-slate-700">
                {new Date(log.created_at).toLocaleString("th-TH", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <FeatureBadge feature={log.feature} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={log.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                {log.model}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">
                    {log.user?.full_name || "Unknown User"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {log.user?.email}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="max-w-xs transition-all duration-300">
                  {log.status === "error" || log.status === "validation_error" ? (
                    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500/80 italic">
                          {log.status === "validation_error" ? "Format Validation Failed" : "System Exception"}
                        </span>
                        {log.error_message && (
                          <CopyErrorButton text={log.error_message} />
                        )}
                      </div>
                      <div className="max-h-[80px] overflow-y-auto custom-scrollbar flex items-start gap-2 p-2 rounded-xl bg-red-50/50 border border-red-100 group-hover:bg-red-100/50 transition-colors">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-[12px] font-mono font-semibold text-red-700 break-all" title={log.error_message || ""}>
                          {log.error_message || "Unknown error occurred"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 group/msg">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-semibold text-slate-400 group-hover/msg:text-emerald-600 transition-colors">
                          Task successfully completed
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px] font-mono text-slate-500 group-hover/msg:bg-white group-hover/msg:border-emerald-100 group-hover/msg:text-emerald-700 transition-all">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>{log.prompt_tokens + log.completion_tokens} tokens</span>
                        </div>
                        <span className="text-slate-200">|</span>
                        <div className="font-semibold">
                          ฿{log.cost_thb.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Search className="w-10 h-10 mb-3 text-slate-300" />
                  <p className="text-lg font-semibold">
                    No activity logs found
                  </p>
                  <p className="text-sm">
                    Usage data will appear here once the AI is used.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
