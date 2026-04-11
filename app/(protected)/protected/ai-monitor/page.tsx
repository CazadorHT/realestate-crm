import {
  getAiDashboardStats,
  getAiLogs,
} from "@/features/ai-monitor/actions";
import { AiUsageMonitor } from "@/components/ai-monitor/AiUsageMonitor";
import {
  Activity,
  BarChart3,
} from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { AiStatsGrid } from "@/features/ai-monitor/components/AiStatsGrid";
import { AiActivityTable } from "@/features/ai-monitor/components/AiActivityTable";
import { AiActivityCard } from "@/features/ai-monitor/components/AiActivityCard";

export const dynamic = "force-dynamic";

export default async function AiDashboardPage() {
  const stats = await getAiDashboardStats();
  const logs = await getAiLogs(50);

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

      <div className="space-y-10">
        {/* Stats Grid */}
        <AiStatsGrid stats={stats} />

        {/* Recent Logs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" />
              กิจกรรมการใช้งานล่าสุด <span className="text-slate-400 font-normal lg:block xl:inline">(Recent Activities)</span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center gap-2 shadow-xs font-semibold">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                แสดงข้อมูล 50 รายการล่าสุด
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* 🖥️ Desktop View (Table) */}
            <AiActivityTable logs={logs} />

            {/* 📱 Mobile View (Cards) */}
            <AiActivityCard logs={logs} />
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 flex justify-between items-center font-semibold uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-time monitoring enabled
              </span>
              <span>Auto-refresh active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
