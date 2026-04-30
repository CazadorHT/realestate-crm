"use client";

import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { MdWavingHand } from "react-icons/md";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  email?: string | null;
  name?: string | null;
}

export function DashboardHeader({ email, name }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      setGreeting(
        hour < 12 ? "สวัสดีตอนเช้า" : hour < 18 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น"
      );
      setCurrentDate(
        now.toLocaleDateString("th-TH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const intervalId = setInterval(updateTime, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div id="tour-header" className="relative overflow-hidden flex flex-col lg:flex-row md:items-center justify-between gap-6 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-10 rounded-3xl shadow-xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

      <div className="relative space-y-3 z-10">
        <p
          className="text-xs md:text-sm font-semibold text-blue-100/90 capitalize flex items-center gap-2.5 min-h-[20px]"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          {mounted ? currentDate : <span className="h-3 w-32 bg-white/20 rounded-sm animate-pulse inline-block" />}
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-md flex flex-wrap items-center gap-2 min-h-[40px]">
          {mounted ? greeting : <span className="h-8 w-40 bg-white/20 rounded-md animate-pulse inline-block" />}
          <span className="text-white/60 font-medium">,</span>
          <span>{name || email?.split("@")[0] || "คุณ"}</span>
          <MdWavingHand className="text-yellow-300 animate-wave inline-block ml-1" />
        </h2>
        <p className="text-blue-100/80 max-w-lg text-sm md:text-base leading-relaxed">
          จัดการทรัพย์ ลีด และงานขายของคุณได้ง่ายๆ ในที่เดียว
        </p>
      </div>

      <div className="relative w-full md:w-auto md:min-w-[320px] lg:min-w-[400px] z-10">
        <GlobalSearch variant="bar" className="w-full" />
      </div>
    </div>
  );
}
