"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Award, Flame, Trophy, Bot, Target } from "lucide-react";
import { getExecutiveWeeklyAISummaryAction } from "@/features/dashboard/queries/executive-ai-summary-action";
import { toast } from "sonner";

export function ExecutiveAISummary({ tenantId }: { tenantId?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: string; stats: any; isSample?: boolean } | null>(null);

  const fetchSummary = async (showToast = false) => {
    setLoading(true);
    try {
      const result = await getExecutiveWeeklyAISummaryAction(tenantId);
      setData(result);
      
      if (showToast) {
        if (result.isSample) {
          toast.info("แสดงข้อมูลจำลอง (ยังไม่มีข้อมูลการขายในรอบ 30 วัน)");
        } else if (result.stats?.totalLeads === 0) {
          toast.warning("ไม่มีข้อมูลใหม่ในช่วง 30 วันที่ผ่านมา");
        } else {
          toast.success("AI สรุปข้อมูลรายเดือนเรียบร้อยแล้ว");
        }
      }
    } catch (error) {
      if (showToast) {
        toast.error("ไม่สามารถสรุปข้อมูลได้ในขณะนี้");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ใช้งานการดึงข้อมูลอัตโนมัติตั้งแต่ตอนโหลด (Auto fetch)
    // หากข้อมูลเป็น 0 ระบบจะใช้ Sample Data ทันที ทำให้โหลดเร็วและไม่เปลืองโควต้า AI
    fetchSummary(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return (
    <Card className="relative shrink-0 flex-none h-fit min-h-max shadow-xl bg-white text-slate-900 overflow-hidden border border-indigo-100">
      {/* Dynamic Background Gradients - Softened for light mode */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 via-purple-50/50 to-transparent pointer-events-none" />
      
      <CardHeader className="pb-4 relative z-10 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                AI Executive Summary
              </CardTitle>
              <CardDescription className="text-slate-500 text-[10px] mt-0.5">
                สรุปทิศทางธุรกิจรายเดือนด้วย AI (วิเคราะห์ลีดและโอกาสการขาย)
              </CardDescription>
            </div>
          </div>
          <div className="p-2 bg-amber-50 rounded-full border border-amber-100">
            <Award className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 relative z-10">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-12 text-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-500 text-xs">กำลังโหลดข้อมูลสรุปธุรกิจ...</p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-10 text-center min-h-[200px]">
            <Bot className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-slate-900 font-semibold mb-1 text-sm">พร้อมวิเคราะห์ข้อมูลของคุณ</h3>
            <p className="text-slate-500 text-xs mb-6 max-w-[280px]">
              คลิกปุ่มด้านล่างเพื่อให้ AI ประมวลผลและสรุปภาพรวมธุรกิจในรอบ 30 วัน
            </p>
            <Button onClick={() => fetchSummary(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 text-xs h-9">
              เริ่มสรุปรายงานด้วย AI
            </Button>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-500">
            {data.isSample && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-3 shadow-sm">
                <span className="relative flex h-2 w-2 mt-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <p className="font-medium leading-relaxed">
                  <span className="font-bold text-amber-600">นี่คือข้อมูลจำลอง (Sample Data)</span> เนื่องจากยังไม่มีข้อมูลการขายจริงในรอบ 30 วัน 
                </p>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className={`grid grid-cols-3 gap-3 ${data.isSample ? "opacity-60 grayscale-[50]" : ""}`}>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`text-[10px] uppercase tracking-wider ${data.isSample ? "text-slate-400" : "text-slate-500 font-semibold"}`}>New Leads</div>
                  <Target className={`h-3.5 w-3.5 ${data.isSample ? "text-slate-300" : "text-blue-500"}`} />
                </div>
                <div className={`text-xl ${data.isSample ? "font-semibold text-slate-400" : "font-bold text-slate-900"}`}>{data.stats?.totalLeads || 0}</div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`text-[10px] uppercase tracking-wider ${data.isSample ? "text-slate-400" : "text-slate-500 font-semibold"}`}>Hot Leads</div>
                  <Flame className={`h-3.5 w-3.5 ${data.isSample ? "text-slate-300" : "text-orange-500"}`} />
                </div>
                <div className={`text-xl ${data.isSample ? "font-semibold text-slate-400" : "font-bold text-orange-600"}`}>{data.stats?.hotLeads || 0}</div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`text-[10px] uppercase tracking-wider ${data.isSample ? "text-slate-400" : "text-slate-500 font-semibold"}`}>Won</div>
                  <Trophy className={`h-3.5 w-3.5 ${data.isSample ? "text-slate-300" : "text-emerald-500"}`} />
                </div>
                <div className={`text-xl ${data.isSample ? "font-semibold text-slate-400" : "font-bold text-emerald-600"}`}>{data.stats?.dealsWon || 0}</div>
              </div>
            </div>

            {/* AI Narrative */}
            <div className={`relative ${data.isSample ? "opacity-70" : ""}`}>
              <div className={`absolute -left-1 top-0 bottom-0 w-[3px] rounded-full ${data.isSample ? "bg-slate-200" : "bg-indigo-500"}`} />
              <div className={`pl-4 py-1 text-xs leading-relaxed whitespace-pre-wrap ${data.isSample ? "text-slate-400" : "text-slate-700 font-medium"}`}>
                {data.summary.replace("📊 [ข้อมูลตัวอย่างจำลอง - เนื่องจากคุณยังไม่มีข้อมูลจริงในระบบ]\n\n", "")}
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => fetchSummary(true)}
              disabled={loading}
              className="w-full bg-white border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl h-10 transition-colors text-xs font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>อัปเดตบทวิเคราะห์ล่าสุด</span>
                </div>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
