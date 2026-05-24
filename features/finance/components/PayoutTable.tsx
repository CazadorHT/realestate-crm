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
                ? "ไม่พบรายการเบิกจ่ายที่ค้นหา"
                : "ยังไม่มีรายการเบิกจ่ายค้างชำระ"}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              {hasActiveFilters
                ? "ลองปรับตัวกรองหรือค้นหาด้วยเกณฑ์อื่นเพื่อให้ครอบคลุมรายการที่คุณต้องการ"
                : "ยินดีด้วย! คุณเครดิตทุกรายการเรียบร้อยแล้ว หรือยังไม่มีการสรุปยอดเบิกจ่ายในรอบนี้"}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              <TableHead className="w-[200px] text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">โครงการ / ทรัพย์สิน</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">เบิกจ่ายให้ (ผู้รับ)</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">สถานะ</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">ยอดคอมมิชชันดิบ</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">หัก ณ ที่จ่าย (3%)</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest font-semibold text-slate-400 h-14">ยอดโอน (สุทธิ)</TableHead>
              <TableHead className="text-center text-[10px] uppercase tracking-widest font-semibold text-slate-400 pr-8 h-14">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <PayoutTableRow 
                key={payout.id} 
                payout={payout} 
                onUpdate={onUpdate}
                onOpenHistory={onViewHistory}
                onOpenPaidDialog={onViewReceipt}
                onRecalculate={onRecalculate}
                isRecalculating={recalculatingIds.has(payout.id)}
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
              <span className="text-sm font-semibold text-slate-600">กำลังอัปเดตตาราง...</span>
           </div>
        </div>
      )}

      {/* 🧭 Elegant Pagination */}
      {totalPages > 1 && (
        <div className="px-8 py-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-medium">
            แสดงหน้าที่ <span className="text-slate-900 font-semibold">{currentPage}</span> จาก <span className="text-slate-900 font-semibold">{totalPages}</span> หน้า
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              ก่อนหน้า
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => onPageChange(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
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
              className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
