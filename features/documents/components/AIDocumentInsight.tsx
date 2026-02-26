"use client";

import { useState } from "react";
import { analyzeDocumentAction } from "../ai-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AIDocumentInsightProps {
  documentId: string;
  documentName: string;
  initialSummary?: string | null;
  initialAnalysis?: any | null;
}

export function AIDocumentInsight({
  documentId,
  documentName,
  initialSummary,
  initialAnalysis,
}: AIDocumentInsightProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState(initialSummary);
  const [analysis, setAnalysis] = useState(initialAnalysis);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeDocumentAction(documentId);
      if (res.success) {
        setSummary(res.data.summary);
        setAnalysis(res.data);
        toast.success("วิเคราะห์เอกสารด้วย AI สำเร็จ");
      } else {
        setError(res.message || "การวิเคราะห์ล้มเหลว");
        toast.error(res.message || "การวิเคราะห์ล้มเหลว");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
    } finally {
      setLoading(false);
    }
  };

  const hasData = summary || analysis;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${hasData ? "text-amber-500 hover:text-amber-600" : "text-slate-400 hover:text-indigo-600"}`}
          title="AI Insights"
        >
          <Sparkles className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-amber-500 fill-amber-50" />
            AI Document Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="p-3 bg-slate-50 border rounded-lg">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Analyzing File:
            </p>
            <p className="text-sm font-semibold text-slate-700 truncate">
              {documentName}
            </p>
          </div>

          {!hasData && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-amber-400" />
              </div>
              <div className="max-w-[300px]">
                <h3 className="text-lg font-bold text-slate-800">
                  ยังไม่มีข้อมูลวิเคราะห์
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  ให้ AI
                  ช่วยสรุปเนื้อหาและตรวจสอบจุดเสี่ยงในเอกสารนี้ให้อัตโนมัติ
                </p>
              </div>
              <Button
                onClick={handleAnalyze}
                className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none shadow-lg shadow-amber-200"
              >
                เริ่มวิเคราะห์ด้วย AI
              </Button>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="max-w-[300px]">
                <h3 className="text-lg font-bold text-red-800">
                  วิเคราะห์ไม่สำเร็จ
                </h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <Button
                onClick={handleAnalyze}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
                <Sparkles className="h-5 w-5 text-amber-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">
                  Gemini กำลังอ่านเอกสาร...
                </p>
                <p className="text-xs text-slate-400 mt-1 italic">
                  ระบบกำลังสรุปข้อมูลและตรวจสอบข้อบัญญัติต่างๆ
                </p>
              </div>
            </div>
          )}

          {hasData && !loading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Section */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">
                    สรุปเนื้อหา (Summary)
                  </h3>
                </div>
                <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl leading-relaxed text-slate-700 text-sm italic">
                  "{summary}"
                </div>
              </section>

              {/* Risks Section */}
              {analysis?.risks && analysis.risks.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h3 className="font-bold text-slate-800">
                      ข้อควรระวัง/จุดเสี่ยง (Risks)
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {analysis.risks.map((risk: string, i: number) => (
                      <div
                        key={i}
                        className="flex gap-2 p-2.5 bg-red-50/50 border border-red-100 rounded-lg text-xs text-red-800"
                      >
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-400" />
                        {risk}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Key Dates Section */}
              {analysis?.key_dates && analysis.key_dates.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <h3 className="font-bold text-slate-800">
                      วันที่สำคัญ (Key Dates)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.key_dates.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-background border rounded-lg shadow-sm"
                      >
                        <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                          <Clock01 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.description}
                          </p>
                          <p className="text-xs font-bold text-slate-700">
                            {item.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] text-slate-400 italic">
                    วิเคราะห์โดย AI ล่าสุดเมื่อ{" "}
                    {new Date().toLocaleDateString("th-TH")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  className="h-8 text-[11px] gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  วิเคราะห์ใหม่
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Clock01({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Fixed missing icon imports in the code above: RefreshCw
import { RefreshCw } from "lucide-react";
