"use client";

import { useState } from "react";
import { Calculator, Banknote, Percent, CalendarClock } from "lucide-react";
import { Slider } from "../ui/slider";
import { Button } from "@/components/ui/button";

export function MortgageCalculatorSection() {
  const [propertyPrice, setPropertyPrice] = useState(5000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(3.5); // APR
  const [termYears, setTermYears] = useState(30);

  const downPaymentAmount = (propertyPrice * downPaymentPercent) / 100;
  const loanAmount = propertyPrice - downPaymentAmount;

  // Monthly Payment Calculation: M = P[r(1+r)^n]/[(1+r)^n-1]
  const calculateMonthlyPayment = () => {
    const r = interestRate / 100 / 12; // Monthly interest rate
    const n = termYears * 12; // Total payments
    if (r === 0) return loanAmount / n;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const monthlyPayment = calculateMonthlyPayment();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <section
      className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden"
      data-aos="fade-up"
    >
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Introduction */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
              <Calculator className="w-4 h-4" />
              คำนวณสินเชื่อเบื้องต้น
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              วางแผนการเงิน <br />
              <span className="text-blue-600">เพื่อบ้านในฝันของคุณ</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              ลองคำนวณยอดผ่อนชำระต่อเดือนเบื้องต้น
              เพื่อช่วยในการตัดสินใจและวางแผนงบประมาณได้อย่างเหมาะสม
            </p>

            {/* Summary Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-8 mt-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <p className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wide">
                  ยอดผ่อนชำระต่อเดือน (ประมาณ)
                </p>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                  {formatCurrency(monthlyPayment)}
                </div>
                <p className="text-slate-400 text-sm">
                  *ผลลัพธ์การคำนวณเป็นเพียงการประมาณการณ์เบื้องต้น
                  ตัวเลขจริงอาจแตกต่างขึ้นอยู่กับโปรโมชั่นของแต่ละธนาคาร
                </p>
              </div>
            </div>
          </div>

          {/* Right: Calculator Controls */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-8 shadow-sm">
            {/* Property Price */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-medium flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-500" /> ราคาทรัพย์สิน
                </label>
                <span className="text-lg font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 min-w-[120px] text-right">
                  {propertyPrice.toLocaleString()} ฿
                </span>
              </div>
              <Slider
                value={[propertyPrice]}
                min={1000000}
                max={50000000}
                step={100000}
                onValueChange={(val: number[]) => setPropertyPrice(val[0])}
                className="py-4"
              />
            </div>

            {/* Down Payment */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-medium flex items-center gap-2">
                  เงินดาวน์ ({downPaymentPercent}%)
                </label>
                <span className="text-slate-500 font-medium">
                  {formatCurrency(downPaymentAmount)}
                </span>
              </div>
              <Slider
                value={[downPaymentPercent]}
                min={0}
                max={50}
                step={5}
                onValueChange={(val: number[]) => setDownPaymentPercent(val[0])}
                className="py-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Interest Rate */}
              <div className="space-y-3">
                <label className="text-slate-700 font-medium flex items-center gap-2 text-sm">
                  <Percent className="w-4 h-4 text-blue-500" /> ดอกเบี้ย (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Loan Term */}
              <div className="space-y-3">
                <label className="text-slate-700 font-medium flex items-center gap-2 text-sm">
                  <CalendarClock className="w-4 h-4 text-blue-500" /> ระยะเวลา
                  (ปี)
                </label>
                <div className="relative">
                  <select
                    value={termYears}
                    onChange={(e) => setTermYears(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value={10}>10 ปี</option>
                    <option value={15}>15 ปี</option>
                    <option value={20}>20 ปี</option>
                    <option value={25}>25 ปี</option>
                    <option value={30}>30 ปี</option>
                    <option value={35}>35 ปี</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-sm text-slate-500">
              <span>วงเงินกู้สุทธิ:</span>
              <span className="font-bold text-slate-900 text-lg">
                {formatCurrency(loanAmount)}
              </span>
            </div>

            <Button className="w-full h-12 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
              ขอคำปรึกษาสินเชื่อ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
