"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCompletenessProps {
  score: number;
}

export function ProfileCompleteness({ score }: ProfileCompletenessProps) {
  const scoreClamped = Math.min(score, 100);

  return (
    <div className="w-full md:w-64 space-y-3 p-5 rounded-2xl bg-white/60 border border-white/40 shadow-sm backdrop-blur-md">
      <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Profile Rating</span>
        </div>
        <span
          className={cn(
            "font-semibold text-xs",
            scoreClamped === 100 ? "text-emerald-600" : "text-blue-600"
          )}
        >
          {scoreClamped}%
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${scoreClamped}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            scoreClamped === 100
              ? "bg-linear-to-r from-emerald-500 to-teal-600"
              : "bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600"
          )}
        />
      </div>
      <p className="text-[10px] text-slate-400 font-bold leading-tight">
        {scoreClamped === 100
          ? "ยอดเยี่ยม! ข้อมูลโปรไฟล์ของคุณสมบูรณ์แบบ"
          : "กรอกข้อมูลติดต่อเพิ่มเติมเพื่อให้บัญชีของคุณดูเป็นมืออาชีพขึ้น"}
      </p>
    </div>
  );
}
