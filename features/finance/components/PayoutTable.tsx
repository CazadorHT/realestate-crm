"use client";

import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, ChevronLeft, ChevronRight, FileX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PayoutTableRow } from "./PayoutTableRow";
import { useLanguage } from "@/lib/i18n/language-context";

interface PayoutTableProps {
  payouts: any[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewHistory: (payout: any) => void;
  onViewReceipt: (payout: any) => void;
  onUpdate: () => void;
  onRecalculate: (id: string) => Promise<void>;
  recalculatingIds: Set<string>;
  disabledAction: boolean;
  formatCurrency: (amt: number) => string;
  hasActiveFilters?: boolean;
}

export function PayoutTable({
  payouts,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onViewHistory,
  onViewReceipt,
  onUpdate,
  onRecalculate,
  recalculatingIds,
  disabledAction,
  formatCurrency,
  hasActiveFilters = false
}: PayoutTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  if (payouts.length === 0 && !isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white p-20 text-center animate-in zoom-in-95 duration-500 my-8">
        <div className="relative flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
            <div className="relative p-6 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/30">
              <BadgeDollarSign className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-semibold text-slate-800">
              {hasActiveFilters
                ? (isEn ? "No payout records found" : "ไม่พบรายการเบิกจ่ายที่ค้นหา")
                : (isEn ? "No pending payouts" : "ยังไม่มีรายการเบิกจ่ายค้างชำระ")}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              {hasActiveFilters
                ? (isEn ? "Try adjusting your filters or search criteria." : "ลองปรับตัวกรองหรือค้นหาด้วยเกณฑ์อื่นเพื่อให้ครอบคลุมรายการที่คุณต้องการ")
                : (isEn ? "All payouts have been settled or there are no pending records in this period." : "ยินดีด้วย! คุณเครดิตทุกรายการเรียบร้อยแล้ว หรือยังไม่มีการสรุปยอดเบิกจ่ายในรอบนี้")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group payouts by deal
  const groupedDeals = payouts.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.dealId === curr.deal_id);
    if (existing) {
      existing.splits.push(curr);
      existing.totalAmount += Number(curr.amount || 0);
      existing.totalWht += Number(curr.wht_amount || 0);
      existing.totalNet += Number(curr.net_transfer_amount || curr.net_amount || 0);
      
      const statuses = existing.splits.map((s: any) => s.status);
      if (statuses.every((s: string) => s === "PAID")) {
        existing.status = "PAID";
      } else if (statuses.every((s: string) => s === "UNPAID")) {
        existing.status = "UNPAID";
      } else if (statuses.every((s: string) => s === "READY_TO_PAY")) {
        existing.status = "READY_TO_PAY";
      } else {
        existing.status = "MIXED";
      }
    } else {
      acc.push({
        dealId: curr.deal_id,
        dealTitle: curr.property?.title || (isEn ? "Unspecified Project" : "ไม่ระบุโครงการ"),
        propertyTitle: curr.property?.title || (isEn ? "Unknown Property" : "ไม่ทราบชื่อทรัพย์สิน"),
        totalAmount: Number(curr.amount || 0),
        totalWht: Number(curr.wht_amount || 0),
        totalNet: Number(curr.net_transfer_amount || curr.net_amount || 0),
        status: curr.status,
        splits: [curr]
      });
    }
    return acc;
  }, []);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-4xl border border-white/50 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-6 duration-700 relative">
      {/* ⏳ Subtle Loading Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden z-20">
          <div className="h-full bg-indigo-500 animate-progress origin-left w-full" />
        </div>
      )}

      <div className={cn("overflow-x-auto transition-opacity duration-300", isLoading && "opacity-60")}>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-12 text-center h-14 pl-4"></TableHead>
              <TableHead className="w-[300px] text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">{isEn ? "Project / Property" : "โครงการ / ทรัพย์สิน"}</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">{isEn ? "Payee" : "ผู้รับเงิน"}</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">{isEn ? "Status" : "สถานะภาพรวม"}</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">{isEn ? "Gross Commission" : "คอมมิชชันรวม"}</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">{isEn ? "WHT (3%)" : "หัก ณ ที่จ่ายรวม (3%)"}</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">{isEn ? "Net Payout" : "ยอดโอนรวม (สุทธิ)"}</TableHead>
              <TableHead className="text-center text-[10px] uppercase tracking-widest font-semibold text-slate-400 pr-8 h-14">{isEn ? "Details" : "ขยายรายละเอียด"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedDeals.map((deal) => (
              <PayoutTableRow 
                key={deal.dealId} 
                deal={deal} 
                onUpdate={onUpdate}
                onOpenHistory={onViewHistory}
                onOpenPaidDialog={onViewReceipt}
                onRecalculate={onRecalculate}
                recalculatingIds={recalculatingIds}
                disabledAction={disabledAction}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 pointer-events-none z-10">
           <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-sm font-semibold text-slate-600">{isEn ? "Updating table..." : "กำลังอัปเดตตาราง..."}</span>
           </div>
        </div>
      )}

      {/* 🧭 Elegant Pagination */}
      {totalPages > 1 && (
        <div className="px-8 py-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-medium">
            {isEn ? (
              <>Page <span className="text-slate-900 font-semibold">{currentPage}</span> of <span className="text-slate-900 font-semibold">{totalPages}</span></>
            ) : (
              <>แสดงหน้าที่ <span className="text-slate-900 font-semibold">{currentPage}</span> จาก <span className="text-slate-900 font-semibold">{totalPages}</span> หน้า</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {isEn ? "Previous" : "ก่อนหน้า"}
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => onPageChange(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === i + 1
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              {isEn ? "Next" : "ถัดไป"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

