"use client";

import React, { memo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BrainCircuit, Info } from "lucide-react";
import dynamic from "next/dynamic";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ForecastData } from "@/features/analytics/market-intelligence";

const ExecutiveRevenueForecastChart = dynamic<{ data: ForecastData[] }>(
  () => import("../ExecutiveRevenueForecastChart").then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-xl" />
    ),
  },
);

interface RevenueForecastSectionProps {
  data: ForecastData[];
  mounted: boolean;
}

export const RevenueForecastSection = memo(function RevenueForecastSection({
  data,
  mounted,
}: RevenueForecastSectionProps) {
  return (
    <Card className="border-slate-100 shadow-sm border-0 bg-linear-to-br from-white/80 to-blue-50/30 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <BrainCircuit className="h-32 w-32 text-blue-600" />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base xs:text-lg font-bold flex items-center gap-2 text-slate-800">
            <div className="p-1.5 xs:p-2 bg-blue-100 rounded-lg shrink-0">
              <BrainCircuit className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600" />
            </div>
            <span className="leading-tight">AI Market Intelligence</span>
          </CardTitle>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-slate-400 hover:text-blue-500 transition-colors">
                  <Info className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-slate-900 text-white border-0 p-3 rounded-xl shadow-2xl">
                <p className="text-xs leading-relaxed">
                  ระบบ AI วิเคราะห์จาก Leads ใน pipeline โดยคำนวณตามดัชนีความร้อนแรง (AI Score), Stage ของดีล และสถิติการปิดดีลในอดีต เพื่อทำนายรายได้ล่วงหน้า 6 เดือน
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-[10px] xs:text-xs text-slate-500 ml-9 xs:ml-11">
          การวิเคราะห์รายได้จริง เทียบกับคาดการณ์ล่วงหน้า
        </CardDescription>
      </CardHeader>
      
      <CardContent className="h-[350px] sm:h-[450px] px-2 sm:px-6 relative mt-4">
        {mounted ? (
          <ExecutiveRevenueForecastChart data={data} />
        ) : (
          <div className="h-full w-full bg-slate-100/50 animate-pulse rounded-2xl" />
        )}
      </CardContent>
    </Card>
  );
});
