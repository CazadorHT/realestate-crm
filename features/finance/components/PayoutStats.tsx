"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Clock, CheckCircle2, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PayoutStatsProps {
  readyToPayAmount: number;
  unpaidCount: number;
  paidAmountThisMonth: number;
  totalPoolAmount: number;
  formatCurrency: (amt: number) => string;
  isLoading?: boolean;
}

export function PayoutStats({
  readyToPayAmount,
  unpaidCount,
  paidAmountThisMonth,
  totalPoolAmount,
  formatCurrency,
  isLoading
}: PayoutStatsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="group bg-linear-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-2xl shadow-indigo-200/50 rounded-3xl overflow-hidden relative transition-all hover:scale-[1.02]">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <CardContent className={cn("pt-8 pb-6 transition-all duration-300", isLoading && "opacity-40 animate-pulse")}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[10px] uppercase font-semibold">
              {isEn ? "Ready" : "พร้อมจ่าย"}
            </Badge>
          </div>
          <span className="text-xs font-semibold opacity-70 uppercase tracking-widest text-indigo-100">
            {isEn ? "Pending Transfer Amount" : "ยอดรอโอนชำระ"}
          </span>
          <h2 className="text-3xl font-semibold mt-2 tracking-tight">
            {formatCurrency(readyToPayAmount)}
          </h2>
        </CardContent>
      </Card>

      <Card className="group bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative hover:scale-[1.02] transition-transform duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
        <CardContent className={cn("pt-8 pb-6 transition-all duration-300", isLoading && "opacity-40 animate-pulse")}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <Badge variant="outline" className="border-amber-200 text-amber-600 text-[10px] uppercase font-semibold">
              {isEn ? "Pending" : "รอตรวจสอบ"}
            </Badge>
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {isEn ? "Pending Approval Items" : "รายการรออนุมัติ"}
          </span>
          <h2 className="text-3xl font-semibold mt-2 text-slate-900">
            {unpaidCount} <span className="text-sm font-semibold text-slate-400">{isEn ? "items" : "รายการ"}</span>
          </h2>
        </CardContent>
      </Card>

      <Card className="group bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative hover:scale-[1.02] transition-transform duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
        <CardContent className={cn("pt-8 pb-6 transition-all duration-300", isLoading && "opacity-40 animate-pulse")}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <Badge variant="outline" className="border-emerald-200 text-emerald-600 text-[10px] uppercase font-semibold">
              {isEn ? "Completed" : "สำเร็จ"}
            </Badge>
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {isEn ? "Paid (This Month)" : "จ่ายแล้ว (เดือนนี้)"}
          </span>
          <h2 className="text-3xl font-semibold mt-2 text-slate-900">
            {formatCurrency(paidAmountThisMonth)}
          </h2>
        </CardContent>
      </Card>

      <Card className="group bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative hover:scale-[1.02] transition-transform duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
        <CardContent className={cn("pt-8 pb-6 transition-all duration-300", isLoading && "opacity-40 animate-pulse")}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
              <Wallet className="w-6 h-6 text-indigo-500" />
            </div>
            <Badge variant="outline" className="border-indigo-200 text-indigo-600 text-[10px] uppercase font-semibold">
              {isEn ? "Pool Fund" : "เป้าหมาย"}
            </Badge>
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {isEn ? "Commission Pool Reserve" : "เงินกองทุนคอมมิชชัน"}
          </span>
          <h2 className="text-3xl font-semibold mt-2 text-slate-900">
            {formatCurrency(totalPoolAmount)}
          </h2>
        </CardContent>
      </Card>
    </div>
  );
}

