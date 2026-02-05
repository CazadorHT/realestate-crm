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
} from "lucide-react";

export default async function AiDashboardPage() {
  const stats = await getAiDashboardStats();
  const logs = await getAiLogs(50);

  return (
    <div className="min-h-screen bg-slate-50/50 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-blue-50/80 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 left-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="p-8 max-w-7xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Intelligence Center</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              AI Monitor & Analytics
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
              ติดตามประสิทธิภาพการทำงานของ AI ทั้งระบบ Chatbot และ Content
              Generator แบบ Real-time
            </p>
          </div>
          <div className="shrink-0">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60">
              <AiUsageMonitor className="w-72 shadow-none bg-transparent border-0" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate font-mono bg-slate-50/30 rounded-r-lg group-hover:bg-slate-100/50 transition-colors">
                        {log.error_message ? (
                          <span className="text-red-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-slate-400 opacity-50">-</span>
                        )}
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
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
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
        <FileText className="w-3.5 h-3.5" /> Blog AI
      </span>
    );
  }
  return (
    <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
      {feature}
    </span>
  );
}
