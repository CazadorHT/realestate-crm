"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 🛡️ บันทึก Error ลง Sentry อัตโนมัติ
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative mx-auto w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">เกิดข้อผิดพลาดบางอย่าง</h1>
          <p className="text-slate-500">
            ระบบพบปัญหาขัดข้องชั่วคราว เราได้บันทึกข้อมูลและแจ้งทีมวิศวกรแล้ว
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Error Digest</p>
          <p className="text-xs font-mono text-slate-600 break-all select-all">
            {error.digest || "N/A - System Auto Tracked"}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => Sentry.showReportDialog({ eventId: error.digest })}
            variant="default"
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            ส่งรายงานปัญหาให้เรา
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => reset()}
              variant="outline"
              className="h-11 rounded-xl border-slate-200 font-semibold gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              ลองอีกครั้ง
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-11 rounded-xl font-semibold gap-2"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                หน้าหลัก
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400">
          * ข้อมูลทางเทคนิคถูกเก็บเข้าระบบความปลอดภัยเพื่อการพัฒนาแก้ไข
        </p>
      </div>
    </div>
  );
}
