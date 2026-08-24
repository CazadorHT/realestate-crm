"use client";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase } from "lucide-react";
import { ExecutiveLeadsChart, ExecutiveDealsChart } from "./ExecutiveCharts";
import { ExecutiveAiInsights } from "./ExecutiveAiInsights";
import { ExecutiveData } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface ExecutiveChartsContainerProps {
  data: ExecutiveData[];
  totalLeads: number;
  totalDeals: number;
  isLoading: boolean;
}

// 🛡️ Skeleton for Chart Area
const ChartSkeleton = () => (
  <div className="h-[350px] w-full flex flex-col gap-4">
    <div className="flex justify-between items-end h-full px-4 pb-8">
      {[20, 60, 40, 90, 30, 70, 50].map((h, i) => (
        <div key={i} className="w-[10%] bg-slate-100 animate-pulse rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

const AiSkeleton = () => (
  <div className="h-[400px] w-full bg-slate-800 animate-pulse rounded-2xl p-6 space-y-6">
    <div className="h-4 w-32 bg-slate-700 rounded" />
    <div className="h-20 w-full bg-slate-700/50 rounded-xl" />
    <div className="h-24 w-full bg-slate-700/50 rounded-xl" />
  </div>
);

export function ExecutiveChartsContainer({
  data,
  totalLeads,
  totalDeals,
  isLoading,
}: ExecutiveChartsContainerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 📊 Main Charts Section */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <Users className="h-5 w-5 text-blue-500" />
              {isEn ? "Lead Volume by Branch" : "การเปรียบเทียบจำนวนลีดรายสาขา"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isEn ? "Acquisition efficiency across global lead distribution" : "ประสิทธิภาพในการสรรหาลูกค้าของแต่ละสาขา"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ErrorBoundary>
              {isLoading ? <ChartSkeleton /> : <ExecutiveLeadsChart data={data} />}
            </ErrorBoundary>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              {isEn ? "Won Deals by Branch" : "การเปรียบเทียบจำนวนดีลรายสาขา"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isEn ? "Conversion performance of successfully closed deals" : "ประสิทธิภาพความสำเร็จในการปิดการขาย"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ErrorBoundary>
              {isLoading ? <ChartSkeleton /> : <ExecutiveDealsChart data={data} />}
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* 🧠 AI Insights Section */}
      <div className="lg:col-span-1">
        <div className="sticky top-8 h-fit lg:h-full lg:max-h-[750px] overflow-y-auto no-scrollbar pb-6 lg:pb-0">
          {isLoading ? (
            <AiSkeleton />
          ) : (
            <ExecutiveAiInsights 
              data={data} 
              totalLeads={totalLeads} 
              totalDeals={totalDeals} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

