"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MarketingPerformanceData } from "@/features/dashboard/queries";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Zap, Facebook, MessageCircle, Search, Share2, Globe } from "lucide-react";

interface MarketingROISummaryProps {
  data: MarketingPerformanceData[];
}

export function MarketingROISummary({ data }: MarketingROISummaryProps) {
  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("facebook")) return <Facebook className="h-4 w-4 text-blue-600" />;
    if (s.includes("line")) return <MessageCircle className="h-4 w-4 text-green-500" />;
    if (s.includes("google") || s.includes("search")) return <Search className="h-4 w-4 text-red-500" />;
    if (s.includes("referral")) return <Share2 className="h-4 w-4 text-purple-500" />;
    return <Globe className="h-4 w-4 text-slate-500" />;
  };

  return (
    <Card className="border-none shadow-lg bg-white/60 backdrop-blur-md overflow-hidden group hover:shadow-xl transition-all duration-500">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/30 border-b border-slate-100/50">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-blue-200 shadow-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
            วิเคราะห์คุณภาพช่องทางตลาด
          </CardTitle>
          <CardDescription className="text-xs">
            ประสิทธิภาพตามคุณภาพลีดที่ประเมินโดย AI
          </CardDescription>
        </div>
        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:rotate-12 transition-transform">
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="p-4 bg-slate-50 rounded-full border border-dashed border-slate-200">
                <Target className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">ยังไม่มีข้อมูลการตลาดในระบบ</p>
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.source}
                className="group/item relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-slate-50 rounded-xl group-hover/item:bg-blue-50 transition-colors">
                      {getSourceIcon(item.source)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate block">
                        {item.source}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium">{item.leadCount} ลีด</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-orange-600 font-bold flex items-center gap-0.5">
                          🔥 {item.hotLeadCount} คุณภาพสูง
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <div className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold mb-1">
                      AI Quality Score
                    </div>
                    <Badge
                      variant="secondary"
                      className={`
                        text-xs font-black rounded-lg px-2 py-0.5 border shadow-sm
                        ${
                          item.avgAiScore >= 70
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : item.avgAiScore >= 40
                              ? "bg-orange-50 text-orange-700 border-orange-100"
                              : "bg-slate-50 text-slate-700 border-slate-100"
                        }
                      `}
                    >
                      {item.avgAiScore}%
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar with Glow */}
                <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 group-hover/item:brightness-110 shadow-[0_0_8px_rgba(0,0,0,0.1)]
                      ${
                        item.avgAiScore >= 70
                          ? "bg-linear-to-r from-emerald-400 to-emerald-500 shadow-emerald-200"
                          : item.avgAiScore >= 40
                            ? "bg-linear-to-r from-orange-400 to-orange-500 shadow-orange-200"
                            : "bg-linear-to-r from-slate-400 to-slate-500 shadow-slate-200"
                      }
                    `}
                    style={{ width: `${item.avgAiScore}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {data.length > 0 && (
          <div className="mt-8 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-start gap-4">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 shrink-0">
              <Zap className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">AI Recommendation</p>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                ช่องทางที่มี AI Score สูงมีความตั้งใจซื้อ (Intent) สูงกว่าปกติ 
                ควรพิจารณาปรับงบประมาณจากช่องทางทั่วไปมายังช่องทางที่มีลีดคุณภาพหนาแน่นเพื่อเพิ่มโอกาสปิดการขาย
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
