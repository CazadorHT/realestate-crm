"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Award,
  Flame,
  Trophy,
  Bot,
  Target,
  Filter,
  Share2,
  Copy,
  CheckCircle2,
} from "lucide-react";
import {
  getExecutiveWeeklyAISummaryAction,
  type AISummaryResult,
} from "@/features/dashboard/queries/executive-ai-summary-action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ExecutiveAISummary({
  tenantId,
  role,
  userId,
  multiTenantEnabled,
}: {
  tenantId?: string | null;
  role?: string;
  userId?: string;
  multiTenantEnabled?: boolean;
}) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AISummaryResult | null>(null);

  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "OWNER";

  // --- Global Filter Sync ---
  const currentBranchId = searchParams.get("branchId") || (multiTenantEnabled ? "ALL" : tenantId || "ALL");
  const currentTeamId = searchParams.get("teamId") || "ALL";
  const currentAgentId = searchParams.get("agentId") || (isAdmin ? "ALL" : userId || "ALL");

  const filters = {
    branchId: currentBranchId,
    teamId: currentTeamId,
    agentId: currentAgentId,
  };

  const fetchSummary = async (showToast = false) => {
    setLoading(true);
    try {
      const result = await getExecutiveWeeklyAISummaryAction({ tenantId, filters });
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

  const handleCopy = () => {
    if (!data) return;
    const textToCopy = `🤖 AI Executive Summary\n\n${data.summary}\n\n📊 Stats:\n- Leads: ${data.stats?.totalLeads}\n- Hot: ${data.stats?.hotLeads}\n- Won: ${data.stats?.dealsWon}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("คัดลอกบทวิเคราะห์ลง Clipboard แล้ว");
  };

  // Auto-fetch when filters change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSummary();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranchId, currentTeamId, currentAgentId]);

  return (
    <Card className="relative shrink-0 flex-none h-fit min-h-max shadow-xl bg-white text-slate-900 overflow-hidden border border-indigo-100">
      {/* Dynamic Background Gradients */}
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
              <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-2">
                 <Filter size={10} className="text-blue-500" />
                 <span className="font-medium">
                  ขอบเขต: {currentBranchId === "ALL" ? "บริษัท" : "รายสาขา"} / {currentTeamId === "ALL" ? "ทุกทีม" : "รายทีม"}
                 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCopy}
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-800">
                  <p className="font-bold">คัดลอกบทวิเคราะห์</p>
                  <p className="text-[10px] opacity-70">สำหรับนำไปแชร์ต่อใน LINE หรือ Email</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 bg-amber-50 rounded-full border border-amber-100 cursor-help">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-amber-900! text-white border-amber-800">
                <p className="font-bold text-amber-200">Executive Insight</p>
                <p className="text-[10px] opacity-80 text-amber-100">การวิเคราะห์ระดับสูงตามเป้าหมายธุรกิจ</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center min-h-[200px] relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-indigo-50/20 to-transparent animate-pulse" />
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4 relative z-10" />
            </div>
            <p className="text-slate-900 font-bold text-sm mb-1 animate-pulse">AI กำลังวิเคราะห์ข้อมูล...</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold opacity-60">Scanning Performance Metrics</p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-10 text-center min-h-[200px]">
            <Bot className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-slate-900 font-semibold mb-1 text-sm">พร้อมวิเคราะห์ข้อมูล</h3>
            <p className="text-slate-500 text-xs mb-6 max-w-[280px]">AI จะประมวลผลสรุปภาพรวมธุรกิจตามฟิลเตอร์ที่คุณเลือก</p>
            <Button
              onClick={() => fetchSummary(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 text-xs h-9"
            >
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
                  <span className="font-bold text-amber-600">ข้อมูลจำลอง</span> เนืองจากยังไม่มีข้อมูลจริงในรอบ 30 วัน
                </p>
              </div>
            )}

            <div className={cn("grid grid-cols-3 gap-2.5", data.isSample && "opacity-60 grayscale-[50]")}>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors group">
                <div className="flex items-center justify-between mb-1 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Leads <Target size={12} className="text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-slate-900">{data.stats?.totalLeads || 0}</div>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs hover:border-orange-200 transition-colors group">
                <div className="flex items-center justify-between mb-1 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Hot <Flame size={12} className="text-orange-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-orange-600">{data.stats?.hotLeads || 0}</div>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs hover:border-emerald-200 transition-colors group">
                <div className="flex items-center justify-between mb-1 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Won <Trophy size={12} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-emerald-600">{data.stats?.dealsWon || 0}</div>
              </div>
            </div>

            {/* Narrative Summary */}
            <div className={cn("relative p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50", data.isSample && "opacity-70")}>
              <div className="absolute top-2 right-2 text-indigo-400 opacity-20">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Bot size={40} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-indigo-900 text-white border-indigo-800">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-amber-400" />
                      <span className="font-bold">Powered by Advanced AI</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium relative z-10">
                {data.summary.replace("📊 [ข้อมูลตัวอย่างจำลอง - เนื่องจากคุณยังไม่มีข้อมูลจริงในระบบ]\n\n", "")}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => fetchSummary(true)}
              disabled={loading}
              className="w-full bg-white border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl h-10 text-xs font-semibold"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : "อัปเดตบทวิเคราะห์"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
