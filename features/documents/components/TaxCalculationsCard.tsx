import React from "react";
import { Label } from "@/components/ui/label";
import { Percent, Calculator } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface TaxCalculationsCardProps {
  taxCalculationMethod: string;
  setTaxCalculationMethod: (val: string) => void;
  vatRate: string;
  setVatRate: (val: string) => void;
  withholdingTaxRate: string;
  setWithholdingTaxRate: (val: string) => void;
  bookingAmount: string;
  dealRentalPrice: number | null;
  reservationFee: string;
  securityDeposit: string;
  activeTemplate: { type: string } | null;
}

export function TaxCalculationsCard({
  taxCalculationMethod,
  setTaxCalculationMethod,
  vatRate,
  setVatRate,
  withholdingTaxRate,
  setWithholdingTaxRate,
  bookingAmount,
  dealRentalPrice,
  reservationFee,
  securityDeposit,
  activeTemplate,
}: TaxCalculationsCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const previewRent = parseFloat(bookingAmount || "0") || dealRentalPrice || 0;
  const previewRes = parseFloat(reservationFee || "0") || 0;
  const previewSec = parseFloat(securityDeposit || "0") || 0;
  const previewVatRate = parseFloat(vatRate) || 0;
  const previewWhtRate = parseFloat(withholdingTaxRate) || 0;

  const isRentReceipt = activeTemplate?.type === "RENT_RECEIPT";
  const hasRent = isRentReceipt && previewRent > 0;
  const hasRes = previewRes > 0;
  const hasSec = previewSec > 0;
  const taxableBase = (hasRent ? previewRent : 0) + (hasRes ? previewRes : 0) + (hasSec ? previewSec : 0);

  let gross = taxableBase;
  let vatVal = 0;
  let whtVal = 0;
  let netTaxable = taxableBase;

  if (taxCalculationMethod === "exclude") {
    gross = taxableBase;
    vatVal = gross * (previewVatRate / 100);
    whtVal = gross * (previewWhtRate / 100);
    netTaxable = gross + vatVal - whtVal;
  } else if (taxCalculationMethod === "include") {
    const divisor = 1 + (previewVatRate / 100) - (previewWhtRate / 100);
    gross = divisor > 0 ? taxableBase / divisor : taxableBase;
    vatVal = gross * (previewVatRate / 100);
    whtVal = gross * (previewWhtRate / 100);
    netTaxable = taxableBase;
  }

  const finalTotal = netTaxable;

  const formatNum = (val: number) => 
    new Intl.NumberFormat(isEn ? "en-US" : "th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const scaleFactor = taxableBase > 0 ? (gross / taxableBase) : 1;
  const displaySecDep = hasSec ? (previewSec * scaleFactor) : 0;

  let resFeeMonths = 0;
  let secDepMonths = 0;
  const baseRentPrice = previewRent || dealRentalPrice || 0;
  if (baseRentPrice > 0) {
    const rMonths = Math.round(previewRes / baseRentPrice);
    if (Math.abs(previewRes - rMonths * baseRentPrice) < 2) {
      resFeeMonths = rMonths;
    }
    const sMonths = Math.round(previewSec / baseRentPrice);
    if (Math.abs(previewSec - sMonths * baseRentPrice) < 2) {
      secDepMonths = sMonths;
    }
  }

  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/20 space-y-4 relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <Percent className="h-24 w-24 text-slate-900" />
      </div>
      <Label className="text-[10px] font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-widest">
        <Calculator className="h-4 w-4 text-blue-600" />
        {isEn ? "Tax Calculations" : "การคำนวณภาษี (Tax Calculations)"}
      </Label>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
        {isEn
          ? "Configure Value Added Tax (VAT) and Withholding Tax (WHT) rates for pricing tables"
          : "ตั้งค่าภาษีมูลค่าเพิ่ม (VAT) และภาษีหัก ณ ที่จ่าย (Withholding Tax) สำหรับคำนวณในตารางราคา"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
            {isEn ? "Tax Method" : "วิธีคำนวณภาษี (Method)"}
          </Label>
          <select
            value={taxCalculationMethod}
            onChange={(e) => setTaxCalculationMethod(e.target.value)}
            className="h-10 text-sm rounded-xl border border-slate-200 bg-white px-3 focus:border-blue-400 focus:outline-none w-full cursor-pointer"
          >
            <option value="none">{isEn ? "No Tax" : "ไม่มีภาษี (No Tax)"}</option>
            <option value="exclude">{isEn ? "Deduct from rent / Exclude VAT" : "หักจากค่าเช่า / ยังไม่รวมภาษี (Exclude)"}</option>
            <option value="include">{isEn ? "Absorb Tax / Gross-up" : "ออกภาษีแทนให้ / รวมภาษีแล้ว (Include/Gross-up)"}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
            {isEn ? "VAT Rate (%)" : "อัตราภาษีมูลค่าเพิ่ม (VAT %)"}
          </Label>
          <select
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            disabled={taxCalculationMethod === "none"}
            className="h-10 text-sm rounded-xl border border-slate-200 bg-white px-3 focus:border-blue-400 focus:outline-none w-full disabled:opacity-50 disabled:bg-slate-100 cursor-pointer"
          >
            <option value="0">0%</option>
            <option value="7">7%</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
            {isEn ? "Withholding Tax (WHT %)" : "ภาษีหัก ณ ที่จ่าย (WHT %)"}
          </Label>
          <select
            value={withholdingTaxRate}
            onChange={(e) => setWithholdingTaxRate(e.target.value)}
            disabled={taxCalculationMethod === "none"}
            className="h-10 text-sm rounded-xl border border-slate-200 bg-white px-3 focus:border-blue-400 focus:outline-none w-full disabled:opacity-50 disabled:bg-slate-100 cursor-pointer"
          >
            <option value="0">0%</option>
            <option value="1">1%</option>
            <option value="3">3%</option>
            <option value="5">5%</option>
            <option value="7">7%</option>
          </select>
        </div>
      </div>

      {taxCalculationMethod !== "none" && taxableBase > 0 && (
        <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-100 text-[11px] space-y-3 shadow-xs">
          <div>
            <p className="font-semibold text-slate-700">
              {isEn ? "Tax Calculation Method Explained:" : "คำอธิบายวิธีคำนวณภาษี:"}
            </p>
            {taxCalculationMethod === "exclude" ? (
              <p className="text-slate-500 font-medium leading-relaxed mt-0.5">
                👉 <strong>{isEn ? "Deduct / Exclude:" : "หักจากค่าเช่า / ยังไม่รวมภาษี (Exclude):"}</strong>{" "}
                {isEn
                  ? `Withholding tax is deducted from base amount. Net transfer to landlord = Base + VAT ${vatRate}% - WHT ${withholdingTaxRate}%.`
                  : `ระบบจะหักภาษี ณ ที่จ่ายออกจากยอดตั้งต้น ทำให้เจ้าของจะได้รับยอดโอนสุทธิลดลง (ยอดโอน = ยอดตั้งต้น + VAT ${vatRate}% - หัก ณ ที่จ่าย ${withholdingTaxRate}%)`}
              </p>
            ) : (
              <p className="text-slate-500 font-medium leading-relaxed mt-0.5">
                👉 <strong>{isEn ? "Gross-up / Include:" : "ออกภาษีแทนให้ / รวมภาษีแล้ว (Include / Gross-up):"}</strong>{" "}
                {isEn
                  ? "Tenant absorbs the withholding tax. System calculates the gross-up base amount so landlord receives exactly the designated full net transfer."
                  : "ยึดตามยอดเงินตั้งต้นเป็นยอดเงินสุทธิที่จะโอนให้เจ้าของจริง โดยผู้เช่าออกค่าภาษีหัก ณ ที่จ่ายแทนให้ ระบบจะปัดเศษคิดย้อนกลับหาฐานก่อนหักภาษีให้อัตโนมัติ เพื่อให้เจ้าของได้รับยอดโอนสุทธิเต็มตามยอดตั้งต้นพอดี"}
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
              📊 {isEn ? "Live Calculation Preview:" : "ตัวอย่างผลลัพธ์การคำนวณจริงในบิล (Live Calculation Preview):"}
            </p>
            <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-100 text-slate-500 font-medium">
                    <th className="py-2 px-3">{isEn ? "Item" : "รายการ"}</th>
                    <th className="py-2 px-3 text-right">{isEn ? "Amount (THB)" : "จำนวนเงิน (บาท)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {hasRent && (
                    <tr>
                      <td className="py-2 px-3">
                        {isEn ? `Rental Fee (Base: ${formatNum(previewRent)})` : `ค่าเช่าอสังหาริมทรัพย์ (ราคาฐาน: ${formatNum(previewRent)})`}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">{formatNum(previewRent * scaleFactor)}</td>
                    </tr>
                  )}
                  {hasRes && (
                    <tr>
                      <td className="py-2 px-3">
                        {isEn ? `Reservation Fee (Base: ${formatNum(previewRes)})` : `เงินมัดจำ / ค่าจอง (ราคาฐาน: ${formatNum(previewRes)})`}
                        {resFeeMonths > 0 ? (isEn ? ` (${resFeeMonths} mo)` : ` (${resFeeMonths} เดือน)`) : ""}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">{formatNum(previewRes * scaleFactor)}</td>
                    </tr>
                  )}
                  {hasSec && (
                    <tr>
                      <td className="py-2 px-3 text-slate-500">
                        {isEn ? "Security Deposit" : "เงินประกันสัญญา (Security Deposit)"}
                        {secDepMonths > 0 ? (isEn ? ` (${secDepMonths} mo)` : ` (${secDepMonths} เดือน)`) : ""}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-500">{formatNum(displaySecDep)}</td>
                    </tr>
                  )}
                  
                  <tr className="bg-slate-100/50 font-semibold text-slate-700">
                    <td className="py-2 px-3">{isEn ? "Gross Subtotal" : "ฐานภาษีก่อนหัก (Gross Subtotal)"}</td>
                    <td className="py-2 px-3 text-right">{formatNum(gross)}</td>
                  </tr>
                  {previewVatRate > 0 && (
                    <tr className="text-slate-600">
                      <td className="py-2 px-3">{isEn ? `VAT (${previewVatRate}%)` : `ภาษีมูลค่าเพิ่ม / VAT (${previewVatRate}%)`}</td>
                      <td className="py-2 px-3 text-right text-blue-600 font-medium">+ {formatNum(vatVal)}</td>
                    </tr>
                  )}
                  {previewWhtRate > 0 && (
                    <tr className="text-slate-600">
                      <td className="py-2 px-3">{isEn ? `Withholding Tax / WHT (${previewWhtRate}%)` : `ภาษีหัก ณ ที่จ่าย / WHT (${previewWhtRate}%)`}</td>
                      <td className="py-2 px-3 text-right text-red-600 font-medium">- {formatNum(whtVal)}</td>
                    </tr>
                  )}
                  <tr className="bg-blue-50/30 font-bold text-slate-900 border-t border-slate-200">
                    <td className="py-2.5 px-3 text-blue-900">{isEn ? "Net Transfer to Landlord" : "ยอดโอนสุทธิให้เจ้าของ (Net Transfer)"}</td>
                    <td className="py-2.5 px-3 text-right text-blue-900 text-xs">{formatNum(finalTotal)} THB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

