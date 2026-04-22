"use client";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { AnimatePresence, m, Variants } from "framer-motion";
import { KeyRound, UserPlus, HelpCircle } from "lucide-react";
import Image from "next/image";

interface AuthHeaderProps {
  view: "login" | "signup" | "forgot-password";
  direction: number;
  variants: Variants;
}

export function AuthHeader({ view, direction, variants }: AuthHeaderProps) {
  const isLogin = view === "login";
  const isSignUp = view === "signup";

  return (
    <div className="flex flex-col items-center text-center space-y-4 pb-1 overflow-hidden pt-6 sm:pt-8">
      <div className="lg:hidden">
        <Image
          src={isLogin ? siteConfig.logo : siteConfig.logoDark}
          alt={siteConfig.name}
          width={120}
          height={35}
          className="h-20 w-auto transition-all"
        />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <m.div
          key={view}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-2 will-change-[transform,opacity,filter]"
        >
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500",
              isLogin
                ? "bg-blue-50 border-blue-100 text-blue-600"
                : isSignUp
                  ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400",
            )}
          >
            {isLogin ? (
              <KeyRound className="h-3 w-3" />
            ) : isSignUp ? (
              <UserPlus className="h-3 w-3" />
            ) : (
              <HelpCircle className="h-3 w-3" />
            )}
            {isLogin
              ? "ยินดีต้อนรับกลับมา"
              : isSignUp
                ? "เข้าร่วมกับเราวันนี้"
                : "กู้คืนรหัสผ่าน"}
          </div>
          <h1
            className={cn(
              "text-2xl sm:text-3xl font-semibold tracking-tight transition-colors duration-500",
              isLogin ? "text-slate-900" : "text-white",
            )}
          >
            {isLogin
              ? "หวัดดี! มาจอยกัน"
              : isSignUp
                ? "สร้างบัญชีใหม่"
                : "ลืมรหัสหรอ?"}
          </h1>
          <p
            className={cn(
              "font-medium text-xs px-8 leading-relaxed transition-colors duration-500",
              isLogin ? "text-slate-500" : "text-slate-400",
            )}
          >
            {isLogin
              ? "เข้าสู่ระบบเพื่อจัดการทรัพย์สินของคุณ"
              : isSignUp
                ? "กรอกข้อมูลสั้นๆ เพื่อเริ่มต้นใช้งานระบบ"
                : "กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่านใหม่"}
          </p>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
