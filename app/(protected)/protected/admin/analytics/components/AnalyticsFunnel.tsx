"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Filter, Users, TrendingUp, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsFunnelProps {
  data: {
    views: number;
    leads: number;
    deals: number;
  };
}

export function AnalyticsFunnel({ data }: AnalyticsFunnelProps) {
  const { views, leads, deals } = data;
  
  const leadRate = views > 0 ? (leads / views) * 100 : 0;
  const dealRate = leads > 0 ? (deals / leads) * 100 : 0;
  const overallRate = views > 0 ? (deals / views) * 100 : 0;

  const funnelSteps = [
    {
      label: "Potential (Views)",
      value: views,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "bg-blue-500",
      width: "w-full",
      description: "ผู้เข้าชมทรัพย์สินทั้งหมด"
    },
    {
      label: "Inquiry (Leads)",
      value: leads,
      icon: <Users className="h-4 w-4" />,
      color: "bg-blue-400",
      width: views > 0 ? `${Math.max((leads / views) * 100, 15)}%` : "w-[60%]",
      description: "ความสนใจ/ผู้ติดต่อสอบถาม",
      conversion: leadRate
    },
    {
      label: "Closed (Deals)",
      value: deals,
      icon: <Handshake className="h-4 w-4" />,
      color: "bg-blue-300",
      width: views > 0 ? `${Math.max((deals / views) * 100, 10)}%` : "w-[30%]",
      description: "ปิดการขายสำเร็จ",
      conversion: dealRate
    }
  ];

  return (
    <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg font-semibold text-slate-800">Conversion Funnel</CardTitle>
        </div>
        <CardDescription>วิเคราะห์ช่องทางและการเปลี่ยนสถานะผู้สนใจ (View-to-Deal)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 py-4">
          {funnelSteps.map((step, index) => (
            <div key={step.label} className="relative">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg text-white shadow-sm", step.color)}>
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{step.label}</p>
                    <p className="text-[10px] text-slate-400">{step.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">{step.value.toLocaleString()}</p>
                  {step.conversion !== undefined && (
                    <p className="text-[10px] font-medium text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block">
                      {step.conversion.toFixed(1)}% Conversion
                    </p>
                  )}
                </div>
              </div>
              
              <div className="h-8 w-full bg-slate-100 rounded-xl overflow-hidden relative shadow-inner">
                <div 
                  className={cn("h-full rounded-xl transition-all duration-1000 ease-out shadow-lg", step.color)}
                  style={{ width: step.width }}
                />
                {index < funnelSteps.length - 1 && (
                  <div className="absolute right-0 top-0 h-full w-2 bg-white/20 skew-x-12" />
                )}
              </div>

              {index < funnelSteps.length - 1 && (
                <div className="absolute bottom-[-20px] left-8 h-4 w-px bg-slate-200 border-dashed border-l" />
              )}
            </div>
          ))}
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-blue-50/50 p-3 rounded-2xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Efficiency</span>
            <div className="text-right">
                <span className="text-lg font-bold text-blue-700">{overallRate.toFixed(2)}%</span>
                <p className="text-[9px] text-slate-400 font-medium italic">Views to Closed Deals</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
