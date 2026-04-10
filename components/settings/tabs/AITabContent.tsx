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

export function AITabContent() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Snapshot Active Model */}
        <Card className="col-span-full border-none bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-[24px] shadow-xl shadow-indigo-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-indigo-50">AI Control Center</CardTitle>
                <CardDescription className="text-indigo-50 font-medium italic">
                  สถานะการทำงานของปัญญาประดิษฐ์ในระบบ
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-1 transition-all hover:bg-white/20">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">LLM Provider</span>
                <span className="text-xl font-bold italic">Claude 3.5 Sonnet / Gemini</span>
              </div>
              <div className="px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-1 transition-all hover:bg-white/20">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</span>
                <span className="text-xl font-bold italic flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ready
                </span>
              </div>
              <div className="px-6 py-4 rounded-3xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 flex flex-col gap-1 transition-all hover:bg-emerald-500/30">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-emerald-200">Processing Mode</span>
                <span className="text-xl font-bold italic text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 fill-emerald-300 text-emerald-300" />
                  Enterprise High-Speed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/protected/ai-monitor" className="group">
          <Card className="hover:border-blue-300 transition-all duration-300 rounded-[22px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors duration-300">
                <Activity className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">AI Monitor</CardTitle>
                <CardDescription className="text-[13px] font-medium text-slate-500 truncate italic">
                  ตรวจสอบสถานะการทำงาน
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/admin/ai-config" className="group">
          <Card className="hover:border-purple-300 transition-all duration-300 rounded-[22px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-600 transition-colors duration-300">
                <Cpu className="h-6 w-6 text-purple-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors truncate">AI Model Config</CardTitle>
                <CardDescription className="text-[13px] font-medium text-slate-500 truncate italic">
                  จัดการ Model และ Prompt
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/settings/smart-match" className="group">
          <Card className="hover:border-amber-300 transition-all duration-300 rounded-[22px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-600 transition-colors duration-300">
                <Sparkles className="h-6 w-6 text-amber-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">SmartMatch</CardTitle>
                <CardDescription className="text-[13px] font-medium text-slate-500 truncate italic">
                  ตั้งค่าแนะนำทรัพย์อัตโนมัติ
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
