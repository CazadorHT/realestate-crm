"use client";

import { useState } from "react";
import { analyzeDocumentAction } from "../ai-actions";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
  Clock,
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
  trigger?: React.ReactNode;
}

export function AIDocumentInsight({
  documentId,
  documentName,
  initialSummary,
  initialAnalysis,
  aiVerifiedAt,
  aiVerifiedBy,
  trigger,
}: AIDocumentInsightProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | undefined>(initialSummary || undefined);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | undefined>(initialAnalysis || undefined);
  const [verifiedAt, setVerifiedAt] = useState(aiVerifiedAt);

  const isVerified = !!verifiedAt;
  const hasData = !!summary && !!analysis;

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
        toast.success("บันทึกและยืนยันข้อมูลแล้ว");
      } else {
        toast.error(res.message || "การยืนยันล้มเหลว");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="md:max-w-2xl"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500 fill-amber-50" />
          <span>AI Document Assistant</span>
        </div>
      }
      description={
        isVerified ? (
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            เอกสารนี้ผ่านการตรวจสอบแล้ว
          </div>
        ) : (
          "ระบบวิเคราะห์เนื้อหาและตรวจสอบจุดเสี่ยงอัตโนมัติ"
        )
      }
      isLoading={loading}
      loadingText={
        <div className="text-center px-6">
          <p className="text-lg font-bold text-slate-900 tracking-tight">
            Gemini กำลังประมวลผล...
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium italic leading-relaxed">
            "ระบบกำลังอ่านสรุปเนื้อหาและตรวจสอบเงื่อนไขในข้อสัญญา"
          </p>
        </div>
      }
      minHeight="300px"
      trigger={
        trigger || (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-lg ${
              isVerified
                ? "text-emerald-500 hover:text-emerald-600 bg-emerald-50/50"
                : hasData
                  ? "text-amber-500 hover:text-amber-600 bg-amber-50/50 animate-pulse"
                  : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
            }`}
            title={isVerified ? "AI Verified" : "AI Insights"}
          >
            {isVerified ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Sparkles className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
            )}
          </Button>
        )
      }
    >
      <div className="py-2 space-y-5 text-left">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Analyzing File:
          </p>
          <p className="text-sm font-semibold text-slate-700 truncate">
            {documentName}
          </p>
        </div>

        {!hasData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-3xl">
            <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center shadow-inner">
              <Sparkles className="h-10 w-10 text-amber-400" />
            </div>
            <div className="max-w-[300px] px-4">
              <h3 className="text-xl font-semibold text-slate-800">
                พร้อมวิเคราะห์ด้วย AI
              </h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Gemini จะช่วยสรุปเนื้อหาและตรวจสอบจุดเสี่ยงในเอกสารนี้ให้คุณทันที
              </p>
            </div>
            <Button
              onClick={handleAnalyze}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-12 font-semibold shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              เริ่มวิเคราะห์เดี๋ยวนี้
            </Button>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-red-50/30 rounded-3xl border border-red-100 shadow-sm">
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center shadow-inner">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <div className="max-w-[300px] px-4">
              <h3 className="text-xl font-semibold text-red-800">
                วิเคราะห์ไม่สำเร็จ
              </h3>
              <p className="text-sm text-red-600 mt-2 font-semibold">{error}</p>
            </div>
            <Button
              onClick={handleAnalyze}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 rounded-2xl h-12 px-8 font-semibold"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        )}

        {/* Loading state is now handled by ResponsiveDialog isLoading prop */}

        {hasData && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isVerified && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 shadow-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold mb-1">📢 ข้อมูลจาก AI (รอตรวจสอบ)</p>
                  <p className="font-medium opacity-90 leading-normal">
                    กรุณาตรวจทานสรุปเนื้อหาเทียบกับเอกสารจริง และกดยืนยันเพื่อบันทึกข้อมูลลงระบบ
                  </p>
                </div>
              </div>
            )}

            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <FileText className="h-4 w-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-800 uppercase tracking-wide text-xs">สรุปเนื้อหา (Summary)</h3>
              </div>
              <div
                className={`p-5 rounded-2xl leading-relaxed text-sm transition-all border shadow-xs ${
                  isVerified
                    ? "bg-slate-50 border-slate-100 text-slate-600 italic"
                    : "bg-white border-blue-100 text-slate-900 font-semibold focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none"
                }`}
                contentEditable={!isVerified}
                onBlur={(e) => setSummary(e.currentTarget.textContent || "")}
                suppressContentEditableWarning={true}
              >
                {summary}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5">
              {analysis?.risks && analysis.risks.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-slate-800 uppercase tracking-wide text-xs">จุดเสี่ยงที่พบ (Risks)</h3>
                  </div>
                  <div className="grid gap-2">
                    {analysis.risks.map((risk: string, i: number) => (
                      <div
                        key={i}
                        className="flex gap-3 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-[12px] text-red-900 font-semibold leading-relaxed"
                      >
                        <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-red-300" />
                        {risk}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {analysis?.key_dates && analysis.key_dates.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800 uppercase tracking-wide text-xs">ข้อมูลสำคัญ (Terms & Dates)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.key_dates.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-xs transition-all hover:border-indigo-100"
                      >
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                            {item.description}
                          </p>
                          <p className="text-[13px] font-semibold text-slate-800 truncate">
                            {item.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <Separator className="my-2 bg-slate-100" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-2 font-semibold px-1">
                <CheckCircle2 className={`h-4 w-4 ${isVerified ? "text-emerald-500" : "text-slate-200"}`} />
                {isVerified ? (
                  <span>Verified by {aiVerifiedBy || "Staff"} at {verifiedAt ? new Date(verifiedAt).toLocaleDateString("th-TH") : "N/A"}</span>
                ) : (
                  <span className="italic">รอการตรวจสอบเพื่อบันทึกลงฐานข้อมูล</span>
                )}
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                {!isVerified && (
                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="flex-1 sm:flex-none h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-100 px-8 font-semibold transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    ยืนยันความถูกต้อง
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={loading || isVerifying}
                  className="h-12 text-[12px] gap-2 text-slate-400 hover:text-indigo-600 font-semibold px-4 rounded-2xl"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  ขอวิเคราะห์ใหม่
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
