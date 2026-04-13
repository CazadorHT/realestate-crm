"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { ExecutiveData } from "../types";

interface ExecutiveAiInsightsProps {
  data: ExecutiveData[];
  totalLeads: number;
  totalDeals: number;
}

export function ExecutiveAiInsights({
  data,
  totalLeads,
  totalDeals,
}: ExecutiveAiInsightsProps) {
  // 🛡️ Safe Data Analysis Logic
  if (data.length === 0) return null;

  const avgConversion = totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0;

  // Find top and bottom performing branches with tie-breaking logic
  const sortedData = [...data].sort((a, b) => {
    const rateA = a.leadCount > 0 ? a.dealCount / a.leadCount : 0;
    const rateB = b.leadCount > 0 ? b.dealCount / b.leadCount : 0;

    if (rateB !== rateA) return rateB - rateA;
    return b.dealCount - a.dealCount; // Tie-breaker: Total deal volume
  });

  const topBranch = sortedData[0];
  const bottomBranch = sortedData[sortedData.length - 1];

  return (
    <Card className="border-0 shadow-lg bg-linear-to-br from-slate-900 to-slate-800 text-white h-full transition-all hover:shadow-xl">
      <CardHeader className="pb-3 border-b border-white/10">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-400 uppercase tracking-widest">
          <Sparkles className="h-4 w-4 animate-pulse" />
          AI EXECUTIVE BRIEFING
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Key Observation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5" />
            บทวิเคราะห์ภาพรวม
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            ปัจจุบันองค์กรมีอัตราการปิดดีลเฉลี่ยที่{" "}
            <span className="text-emerald-400 font-semibold">
              {avgConversion.toFixed(1)}%
            </span>
            โดยสาขา{" "}
            <span className="text-blue-400 font-semibold">
              {topBranch?.tenantName}
            </span>{" "}
            มีประสิทธิภาพสูงสุด ขณะที่ภาพรวมลีด{" "}
            {totalLeads > 50
              ? "จัดอยู่ในเกณฑ์ที่น่าพอใจ"
              : "แนะนำให้เร่งการทำตลาด"}
          </p>
        </div>

        {/* Actionable Insight */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2 group hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" />
            Strategic Warning
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            สาขา{" "}
            <span className="text-rose-400 font-semibold">
              {bottomBranch?.tenantName}
            </span>{" "}
            มีประสิทธิภาพต่ำกว่าเกณฑ์เฉลี่ย
            ควรตรวจสอบกระบวนการโอนย้ายลีดและประสิทธิภาพเซลล์รายบุคคลเป็นการเร่งด่วน
          </p>
        </div>

        {/* Recommendation */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Lightbulb className="h-3.5 w-3.5" />
            ข้อเสนอแนะเชิงกลยุทธ์
          </div>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2 text-[11px] text-slate-400 italic">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              ศึกษา Best Practice จาก {topBranch?.tenantName}{" "}
              เพื่อปรับใช้กับสาขาอื่นๆ
            </li>
            <li className="flex items-start gap-2 text-[11px] text-slate-400 italic">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              พิจารณาการขยายงบการตลาดในสาขาที่มี Conversion Rate สูง (High
              Efficiency)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
