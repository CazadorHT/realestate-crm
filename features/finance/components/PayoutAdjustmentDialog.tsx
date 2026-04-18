"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusIcon, 
  Save, 
  X, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PayoutAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayoutAdjustmentDialog({
  isOpen,
  onClose,
  onSuccess
}: PayoutAdjustmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<"EARNING" | "DEDUCTION">("EARNING");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API Call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast.success("บันทึกรายการปรับปรุงเรียบร้อยแล้ว");
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title="เพิ่มรายการปรับปรุงการเงิน"
      description="ระบุรายการเพิ่มรายได้หรือหักค่าใช้จ่ายส่วนเพิ่ม เพื่อคำนวณยอดโอนสุทธิให้เอเยนต์อย่างถูกต้อง"
      className="max-w-lg"
      footer={
        <div className="flex gap-4 w-full font-bold px-6 pb-6">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 h-14 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all font-bold" 
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button 
            type="submit" 
            form="payout-adjustment-form"
            disabled={isSubmitting}
            className={cn(
              "flex-2 h-14 text-white shadow-xl shadow-indigo-100 rounded-2xl transition-all font-bold group",
              type === "EARNING" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 กำลังบันทึก...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Save className="w-4 h-4 transition-transform group-hover:scale-110" /> 
                ยืนยันการปรับปรุง
              </div>
            )}
          </Button>
        </div>
      }
    >
      <form 
        id="payout-adjustment-form"
        onSubmit={handleSubmit} 
        className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        {/* 📘 Guidance Card */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 flex gap-4">
          <div className="h-10 w-10 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
             <Info className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
             <p className="text-sm font-bold text-indigo-900 leading-tight">คำแนะนำการใช้งาน</p>
             <p className="text-[11px] text-indigo-700/80 leading-relaxed font-medium">
               รายการปรับปรุงจะถูกนำไปรวมกับยอดคอมมิชชันในรอบปัจจุบัน กรุณาตรวจสอบจำนวนเงินและประเภทรายการให้ถูกต้องก่อนบันทึก
             </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 🔘 Type Selector */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ประเภทการปรับปรุง</label>
             <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("EARNING")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group",
                    type === "EARNING" 
                      ? "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/10" 
                      : "bg-white border-slate-100 hover:border-slate-200 text-slate-400"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    type === "EARNING" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-50 group-hover:bg-slate-100"
                  )}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className={cn("text-xs font-bold", type === "EARNING" ? "text-emerald-700" : "text-slate-500")}>เพิ่มรายได้ (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("DEDUCTION")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group",
                    type === "DEDUCTION" 
                      ? "bg-rose-50 border-rose-500 ring-4 ring-rose-500/10" 
                      : "bg-white border-slate-100 hover:border-slate-200 text-slate-400"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    type === "DEDUCTION" ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-slate-50 group-hover:bg-slate-100"
                  )}>
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <span className={cn("text-xs font-bold", type === "DEDUCTION" ? "text-rose-700" : "text-slate-500")}>หักรายได้ (-)</span>
                </button>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              จำนวนเงิน (บาท)
              <AlertCircle className="h-3 w-3 text-slate-300" />
            </label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">฿</span>
               <Input 
                 type="number" 
                 placeholder="0.00" 
                 className={cn(
                   "h-14 pl-10 rounded-2xl text-lg font-bold transition-all",
                   type === "EARNING" ? "focus:ring-emerald-500 text-emerald-700" : "focus:ring-rose-500 text-rose-700"
                 )} 
                 required 
               />
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1 italic">ระบุเฉพาะจำนวนเงินบวก ระบบจะจัดการทิศทางตามประเภทที่เลือกด้านบน</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">เหตุผลและหมายเหตุ</label>
            <Textarea 
              placeholder="เช่น โบนัสทำยอดทะลุเป้า Q4 หรือ ค่าธรรมเนียมธนาคารส่วนเกิน..." 
              className="min-h-[120px] rounded-2xl focus:ring-indigo-500 bg-slate-50/50 border-slate-200 font-medium p-4 py-3"
              required
            />
            <p className="text-[10px] text-slate-400 font-medium ml-1">ข้อมูลส่วนนี้จะปรากฏในรายงานสรุปการเงินของเอเยนต์</p>
          </div>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
