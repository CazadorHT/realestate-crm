"use client";

import * as React from "react";
import { getSystemStatus } from "@/lib/actions/system-status";
import {
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Facebook,
  MessageSquare,
  Globe,
  Database,
  Video,
} from "lucide-react";
import { FaLine, FaTiktok } from "react-icons/fa";

// ─── Reusable card ────────────────────────────────────────────────────────────
function StatusCard({
  icon: Icon,
  name,
  ok,
  okLabel,
  missing,
  warn = false,
}: {
  icon: React.ElementType;
  name: string;
  ok: boolean;
  okLabel: string;
  missing?: string[];
  warn?: boolean;
}) {
  const color = ok ? "emerald" : warn ? "amber" : "red";

  const bg = ok
    ? "bg-emerald-50/50 border-emerald-100"
    : warn
      ? "bg-amber-50 border-amber-200"
      : "bg-red-50 border-red-200";

  const iconBg = ok ? "bg-emerald-100" : warn ? "bg-amber-100" : "bg-red-100";

  const iconColor = ok
    ? "text-emerald-600"
    : warn
      ? "text-amber-600"
      : "text-red-600";

  const titleColor = ok
    ? "text-emerald-900"
    : warn
      ? "text-amber-800"
      : "text-red-800";

  const descColor = ok
    ? "text-emerald-600"
    : warn
      ? "text-amber-700"
      : "text-red-700";

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border shadow-xs transition-all ${bg}`}
    >
      <div className={`p-2 rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <h4 className={`text-sm font-bold ${titleColor}`}>{name}</h4>
          {ok && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </div>
        <p className={`text-[10px] font-medium ${descColor}`}>
          {ok
            ? okLabel
            : missing && missing.length > 0
              ? `ขาด: ${missing.join(", ")}`
              : "ยังไม่ได้ตั้งค่า"}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SystemStatus() {
  const [status, setStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSystemStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  if (loading || !status) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="h-5 w-5 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          System Integration Status
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Supabase */}
        <StatusCard
          icon={Database}
          name="Supabase DB"
          ok={status.supabase.configured}
          okLabel="เชื่อมต่อเรียบร้อย"
          missing={status.supabase.missing}
        />

        {/* Meta */}
        <StatusCard
          icon={Facebook}
          name="Meta (FB/IG)"
          ok={status.meta.configured}
          okLabel="เชื่อมต่อเรียบร้อย"
          missing={status.meta.missing}
        />

        {/* LINE */}
        <StatusCard
          icon={FaLine}
          name="LINE Noti"
          ok={status.line.configured}
          okLabel="Active (ใช้งานได้)"
          missing={status.line.missing}
        />

        {/* TikTok */}
        <StatusCard
          icon={FaTiktok}
          name="TikTok API"
          ok={status.tiktok.configured}
          okLabel="เชื่อมต่อเรียบร้อย"
          missing={status.tiktok.missing}
        />

        {/* Gemini AI */}
        <StatusCard
          icon={Cpu}
          name="Gemini AI"
          ok={status.ai.configured}
          okLabel="พร้อมใช้งาน"
          missing={status.ai.missing}
          warn={!status.ai.configured}
        />

        {/* Webhook URL */}
        <StatusCard
          icon={Globe}
          name="Webhook URL"
          ok={status.app.url_configured}
          okLabel="URL พร้อมใช้งาน"
          missing={["NEXT_PUBLIC_APP_URL"]}
        />
      </div>
    </div>
  );
}
