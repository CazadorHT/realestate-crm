import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CheckCircle2, ShieldCheck, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface SentinelAuditBannerProps {
  reviewedAt: string | null | undefined;
  reviewerName: string | null | undefined;
  className?: string;
}

export function SentinelAuditBanner({
  reviewedAt,
  reviewerName,
  className,
}: SentinelAuditBannerProps) {
  if (!reviewedAt) return null;

  const dateLabel = format(new Date(reviewedAt), "d MMM yyyy HH:mm", {
    locale: th,
  });

  return (
    <div
      className={cn(
        "relative overflow-hidden group mb-4 p-4 rounded-xl border border-indigo-100 bg-linear-to-r from-indigo-50/50 to-white shadow-sm transition-all duration-300 hover:shadow-md",
        className
      )}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
        <ShieldCheck className="w-24 h-24 text-indigo-600" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100/80 text-indigo-600 shrink-0">
          <div className="relative">
            <ShieldCheck className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-indigo-600 rounded-full border-2 border-white animate-pulse" />
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              ✨ ยืนยันข้อมูล AI แล้ว (Sentinel Verified)
            </h3>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Trusted
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 italic">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-400" />
              <span>ผู้ตรวจสอบ: </span>
              <span className="font-semibold text-slate-700 not-italic">
                {reviewerName || "ระบบส่วนกลาง (Central Admin)"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>วันที่ยืนยัน: </span>
              <span className="font-semibold text-slate-700 not-italic">{dateLabel} น.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="text-[10px] font-medium text-indigo-500 bg-white px-2 py-1 rounded-full border border-indigo-100 shadow-sm">
            AI Accuracy Verified 100%
          </div>
        </div>
      </div>
    </div>
  );
}
