"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { generateLeadSummaryAction } from "../actions";
import { toast } from "sonner";

interface LeadSummaryCardProps {
  leadId: string;
}

export function LeadSummaryCard({ leadId }: LeadSummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateLeadSummaryAction({ leadId });
      if (!result.success) throw new Error(result.error);
      setSummary(result.data);
      toast.success("สรุปข้อมูลด้วย AI เรียบร้อยแล้ว ✨");
    } catch (error: any) {
      console.error("AI Summary Error:", error);
      toast.error(error.message || "ไม่สามารถสรุปข้อมูลได้ในขณะนี้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-violet-900/5">
      <CardHeader className="flex flex-row items-center gap-4 justify-between space-y-0 p-5 border-b border-slate-50 bg-slate-50/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200">
            <Sparkles
              className={`h-5 w-5 ${isLoading ? "animate-pulse" : ""}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">AI Intelligent Summary</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              สรุปความต้องการและกิจกรรมสำคัญอัตโนมัติ
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs font-medium border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
        >
          {isLoading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          )}
          {summary ? "สรุปใหม่" : "สรุปด้วย AI"}
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        {!summary && !isLoading && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">
                ยังไม่มีบทสรุป
              </p>
              <p className="text-xs text-slate-400">
                กดปุ่ม "สรุปด้วย AI" เพื่อวิเคราะห์ข้อมูลลีดรายนี้
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3 py-2">
            <div className="h-4 w-full animate-pulse rounded-md bg-slate-100" />
            <div className="h-4 w-[90%] animate-pulse rounded-md bg-slate-100" />
            <div className="h-4 w-[95%] animate-pulse rounded-md bg-slate-100" />
            <div className="h-4 w-[80%] animate-pulse rounded-md bg-slate-100" />
          </div>
        )}

        {summary && !isLoading && (
          <div className="relative">
            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-linear-to-b from-violet-400/50 to-fuchsia-400/50 rounded-full opacity-50" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
