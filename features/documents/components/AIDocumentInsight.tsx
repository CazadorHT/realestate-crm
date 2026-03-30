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
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { verifyAiAnalysisAction } from "../actions";
import { AIAnalysisResult } from "../schema";

interface AIDocumentInsightProps {
  documentId: string;
  documentName: string;
  initialSummary?: string | null;
  initialAnalysis?: AIAnalysisResult | null;
  aiVerifiedAt?: string | null;
  aiVerifiedBy?: string | null;
}

export function AIDocumentInsight({
  documentId,
  documentName,
  initialSummary,
  initialAnalysis,
  aiVerifiedAt,
  aiVerifiedBy,
}: AIDocumentInsightProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | undefined>(initialSummary || undefined);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | undefined>(initialAnalysis || undefined);
  const [verifiedAt, setVerifiedAt] = useState(aiVerifiedAt);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeDocumentAction(documentId);
      if (res.success && res.data) {
        setSummary(res.data.summary);
        setAnalysis(res.data);
        setVerifiedAt(null); // Reset when new analysis is generated
        toast.success("AI วิเคราะห์เสร็จสิ้น กรุณาตรวจสอบและกดยืนยันข้อมูล");
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

  const handleVerify = async () => {
    if (!summary || !analysis) return;
    setIsVerifying(true);
    try {
      const res = await verifyAiAnalysisAction(documentId, summary, analysis);
      if (res.success) {
        setVerifiedAt(new Date().toISOString());
        toast.success("บันทึกและยืนยันข้อมูล AI เรียบร้อยแล้ว");
      } else {
        toast.error(res.message || "ยืนยันข้อมูลไม่สำเร็จ");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsVerifying(false);
    }
  };

  const hasData = !!(summary || analysis);
  const isVerified = !!verifiedAt;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${
            isVerified 
              ? "text-emerald-500 hover:text-emerald-600" 
              : hasData 
                ? "text-amber-500 hover:text-amber-600 animate-pulse" 
                : "text-slate-400 hover:text-indigo-600"
          }`}
          title={isVerified ? "AI Verified" : "AI Insights"}
        >
          {isVerified ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Sparkles className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl pr-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500 fill-amber-50" />
              AI Document Assistant
            </div>
            {isVerified && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ตรวจสอบแล้ว
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-5">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Analyzing File:
            </p>
            <p className="text-sm font-semibold text-slate-700 truncate">
              {documentName}
            </p>
          </div>

          {!hasData && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-2xl">
              <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-amber-400" />
              </div>
              <div className="max-w-[300px]">
                <h3 className="text-lg font-bold text-slate-800">
                  พร้อมวิเคราะห์ด้วย AI
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  ระบบจะช่วยสรุปเนื้อหาและตรวจสอบจุดเสี่ยงในเอกสารนี้ให้อัตโนมัติ
                </p>
              </div>
              <Button
                onClick={handleAnalyze}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-100"
              >
                เริ่มวิเคราะห์ทันที
              </Button>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-red-50/30 rounded-2xl border border-red-100">
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
                className="border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" strokeWidth={1.5} />
                <Sparkles className="h-5 w-5 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">
                  Gemini กำลังอ่านเอกสารอย่างละเอียด...
                </p>
                <p className="text-xs text-slate-400 mt-1 italic">
                  ระบบกำลังสรุปข้อมูลและตรวจสอบข้อสัญญาต่างๆ
                </p>
              </div>
            </div>
          )}

          {hasData && !loading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!isVerified && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 shadow-sm">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold mb-1">📢 ข้อมูลนี้ยังไม่ผ่านการตรวจสอบโดยเจ้าหน้าที่</p>
                    <p className="opacity-90">ข้อมูลชุดนี้ประมวลผลโดย AI ซึ่งอาจมีการคาดเคลื่อนของตัวเลขหรือวันที่ กรุณาตรวจทานเทียบกับเอกสารจริง และกดยืนยันเพื่อบันทึกลงระบบ</p>
                  </div>
                </div>
              )}

              {/* Summary Section */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">สรุปเนื้อหา (Summary)</h3>
                </div>
                <div 
                  className={`p-4 rounded-xl leading-relaxed text-sm transition-colors ${
                    isVerified ? "bg-slate-50 text-slate-600 italic" : "bg-white border-2 border-amber-100 text-slate-900 font-medium shadow-sm"
                  }`}
                  contentEditable={!isVerified}
                  onBlur={(e) => setSummary(e.currentTarget.textContent || "")}
                  suppressContentEditableWarning={true}
                >
                  {summary}
                </div>
              </section>

              {/* Highlights/Points */}
              <div className="grid grid-cols-1 gap-4">
                {/* Risks Section */}
                {analysis?.risks && analysis.risks.length > 0 && (
                  <section className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <h3 className="font-bold text-slate-800 text-sm">จุดเสี่ยงที่พบ (Risks)</h3>
                    </div>
                    <div className="grid gap-2">
                      {analysis.risks.map((risk: string, i: number) => (
                        <div
                          key={i}
                          className="flex gap-2 p-2.5 bg-red-50/50 border border-red-100 rounded-lg text-[11px] text-red-800"
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
                      <h3 className="font-bold text-slate-800 text-sm">ข้อมูลสำคัญ (Key Dates/Terms)</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysis.key_dates.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm"
                        >
                          <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <Clock01 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                              {item.description}
                            </p>
                            <p className="text-xs font-bold text-slate-800">
                              {item.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <Separator className="my-2" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isVerified ? "text-emerald-500" : "text-slate-300"}`} />
                  {isVerified ? (
                    <span>ยืนยันโดย {aiVerifiedBy || "เจ้าหน้าที่"} เมื่อ {verifiedAt ? new Date(verifiedAt).toLocaleDateString("th-TH") : "N/A"}</span>
                  ) : (
                    <span className="italic">รอการตรวจสอบความถูกต้องก่อนบันทึก</span>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {!isVerified && (
                    <Button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="flex-1 sm:flex-none h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-100 px-6 font-bold"
                    >
                      {isVerifying ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      ตรวจสอบถูกต้องแล้ว
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={loading || isVerifying}
                    className="h-9 text-[11px] gap-1.5 text-slate-400 hover:text-indigo-600"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    ขอวิเคราะห์ใหม่
                  </Button>
                </div>
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
