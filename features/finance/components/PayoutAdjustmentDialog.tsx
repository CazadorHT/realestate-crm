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
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompanyExpense, setIsCompanyExpense] = useState(false);
  const [type, setType] = useState<"EARNING" | "DEDUCTION">("EARNING");
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>("");
  const [isSelectCommissionOpen, setIsSelectCommissionOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const eligiblePayouts = payouts.filter(p => p.status !== "PAID");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompanyExpense && !selectedCommissionId) {
      toast.error(isEn ? "Please select an agent commission record" : "กรุณาเลือกรายการคอมมิชชันเอเยนต์");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(isEn ? "Please enter a valid amount (> 0)" : "กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)");
      return;
    }

    setIsSubmitting(true);
    
    // Deductions must be stored as negative numbers in financial_ledger_v3
    const finalAmount = (isCompanyExpense || type === "DEDUCTION") ? -numAmount : numAmount;
    const adjustmentType = isCompanyExpense ? "FEE" : (type === "EARNING" ? "BONUS" : "FEE");

    try {
      const res = await createCommissionAdjustmentAction({
        commission_id: isCompanyExpense ? "COMPANY" : selectedCommissionId,
        description,
        amount: finalAmount,
        adjustment_type: adjustmentType
      });

      if (res.success) {
        toast.success(
          isCompanyExpense 
            ? (isEn ? "Company expense recorded successfully" : "บันทึกรายจ่ายบริษัทเรียบร้อยแล้ว") 
            : (isEn ? "Adjustment recorded successfully" : "บันทึกรายการปรับปรุงเรียบร้อยแล้ว")
        );
        // Reset state
        setAmount("");
        setDescription("");
        setSelectedCommissionId("");
        setIsCompanyExpense(false);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? "Error saving adjustment" : "เกิดข้อผิดพลาดในการบันทึกรายการ"));
      }
    } catch (err) {
      toast.error(isEn ? "Failed to save adjustment" : "ไม่สามารถบันทึกรายการได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title={isEn ? "Add Financial Adjustment" : "เพิ่มรายการปรับปรุงการเงิน"}
      description={isEn ? "Specify bonus earnings or expense deductions to accurately calculate net payout for agents." : "ระบุรายการเพิ่มรายได้หรือหักค่าใช้จ่ายส่วนเพิ่ม เพื่อคำนวณยอดโอนสุทธิให้เอเยนต์อย่างถูกต้อง"}
      className="max-w-lg"
      footer={
        <div className="flex gap-4 w-full font-bold px-6 pb-6">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 h-14 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all font-bold cursor-pointer" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button 
            type="submit" 
            form="payout-adjustment-form"
            disabled={isSubmitting || (!isCompanyExpense && !selectedCommissionId)}
            className={cn(
              "flex-2 h-14 text-white shadow-xl rounded-2xl transition-all font-bold group cursor-pointer",
              (!isCompanyExpense && !selectedCommissionId) 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                : (isCompanyExpense || type === "DEDUCTION" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100")
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 {isEn ? "Saving..." : "กำลังบันทึก..."}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Save className="w-4 h-4 transition-transform group-hover:scale-110" /> 
                {isEn ? "Confirm Adjustment" : "ยืนยันการบันทึก"}
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
             <p className="text-sm font-bold text-indigo-900 leading-tight">{isEn ? "Guidelines" : "คำแนะนำการใช้งาน"}</p>
             <p className="text-[11px] text-indigo-700/80 leading-relaxed font-medium">
               {isEn 
                 ? "Adjustments will be aggregated into the current payout cycle. Please verify the amount and adjustment type before submitting." 
                 : "รายการปรับปรุงจะถูกนำไปรวมกับยอดคอมมิชชันในรอบปัจจุบัน กรุณาตรวจสอบจำนวนเงินและประเภทรายการให้ถูกต้องก่อนบันทึก"}
             </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 🏢 Company Expense Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-700">{isEn ? "Company Shared Expense" : "รายจ่ายกองกลางบริษัท"}</label>
              <p className="text-[10px] text-slate-400">
                {isEn ? "Directly record to company pool account (unlinked from specific deals/agents)" : "บันทึกตรงเข้าบัญชีกองกลาง (ไม่ผูกกับดีล/คอมมิชชันเอเยนต์)"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isCompanyExpense}
              disabled={isSubmitting}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsCompanyExpense(checked);
                if (checked) {
                  setSelectedCommissionId("COMPANY");
                  setType("DEDUCTION");
                } else {
                  setSelectedCommissionId("");
                  setType("EARNING");
                }
              }}
              className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* 📂 Commission Selection Dropdown */}
          {!isCompanyExpense && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Select Target Commission" : "เลือกคอมมิชชันที่ต้องการปรับปรุง"}</label>
              <button
                type="button"
                onClick={() => setIsSelectCommissionOpen(true)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between h-14 rounded-2xl bg-slate-50/50 border border-slate-200 px-4 text-left hover:bg-slate-50 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  {selectedCommissionId && selectedCommissionId !== "COMPANY" ? (
                    <>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isEn ? "Selected Commission" : "คอมมิชชันที่เลือก"}</span>
                      <span className="text-sm font-bold text-slate-800 truncate max-w-[280px]">
                        {payouts.find(p => p.id === selectedCommissionId)?.agent?.full_name || payouts.find(p => p.id === selectedCommissionId)?.recipient_name || (isEn ? "Unnamed Agent" : "ไม่ระบุชื่อเอเยนต์")} - {payouts.find(p => p.id === selectedCommissionId)?.property?.title || (isEn ? "Unknown Property" : "ไม่ระบุทรัพย์สิน")}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 font-medium">
                      {eligiblePayouts.length === 0 
                        ? (isEn ? "No adjustable items available" : "ไม่มีรายการที่สามารถปรับปรุงได้ในขณะนี้") 
                        : (isEn ? "Select agent & property..." : "เลือกเอเยนต์และทรัพย์สิน...")}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all">{isEn ? "Select" : "เลือก"}</span>
              </button>
            </div>
          )}

          {/* 🔘 Type Selector */}
          {!isCompanyExpense && (
            <div className="space-y-3">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Adjustment Type" : "ประเภทการปรับปรุง"}</label>
               <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("EARNING")}
                  disabled={!selectedCommissionId || isSubmitting}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group cursor-pointer",
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
                  <span className={cn("text-xs font-bold", type === "EARNING" && selectedCommissionId ? "text-emerald-700" : "text-slate-500")}>
                    {isEn ? "Bonus / Earning (+)" : "เพิ่มรายได้ (+)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("DEDUCTION")}
                  disabled={!selectedCommissionId || isSubmitting}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group cursor-pointer",
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
                  <span className={cn("text-xs font-bold", type === "DEDUCTION" && selectedCommissionId ? "text-rose-700" : "text-slate-500")}>
                    {isEn ? "Deduction (-)" : "หักรายได้ (-)"}
                  </span>
                </button>
             </div>
          </div>
          )}

          {/* ⚡ Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              {isEn ? "Quick Presets" : "รายการแนะนำ (Quick Presets)"}
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 h-9 font-medium cursor-pointer"
                onClick={() => {
                  if (!isCompanyExpense) setType("EARNING");
                  setDescription(
                    isCompanyExpense 
                      ? (isEn ? "Company Expense: Fuel / Travel" : "รายจ่ายบริษัท: ค่าน้ำมัน") 
                      : (isEn ? "Travel/Fuel Reimbursement" : "เบิกค่าน้ำมันสำรองจ่าย")
                  );
                }}
                disabled={!selectedCommissionId}
              >
                {isEn ? "🚗 Fuel / Travel" : "🚗 ค่าน้ำมัน"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 h-9 font-medium cursor-pointer"
                onClick={() => {
                  if (!isCompanyExpense) setType("EARNING");
                  setDescription(
                    isCompanyExpense 
                      ? (isEn ? "Company Expense: General Supplies" : "รายจ่ายบริษัท: ค่าของใช้ทั่วไป") 
                      : (isEn ? "Supplies Reimbursement" : "เบิกค่าของใช้สำรองจ่าย")
                  );
                }}
                disabled={!selectedCommissionId}
              >
                {isEn ? "📦 Supplies" : "📦 ค่าของใช้"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 h-9 font-medium cursor-pointer"
                onClick={() => {
                  setType("DEDUCTION");
                  setDescription(
                    isCompanyExpense 
                      ? (isEn ? "Company Expense: Marketing Ads" : "รายจ่ายบริษัท: ค่าโฆษณา Ads") 
                      : (isEn ? "Deduct Marketing Ads" : "หักค่า Ads โฆษณา")
                  );
                }}
                disabled={!selectedCommissionId}
              >
                {isEn ? "📢 Marketing / Ads" : "📢 ค่า Ads โฆษณา"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 h-9 font-medium cursor-pointer"
                onClick={() => {
                  setType("DEDUCTION");
                  setDescription(
                    isCompanyExpense 
                      ? (isEn ? "Company Expense: Toll Fee" : "รายจ่ายบริษัท: ค่าทางด่วน") 
                      : (isEn ? "Deduct Toll Fee" : "หักค่าทางด่วน")
                  );
                }}
                disabled={!selectedCommissionId}
              >
                {isEn ? "🛣️ Toll Fee" : "🛣️ ค่าทางด่วน"}
              </Button>
              {!isCompanyExpense && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 h-9 font-medium cursor-pointer"
                  onClick={() => {
                    setType("DEDUCTION");
                    setDescription(isEn ? "Deduct Company Pool Share" : "หักส่วนแบ่งเข้ากองกลางบริษัท");
                  }}
                  disabled={!selectedCommissionId}
                >
                  {isEn ? "🏢 Company Share" : "🏢 ส่วนแบ่งบริษัท"}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              {isEn ? "Amount (THB)" : "จำนวนเงิน (บาท)"}
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
            <p className="text-[10px] text-slate-400 font-medium ml-1 italic">
              {isEn ? "Enter positive amount only. The system handles positive/negative signs based on the selected type." : "ระบุเฉพาะจำนวนเงินบวก ระบบจะจัดการทิศทางตามประเภทที่เลือกด้านบน"}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Reason & Notes" : "เหตุผลและหมายเหตุ"}</label>
            <Textarea 
              placeholder={
                !selectedCommissionId 
                  ? (isEn ? "Please select commission to enter description..." : "กรุณาเลือกคอมมิชชันเพื่อกรอกข้อมูล...") 
                  : (isEn ? "e.g. Q4 Target Bonus, Excess Bank Fee..." : "เช่น โบนัสทำยอดทะลุเป้า Q4 หรือ ค่าธรรมเนียมธนาคารส่วนเกิน...")
              }
              className="min-h-[100px] rounded-2xl focus:ring-indigo-500 bg-slate-50/50 border-slate-200 font-medium p-4 py-3"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!selectedCommissionId || isSubmitting}
            />
            <p className="text-[10px] text-slate-400 font-medium ml-1">
              {isEn ? "This description will appear on the agent's financial statement" : "ข้อมูลส่วนนี้จะปรากฏในรายงานสรุปการเงินของเอเยนต์"}
            </p>
          </div>
        </div>
      </form>

      <ResponsiveDialog
        open={isSelectCommissionOpen}
        onOpenChange={setIsSelectCommissionOpen}
        title={isEn ? "Select Commission to Adjust" : "เลือกคอมมิชชันที่ต้องการปรับปรุง"}
        description={isEn ? "Choose an active commission payout record to adjust" : "เลือกรายการคอมมิชชันที่เปิดรอบเบิกจ่ายอยู่เพื่อปรับปรุงยอดเงิน"}
        className="max-w-md z-[300]"
      >
        <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
          {eligiblePayouts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              {isEn ? "No adjustable commission records found in this cycle" : "ไม่มีรายการคอมมิชชันที่สามารถปรับปรุงได้ในรอบนี้"}
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
                      "w-full flex flex-col p-4 rounded-2xl text-left border-2 transition-all duration-200 cursor-pointer",
                      isSelected 
                        ? "bg-indigo-50/80 border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <span className="font-bold text-slate-800 text-sm">
                      {p.agent?.full_name || p.recipient_name || (isEn ? "Unnamed Agent" : "ไม่ระบุชื่อเอเยนต์")}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      {isEn ? "Property: " : "ทรัพย์สิน: "}{p.property?.title || (isEn ? "Unknown Property" : "ไม่ระบุทรัพย์สิน")}
                    </span>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 w-full">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isEn ? "Base Amount" : "ยอดเบื้องต้น"}</span>
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

