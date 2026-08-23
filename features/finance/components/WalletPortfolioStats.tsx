"use client";

import { Award, ArrowUpRight, TrendingUp, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface WalletPortfolioStatsProps {
  history: any[];
}

export function WalletPortfolioStats({ history }: WalletPortfolioStatsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const maxDeal = Math.max(...history.map((h: any) => h.net_amount || 0), 0);
  const totalWht = history.reduce((acc: number, h: any) => acc + Number(h.wht_amount || 0), 0);

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
        <Award className="w-5 h-5" />
        {isEn ? "Achievement Portfolio" : "พอร์ตโฟลิโอความสำเร็จ"}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-linear-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-sm relative group">
          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity">
            <Award className="w-12 h-12 text-indigo-600" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-indigo-600 hover:bg-indigo-700 border-none px-3 font-bold">
              {isEn ? "Top Deal" : "ดีลเด่น"}
            </Badge>
            <ArrowUpRight className="w-4 h-4 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isEn ? "Highest Single Deal" : "ปิดดีลสูงสุดต่อชิ้น"}
          </p>
          <h4 className="text-xl font-bold text-indigo-950 mt-1">
            {formatCurrency(maxDeal)}
          </h4>
        </div>

        <div className="p-6 bg-linear-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 shadow-sm relative group">
          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none px-3 font-bold">
              {isEn ? "Tax Accumulation" : "ภาษีสะสม"}
            </Badge>
            <TrendingUp className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isEn ? "Total Withholding Tax (WHT)" : "ยอดหัก ณ ที่จ่าย (WHT) รวม"}
          </p>
          <h4 className="text-xl font-bold text-emerald-950 mt-1">
            {formatCurrency(totalWht)}
          </h4>
        </div>

        <Card className="col-span-2 rounded-3xl border-slate-100 shadow-sm p-5 hover:shadow-xl hover:shadow-slate-200/40 hover:border-indigo-100 transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
              <Download className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {isEn ? "Download Withholding Tax Certificate (50 Twi)" : "ดาวน์โหลดหนังสือรับรอง 50 ทวิ"}
                </h4>
                <Badge variant="outline" className="border-indigo-200 text-indigo-600 text-[8px] px-1.5 font-bold h-4">
                  {isEn ? "Soon" : "เร็วๆ นี้"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {isEn 
                  ? "Used for annual personal income tax returns and tax refund claims" 
                  : "ใช้สำหรับยื่นภาษีเงินได้บุคคลธรรมดาประจำปี เพื่อขอคืนภาษี"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

