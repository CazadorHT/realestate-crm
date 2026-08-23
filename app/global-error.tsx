"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isEn, setIsEn] = useState(false);

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
    if (typeof document !== "undefined") {
      setIsEn(document.cookie.includes("NEXT_LOCALE=en"));
    }
  }, [error]);

  return (
    <html lang={isEn ? "en" : "th"}>
      <body className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in duration-700">
          <div className="mx-auto w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
            <AlertTriangle className="h-12 w-12 text-rose-500" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tighter">CRITICAL SYSTEM ERROR</h1>
            <p className="text-slate-400 text-lg">
              {isEn
                ? "A critical system error occurred. Our engineering team has been alerted and is restoring service."
                : "ระบบหลักขัดข้องรุนแรง ทีมวิศวกรได้รับแจ้งเตือนแล้ว และกำลังเร่งกู้คืนระบบ"}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              onClick={() => reset()}
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-200 h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-2xl cursor-pointer"
            >
              {isEn ? "Reload System" : "พยายามกู้คืนระบบ (Reload)"}
            </Button>
            
            <Button
              onClick={() => Sentry.showReportDialog({ eventId: error.digest })}
              variant="link"
              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              {isEn ? "Send Error Report" : "ส่งรายงานปัญหา (Send Error Report)"}
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
