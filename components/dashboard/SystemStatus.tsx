"use client";

import * as React from "react";
import { getSystemStatus } from "@/lib/actions/system-status";
import { 
  HiOutlineShieldCheck, 
  HiOutlineGlobeAlt, 
  HiOutlineCpuChip, 
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
  HiOutlineExclamationTriangle,
  HiOutlineCheckBadge
} from "react-icons/hi2";
import { 
  SiSupabase, 
  SiFacebook, 
  SiLine, 
  SiTiktok, 
  SiTelegram, 
  SiGoogle 
} from "react-icons/si";
import { BiLoaderAlt } from "react-icons/bi";
import { cn } from "@/lib/utils";

// ─── Status Indicator Component ──────────────────────────────────────────────
function StatusIndicator({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const color = ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/80 border border-slate-100 shadow-sm">
      <div className="relative flex h-2 w-2">
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          color
        )}></span>
        <span className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          color
        )}></span>
      </div>
      <span className={cn(
        "text-[10px] font-semibold uppercase tracking-wider",
        ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-rose-600"
      )}>
        {ok ? "ออนไลน์" : warn ? "มีปัญหา" : "ออฟไลน์"}
      </span>
    </div>
  );
}

// ─── Status Card Component ──────────────────────────────────────────────────
function IntegrationCard({
  icon: Icon,
  name,
  ok,
  missing,
  warn = false,
}: {
  icon: React.ElementType;
  name: string;
  ok: boolean;
  missing?: string[];
  warn?: boolean;
}) {
  return (
    <div className={cn(
      "group flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 hover:shadow-lg",
      ok ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/30 border-rose-100"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 transition-transform duration-500 group-hover:scale-110",
          ok ? "text-emerald-600" : "text-rose-500"
        )}>
          <Icon size={18} />
        </div>
        <div className="flex flex-col">
          <h4 className="text-xs font-semibold text-slate-800 tracking-tight">{name}</h4>
          <p className="text-[10px] text-slate-500 font-medium">
            {ok ? "เชื่อมต่อเรียบร้อย" : missing && missing.length > 0 ? `ขาด: ${missing.join(", ")}` : "ยังไม่ได้ตั้งค่า"}
          </p>
        </div>
      </div>
      <StatusIndicator ok={ok} warn={warn} />
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

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <BiLoaderAlt size={32} className="text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">กำลังตรวจสอบความพร้อมของระบบ...</p>
      </div>
    );
  }

  if (!status) return null;

  const totalServices = 7;
  const activeServices = [
    status.supabase.configured,
    status.meta.configured,
    status.line.configured,
    status.tiktok.configured,
    status.ai.configured,
    status.app.url_configured,
    status.telegram.configured
  ].filter(Boolean).length;

  const healthPercentage = Math.round((activeServices / totalServices) * 100);

  return (
    <div className="space-y-6">
      {/* Header with Overall Health */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl shadow-xl">
            <HiOutlineBolt size={20} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">ความพร้อมของระบบและการเชื่อมต่อ</h3>
            <p className="text-xs text-slate-500 font-medium">ตรวจสอบสถานะโครงสร้างพื้นฐานแบบเรียลไทม์</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">สุขภาพระบบ</span>
            <span className={cn(
              "text-lg font-semibold tabular-nums",
              healthPercentage > 80 ? "text-emerald-500" : healthPercentage > 50 ? "text-amber-500" : "text-rose-500"
            )}>
              {healthPercentage}%
            </span>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="flex -space-x-2">
            {[status.supabase.configured, status.line.configured, status.ai.configured].map((ok, i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center overflow-hidden relative">
                <div className={cn("absolute inset-0 opacity-20", i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : "bg-amber-500")} />
                <HiOutlineCheckBadge size={14} className={ok ? "text-emerald-600 z-10" : "text-slate-300 z-10"} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Core Infrastructure */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <HiOutlineShieldCheck size={14} className="text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">โครงสร้างพื้นฐานหลัก</span>
          </div>
          <div className="flex flex-col gap-2">
            <IntegrationCard
              icon={SiSupabase}
              name="ฐานข้อมูล Supabase"
              ok={status.supabase.configured}
              missing={status.supabase.missing}
            />
            <IntegrationCard
              icon={HiOutlineGlobeAlt}
              name="Webhook URL ของแอป"
              ok={status.app.url_configured}
              missing={["NEXT_PUBLIC_APP_URL"]}
            />
          </div>
        </div>

        {/* Messaging & Social */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <HiOutlineChatBubbleLeftRight size={14} className="text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ข้อความและโซเชียล</span>
          </div>
          <div className="flex flex-col gap-2">
            <IntegrationCard
              icon={SiLine}
              name="LINE Official Account"
              ok={status.line.configured}
              missing={status.line.missing}
            />
             <IntegrationCard
              icon={SiTelegram}
              name="Telegram Admin Bot"
              ok={status.telegram.configured}
              missing={status.telegram.missing}
            />
            <IntegrationCard
              icon={SiFacebook}
              name="Meta (Facebook/IG)"
              ok={status.meta.configured}
              missing={status.meta.missing}
            />
          </div>
        </div>

        {/* AI & Automation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <HiOutlineCpuChip size={14} className="text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">เอไอและระบบอัตโนมัติ</span>
          </div>
          <div className="flex flex-col gap-2">
            <IntegrationCard
              icon={SiGoogle}
              name="ระบบสมองกล Gemini AI"
              ok={status.ai.configured}
              missing={status.ai.missing}
              warn={!status.ai.configured}
            />
            <IntegrationCard
              icon={SiTiktok}
              name="การเชื่อมต่อ TikTok"
              ok={status.tiktok.configured}
              missing={status.tiktok.missing}
            />
          </div>
        </div>
      </div>

      {healthPercentage < 100 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <HiOutlineExclamationTriangle size={20} className="text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-amber-800">
            การเชื่อมต่อบางอย่างยังไม่สมบูรณ์ โปรดไปที่ <span className="font-bold underline cursor-pointer">ตั้งค่าระบบ</span> เพื่อจัดการให้เรียบร้อย
          </p>
        </div>
      )}
    </div>
  );
}
