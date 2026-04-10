import {
  getAiDashboardStats,
  getAiLogs,
  type AiLogRecord,
} from "@/features/ai-monitor/actions";
import { AiUsageMonitor } from "@/components/ai-monitor/AiUsageMonitor";
import {
  Bot,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  BarChart3,
  Search,
  PenTool,
  ClipboardList,
  MapPin,
} from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { CopyErrorButton } from "@/components/ai-monitor/CopyErrorButton";

export const dynamic = "force-dynamic";

export default async function AiDashboardPage() {
  const stats = await getAiDashboardStats();
  const logs = await getAiLogs(50);

  return (
    <div className="min-h-screen relative space-y-10 max-w-screen-2xl mx-auto py-8">
      <SettingsHeader 
        title={<>ศูนย์เฝ้าระวัง <span className="bg-linear-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">AI Monitor & Analytics</span></>}
        description="ติดตามประสิทธิภาพการทำงานของ AI ทั้งระบบ Chatbot และ Content Generator แบบ Real-time"
        subPath={[
          { label: "System Control", href: "/protected/settings?tab=ai" },
          { label: "AI Monitor (ศูนย์เฝ้าระวัง)" }
        ]}
        actions={
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60">
            <AiUsageMonitor className="w-full shadow-none bg-transparent border-0" />
          </div>
        }
      />

      <div className="space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Requests"
            value={stats.totalRequests.toLocaleString()}
            icon={<Zap className="w-6 h-6 text-yellow-600" />}
            description="All time interactions"
            trend="Live"
            color="yellow"
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            description="Operational status"
            trend="Stable"
            color="emerald"
          />
          <StatsCard
            title="AI Investment"
            value={`฿${stats.totalCostThb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
            description="Total API Cost (THB)"
            trend="Est."
            color="indigo"
          />
          <StatsCard
            title="Chatbot Convers."
            value={stats.chatbotUsage.toLocaleString()}
            icon={<Bot className="w-6 h-6 text-indigo-600" />}
            description="Property inquiries"
            trend="+12%"
            color="indigo"
          />
          <StatsCard
            title="Content Gen"
            value={stats.blogUsage.toLocaleString()}
            icon={<FileText className="w-6 h-6 text-pink-600" />}
            description="Articles & Refinements"
            trend="Active"
            color="pink"
          />
        </div>

        {/* Recent Logs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" />
              Recent Activities
            </h2>
            <div className="flex items-center gap-3">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-sm flex items-center gap-2 shadow-xs">
                <BarChart3 className="w-4 h-4" />
                Showing last 50 records
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
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
                          <span className="text-sm font-medium text-slate-700">
                            {log.user?.full_name || "Unknown User"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {log.user?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs transition-all duration-300">
                          {log.status === "error" ? (
                            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500/80 italic">
                                  System Exception
                                </span>
                                {log.error_message && (
                                  <CopyErrorButton text={log.error_message} />
                                )}
                              </div>
                              <div className="flex items-start gap-2 p-2 rounded-xl bg-red-50/50 border border-red-100 group-hover:bg-red-100/50 transition-colors">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <span className="text-[12px] font-mono font-medium text-red-700 break-all line-clamp-2" title={log.error_message || ""}>
                                  {log.error_message || "Unknown error occurred"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 group/msg">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[11px] font-bold text-slate-400 group-hover/msg:text-emerald-600 transition-colors">
                                  Task successfully completed
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px] font-mono text-slate-500 group-hover/msg:bg-white group-hover/msg:border-emerald-100 group-hover/msg:text-emerald-700 transition-all">
                                <div className="flex items-center gap-1.5">
                                  <Zap className="w-3 h-3 text-amber-500" />
                                  <span>{log.prompt_tokens + log.completion_tokens} tokens</span>
                                </div>
                                <span className="text-slate-200">|</span>
                                <div className="font-bold">
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
                          <p className="text-lg font-medium">
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
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400 flex justify-between items-center">
              <span>Real-time monitoring enabled</span>
              <span>Auto-refresh system active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend: string;
  color: "indigo" | "emerald" | "yellow" | "pink";
}) {
  const colorStyles = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100",
    yellow:
      "bg-yellow-50 text-yellow-600 border-yellow-100 group-hover:bg-yellow-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100 group-hover:bg-pink-100",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-colors ${colorStyles[color].split(" ")[0].replace("-50", "-500")}`}
      />

      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3.5 rounded-2xl border transition-colors ${colorStyles[color]}`}
        >
          {icon}
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold bg-white border border-slate-100 shadow-xs ${colorStyles[color].split(" ")[1]}`}
        >
          {trend}
        </span>
      </div>

      <div>
        <div className="text-3xl font-semibold text-blue-700 tracking-tight mb-1">
          {value}
        </div>
        <div className="text-sm font-semibold text-slate-600">{title}</div>
        <div className="text-xs text-slate-400 mt-1.5">{description}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "success" | "error" }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 shadow-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100/80 text-red-700 border border-red-200/50 shadow-xs">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Error
    </span>
  );
}

function FeatureBadge({ feature }: { feature: string }) {
  if (feature === "chatbot") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
        <Bot className="w-3.5 h-3.5" /> Chatbot
      </span>
    );
  }
  if (feature === "blog_generator" || feature === "content_refiner") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-100">
        <FileText className="w-3.5 h-3.5" /> Content AI
      </span>
    );
  }
  if (
    feature === "description_generator" ||
    feature === "property_translator"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        <PenTool className="w-3.5 h-3.5" /> Property AI
      </span>
    );
  }
  if (feature === "lead_summary") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <ClipboardList className="w-3.5 h-3.5" /> Lead AI
      </span>
    );
  }
  if (feature === "popular_areas_translator") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
        <MapPin className="w-3.5 h-3.5" /> Area AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
      <Sparkles className="w-3.5 h-3.5" /> {feature}
    </span>
  );
}
