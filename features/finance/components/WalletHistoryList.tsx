"use client";

import { History, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface WalletHistoryListProps {
  history: any[];
}

export function WalletHistoryList({ history }: WalletHistoryListProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
          <History className="w-5 h-5" />
          {isEn ? "Recent Payouts" : "รายการรับเงินล่าสุด"}
        </h3>
        <button className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer">
          {isEn ? "View all" : "ดูทั้งหมด"}
        </button>
      </div>
      
      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-4xl border border-dashed border-slate-200 animate-in fade-in duration-500">
            <span className="text-slate-400 text-sm font-medium italic">
              {isEn ? "No payout history recorded yet" : "ยังไม่มีรายการบันทึกในขณะนี้"}
            </span>
          </div>
        ) : (
          history.map((record: any) => (
            <div key={record.id} className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 active:scale-[0.99]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors duration-500">
                  <Building2 className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-900 transition-colors">
                    {record.deal?.property?.title || (isEn ? "Unknown Property" : "ไม่ทราบชื่อทรัพย์สิน")}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(record.created_at), "d MMM yyyy", isEn ? undefined : { locale: th })}
                  </span>
                </div>
              </div>
                <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {formatCurrency(record.net_transfer_amount || record.net_amount)}
                </span>
                <div className="flex gap-1.5">
                  {record.total_adjustments !== undefined && record.total_adjustments !== null && Number(record.total_adjustments) !== 0 && (
                    <Badge variant="outline" className="text-[8px] px-1.5 h-4 border-amber-200 text-amber-600 bg-amber-50 font-bold">
                      {Number(record.total_adjustments) > 0 ? "+" : ""}{record.total_adjustments} {isEn ? "Adj" : "ปรับปรุง"}
                    </Badge>
                  )}
                  {record.status === "PAID" ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 text-[9px] px-2 h-4 font-bold">
                      {isEn ? "Paid" : "จ่ายแล้ว"}
                    </Badge>
                  ) : record.status === "READY_TO_PAY" ? (
                    <Badge className="bg-indigo-50 text-indigo-600 border-none hover:bg-indigo-100 text-[9px] px-2 h-4 font-bold animate-pulse">
                      {isEn ? "Ready to Pay" : "พร้อมจ่าย"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 border-slate-200 text-[9px] px-2 h-4 font-bold italic">
                      {isEn ? "Unpaid" : "ยังไม่จ่าย"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

