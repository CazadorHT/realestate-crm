import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, ArrowUpRight, Clock, CheckCircle2, 
  History as HistoryIcon, ShieldCheck, RefreshCw, FileDown
} from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { WhtCertificateTemplate } from "./WhtCertificateTemplate";
import { FinanceMath } from "@/lib/finance/precision";
import { usePayoutStore } from "../stores/payoutStore";
import { cn } from "@/lib/utils";

interface PayoutTableRowProps {
  payout: any;
  onOpenHistory: (payout: any) => void;
  onOpenPaidDialog: (payout: any) => void;
  onRecalculate: (id: string) => Promise<void>;
  isRecalculating: boolean;
}

export const PayoutTableRow = React.memo(({ 
  payout, 
  onOpenHistory, 
  onOpenPaidDialog,
  onRecalculate,
  isRecalculating
}: PayoutTableRowProps) => {
  // ✅ Specific Selector Tip from Mr. Hunter
  const isSelected = usePayoutStore((state) => state.selectedIds.has(payout.id));
  const isExpanded = usePayoutStore((state) => state.expandedRows.has(payout.id));
  const toggleSelection = usePayoutStore((state) => state.toggleSelection);
  const toggleExpansion = usePayoutStore((state) => state.toggleExpansion);

  const statusMap: any = {
    'UNPAID': { label: 'รอตรวจ', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    'READY_TO_PAY': { label: 'รอจ่าย', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    'PAID': { label: 'จ่ายแล้ว', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  };

  const status = statusMap[payout.status] || { label: payout.status, color: 'bg-gray-100' };

  return (
    <>
      <TableRow className={cn(
        "group transition-colors",
        isSelected ? "bg-indigo-50/50 hover:bg-indigo-50" : "hover:bg-slate-50/50",
        isExpanded && "border-b-0"
      )}>
        <TableCell className="w-12 text-center">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={() => toggleSelection(payout.id)}
            disabled={payout.status === 'PAID'}
            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{payout.agent?.full_name || 'ไม่ระบุชื่อ'}</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
              ID: {payout.id.slice(0, 8)}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("font-medium px-2 py-0.5 rounded-full text-[11px]", status.color)}>
            {status.label}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-semibold text-slate-800">
          {FinanceMath.format(payout.amount)}
        </TableCell>
        <TableCell className="text-right text-rose-600 font-medium bg-rose-50/30">
          -{FinanceMath.format(payout.wht_amount)}
        </TableCell>
        <TableCell className="text-right font-bold text-indigo-700 bg-indigo-50/30">
          {FinanceMath.format(payout.net_transfer_amount)}
        </TableCell>
        <TableCell className="text-right space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200" 
            onClick={() => toggleExpansion(payout.id)}
          >
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180")} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={() => onOpenHistory(payout)}
          >
            <HistoryIcon className="w-3.5 h-3.5 text-slate-500" />
          </Button>
          
          {payout.status === 'READY_TO_PAY' ? (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 shadow-sm" 
              onClick={() => onOpenPaidDialog(payout)}
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              จ่ายเงิน
            </Button>
          ) : payout.status === 'UNPAID' && (
            <Button 
              variant="outline" 
              size="sm" 
              disabled 
              className="h-8 px-3 opacity-50 cursor-not-allowed border-dashed"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              บัญชีรอตรวจ
            </Button>
          )}

          {/* 📄 WHT Certificate Download (Only for PAID) */}
          {payout.status === 'PAID' && (
            <PDFDownloadLink
              document={
                <WhtCertificateTemplate 
                  data={{
                    agentName: payout.agent?.full_name || 'ไม่ระบุชื่อ',
                    address: "กรุงเทพมหานคร", // TODO: Link to real agent address if available
                    taxAmount: FinanceMath.format(payout.wht_amount),
                    grossAmount: FinanceMath.format(payout.amount),
                    netAmount: FinanceMath.format(payout.net_transfer_amount),
                    date: payout.paid_at ? new Intl.DateTimeFormat('th-TH').format(new Date(payout.paid_at)) : '-',
                    tenantName: "Cazador CRM Provider",
                    referenceCode: payout.payment_reference || payout.id.slice(0, 8).toUpperCase()
                  }} 
                />
              }
              fileName={`WHT_${payout.id.slice(0, 8)}.pdf`}
            >
              {({ loading }) => (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50",
                    loading && "opacity-50 animate-pulse"
                  )}
                  title="ดาวน์โหลดใบ 50 ทวิ"
                >
                  <FileDown className="w-3.5 h-3.5" />
                </Button>
              )}
            </PDFDownloadLink>
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
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      รายละเอียดการคำนวณ (Calculation Breakdown)
                    </h4>
                    <p className="text-[10px] text-slate-400 italic">
                      ยอดนี้ถูกล็อกไว้เมื่อเข้าสถานะ {status.label}
                    </p>
                  </div>
                  
                  {/* ✅ Recalculation Lock Logic */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold"
                    disabled={payout.status === 'PAID' || isSelected || isRecalculating}
                    onClick={() => onRecalculate(payout.id)}
                  >
                    <RefreshCw className={cn("w-3 h-3 mr-1", isRecalculating && "animate-spin")} />
                    คำนวณใหม่ (Recalculate)
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 mb-1">ยอดคอมมิชชันดิบ</span>
                    <span className="text-sm font-bold text-slate-700">{FinanceMath.format(payout.amount)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="block text-[10px] text-rose-400 mb-1 text-right">หัก ณ ที่จ่าย (3%)</span>
                    <span className="block text-sm font-bold text-rose-700 text-right">-{FinanceMath.format(payout.wht_amount)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 col-span-2 flex justify-between items-end">
                    <div>
                      <span className="block text-[10px] text-indigo-400 mb-1">ยอดโอนสุทธิ (NET)</span>
                      <span className="text-lg font-black text-indigo-700">{FinanceMath.format(payout.net_transfer_amount)}</span>
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
