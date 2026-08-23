"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, Loader2, Send, AlertTriangle } from "lucide-react";
import { runSmartMatchAction } from "../actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LeadSmartMatchProps {
  leadId: string;
  leadName: string;
  initialSummary?: string;
}

export function LeadSmartMatch({ leadId, leadName, initialSummary }: LeadSmartMatchProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [summary, setSummary] = useState(initialSummary || "");
  const [hasScanned, setHasScanned] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { language } = useLanguage();
  const isEn = language === "en";

  const handleScan = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await runSmartMatchAction(leadId, true); // true = notify agent if high match
      if (res.success) {
        setMatches(res.matches || []);
        if (res.requirementSummary) setSummary(res.requirementSummary);
        setHasScanned(true);
        toast.success(isEn ? "AI Matching completed" : "จับคู่รายการทรัพย์เรียบร้อย");
      } else {
        const errorText = res.error || (isEn ? "Lead not found" : "ไม่พบข้อมูลลูกค้า");
        setErrorMessage(errorText);
        toast.error(isEn ? `Matching failed: ${errorText}` : `การจับคู่ล้มเหลว: ${errorText}`);
      }
    } catch (err: any) {
      console.error(err);
      const errStr = err?.message || (isEn ? "Connection error" : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setErrorMessage(errStr);
      toast.error(errStr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="tour-leads-smart-match" className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Sparkles className={cn("h-6 w-6", loading && "animate-pulse")} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">AI Smart Match</h3>
              <p className="text-sm text-slate-500 font-medium italic">
                {isEn ? "Precision matching via Google Gemini" : "จับคู่อสังหาฯ อัจฉริยะด้วย Google Gemini"}
              </p>
            </div>
          </div>

          <button
            id="tour-leads-scan-btn"
            onClick={handleScan}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-slate-900/10 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEn ? "Analyzing..." : "กำลังวิเคราะห์..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {isEn ? "Scan for Matches" : "ค้นหาทรัพย์ที่ตรงใจ"}
              </>
            )}
          </button>
        </div>

        {/* AI Insight Summary */}
        {summary && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
            <div className="text-[10px] uppercase tracking-widest font-bold text-indigo-500 mb-1">
              {isEn ? "Lead Requirement Vector" : "สรุปความต้องการของลูกค้า"}
            </div>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        {/* Results Area */}
        {!hasScanned && !loading && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-slate-400 text-sm font-medium max-w-xs">
              {isEn
                ? `Click Scan to analyze the database and find the best properties for ${leadName}.`
                : `กดปุ่มค้นหาเพื่อวิเคราะห์และค้นหาทรัพย์ที่ตรงกับความต้องการของ ${leadName} มากที่สุด`}
            </p>
          </div>
        )}

        {hasScanned && matches.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-500 font-medium">
              {isEn ? "No high-confidence matches found right now." : "ไม่พบรายการทรัพย์ที่มีความตรงกันสูงในขณะนี้"}
            </p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((property) => (
              <div 
                key={property.id} 
                className="group relative p-5 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">
                  <CheckCircle2 className="h-3 w-3" />
                  {isEn
                    ? `${Math.round(property.similarity * 100)}% Match`
                    : `ตรงกัน ${Math.round(property.similarity * 100)}%`}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      {property.property_type.replace(/_/g, ' ')}
                    </p>
                    <h4 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {property.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-slate-900">
                      {property.listing_type === 'RENT' 
                        ? `${property.rental_price?.toLocaleString()} ฿/${isEn ? "mo" : "เดือน"}`
                        : `${property.price?.toLocaleString()} ฿`
                      }
                    </div>
                  </div>

                  <Link 
                    href={`/protected/properties/${property.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-900 hover:text-white transition-all"
                  >
                    {isEn ? "View Details" : "ดูรายละเอียด"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LINE Hint */}
        {hasScanned && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
             <Send className="h-4 w-4 text-emerald-500" />
             <p className="text-[11px] text-emerald-700 font-medium">
               {isEn
                 ? "High-confidence matches (>85%) have been notified to the assigned agent on LINE."
                 : "ทรัพย์ที่ตรงกันมากกว่า 85% ได้รับการแจ้งเตือนไปยังเอเจนต์ผู้ดูแลผ่าน LINE แล้ว"}
             </p>
          </div>
        )}
      </div>

      {/* Error Alert Dialog */}
      <ResponsiveDialog
        open={!!errorMessage}
        onOpenChange={(open) => !open && setErrorMessage(null)}
        title={
          <div className="flex items-center gap-3 text-rose-600">
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              {isEn ? "AI Matching Failed" : "การจับคู่ล้มเหลว"}
            </span>
          </div>
        }
        description={
          isEn
            ? "Could not complete smart matching for this lead."
            : "ไม่สามารถดำเนินการค้นหาทรัพย์ที่ตรงกับลูกค้ารายนี้ได้"
        }
        className="bg-white md:max-w-md"
      >
        <div className="p-4 md:p-6 space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700 leading-relaxed font-medium">
            {errorMessage}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setErrorMessage(null)}
              className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
            >
              {isEn ? "Close" : "ปิด"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
