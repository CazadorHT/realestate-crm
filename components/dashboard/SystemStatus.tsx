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
  HiOutlineCheckBadge,
  HiOutlineChevronDown as ChevronDown,
  HiOutlineChevronRight as ChevronRight,
} from "react-icons/hi2";
import {
  SiSupabase,
  SiFacebook,
  SiLine,
  SiTiktok,
  SiTelegram,
  SiGoogle,
} from "react-icons/si";
import { BiLoaderAlt } from "react-icons/bi";
import { cn } from "@/lib/utils";

// ─── Status Indicator Component ──────────────────────────────────────────────
function StatusIndicator({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const color = ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-rose-500";
  const textColor = ok
    ? "text-emerald-700"
    : warn
      ? "text-amber-700"
      : "text-rose-700";
  const bgColor = ok ? "bg-emerald-50" : warn ? "bg-amber-50" : "bg-rose-50";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-sm",
        bgColor,
        ok
          ? "border-emerald-100"
          : warn
            ? "border-amber-100"
            : "border-rose-100",
      )}
    >
      <div className="relative flex h-2 w-2">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            color,
          )}
        ></span>
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", color)}
        ></span>
      </div>
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          textColor,
        )}
      >
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
    <div
      className={cn(
        "group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 bg-white hover:-translate-y-0.5",
        ok
          ? "border-slate-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/50"
          : "border-rose-200 hover:border-rose-300 hover:shadow-md hover:shadow-rose-100/50",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2.5 rounded-xl shadow-sm border transition-transform duration-500 group-hover:scale-110",
            ok
              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
              : "bg-rose-50 border-rose-100 text-rose-500",
          )}
        >
          <Icon size={18} />
        </div>
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-slate-800 tracking-tight">
            {name}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {ok ? (
              "เชื่อมต่อเรียบร้อย"
            ) : missing && missing.length > 0 ? (
              <span className="text-rose-500">ขาด: {missing.join(", ")}</span>
            ) : (
              "ยังไม่ได้ตั้งค่า"
            )}
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
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    getSystemStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <BiLoaderAlt size={24} className="text-blue-500 animate-spin mb-2" />
        <p className="text-xs font-medium text-slate-400">
          กำลังตรวจสอบระบบ...
        </p>
      </div>
    );
  }

  if (!status) return null;

  const totalServices = 7;
  const activeServices = [
    status.supabase?.configured,
    status.meta?.configured,
    status.line?.configured,
    status.tiktok?.configured,
    status.ai?.configured,
    status.app?.url_configured,
    status.telegram?.configured,
  ].filter(Boolean).length;

  const healthPercentage = Math.round((activeServices / totalServices) * 100);

  return (
    <div
      className={cn(
        "bg-linear-to-br from-white via-slate-50 to-slate-100 rounded-3xl border border-slate-200 shadow-sm transition-all duration-500 overflow-hidden",
        isExpanded ? "p-4 sm:p-6 lg:p-8 space-y-6" : "p-4",
      )}
    >
      {/* Header with Overall Health */}
      <div
        className={cn(
          "flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer select-none",
          !isExpanded && "md:gap-2",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              "p-2.5 rounded-xl shadow-lg transition-all duration-500",
              isExpanded
                ? "bg-blue-600 shadow-blue-200"
                : "bg-white border border-slate-200 shadow-none",
            )}
          >
            <HiOutlineBolt
              size={22}
              className={isExpanded ? "text-white" : "text-blue-600"}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              สถานะระบบ
              {!isExpanded && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                    healthPercentage > 80
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800",
                  )}
                >
                  {healthPercentage}% Healthy
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ตรวจสอบการเชื่อมต่อและโครงสร้างพื้นฐาน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">
                ความพร้อม
              </span>
              <span
                className={cn(
                  "text-xl font-bold tabular-nums leading-none",
                  healthPercentage > 80
                    ? "text-emerald-700"
                    : healthPercentage > 50
                      ? "text-amber-700"
                      : "text-rose-700",
                )}
              >
                {healthPercentage}%
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="flex -space-x-2">
              {[
                status.supabase?.configured,
                status.line?.configured,
                status.ai?.configured,
              ].map((ok, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center overflow-hidden relative shadow-sm"
                >
                  <div
                    className={cn(
                      "absolute inset-0 opacity-15",
                      ok ? "bg-emerald-500" : "bg-slate-400",
                    )}
                  />
                  <HiOutlineCheckBadge
                    size={14}
                    className={
                      ok ? "text-emerald-600 z-10" : "text-slate-400 z-10"
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 rotate-180 transition-transform" />
            ) : (
              <ChevronRight className="h-5 w-5 transition-transform" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Core Infrastructure */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <HiOutlineShieldCheck size={16} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  โครงสร้างพื้นฐานหลัก
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <IntegrationCard
                  icon={SiSupabase}
                  name="ฐานข้อมูล Supabase"
                  ok={status.supabase?.configured}
                  missing={status.supabase?.missing}
                />
                <IntegrationCard
                  icon={HiOutlineGlobeAlt}
                  name="Webhook URL ของแอป"
                  ok={status.app?.url_configured}
                  missing={["NEXT_PUBLIC_APP_URL"]}
                />
              </div>
            </div>

            {/* Messaging & Social */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <HiOutlineChatBubbleLeftRight
                  size={16}
                  className="text-slate-400"
                />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  ข้อความและโซเชียล
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <IntegrationCard
                  icon={SiLine}
                  name="LINE Official Account"
                  ok={status.line?.configured}
                  missing={status.line?.missing}
                />
                <IntegrationCard
                  icon={SiTelegram}
                  name="Telegram Admin Bot"
                  ok={status.telegram?.configured}
                  missing={status.telegram?.missing}
                />
                <IntegrationCard
                  icon={SiFacebook}
                  name="Meta (Facebook/IG)"
                  ok={status.meta?.configured}
                  missing={status.meta?.missing}
                />
              </div>
            </div>

            {/* AI & Automation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <HiOutlineCpuChip size={16} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  เอไอและระบบอัตโนมัติ
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <IntegrationCard
                  icon={SiGoogle}
                  name="ระบบสมองกล Gemini AI"
                  ok={status.ai?.configured}
                  missing={status.ai?.missing}
                  warn={!status.ai?.configured}
                />
                <IntegrationCard
                  icon={SiTiktok}
                  name="การเชื่อมต่อ TikTok"
                  ok={status.tiktok?.configured}
                  missing={status.tiktok?.missing}
                />
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          {healthPercentage < 100 && (
            <div className="flex items-start sm:items-center gap-3 p-4 bg-amber-50/80 border border-amber-200/60 rounded-2xl mt-2">
              <HiOutlineExclamationTriangle
                size={20}
                className="text-amber-500 shrink-0 mt-0.5 sm:mt-0"
              />
              <p className="text-sm font-medium text-amber-800">
                การเชื่อมต่อบางอย่างยังไม่สมบูรณ์ โปรดไปที่{" "}
                <span className="font-bold underline decoration-amber-300 underline-offset-2 cursor-pointer hover:text-amber-900">
                  ตั้งค่าระบบ
                </span>{" "}
                เพื่อจัดการให้เรียบร้อย
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
