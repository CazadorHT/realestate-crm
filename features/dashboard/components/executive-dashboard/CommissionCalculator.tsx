"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-slate-200 bg-white/50 hover:bg-white shadow-sm"
        >
          <Calculator className="h-4 w-4 text-blue-500" />
          เครื่องคำนวณเบื้องต้น (Quick Calculator)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            คำนวณค่าคอมมิชชั่นแบบรวดเร็ว
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>ราคาอสังหาริมทรัพย์ (฿)</Label>
            <PriceInput
              value={price}
              onChange={(val) => setPrice(val)}
              placeholder="ระบุราคา..."
              className="text-lg font-bold"
              showSuffix={false}
            />
          </div>

          <Button
            onClick={performCalc}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            เริ่มคำนวณ
          </Button>

          {result !== null && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 animate-in fade-in zoom-in-95">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                ประมาณการค่าคอมมิชชั่น (Estimate)
              </p>
              <h3 className="text-3xl font-black text-blue-600">
                {formatThaiCurrency(result)}
              </h3>
              <p className="text-[10px] text-slate-400">
                คำนวณจากเกณฑ์ขั้นบันไดที่ตั้งค่าไว้ในระบบปัจจุบัน
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
