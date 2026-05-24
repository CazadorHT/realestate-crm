"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Save, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createCommissionAdjustmentAction } from "../actions";
import { CommissionPayoutRecord } from "../types";

interface PayoutAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payouts: CommissionPayoutRecord[];
}

export function PayoutAdjustmentDialog({
  isOpen,
  onClose,
  onSuccess,
  payouts
}: PayoutAdjustmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<"EARNING" | "DEDUCTION">("EARNING");
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>("");
  const [isSelectCommissionOpen, setIsSelectCommissionOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const eligiblePayouts = payouts.filter(p => p.status !== "PAID");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommissionId) {
      toast.error("กรุณาเลือกรายการคอมมิชชันเอเยนต์");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)");
      return;
    }

    setIsSubmitting(true);
    
    // Deductions must be stored as negative numbers in financial_ledger_v3
    const finalAmount = type === "EARNING" ? numAmount : -numAmount;
    const adjustmentType = type === "EARNING" ? "BONUS" : "FEE";

    try {
      const res = await createCommissionAdjustmentAction({
        commission_id: selectedCommissionId,
        description,
        amount: finalAmount,
        adjustment_type: adjustmentType
      });

      if (res.success) {
        toast.success("บันทึกรายการปรับปรุงเรียบร้อยแล้ว");
        // Reset state
        setAmount("");
        setDescription("");
        setSelectedCommissionId("");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึกรายการปรับปรุง");
      }
    } catch (err) {
      toast.error("ไม่สามารถบันทึกรายการปรับปรุงได้");
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
          >
            ยกเลิก
          </Button>
          <Button 
            type="submit" 
            form="payout-adjustment-form"
            disabled={isSubmitting || !selectedCommissionId}
            className={cn(
              "flex-2 h-14 text-white shadow-xl rounded-2xl transition-all font-bold group",
              !selectedCommissionId 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                : (type === "EARNING" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-rose-600 hover:bg-rose-700 shadow-rose-100")
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
        className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
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

        <div className="space-y-4">
          {/* 📂 Commission Selection Dropdown (using nested ResponsiveDialog) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">เลือกคอมมิชชันที่ต้องการปรับปรุง</label>
            <button
              type="button"
              onClick={() => setIsSelectCommissionOpen(true)}
              className="w-full flex items-center justify-between h-14 rounded-2xl bg-slate-50/50 border border-slate-200 px-4 text-left hover:bg-slate-50 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <div className="flex flex-col min-w-0 pr-2">
                {selectedCommissionId ? (
                  <>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">คอมมิชชันที่เลือก</span>
                    <span className="text-sm font-bold text-slate-800 truncate max-w-[280px]">
                      {payouts.find(p => p.id === selectedCommissionId)?.agent?.full_name || payouts.find(p => p.id === selectedCommissionId)?.recipient_name || "ไม่ระบุชื่อเอเยนต์"} - {payouts.find(p => p.id === selectedCommissionId)?.property?.title || "ไม่ระบุทรัพย์สิน"}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400 font-medium">
                    {eligiblePayouts.length === 0 ? "ไม่มีรายการที่สามารถปรับปรุงได้ในขณะนี้" : "เลือกเอเยนต์และทรัพย์สิน..."}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-indigo-600 shrink-0 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all">เลือก</span>
            </button>
          </div>

          {/* 🔘 Type Selector */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ประเภทการปรับปรุง</label>
             <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("EARNING")}
                  disabled={!selectedCommissionId || isSubmitting}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group",
                    (!selectedCommissionId || isSubmitting) && "opacity-40 cursor-not-allowed",
                    type === "EARNING" && selectedCommissionId
                      ? "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/10" 
                      : "bg-white border-slate-100 hover:border-slate-200 text-slate-400"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    type === "EARNING" && selectedCommissionId ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-50 group-hover:bg-slate-100"
                  )}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className={cn("text-xs font-bold", type === "EARNING" && selectedCommissionId ? "text-emerald-700" : "text-slate-500")}>เพิ่มรายได้ (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("DEDUCTION")}
                  disabled={!selectedCommissionId || isSubmitting}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group",
                    (!selectedCommissionId || isSubmitting) && "opacity-40 cursor-not-allowed",
                    type === "DEDUCTION" && selectedCommissionId
                      ? "bg-rose-50 border-rose-500 ring-4 ring-rose-500/10" 
                      : "bg-white border-slate-100 hover:border-slate-200 text-slate-400"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    type === "DEDUCTION" && selectedCommissionId ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-slate-50 group-hover:bg-slate-100"
                  )}>
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <span className={cn("text-xs font-bold", type === "DEDUCTION" && selectedCommissionId ? "text-rose-700" : "text-slate-500")}>หักรายได้ (-)</span>
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
                 value={amount}
                 onChange={e => setAmount(e.target.value)}
                 min="0.01"
                 step="any"
                 disabled={!selectedCommissionId || isSubmitting}
               />
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1 italic">ระบุเฉพาะจำนวนเงินบวก ระบบจะจัดการทิศทางตามประเภทที่เลือกด้านบน</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">เหตุผลและหมายเหตุ</label>
            <Textarea 
              placeholder={!selectedCommissionId ? "กรุณาเลือกคอมมิชชันเพื่อกรอกข้อมูล..." : "เช่น โบนัสทำยอดทะลุเป้า Q4 หรือ ค่าธรรมเนียมธนาคารส่วนเกิน..."}
              className="min-h-[100px] rounded-2xl focus:ring-indigo-500 bg-slate-50/50 border-slate-200 font-medium p-4 py-3"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!selectedCommissionId || isSubmitting}
            />
            <p className="text-[10px] text-slate-400 font-medium ml-1">ข้อมูลส่วนนี้จะปรากฏในรายงานสรุปการเงินของเอเยนต์</p>
          </div>
        </div>
      </form>

      <ResponsiveDialog
        open={isSelectCommissionOpen}
        onOpenChange={setIsSelectCommissionOpen}
        title="เลือกคอมมิชชันที่ต้องการปรับปรุง"
        description="เลือกรายการคอมมิชชันที่เปิดรอบเบิกจ่ายอยู่เพื่อปรับปรุงยอดเงิน"
        className="max-w-md z-[300]"
      >
        <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
          {eligiblePayouts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              ไม่มีรายการคอมมิชชันที่สามารถปรับปรุงได้ในรอบนี้
            </div>
          ) : (
            <div className="space-y-2">
              {eligiblePayouts.map((p) => {
                const isSelected = selectedCommissionId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedCommissionId(p.id);
                      setIsSelectCommissionOpen(false);
                    }}
                    className={cn(
                      "w-full flex flex-col p-4 rounded-2xl text-left border-2 transition-all duration-200",
                      isSelected 
                        ? "bg-indigo-50/80 border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <span className="font-bold text-slate-800 text-sm">
                      {p.agent?.full_name || p.recipient_name || "ไม่ระบุชื่อเอเยนต์"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      ทรัพย์สิน: {p.property?.title || "ไม่ระบุทรัพย์สิน"}
                    </span>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 w-full">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ยอดเบื้องต้น</span>
                      <span className="font-bold text-slate-700 text-sm">
                        ฿{p.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ResponsiveDialog>
    </ResponsiveDialog>
  );
}
