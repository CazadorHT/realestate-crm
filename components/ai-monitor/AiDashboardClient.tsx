"use client";

import useSWR from "swr";
import React from "react";
import { AiStatsGrid } from "@/features/ai-monitor/components/AiStatsGrid";
import { AiActivityTable } from "@/features/ai-monitor/components/AiActivityTable";
import { AiActivityCard } from "@/features/ai-monitor/components/AiActivityCard";
import { AiUsageMonitor } from "@/components/ai-monitor/AiUsageMonitor";
import { SettingsHeader } from "../settings/SettingsHeader";

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('Network error');
  return r.json();
});

export default function AiDashboardClient() {
  const { data: stats, error: statsErr } = useSWR('/api/ai-monitor/stats', fetcher, { refreshInterval: 10000 });
  const { data: logs } = useSWR('/api/ai-monitor/logs?limit=50', fetcher, { refreshInterval: 5000 });

  return (
    <div className="min-h-screen relative space-y-10 max-w-screen-2xl mx-auto py-8">
        <SettingsHeader 
        title={<>ศูนย์เฝ้าระวัง <span className="bg-linear-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent italic">(AI Monitor & Analytics)</span></>}
        description="ติดตามประสิทธิภาพการทำงานของ AI ทั้งระบบ Chatbot และ Content Generator แบบ Real-time"
        subPath={[
          { label: "การตั้งค่าระบบ (System Settings)", href: "/protected/settings?tab=ai" },
          { label: "ศูนย์เฝ้าระวัง AI (AI Monitor)" }
        ]}
        actions={
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60">
            <AiUsageMonitor className="w-full shadow-none bg-transparent border-0" />
          </div>
        }
      />

      <div className="space-y-10 px-6">
        {stats ? <AiStatsGrid stats={stats} /> : <div>Loading stats...</div>}

        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {logs ? (
            <>
              <AiActivityTable logs={logs} />
              <AiActivityCard logs={logs} />
            </>
          ) : (
            <div className="p-6">Loading logs...</div>
          )}
        </div>
      </div>
    </div>
  );
}
