"use client";

import Link from "next/link";
import { 
  Cpu, 
  Zap, 
  Activity, 
  ChevronRight, 
  Sparkles 
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/language-context";

export function AITabContent() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Snapshot Active Model */}
        <Card className="col-span-full border-none bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-[32px] shadow-xl shadow-indigo-100 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <CardHeader className="relative z-10 pt-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold text-white">
                  {isEn ? (
                    "AI Control Center"
                  ) : (
                    <>
                      ศูนย์รวมการจัดการ AI <span className="text-indigo-100/70 font-normal italic">(AI Control Center)</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-indigo-50/80 font-medium italic mt-1">
                  {isEn
                    ? "Monitor status and orchestrate enterprise AI models and features"
                    : "ติดตามสถานะและควบคุมการทำงานของปัญญาประดิษฐ์ในระดับองค์กร"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pb-8">
            <div className="flex flex-wrap gap-4">
              <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-1 transition-all hover:bg-white/20 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                  {isEn ? "LLM Provider" : "LLM Provider (ผู้ให้บริการ)"}
                </span>
                <span className="text-xl font-semibold italic">Claude 3.5 Sonnet / Gemini</span>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-1 transition-all hover:bg-white/20 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                  {isEn ? "Status" : "Status (สถานะ)"}
                </span>
                <span className="text-xl font-semibold italic flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isEn ? "Ready" : "พร้อมใช้งาน (Ready)"}
                </span>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 flex flex-col gap-1 transition-all hover:bg-emerald-500/30 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80 text-emerald-200">
                  {isEn ? "Processing Mode" : "โหมดประมวลผล (Processing Mode)"}
                </span>
                <span className="text-xl font-semibold italic text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 fill-emerald-300 text-emerald-300" />
                  Enterprise High-Speed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/protected/ai-monitor" className="group">
          <Card className="hover:border-blue-300 transition-all duration-300 rounded-[32px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 pt-6 px-6">
              <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-blue-600 transition-all duration-300 shadow-sm border border-blue-100/50">
                <Activity className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {isEn ? (
                    "AI Monitor"
                  ) : (
                    <>
                      เฝ้าระวัง AI <span className="text-slate-400 font-normal block text-xs">(AI Monitor)</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-[11px] font-semibold text-slate-500 truncate italic mt-0.5 uppercase tracking-wide opacity-70">
                  Performance Tracking
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/admin/ai-config" className="group">
          <Card className="hover:border-purple-300 transition-all duration-300 rounded-[32px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 pt-6 px-6">
              <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-purple-600 transition-all duration-300 shadow-sm border border-purple-100/50">
                <Cpu className="h-6 w-6 text-purple-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                  {isEn ? (
                    "AI Model Config"
                  ) : (
                    <>
                      ตั้งค่าโมเดล <span className="text-slate-400 font-normal block text-xs">(AI Model Config)</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-[11px] font-semibold text-slate-500 truncate italic mt-0.5 uppercase tracking-wide opacity-70">
                  LLM & Prompt Tuning
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-500 transition-all group-hover:translate-x-1" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/settings/smart-match" className="group">
          <Card className="hover:border-amber-300 transition-all duration-300 rounded-[32px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 pt-6 px-6">
              <div className="p-4 bg-amber-50 rounded-2xl group-hover:bg-amber-600 transition-all duration-300 shadow-sm border border-amber-100/50">
                <Sparkles className="h-6 w-6 text-amber-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                  {isEn ? (
                    "SmartMatch"
                  ) : (
                    <>
                      จับคู่ทรัพย์อัจฉริยะ <span className="text-slate-400 font-normal block text-xs">(SmartMatch)</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-[11px] font-semibold text-slate-500 truncate italic mt-0.5 uppercase tracking-wide opacity-70">
                  Autopilot Recommendations
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" />
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

