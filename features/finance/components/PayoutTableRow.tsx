import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, ArrowUpRight, Clock, CheckCircle2, 
  History as HistoryIcon, ShieldCheck, RefreshCw, FileDown
} from "lucide-react";
import { FinanceMath } from "@/lib/finance/precision";
import { usePayoutStore } from "../stores/payoutStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { startProcess, finishProcess } from "@/lib/process-monitor";

interface PayoutTableRowProps {
  payout: any;
  onOpenHistory: (payout: any) => void;
  onOpenPaidDialog: (payout: any) => void;
  onRecalculate: (id: string) => Promise<void>;
  isRecalculating: boolean;
  onUpdate: () => void;
  disabledAction: boolean;
}

export const PayoutTableRow = React.memo(({ 
  payout, 
  onOpenHistory, 
  onOpenPaidDialog,
  onRecalculate,
  isRecalculating,
  disabledAction
  
}: PayoutTableRowProps) => {
  // ✅ Specific Selector Tip from Mr. Hunter
  const isSelected = usePayoutStore((state) => state.selectedIds.has(payout.id));
  const isExpanded = usePayoutStore((state) => state.expandedRows.has(payout.id));
  const toggleSelection = usePayoutStore((state) => state.toggleSelection);
  const toggleExpansion = usePayoutStore((state) => state.toggleExpansion);

  const statusMap: any = {
    'UNPAID': { 
      label: 'รอดำเนินการ', 
      color: 'bg-slate-500/10 text-slate-500 border-slate-200/50',
      glow: 'shadow-[0_0_15px_rgba(100,116,139,0.15)]'
    },
    'READY_TO_PAY': { 
      label: 'พร้อมโอนเงิน', 
      color: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]'
    },
    'PAID': { 
      label: 'ชำระเงินแล้ว', 
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]'
    },
  };
   
  const status = statusMap[payout.status] || { label: payout.status, color: 'bg-gray-100' };

  return (
    <>
      <TableRow className={cn(
        "group transition-all duration-300 relative border-b border-slate-100/50",
        isSelected ? "bg-indigo-50/70 backdrop-blur-sm" : "hover:bg-white hover:scale-[1.002] hover:shadow-xl hover:shadow-indigo-500/5 z-10",
        isExpanded && "bg-slate-50/50 border-b-0"
      )}>
        <TableCell className="relative w-12 text-center">
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full animate-in slide-in-from-left duration-300" />}
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={() => toggleSelection(payout.id)}
            disabled={payout.status === 'PAID'}
            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-transform active:scale-90"
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{payout.agent?.full_name || 'ไม่ระบุชื่อ'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold uppercase">AGENT</span>
                <span className="text-[9px] text-slate-400 font-mono tracking-tighter opacity-70">#{payout.id.slice(0, 8)}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge 
            variant="outline" 
            className={cn(
                "font-semibold px-3 py-1 rounded-full text-[10px] border tracking-tight uppercase transition-all duration-500", 
                status.color,
                status.glow
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse", status.color.replace('/10', ''))} />
            {status.label}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
             <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-400 line-through opacity-50">{FinanceMath.format(payout.amount)}</span>
                <span className="text-sm font-semibold text-slate-900">{FinanceMath.format(payout.amount)}</span>
             </div>
        </TableCell>
        <TableCell className="text-right">
            <div className="inline-flex flex-col items-end px-3 py-1 rounded-lg bg-rose-50/50 border border-rose-100/50">
                <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-widest mb-0.5">WHT 3%</span>
                <span className="text-xs font-semibold text-rose-600">-{FinanceMath.format(payout.wht_amount)}</span>
            </div>
        </TableCell>
        <TableCell className="text-right">
             <div className="inline-flex flex-col items-end px-3 py-1 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <span className="text-[9px] font-semibold text-indigo-200 uppercase tracking-widest mb-0.5">Final Net</span>
                <span className="text-sm font-semibold">฿{FinanceMath.format(payout.net_amount || payout.net_transfer_amount)}</span>
            </div>
        </TableCell>
        <TableCell className="text-right space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-200" 
            onClick={() => toggleExpansion(payout.id)}
          >
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-500", isExpanded && "rotate-180 text-indigo-600")} />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 rounded-xl border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm" 
            onClick={() => onOpenHistory(payout)}
          >
            <HistoryIcon className="w-4 h-4" />
          </Button>

          {/* 📄 Secured Document Actions */}
          {payout.status === 'PAID' && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                onClick={async () => {
                  const { getSignedSlipUrlAction } = await import("../actions");
                  const res = await getSignedSlipUrlAction(payout.slip_url);
                  if (res.success && res.url) {
                    window.open(res.url, "_blank");
                  }
                }}
                title="ดูสลิปโอนเงิน (Secure Link)"
              >
                <ShieldCheck className="w-4 h-4" />
              </Button>

              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                onClick={async () => {
                   const { generateWhtPdfAction } = await import("../actions");
                   const processId = startProcess("กำลังสร้างใบ 50 ทวิ (WHT Certificate)", {
                     type: "EXPORT"
                   });
                   try {
                     const res = await generateWhtPdfAction(payout.id);
                     if (res.success && res.content) {
                        // 🧬 Convert base64 to Blob for internal linking
                        const byteCharacters = atob(res.content);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: "application/pdf" });
                        const blobUrl = URL.createObjectURL(blob);

                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = res.fileName || "WHT_Certificate.pdf";
                        link.click();
                        
                        finishProcess(processId, "SUCCESS", "ดาวน์โหลดใบ 50 ทวิสำเร็จ ✨", {
                          resultLink: blobUrl
                        });
                     } else {
                        finishProcess(processId, "ERROR", res.error || "เกิดข้อผิดพลาดในการสร้าง PDF");
                     }
                   } catch (e: unknown) {
                     const msg = e instanceof Error ? e.message : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
                     finishProcess(processId, "ERROR", msg);
                   }
                }}
                title="ดาวน์โหลดใบ 50 ทวิ (Server-side generated)"
              >
                <FileDown className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {payout.status === 'READY_TO_PAY' && (
            <Button 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 h-9 px-4 rounded-xl shadow-lg shadow-indigo-100 font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:grayscale" 
              onClick={() => onOpenPaidDialog(payout)}
              disabled={disabledAction}
              title={disabledAction ? "กรุณาสลับสาขาที่เมนูพื่อโอนเงิน" : "บันทึกการโอนเงิน"}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              โอนเงิน
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* 📊 Expanded Detail Row */}
      {isExpanded && (
        <TableRow className="bg-slate-50/50 border-t-0 hover:bg-slate-50/50">
          <TableCell colSpan={7} className="p-0 border-t-0">
            <div className="px-14 py-4 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                      รายละเอียดการคำนวณ (Calculation Breakdown)
                    </h4>
                    <p className="text-[10px] text-slate-400 italic">
                      ยอดนี้ถูกล็อกไว้เมื่อเข้าสถานะ {status.label}
                    </p>

                    {/* 🕵️ Dirty Sync Alert Banner */}
                    {payout.is_stale && (
                      <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 animate-in zoom-in-95 duration-500">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-semibold">ราคาดีลมีการเปลี่ยนแปลง (Pending Update)</p>
                          <p className="text-[10px] opacity-70">ยอดรวมคอมมิชชันในดีลคือ {FinanceMath.format(payout.expected_total)} บ. (ปัจจุบันคำนวณไว้ {FinanceMath.format(payout.calculated_total)} บ.)</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-3 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-[10px] font-semibold shadow-sm shadow-amber-200"
                          onClick={() => onRecalculate(payout.id)}
                          disabled={isRecalculating || disabledAction}
                        >
                          Recalculate Now
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* ✅ Recalculation Lock Logic (Standard) */}
                  {!payout.is_stale && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] font-semibold disabled:opacity-50"
                      disabled={payout.status === 'PAID' || isSelected || isRecalculating || disabledAction}
                      onClick={() => onRecalculate(payout.id)}
                      title={disabledAction ? "กรุณาสลับสาขาก่อนคำนวณใหม่" : "คำนวณยอดใหม่"}
                    >
                      <RefreshCw className={cn("w-3 h-3 mr-1", isRecalculating && "animate-spin")} />
                      คำนวณใหม่ (Recalculate)
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 mb-1">ยอดคอมมิชชันดิบ</span>
                    <span className="text-sm font-semibold text-slate-700">{FinanceMath.format(payout.amount)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="block text-[10px] text-rose-400 mb-1 text-right">หัก ณ ที่จ่าย (3%)</span>
                    <span className="block text-sm font-semibold text-rose-700 text-right">-{FinanceMath.format(payout.wht_amount)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 col-span-2 flex justify-between items-end">
                    <div>
                      <span className="block text-[10px] text-indigo-400 mb-1">ยอดโอนสุทธิ (NET)</span>
                      <span className="text-lg font-semibold text-indigo-700">{FinanceMath.format(payout.net_transfer_amount)}</span>
                    </div>
                    {payout.status === 'PAID' && (
                        <div className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            VERIFIED SNAPSHOT
                        </div>
                    )}
                  </div>
                </div>

                {/* Audit Hint */}
                {payout.payout_metadata?.calculation_snapshot && (
                   <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                      <p className="text-[9px] text-slate-400 flex items-center">
                        <HistoryIcon className="w-3 h-3 mr-1" />
                        Last Recalculated: {new Date(payout.updated_at).toLocaleString('th-TH')} 
                        {payout.payout_metadata.calculation_snapshot.tax_rate_snapshot && ` (Tax Rate: ${payout.payout_metadata.calculation_snapshot.tax_rate_snapshot * 100}%)`}
                      </p>
                   </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

PayoutTableRow.displayName = "PayoutTableRow";
