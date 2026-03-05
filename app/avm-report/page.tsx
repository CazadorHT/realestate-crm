"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  MapPin,
  Maximize,
  BedDouble,
  Bath,
  Scale,
  CheckCircle2,
  TrendingUp,
  Zap,
  Sparkles,
} from "lucide-react";

export default function AvmReportPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const encodedData = searchParams.get("data");
    if (!encodedData) {
      setErrorMsg(
        "ไม่พบข้อมูลสำหรับการสร้างรายงาน กรุณากลับไปกดปุ่ม 'พิมพ์รายงาน' จากหน้าประเมินราคาอีกครั้ง",
      );
      return;
    }

    let timer: NodeJS.Timeout | null = null;

    try {
      const decodedString = decodeURIComponent(escape(atob(encodedData)));
      const parsedData = JSON.parse(decodedString);

      if (!parsedData || !parsedData.result || !parsedData.inputs) {
        throw new Error("Invalid data structure");
      }

      setData(parsedData);

      // Auto-trigger print dialog after rendering
      timer = setTimeout(() => {
        window.print();
      }, 800);
    } catch (err) {
      console.error("Failed to parse report data", err);
      setErrorMsg("ข้อมูลรายงานไม่สมบูรณ์หรือไม่ถูกต้อง");
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [searchParams]);

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-800 bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md text-center">
          <div className="text-red-500 bg-red-50 p-4 rounded-full mx-auto w-fit mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            ปิดหน้านี้
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        กำลังโหลดข้อมูลรายงาน...
      </div>
    );
  }

  const { result, inputs } = data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price);
  };

  const getPropertyTypeName = (type: string) => {
    const types: Record<string, string> = {
      CONDO: "คอนโดมิเนียม",
      HOUSE: "บ้านเดี่ยว",
      TOWNHOME: "ทาวน์โฮม",
      LAND: "ที่ดินว่างเปล่า",
      COMMERCIAL_BUILDING: "อาคารพาณิชย์",
      OFFICE_BUILDING: "อาคารสำนักงาน",
      WAREHOUSE: "โกดัง / โรงงาน",
      VILLA: "วิลล่า",
      POOL_VILLA: "พูลวิลล่า",
    };
    return types[type] || type;
  };

  const locationText =
    [inputs.popularArea, inputs.subdistrict, inputs.district, inputs.province]
      .filter(Boolean)
      .join(", ") || "ไม่ระบุตำแหน่ง";

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none">
      {/* Header */}
      <div className="border-b-2 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-indigo-900 tracking-tight">
            รายงานประเมินราคาอสังหาริมทรัพย์
          </h1>
          <p className="text-indigo-600 font-medium mt-1">
            Automated Valuation Model (AVM) Report
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>
            วันที่พิมพ์:{" "}
            {new Intl.DateTimeFormat("th-TH", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(new Date())}
          </p>
        </div>
      </div>

      {/* Property Details */}
      <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-500" />
          ข้อมูลทรัพย์สิน (Subject Property)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              ประเภททรัพย์
            </span>
            <div className="font-semibold text-slate-800">
              {getPropertyTypeName(inputs.propertyType)}
            </div>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              สถานะ
            </span>
            <div className="font-semibold text-slate-800 capitalize">
              {inputs.listingType === "SALE"
                ? "ขาย (For Sale)"
                : "เช่า (For Rent)"}
            </div>
          </div>

          {inputs.sizeSqm > 0 && (
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                ขนาดพื้นที่
              </span>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Maximize className="h-4 w-4 text-slate-400" />
                {inputs.sizeSqm} ตร.ม.
              </div>
            </div>
          )}

          {(inputs.bedrooms > 0 || inputs.bathrooms > 0) && (
            <div className="flex gap-4">
              {inputs.bedrooms > 0 && (
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    ห้องนอน
                  </span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <BedDouble className="h-4 w-4 text-slate-400" />
                    {inputs.bedrooms}
                  </div>
                </div>
              )}
              {inputs.bathrooms > 0 && (
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    ห้องน้ำ
                  </span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Bath className="h-4 w-4 text-slate-400" />
                    {inputs.bathrooms}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="col-span-2 md:col-span-4 mt-2">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              ทำเลที่ตั้ง
            </span>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-indigo-500" />
              {locationText}
            </div>
          </div>
        </div>
      </div>

      {/* Main Valuation Result */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Scale className="h-6 w-6 text-emerald-500" />
          สรุปราคาประเมินตลาด (Estimated Market Value)
        </h2>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Main Recommended Price */}
          <div className="flex-1 bg-emerald-50 rounded-3xl p-8 border border-emerald-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-full mb-4 w-fit">
              แนะนำให้ใช้ราคานี้
            </span>
            <div className="text-sm font-semibold text-emerald-800 mb-1">
              ราคาตลาดเหมาะสม (Market Price)
            </div>
            <div className="text-5xl font-black text-emerald-600 tracking-tight">
              ฿{formatPrice(result.marketPrice)}
            </div>
            <p className="text-sm text-emerald-700/80 mt-3 font-medium">
              ราคาที่เหมาะสมกับสภาพตลาดปัจจุบัน มีโอกาสปิดการขายได้สูงที่สุด
            </p>
          </div>

          {/* Confidence Score */}
          <div className="w-full md:w-1/3 bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-center items-center text-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              ระดับความเชื่อมั่น
            </div>
            <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-3">
              <CheckCircle2
                className={
                  "h-10 w-10 " +
                  (result.confidenceScore === "HIGH"
                    ? "text-green-500"
                    : result.confidenceScore === "MEDIUM"
                      ? "text-yellow-500"
                      : "text-red-500")
                }
              />
            </div>
            <div
              className={
                "text-2xl font-black " +
                (result.confidenceScore === "HIGH"
                  ? "text-green-600"
                  : result.confidenceScore === "MEDIUM"
                    ? "text-yellow-600"
                    : "text-red-600")
              }
            >
              {result.confidenceScore}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {result.confidenceScore === "HIGH"
                ? "ความแม่นยำสูง มีข้อมูลเทียบเคียงเพียงพอ"
                : "ประเมินจากข้อมูลภาพรวมตลาด"}
            </p>

            {result.estimatedYieldPercent > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 w-full">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  อัตราผลตอบแทนคาดหวัง
                </div>
                <div className="text-xl font-bold text-slate-800">
                  {result.estimatedYieldPercent}%{" "}
                  <span className="text-sm font-normal text-slate-500">
                    / ปี
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Strategies */}
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
          กลยุทธ์ราคาทางเลือก (Alternative Strategies)
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 border border-indigo-100 bg-indigo-50/30 rounded-2xl flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-indigo-700">
              <TrendingUp className="h-5 w-5" />
              <span className="font-bold">Max Profit Price</span>
            </div>
            <div className="text-2xl font-black text-slate-800 mb-2">
              ฿{formatPrice(result.maxProfitPrice)}
            </div>
            <p className="text-sm text-slate-600">
              ราคาสูงสุดที่ตลาดอาจยอมรับได้ เหมาะสำหรับการตั้งราคาเผื่อต่อรอง
            </p>
          </div>

          <div className="p-6 border border-amber-100 bg-amber-50/30 rounded-2xl flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-amber-600">
              <Zap className="h-5 w-5" />
              <span className="font-bold">Quick Sale Price</span>
            </div>
            <div className="text-2xl font-black text-slate-800 mb-2">
              ฿{formatPrice(result.quickSalePrice)}
            </div>
            <p className="text-sm text-slate-600">
              ราคาดึงดูดใจผู้ซื้อนักลงทุน ลดราคาเพื่อสภาพคล่อง
              เหมาะสำหรับปิดดีลด่วน
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="p-6 bg-slate-800 text-white rounded-2xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          บทวิเคราะห์จาก AI (AI Analysis Summary)
        </h3>
        <p className="text-slate-200 leading-relaxed">
          {result.analysisSummary}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>
          เอกสารฉบับนี้สร้างขึ้นโดยอัตโนมัติจากระบบ AI Automated Valuation Model
        </p>
        <p className="mt-1">
          ราคาประเมินอาจมีการเปลี่ยนแปลงตามสภาวะตลาด
          โปรดใช้ประกอบการพิจารณาเบื้องต้นเท่านั้น
        </p>
      </div>
    </div>
  );
}
