"use client";

import { useState, useEffect } from "react";
import { getAgentWalletStatsAction } from "@/features/finance/actions";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  TrendingUp, 
  CreditCard, 
  Award,
  ArrowUpRight,
  Download,
  Building2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default function AgentWalletPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getAgentWalletStatsAction();
    if (res.success) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0
    }).format(amt);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลกระเป๋าเงิน...</p>
        </div>
      </div>
    );
  }

  const { stats, history } = data || { stats: {}, history: [] };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* 👑 Header & Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">กระเป๋าเงินของฉัน</h1>
          <p className="text-slate-500 text-sm mt-1">สรุปยอดรายได้และผลงานการปิดดีลทั้งหมด</p>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hidden sm:block">
          <Award className="w-6 h-6 text-indigo-600" />
        </div>
      </div>

      {/* 💰 Main Wealth Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 relative overflow-hidden bg-slate-900 rounded-4xl p-8 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col h-full justify-between gap-12">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-70">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Total Earnings (Net)</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter">
                {formatCurrency(stats?.totalEarnings || 0)}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Closed Deals</span>
                <span className="text-2xl font-black">{stats?.closedDealsCount || 0}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Cases</span>
                <span className="text-2xl font-black">{stats?.totalCommissionsCount || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Abstract Decorations */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <Card className="rounded-4xl border-none shadow-xl bg-indigo-50/50 flex flex-col justify-center p-8 text-center relative group">
          <div className="mx-auto p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">ยอดรอโอน (Pending)</p>
          <h3 className="text-3xl font-black text-indigo-900">
            {formatCurrency(stats?.pendingAmount || 0)}
          </h3>
          <p className="text-[10px] text-indigo-600/70 mt-2 font-medium">รอการยืนยันจากบัญชี</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Case History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-slate-900" />
              รายการรับเงินล่าสุด
            </h3>
            <button className="text-xs text-indigo-600 font-bold hover:underline">ดูทั้งหมด</button>
          </div>
          
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <span className="text-slate-400 text-sm">ยังไม่มีรายการบันทึกในขณะนี้</span>
              </div>
            ) : (
              history.map((record: any) => (
                <div key={record.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                      <Building2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 line-clamp-1">{record.deal?.property?.title || "ไม่ทราบชื่อทรัพย์"}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(record.created_at), "d MMM yyyy", { locale: th })}
                      </span>
                    </div>
                  </div>
                    <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm font-black text-slate-900">{formatCurrency(record.net_transfer_amount || record.net_amount)}</span>
                    <div className="flex gap-1">
                      {record.total_adjustments !== 0 && (
                        <Badge variant="outline" className="text-[8px] px-1 h-3.5 border-amber-200 text-amber-600 bg-amber-50">
                          {record.total_adjustments > 0 ? "+" : ""}{record.total_adjustments} ADJ
                        </Badge>
                      )}
                      {record.status === "PAID" ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 text-[9px] px-1.5 h-4">
                          PAID
                        </Badge>
                      ) : record.status === "READY_TO_PAY" ? (
                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-50 text-[9px] px-1.5 h-4 animate-pulse">
                          READY
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 text-[9px] px-1.5 h-4 italic">
                          UNPAID
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Portfolio / Success Stats */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-slate-900" />
            พอร์ตโฟลิโอความสำเร็จ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-linear-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-indigo-600">HOT DEAL</Badge>
                <ArrowUpRight className="w-4 h-4 text-indigo-300" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">ปิดดีลสูงสุดต่อชิ้น</p>
              <h4 className="text-xl font-black text-indigo-950 mt-1">
                {formatCurrency(Math.max(...history.map((h: any) => h.net_amount), 0))}
              </h4>
            </div>

            <div className="p-6 bg-linear-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-emerald-600">BONUS</Badge>
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">ยอดภาษี (WHT) รวม</p>
              <h4 className="text-xl font-black text-emerald-950 mt-1">
                {formatCurrency(history.reduce((acc: number, h: any) => acc + Number(h.wht_amount || 0), 0))}
              </h4>
            </div>

            <Card className="col-span-2 rounded-3xl border-slate-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                  <Download className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">ดาวน์โหลดหนังสือรับรอง 50 ทวิ</h4>
                  <p className="text-[10px] text-slate-400">สำหรับยื่นภาษีเงินได้บุคคลธรรมดา ประจำปี</p>
                </div>
                <Badge variant="outline" className="border-indigo-200 text-indigo-600">เร็วๆ นี้</Badge>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
