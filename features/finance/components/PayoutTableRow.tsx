import React from "react";
import { TableRow, TableCell, Table, TableHeader, TableHead, TableBody } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, ArrowUpRight, Clock, CheckCircle2, 
  History as HistoryIcon, ShieldCheck, RefreshCw, FileDown,
  Loader2
} from "lucide-react";
import { FinanceMath } from "@/lib/finance/precision";
import { usePayoutStore } from "../stores/payoutStore";
import { cn } from "@/lib/utils";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { toast } from "sonner";

interface PayoutTableRowProps {
  deal: any; // { dealId, dealTitle, propertyTitle, totalAmount, totalWht, totalNet, status, splits }
  onOpenHistory: (payout: any) => void;
  onOpenPaidDialog: (payout: any) => void;
  onRecalculate: (id: string) => Promise<void>;
  recalculatingIds: Set<string>;
  onUpdate?: () => void;
  disabledAction: boolean;
}

export const PayoutTableRow = React.memo(({ 
  deal, 
  onOpenHistory, 
  onOpenPaidDialog,
  onRecalculate,
  recalculatingIds,
  onUpdate,
  disabledAction
}: PayoutTableRowProps) => {
  const selectedIds = usePayoutStore((state) => state.selectedIds);
  const toggleSelection = usePayoutStore((state) => state.toggleSelection);
  const isExpanded = usePayoutStore((state) => state.expandedRows.has(deal.dealId));
  const toggleExpansion = usePayoutStore((state) => state.toggleExpansion);
  const [approvingIds, setApprovingIds] = React.useState<Set<string>>(new Set());

  // Group status map
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
    'MIXED': { 
      label: 'สถานะผสม', 
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50',
      glow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]'
    }
  };

  const status = statusMap[deal.status] || { label: deal.status, color: 'bg-gray-100' };

  // Checkbox helpers for bulk selection of splits under this deal
  const eligibleSplits = deal.splits.filter((s: any) => s.status !== 'PAID');
  const allSelected = eligibleSplits.length > 0 && eligibleSplits.every((s: any) => selectedIds.has(s.id));
  const partialSelected = eligibleSplits.length > 0 && eligibleSplits.some((s: any) => selectedIds.has(s.id)) && !allSelected;

  const handleGroupCheckboxChange = () => {
    if (allSelected) {
      eligibleSplits.forEach((s: any) => {
        if (selectedIds.has(s.id)) toggleSelection(s.id);
      });
    } else {
      eligibleSplits.forEach((s: any) => {
        if (!selectedIds.has(s.id)) toggleSelection(s.id);
      });
    }
  };

  return (
    <>
      <TableRow className={cn(
        "group transition-all duration-300 relative border-b border-slate-100/50",
        isExpanded && "bg-slate-50/30 border-b-0 hover:bg-slate-50/30"
      )}>
        <TableCell className="relative w-12 text-center">
          {allSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />}
          <Checkbox 
            checked={allSelected ? true : (partialSelected ? "indeterminate" : false)} 
            onCheckedChange={handleGroupCheckboxChange}
            disabled={eligibleSplits.length === 0}
            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-transform active:scale-90"
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-col max-w-[300px]">
            <span className="font-bold text-slate-800 text-sm truncate block" title={deal.propertyTitle}>
              {deal.propertyTitle}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">ID: {deal.dealId.slice(0, 8)}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700 text-xs">
              {deal.splits.length} ผู้รับเงิน
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {deal.splits.map((s: any) => s.recipient_name || s.agent?.full_name).join(", ")}
            </span>
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
            <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", status.color.replace('/10', ''))} />
            {status.label}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-bold text-slate-800 text-xs">
          {FinanceMath.format(deal.totalAmount)}
        </TableCell>
        <TableCell className="text-right text-xs font-semibold text-rose-600">
          {deal.totalWht >= 0.01 ? `-${FinanceMath.format(deal.totalWht)}` : "-"}
        </TableCell>
        <TableCell className="text-right">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
            ฿{FinanceMath.format(deal.totalNet)}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-all border border-transparent" 
            onClick={() => toggleExpansion(deal.dealId)}
          >
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-500", isExpanded && "rotate-180 text-indigo-600")} />
          </Button>
        </TableCell>
      </TableRow>

      {/* 📊 Expanded Detail Row */}
      {isExpanded && (
        <TableRow className="bg-slate-50/30 border-t-0 hover:bg-slate-50/30">
          <TableCell colSpan={8} className="p-0 border-t-0">
            <div className="px-12 py-4 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    รายการจัดสรรคอมมิชชันภายในดีล (Commission Splits)
                  </h4>
                </div>
                <Table>
                  <TableHeader className="bg-slate-50/10">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-10 pl-4"></TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ผู้รับเงิน / บทบาท</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สัดส่วน</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สถานะ</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">ยอดเงินดิบ</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">WHT 3%</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">ยอดโอน (สุทธิ)</TableHead>
                      <TableHead className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pr-4">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deal.splits.map((split: any) => {
                      const splitStatus = statusMap[split.status] || { label: split.status, color: 'bg-gray-100' };
                      const isSplitSelected = selectedIds.has(split.id);
                      const isRecalculating = recalculatingIds.has(split.id);

                      return (
                        <TableRow key={split.id} className={cn("hover:bg-slate-50/50 border-b border-slate-100/50", isSplitSelected && "bg-indigo-50/40")}>
                          <TableCell className="pl-4">
                            <Checkbox 
                              checked={isSplitSelected} 
                              onCheckedChange={() => toggleSelection(split.id)}
                              disabled={split.status === 'PAID'}
                              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-transform active:scale-90"
                            />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-xs">
                                {split.recipient_name || split.agent?.full_name || 'ไม่ระบุชื่อ'}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                                {split.recipient_role}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 font-semibold text-xs">
                            {Number(split.percentage)}%
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                  "font-semibold px-2 py-0.5 rounded-full text-[9px] border tracking-tight uppercase", 
                                  splitStatus.color
                              )}
                            >
                              {splitStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-600 text-xs">
                            {FinanceMath.format(split.amount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-rose-500 text-xs">
                            {split.wht_amount >= 0.01 ? `-${FinanceMath.format(split.wht_amount)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-800 text-xs">
                            {FinanceMath.format(split.net_transfer_amount || split.net_amount)}
                          </TableCell>
                          <TableCell className="text-right space-x-1.5 pr-4">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-xs" 
                              onClick={() => onOpenHistory(split)}
                              title="ดูประวัติการเบิกจ่าย"
                            >
                              <HistoryIcon className="w-3.5 h-3.5" />
                            </Button>

                            {split.status === 'PAID' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all shadow-xs"
                                  onClick={async () => {
                                    const { getSignedSlipUrlAction } = await import("../actions");
                                    const res = await getSignedSlipUrlAction(split.slip_url);
                                    if (res.success && res.url) {
                                      window.open(res.url, "_blank");
                                    }
                                  }}
                                  title="ดูสลิปโอนเงิน"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </Button>

                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all shadow-xs"
                                  onClick={async () => {
                                     const { generateWhtPdfAction } = await import("../actions");
                                     const processId = startProcess("กำลังสร้างใบ 50 ทวิ (WHT Certificate)", {
                                       type: "EXPORT"
                                     });
                                     try {
                                       const res = await generateWhtPdfAction(split.id);
                                       if (res.success && res.content) {
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
                                       finishProcess(processId, "ERROR", e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
                                     }
                                  }}
                                  title="ดาวน์โหลดใบ 50 ทวิ"
                                >
                                  <FileDown className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}

                            {split.status === 'UNPAID' && (
                              <Button 
                                size="sm" 
                                className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 rounded-lg text-xs font-semibold shadow-md shadow-amber-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center" 
                                onClick={async () => {
                                  setApprovingIds(prev => {
                                    const next = new Set(prev);
                                    next.add(split.id);
                                    return next;
                                  });
                                  try {
                                    const { markAsReadyToPayAction } = await import("../actions");
                                    const res = await markAsReadyToPayAction(split.id);
                                    if (res.success) {
                                      toast.success("อนุมัติพร้อมจ่ายสำเร็จ ✨");
                                      if (onUpdate) onUpdate();
                                    } else {
                                      toast.error(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
                                    }
                                  } catch (e: any) {
                                    toast.error(e.message || "เกิดข้อผิดพลาด");
                                  } finally {
                                    setApprovingIds(prev => {
                                      const next = new Set(prev);
                                      next.delete(split.id);
                                      return next;
                                    });
                                  }
                                }}
                                disabled={disabledAction || approvingIds.has(split.id)}
                                title={disabledAction ? "กรุณาสลับสาขาก่อนอนุมัติ" : "อนุมัติพร้อมจ่าย"}
                              >
                                {approvingIds.has(split.id) ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    กำลังอนุมัติ...
                                  </>
                                ) : (
                                  "อนุมัติ"
                                )}
                              </Button>
                            )}

                            {split.status === 'READY_TO_PAY' && (
                              <Button 
                                size="sm" 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50" 
                                onClick={() => onOpenPaidDialog(split)}
                                disabled={disabledAction}
                                title={disabledAction ? "กรุณาสลับสาขาก่อนโอนเงิน" : "บันทึกการโอนเงิน"}
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                                โอนเงิน
                              </Button>
                            )}

                            {split.status !== 'PAID' && (
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-xs"
                                onClick={() => onRecalculate(split.id)}
                                disabled={isRecalculating || disabledAction}
                                title="คำนวณสัดส่วนใหม่"
                              >
                                <RefreshCw className={cn("w-3 h-3", isRecalculating && "animate-spin")} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

PayoutTableRow.displayName = "PayoutTableRow";


