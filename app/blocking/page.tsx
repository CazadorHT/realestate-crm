"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Home, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function BlockingContent() {
  const searchParams = useSearchParams();
  const retryParam = searchParams.get("retry");
  const initialRetry = retryParam ? parseInt(retryParam, 10) : 10;
  
  const [countdown, setCountdown] = useState(initialRetry);

  useEffect(() => {
    if (retryParam) {
      const val = parseInt(retryParam, 10);
      if (!isNaN(val)) setCountdown(val);
    }
  }, [retryParam]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center"
      >
        {/* 🛡️ Icon Animation */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner"
        >
          <ShieldAlert size={42} strokeWidth={1.5} />
        </motion.div>

        {/* 📝 Messaging */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
          เราตรวจพบกิจกรรมที่รวดเร็วผิดปกติ
        </h1>
        
        <p className="text-slate-600 text-lg leading-relaxed mb-8">
          เพื่อความปลอดภัยของข้อมูล และเพื่อให้ระบบทำงานได้อย่างมั่นคง
          โปรดพักผ่อนสักครู่ (หายใจเข้าลึกๆ) แล้วลองใหม่อีกครั้งในไม่กี่วินาทีครับ
        </p>

        {/* ⏳ Countdown Status */}
        <div className="bg-slate-50 rounded-2xl py-4 px-6 mb-8 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-3 text-slate-600">
            <Clock size={20} className="text-blue-500" />
            <span className="font-medium">พ้นระยะเวลาบล็อกใน:</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900">
            {countdown}s
          </span>
        </div>

        {/* 🔘 Actions */}
        <div className="grid gap-3">
          <Button
            asChild
            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-xl text-lg font-semibold shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
          >
            <Link href="/">
              <Home size={20} className="mr-2" />
              กลับไปหน้าหลัก
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-12 rounded-xl text-md"
          >
            <Link href="mailto:support@yourdomain.com">
              <MessageCircle size={18} className="mr-2" />
              ติดต่อฝ่ายสนับสนุน
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-slate-400 font-medium">
          Error 429: Too Many Requests | Security Layer v2.5
        </p>
      </motion.div>

      {/* 🖼️ Subtle background branding */}
      <div className="fixed bottom-8 left-0 right-0 text-center opacity-10 pointer-events-none select-none">
        <span className="text-4xl font-black uppercase tracking-widest text-slate-500">
          Enterprise Security CRM
        </span>
      </div>
    </div>
  );
}

export default function BlockingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="animate-pulse text-slate-400 font-medium">กำลังตรวจสอบความปลอดภัย...</div>
      </div>
    }>
      <BlockingContent />
    </Suspense>
  );
}
