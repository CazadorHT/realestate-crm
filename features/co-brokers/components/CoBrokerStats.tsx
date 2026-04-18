"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Handshake } from "lucide-react";

interface CoBrokerStatsProps {
  stats: {
    total: number;
    highRated: number;
    active: number;
  };
}

export function CoBrokerStats({ stats }: CoBrokerStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="group border-none shadow-xl shadow-blue-100/50 bg-white/80 backdrop-blur-xl rounded-4xl overflow-hidden relative hover:scale-[1.02] transition-all duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">คู่ค้าทั้งหมด</CardTitle>
          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
            <Users className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1 italic">เครือข่ายความร่วมมือ</p>
        </CardContent>
      </Card>

      <Card className="group border-none shadow-xl shadow-amber-100/50 bg-white/80 backdrop-blur-xl rounded-4xl overflow-hidden relative hover:scale-[1.02] transition-all duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">พาร์ทเนอร์เกรด A</CardTitle>
          <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-500">
            <TrendingUp className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.highRated}</div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1 italic">เรตติ้ง 4-5 ดาว</p>
        </CardContent>
      </Card>

      <Card className="group border-none shadow-xl shadow-emerald-100/50 bg-white/80 backdrop-blur-xl rounded-4xl overflow-hidden relative hover:scale-[1.02] transition-all duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">เปิดใช้งานอยู่</CardTitle>
          <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
            <Handshake className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.active}</div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1 italic">พร้อมร่วมงานทันที</p>
        </CardContent>
      </Card>
    </div>
  );
}
