import React from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FinanceMath } from "@/lib/finance/precision";
import { RefreshCw, ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface RecalculateConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  previewData: {
    before: { amount: number; wht: number; net: number; taxRate: number | null };
    after: { amount: number; wht: number; net: number; taxRate: number };
    reason: string;
  } | null;
}

const ComparisonRow = ({ label, oldVal, newVal, symbol = "" }: any) => (
  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 font-medium">
    <span className="text-[11px] text-slate-500 uppercase tracking-tighter">{label}</span>
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 line-through decoration-slate-300 opacity-60">
        {symbol}{FinanceMath.format(oldVal)}
      </span>
      <ArrowRight className="w-3 h-3 text-slate-300" />
      <span className={cn(
        "text-sm font-bold",
        newVal > oldVal ? "text-emerald-600" : newVal < oldVal ? "text-rose-600" : "text-slate-800"
      )}>
        {symbol}{FinanceMath.format(newVal)}
      </span>
    </div>
  </div>
);

export const RecalculateConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  previewData
}: RecalculateConfirmDialogProps) => {
  const { language } = useLanguage();
  const isEn = language === "en";

  if (!previewData) return null;

  const { before, after, reason } = previewData;
  const isIncrease = after.net > before.net;
  const isNeutral = after.net === before.net;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-4xl p-0 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white relative">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <RefreshCw className="w-24 h-24 rotate-12" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
              {isEn ? "Review Recalculation Preview" : "ตรวจสอบยอดที่จะคำนวณใหม่"}
            </DialogTitle>
            <DialogDescription className="text-indigo-100 opacity-80 font-medium line-clamp-2">
              {reason}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <ComparisonRow label={isEn ? "Gross Commission" : "ยอดคอมมิชชันดิบ"} oldVal={before.amount} newVal={after.amount} />
            <ComparisonRow label={isEn ? "Withholding Tax (WHT)" : "ภาษีหัก ณ ที่จ่าย"} oldVal={before.wht} newVal={after.wht} />
            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    {isEn ? "New Net Payout" : "ยอดโอนสุทธิใหม่"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-slate-900 tracking-tighter">฿{FinanceMath.format(after.net)}</span>
                    {!isNeutral && (
                      <div className={cn(
                        "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full",
                        isIncrease ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {isIncrease ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {FinanceMath.format(Math.abs(after.net - before.net))}
                      </div>
                    )}
                  </div>
               </div>
               <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-slate-400 tracking-tighter">
                    {((after.taxRate || 0) * 100).toFixed(0)}%
                  </span>
               </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {isEn 
                ? "Confirming will update payout balances and record changes to the audit log automatically." 
                : "การยืนยันจะทำการอัปเดตยอดโอนสิทธิและบันทึกหลักฐานการเปลี่ยนแปลงลงใน Audit Log โดยอัตโนมัติ"}
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 flex gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 rounded-xl font-semibold h-12 text-slate-500 hover:bg-slate-50 cursor-pointer"
            disabled={isLoading}
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 rounded-xl font-semibold h-12 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : (isEn ? "Confirm New Amount" : "ยืนยันยอดใหม่")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

