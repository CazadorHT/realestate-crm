"use client";

import React, { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { calculateCommission } from "@/lib/finance/commissions";
import { formatThaiCurrency } from "@/lib/excel-export";
import { toast } from "sonner";

export function CommissionCalculator() {
  const [price, setPrice] = useState<number>(10000000);
  const [result, setResult] = useState<number | null>(null);

  const performCalc = () => {
    try {
      if (isNaN(price) || price < 0) {
        toast.error("กรุณาระบุราคาที่ถูกต้อง");
        return;
      }
      // Current hardcoded rule for demo
      const ruleSet = {
        type: "TIERED" as const,
        tiers: [
          { minPrice: 0, maxPrice: 5000000, percentage: 3 },
          { minPrice: 5000001, maxPrice: 10000000, percentage: 4 },
          { minPrice: 10000001, maxPrice: null, percentage: 5 },
        ],
      };
      const comm = calculateCommission(price, ruleSet);
      setResult(comm);
      toast.success("คำนวณสำเร็จ!");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("เกิดข้อผิดพลาดในการคำนวณ");
    }
  };

  return (
    <ResponsiveDialog
      title={
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-500" />
          คำนวณค่าคอมมิชชั่น
        </div>
      }
      description="ประมาณการค่าคอมมิชชั่นแบบรวดเร็วตามเกณฑ์ขั้นบันได"
      trigger={
        <Button
          variant="outline"
          className="gap-2 border-slate-200 hover:text-blue-700 hover:border-blue-200 text-blue-700 bg-white/50 hover:bg-white shadow-sm font-semibold transition-all active:scale-95"
        >
          <Calculator className="h-4 w-4 text-blue-500" />
          เครื่องคำนวณเบื้องต้น
        </Button>
      }
    >
      <div className="space-y-6 p-4 sm:p-6 text-left">
        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">
            ราคาอสังหาริมทรัพย์ (฿)
          </Label>
          <PriceInput
            value={price}
            onChange={(val) => setPrice(val)}
            placeholder="ระบุราคา..."
            className="text-lg font-semibold rounded-xl h-12 border-slate-200"
            showSuffix={false}
          />
        </div>

        <Button
          onClick={performCalc}
          disabled={!price || price <= 0}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-semibold text-white shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          เริ่มคำนวณ
        </Button>

        {result !== null && (
          <div className="p-6 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-blue-100 space-y-2 animate-in fade-in zoom-in-95 duration-500">
            <p className="text-[10px] text-blue-500 uppercase font-semibold tracking-widest">
              ประมาณการค่าคอมมิชชั่น
            </p>
            <h3 className="text-3xl font-semibold text-slate-900">
              {formatThaiCurrency(result)}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              * คำนวณจากเกณฑ์ 3-5% ตามราคาประเมินในระบบ
            </p>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
