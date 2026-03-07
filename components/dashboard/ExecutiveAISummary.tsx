"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BarChart3, ChevronRight, Loader2, Award } from "lucide-react";
import { getExecutiveWeeklyAISummaryAction } from "@/features/dashboard/queries";
import { toast } from "sonner";

export function ExecutiveAISummary() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: string; stats: any } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await getExecutiveWeeklyAISummaryAction();
      setData(result);
      toast.success("AI สรุปข้อมูลรายสัปดาห์เรียบร้อยแล้ว");
    } catch (error) {
      toast.error("ไม่สามารถสรุปข้อมูลได้ในขณะนี้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-lg bg-linear-to-br from-slate-900 to-indigo-950 text-white overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-indigo-300" />
            </div>
            <CardTitle className="text-lg font-bold text-white">AI Executive Summary</CardTitle>
          </div>
          <Award className="h-5 w-5 text-amber-400 " />
        </div>
        <CardDescription className="text-slate-300">
          สรุปทิศทางธุรกิจรายสัปดาห์ด้วย AI (วิเคราะห์ลีดและโอกาสการขาย)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {!data ? (
          <div className="flex flex-col items-center py-6 text-center">
            <BarChart3 className="h-12 w-12 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              ยังไม่มีรายงานสรุปล่าสุด คลิกปุ่มเพื่อประมวลผลข้อมูลในรอบ 7 วันที่ผ่านมา
            </p>
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-md shadow-indigo-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังคิดวิเคราะห์...
                </>
              ) : (
                "เริ่มสรุปรายงานด้วย AI"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">New Leads</div>
                <div className="text-xl font-bold">{data.stats.totalLeads}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Hot Leads</div>
                <div className="text-xl font-bold text-orange-400">{data.stats.hotLeads}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Won</div>
                <div className="text-xl font-bold text-green-400">{data.stats.dealsWon}</div>
              </div>
            </div>

            {/* AI Narrative */}
            <div className="relative">
              <div className="absolute -left-3 top-0 bottom-0 w-1 bg-indigo-500/50 rounded-full" />
              <div className="pl-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                {data.summary}
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full text-slate-400 hover:text-white hover:bg-white/5 text-xs h-8"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : "อัปเดตข้อมูลล่าสุด"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
