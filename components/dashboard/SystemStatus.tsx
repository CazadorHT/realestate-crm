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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meta Status */}
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border shadow-xs transition-all ${
            status.meta.configured
              ? "bg-emerald-50/50 border-emerald-100"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div
            className={`p-2 rounded-xl ${status.meta.configured ? "bg-emerald-100" : "bg-red-100"}`}
          >
            <Facebook
              className={`h-5 w-5 ${status.meta.configured ? "text-emerald-600" : "text-red-600"}`}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h4
                className={`text-sm font-bold ${status.meta.configured ? "text-emerald-900" : "text-red-800"}`}
              >
                Meta (FB/IG)
              </h4>
              {status.meta.configured && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
            <p
              className={`text-[10px] font-medium ${status.meta.configured ? "text-emerald-600" : "text-red-700"}`}
            >
              {status.meta.configured
                ? "เชื่อมต่อเรียบร้อย"
                : `ขาด: ${status.meta.missing.join(", ")}`}
            </p>
          </div>
        </div>

        {/* LINE Status */}
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border shadow-xs transition-all ${
            status.line.configured
              ? "bg-emerald-50/50 border-emerald-100"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div
            className={`p-2 rounded-xl ${status.line.configured ? "bg-emerald-100" : "bg-red-100"}`}
          >
            <MessageSquare
              className={`h-5 w-5 ${status.line.configured ? "text-emerald-600" : "text-red-600"}`}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h4
                className={`text-sm font-bold ${status.line.configured ? "text-emerald-900" : "text-red-800"}`}
              >
                LINE Noti
              </h4>
              {status.line.configured && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
            <p
              className={`text-[10px] font-medium ${status.line.configured ? "text-emerald-600" : "text-red-700"}`}
            >
              {status.line.configured
                ? "Active (ใช้งานได้)"
                : `ขาด: ${status.line.missing.join(", ")}`}
            </p>
          </div>
        </div>

        {/* AI Status */}
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border shadow-xs transition-all ${
            status.ai.configured
              ? "bg-emerald-50/50 border-emerald-100"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div
            className={`p-2 rounded-xl ${status.ai.configured ? "bg-emerald-100" : "bg-amber-100"}`}
          >
            <Cpu
              className={`h-5 w-5 ${status.ai.configured ? "text-emerald-600" : "text-amber-600"}`}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h4
                className={`text-sm font-bold ${status.ai.configured ? "text-emerald-900" : "text-amber-800"}`}
              >
                Gemini AI
              </h4>
              {status.ai.configured && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
            <p
              className={`text-[10px] font-medium ${status.ai.configured ? "text-emerald-600" : "text-amber-700"}`}
            >
              {status.ai.configured
                ? "พร้อมแปลภาษา"
                : "กรุณาตั้งค่า GEMINI_API_KEY"}
            </p>
          </div>
        </div>

        {/* App URL Status */}
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border shadow-xs transition-all ${
            status.app.url_configured
              ? "bg-emerald-50/50 border-emerald-100"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div
            className={`p-2 rounded-xl ${status.app.url_configured ? "bg-emerald-100" : "bg-red-100"}`}
          >
            <Globe
              className={`h-5 w-5 ${status.app.url_configured ? "text-emerald-600" : "text-red-600"}`}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h4
                className={`text-sm font-bold ${status.app.url_configured ? "text-emerald-900" : "text-red-800"}`}
              >
                Webhook URL
              </h4>
              {status.app.url_configured && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
            <p
              className={`text-[10px] font-medium ${status.app.url_configured ? "text-emerald-600" : "text-red-700"}`}
            >
              {status.app.url_configured
                ? "URL พร้อมใช้งาน"
                : "ต้องระบุ NEXT_PUBLIC_APP_URL"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
