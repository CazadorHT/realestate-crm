"use client";

import { Card } from "@/components/ui/card";
import { CreditCard, TrendingUp } from "lucide-react";

interface WalletWealthCardsProps {
  stats: {
    totalEarnings: number;
    pendingAmount: number;
    closedDealsCount: number;
    totalCommissionsCount: number;
  };
  formatCurrency: (amt: number) => string;
}

export function WalletWealthCards({ stats, formatCurrency }: WalletWealthCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1 md:col-span-2 relative overflow-hidden bg-slate-900 rounded-4xl p-8 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        <div className="relative z-10 flex flex-col h-full justify-between gap-12">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-70">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">รายได้ทั้งหมด (สุทธิ)</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-semibold tracking-tighter">
              {formatCurrency(stats?.totalEarnings || 0)}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col border-white/10">
              <span className="text-[10px] uppercase font-semibold text-slate-400">ปิดดีลได้</span>
              <span className="text-2xl font-semibold">{stats?.closedDealsCount || 0}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400">จำนวนเคสทั้งหมด</span>
              <span className="text-2xl font-semibold">{stats?.totalCommissionsCount || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Abstract Decorations */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="rounded-4xl border-none shadow-xl bg-indigo-50/50 flex flex-col justify-center p-8 text-center relative group overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="mx-auto p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform duration-500">
          <TrendingUp className="w-8 h-8 text-indigo-600" />
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">ยอดรอโอน (พักรายได้)</p>
        <h3 className="text-3xl font-semibold text-indigo-900">
          {formatCurrency(stats?.pendingAmount || 0)}
        </h3>
        <p className="text-[10px] text-indigo-600/70 mt-2 font-semibold">รอการยืนยันจากฝ่ายบัญชี</p>
      </Card>
    </div>
  );
}
