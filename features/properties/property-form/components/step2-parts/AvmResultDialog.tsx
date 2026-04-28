"use client";

import React, { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Zap,
  Scale,
  Loader2,
  Printer,
  AlertCircle,
} from "lucide-react";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";
import {
  generatePropertyValuation,
  AVMResult,
} from "@/features/properties/actions/avm";
import { cn } from "@/lib/utils";

interface AvmResultDialogProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  isOpen: boolean;
  onClose: () => void;
  listingType: "SALE" | "RENT";
}

export function AvmResultDialog({
  form: formProp,
  isOpen,
  onClose,
  listingType,
}: AvmResultDialogProps) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AVMResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    const values = form.getValues();

    // --- Pre-flight Validation ---
    if (!values.property_type) {
      setError(
        "❌ กรุณากลับไปเลือก 'ประเภททรัพย์' (Step 1) ก่อนเริ่มประเมินราคา เพื่อความแม่นยำ",
      );
      return;
    }

    if (
      !values.size_sqm &&
      !values.land_size_sqwah &&
      values.property_type !== "LAND"
    ) {
      setError(
        "❌ กรุณากลับไประบุ 'ขนาดพื้นที่' (Step 2) เพื่อให้ AI ประเมินราคาได้ใกล้เคียงที่สุด",
      );
      return;
    }

    if (
      !values.province &&
      !values.popular_area &&
      !values.district &&
      !values.subdistrict
    ) {
      setError(
        "❌ กรุณากลับไประบุ 'ที่ตั้ง/ทำเล' (Step 3) เพื่อให้ AI ทราบว่าทรัพย์อยู่โซนไหน",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await generatePropertyValuation({
        propertyType: values.property_type,
        listingType: listingType,
        sizeSqm: values.size_sqm,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        province: values.province,
        district: values.district,
        subdistrict: values.subdistrict,
        popularArea: values.popular_area,
      });
      setResult(res);
    } catch (err: any) {
      setError(
        err.message || "เกิดข้อผิดพลาดในการประเมินราคา กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!result) return;

    const values = form.getValues();
    const exportData = {
      result,
      inputs: {
        propertyType: values.property_type,
        listingType: listingType,
        sizeSqm: values.size_sqm,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        province: values.province,
        district: values.district,
        subdistrict: values.subdistrict,
        popularArea: values.popular_area,
      },
    };

    // Base64 encode the JSON data
    const encodedStr = btoa(
      unescape(encodeURIComponent(JSON.stringify(exportData))),
    );
    window.open(`/avm-report?data=${encodedStr}`, "_blank");
  };

  const applyPrice = (price: number) => {
    if (listingType === "SALE") {
      form.setValue("original_price", price, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      form.setValue("original_rental_price", price, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    form.setValue("requires_ai_review", true, { shouldDirty: true });
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(
      price,
    );
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="sm:max-w-[700px]"
      snapPoints={["0.5", "0.95"]}
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl">
              <Sparkles className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                AI Smart Valuation
              </h2>
              <p className="text-slate-500 text-xs font-medium">
                ประเมินราคาอัจฉริยะจากข้อมูลตลาดจริง
              </p>
            </div>
          </div>
          {result && (
            <Button
              onClick={handleExportPdf}
              variant="outline"
              size="sm"
              className="hidden sm:flex rounded-full border-slate-200 h-9 px-4"
            >
              <Printer className="h-4 w-4 mr-2" />
              รายงาน
            </Button>
          )}
        </div>
      }
    >
      <div className="bg-slate-50 min-h-[300px] rounded-2xl overflow-hidden p-1">
        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-2">
              <Sparkles className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              พร้อมให้ระบบ AI ช่วยวิเคราะห์ราคาตลาดที่เหมาะสม?
            </h3>
            <p className="text-sm text-slate-500 max-w-sm px-4">
              ระบบจะคำนวณราคาจากทรัพย์สินประเภทเดียวกัน ในพื้นที่ใกล้เคียง ทั้งตัวที่กำลังประกาศและดีลที่ปิดไปแล้ว
            </p>
            <Button
              onClick={handleEvaluate}
              className="mt-6 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-6 text-base shadow-lg transition-all"
            >
              <Sparkles className="h-5 w-5" />
              เริ่มการประเมิน
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
            <div>
              <h3 className="text-lg font-medium text-slate-800 animate-pulse">
                กำลังประมวลผลข้อมูลตลาด...
              </h3>
              <p className="text-sm text-slate-500">อาจใช้เวลาสักครู่</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <div className="text-red-500 bg-red-50 p-4 rounded-full">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">ขออภัย</h3>
            <p className="text-sm text-slate-600 px-4">{error}</p>
            <Button
              onClick={() => setError(null)}
              variant="outline"
              className="mt-4"
            >
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-2">
            {/* Confidence Score & Summary */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  บทวิเคราะห์จาก AI
                </h4>
                <p className="text-slate-700 leading-relaxed text-sm">
                  {result?.analysisSummary}
                </p>
              </div>
              <div className="sm:border-l border-slate-100 sm:pl-6 flex flex-col justify-center shrink-0">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1">
                  ความแม่นยำ
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={
                      cn("flex", 
                        result?.confidenceScore === "HIGH" ? "text-green-500" :
                        result?.confidenceScore === "MEDIUM" ? "text-yellow-500" : "text-red-500"
                      )
                    }
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-slate-800">
                    {result?.confidenceScore}
                  </span>
                </div>
                {result && result.estimatedYieldPercent > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                      Expected Yield
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {result.estimatedYieldPercent}% / yr
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Strategies */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2 px-1">
                <Scale className="h-5 w-5 text-indigo-500" />
                กลยุทธ์การตั้งราคา
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Maximum Profit */}
                <div className="bg-white hover:border-indigo-300 transition-colors border border-slate-200 rounded-2xl p-5 shadow-sm group relative overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase">
                      Max Profit
                    </span>
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mb-1">
                    ฿{formatPrice(result?.maxProfitPrice ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-500 mb-5 leading-relaxed">
                    ราคาสูงสุดที่ตลาดอาจยอมรับได้ เหมาะสำหรับการตั้งเผื่อต่อรอง
                  </p>
                  <Button
                    onClick={() => result && applyPrice(result.maxProfitPrice)}
                    variant="outline"
                    className="mt-auto w-full rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-10 text-xs font-bold"
                  >
                    ใช้ราคานี้
                  </Button>
                </div>

                {/* Market Price */}
                <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col md:-translate-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase">
                      Market Value
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mb-1">
                    ฿{formatPrice(result?.marketPrice ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-600 mb-5 leading-relaxed">
                    ราคาตลาดที่เหมาะสม โอกาสปิดการขายสูง มีความเป็นไปได้จริง
                  </p>
                  <Button
                    onClick={() => result && applyPrice(result.marketPrice)}
                    className="mt-auto w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm h-10 text-xs font-bold"
                  >
                    ใช้ราคานี้
                  </Button>
                </div>

                {/* Quick Sale Price */}
                <div className="bg-white hover:border-amber-300 transition-colors border border-slate-200 rounded-2xl p-5 shadow-sm group relative overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase">
                      Quick Sale
                    </span>
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mb-1">
                    ฿{formatPrice(result?.quickSalePrice ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-500 mb-5 leading-relaxed">
                    ลดราคาเพื่อเพิ่มสภาพคล่อง เหมาะสำหรับปิดดีลด่วนฟ้าแลบ
                  </p>
                  <Button
                    onClick={() => result && applyPrice(result.quickSalePrice)}
                    variant="outline"
                    className="mt-auto w-full rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 h-10 text-xs font-bold"
                  >
                    ใช้ราคานี้
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Export Button */}
            <Button
              onClick={handleExportPdf}
              variant="outline"
              className="w-full sm:hidden rounded-xl border-slate-200 h-12 font-bold"
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์รายงานความคุ้มค่า (PDF)
            </Button>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
