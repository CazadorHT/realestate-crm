"use client";

import { BellOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NotificationEmptyStateProps {
  message?: string;
  onRefresh?: () => void;
}

export function NotificationEmptyState({ 
  message = "ไม่มีการแจ้งเตือน", 
  onRefresh 
}: NotificationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center">
          <BellOff className="h-10 w-10 text-slate-300" />
        </div>
        <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-3">{message}</h3>
      <p className="text-slate-500 max-w-sm text-sm leading-relaxed mb-8">
        ดูเหมือนว่าคุณจะจัดการงานทั้งหมดเสร็จสิ้นแล้ว! เราจะแจ้งให้คุณทราบทันทีเมื่อมีความเคลื่อนไหวใหม่ในระบบอสังหาฯ ของคุณ
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="rounded-xl px-6 h-11 border-slate-200 font-bold text-xs gap-2 hover:bg-slate-50 hover:text-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
            ตรวจสอบอีกครั้ง
          </Button>
        )}
        <Button 
          asChild
          className="rounded-xl px-6 h-11 bg-slate-900 text-white font-bold text-xs gap-2 hover:bg-slate-800 shadow-lg shadow-slate-100"
        >
          <Link href="/protected">
            <Home className="h-4 w-4" />
            กลับไปหน้าหลัก
          </Link>
        </Button>
      </div>
    </div>
  );
}
