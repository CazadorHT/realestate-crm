"use client";

import { ExecutiveAiInsights } from "../executive-ai-actions";
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  BarChart,
  Target,
  Zap,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AiExecutiveBriefingProps {
  insights?: ExecutiveAiInsights | null;
  isLoading?: boolean;
  className?: string;
}

export function AiExecutiveBriefing({
  insights,
  isLoading,
  className,
}: AiExecutiveBriefingProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-6 animate-pulse", className)}>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 h-40 bg-indigo-600/40 rounded-2xl relative overflow-hidden" />
          <div className="h-40 bg-white border-l-4 border-amber-200 rounded-xl shadow-sm" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-slate-100/50 rounded-2xl border border-slate-100" />
          <div className="h-64 bg-slate-100/50 rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Summary & Forecast */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 ">
        <Card className="md:col-span-2 border-0 shadow-lg bg-linear-to-br from-indigo-500 to-blue-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-amber-300" />
              AI Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed font-medium text-white/90">
              {insights.summary}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white border-l-4 border-amber-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              Next Month Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 font-semibold leading-relaxed">
              {insights.forecast}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Trends */}
        <Card className="border-0 shadow-md bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Key Observations & Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.trends.map((trend, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-slate-600"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  {trend}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-0 shadow-md bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <Lightbulb className="h-4 w-4 text-emerald-500" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-slate-600"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* AI Usage Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-500 mt-4">
        <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed italic">
          <p className="font-bold text-slate-600 mb-0.5">⚠️ ข้อมูลการใช้งานระบบ AI (AI Usage Disclaimer):</p>
          บทพยากรณ์และข้อเสนอแนะเชิงกลยุทธ์นี้ประมวลผลโดย Generative AI เพื่อช่วยอำนวยความสะดวกในการวิเคราะห์ข้อมูลเบื้องต้นเท่านั้น โปรดตรวจสอบความถูกต้องของตัวเลขและสรุปผลกับรายงานทางสถิติและข้อมูลบัญชีจริงจากระบบ CRM ทุกครั้งก่อนนำไปประกอบการตัดสินใจทางธุรกิจ
        </div>
      </div>
    </div>
  );
}
