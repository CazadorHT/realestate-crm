"use client";

import { PremiumAuthLayout } from "@/components/auth/premium-auth-layout";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SignUpSuccessPage() {
  return (
    <PremiumAuthLayout
      view="signup"
      title={
        <div className="flex flex-col items-center text-center space-y-4 pb-1 pt-6 sm:pt-8">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] bg-purple-500/10 border-purple-500/20 text-purple-400",
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            ลงทะเบียนสำเร็จ
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            เช็คอีเมลของคุณ
          </h1>
          <p className="font-medium text-xs px-8 leading-relaxed text-slate-400">
            เราได้ส่งลิงก์ยืนยันตัวตนไปที่อีเมลของคุณแล้ว
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            กรุณาตรวจสอบกล่องจดหมายของคุณและคลิกลิงก์เพื่อยืนยันบัญชีผู้ใช้งานก่อนเข้าสู่ระบบ
          </p>
        </m.div>

        <Button
          asChild
          className="w-full h-14 text-base font-bold shadow-2xl rounded-xl transition-all active:scale-[0.98] bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
        >
          <Link href="/auth/login" className="flex items-center justify-center gap-2">
            ไปหน้าเข้าสู่ระบบ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <p className="text-center text-[10px] text-slate-500 font-medium">
          ไม่ได้รับอีเมล? <button className="text-purple-400 hover:underline">ส่งอีกครั้ง</button>
        </p>
      </div>
    </PremiumAuthLayout>
  );
}
