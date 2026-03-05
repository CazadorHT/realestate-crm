"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Zap,
  Scale,
  Loader2,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";
import {
  generatePropertyValuation,
  AVMResult,
} from "@/features/properties/actions/avm";

interface AvmResultDialogProps {
  form: UseFormReturn<PropertyFormValues>;
  isOpen: boolean;
  onClose: () => void;
  listingType: "SALE" | "RENT";
}

export function AvmResultDialog({
  form,
  isOpen,
  onClose,
  listingType,
}: AvmResultDialogProps) {
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
        "❌ กรุณากลับไประบุ 'ขนาดพื้นที่' (Step 1) เพื่อให้ AI ประเมินราคาได้ใกล้เคียงที่สุด",
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
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(
      price,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] overflow-hidden p-0 border-0 shadow-2xl rounded-2xl">
        <div className="bg-linear-to-r from-indigo-600 to-violet-600 p-6 sm:p-8 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                <Sparkles className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  AI Smart Valuation
                </DialogTitle>
                <DialogDescription className="text-indigo-100 mt-1 text-sm font-medium">
                  ประเมินราคาอัจฉริยะจากข้อมูลตลาดจริง
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 bg-slate-50 min-h-[300px]">
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-2">
                <Sparkles className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                พร้อมให้ระบบ AI ช่วยวิเคราะห์ราคาตลาดที่เหมาะสม?
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                ระบบจะคำนวณราคาจากทรัพย์สินประเภทเดียวกัน ในพื้นที่ใกล้เคียง
                ทั้งตัวที่กำลังประกาศและดีลที่ปิดข้ามไปแล้ว
              </p>
              <Button
                onClick={handleEvaluate}
                className="mt-6 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all cursor-pointer"
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">ขออภัย</h3>
              <p className="text-sm text-slate-600">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="outline"
                className="mt-4 cursor-pointer"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        "flex " +
                        (result?.confidenceScore === "HIGH"
                          ? "text-green-500"
                          : result?.confidenceScore === "MEDIUM"
                            ? "text-yellow-500"
                            : "text-red-500")
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {result.estimatedYieldPercent}% / yr
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Strategies */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-indigo-500" />
                  กลยุทธ์การตั้งราคา 3 ระดับ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Maximum Profit */}
                  <div className="bg-white hover:border-indigo-300 transition-colors border border-slate-200 rounded-2xl p-5 shadow-sm group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-br from-blue-50 to-indigo-50 rounded-bl-3xl -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                        Max Profit
                      </span>
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      ฿{formatPrice(result?.maxProfitPrice ?? 0)}
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      ราคาสูงสุดที่ตลาดอาจยอมรับได้
                      เหมาะสำหรับการตั้งเผื่อต่อรอง
                    </p>
                    <div className="mt-auto">
                      <Button
                        onClick={() =>
                          result && applyPrice(result.maxProfitPrice)
                        }
                        variant="outline"
                        className="w-full rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer"
                      >
                        ใช้ราคานี้
                      </Button>
                    </div>
                  </div>

                  {/* Market Price */}
                  <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col transform md:-translate-y-2">
                    <div className="absolute top-0 inset-x-0 bg-emerald-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                      Recommended
                    </div>
                    <div className="flex items-center justify-between mb-3 mt-3">
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        Market Value
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">
                      ฿{formatPrice(result?.marketPrice ?? 0)}
                    </div>
                    <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                      ราคาตลาดที่เหมาะสม โอกาสปิดการขายสูง มีความเป็นไปได้จริง
                    </p>
                    <div className="mt-auto">
                      <Button
                        onClick={() => result && applyPrice(result.marketPrice)}
                        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm cursor-pointer"
                      >
                        ใช้ราคานี้
                      </Button>
                    </div>
                  </div>

                  {/* Quick Sale Price */}
                  <div className="bg-white hover:border-amber-300 transition-colors border border-slate-200 rounded-2xl p-5 shadow-sm group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-16 h-16 bg-linear-to-br from-amber-50 to-orange-50 rounded-br-3xl -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                        Quick Sale
                      </span>
                      <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      ฿{formatPrice(result?.quickSalePrice ?? 0)}
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      ลดราคาเพื่อเพิ่มสภาพคล่อง เหมาะสำหรับปิดดีลด่วนฟ้าแลบ
                    </p>
                    <div className="mt-auto">
                      <Button
                        onClick={() =>
                          result && applyPrice(result.quickSalePrice)
                        }
                        variant="outline"
                        className="w-full rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                      >
                        ใช้ราคานี้
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
