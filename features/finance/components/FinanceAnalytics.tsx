"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, TooltipValueType
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, FileSpreadsheet, Loader2, ArrowLeft, Calendar, Clock, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getFinancialAnalyticsAction, 
  exportYearlyFinanceAction, 
  getAvailableFinancialYearsAction,
  FinancialAnalyticsData 
} from "../analytics-actions";
import { FinanceMath } from "@/lib/finance/precision";
import { YearSelectorModal } from "./YearSelectorModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FinanceAnalyticsProps {
  onBack: () => void;
}

export const FinanceAnalytics = ({ onBack }: FinanceAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialAnalyticsData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await getFinancialAnalyticsAction(year);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      toast.error(res.error || "โหลดข้อมูลไม่สำเร็จ");
    }
    setLoading(false);
  };

  const fetchAvailableYears = async () => {
    const res = await getAvailableFinancialYearsAction();
    if (res.success && res.data) {
      setAvailableYears(res.data);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    const res = await exportYearlyFinanceAction(year);
    if (res.success && res.data) {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.data}`;
      link.download = res.filename || `Finance_Report_${year}.xlsx`;
      link.click();
      toast.success("ดาวน์โหลดรายงานสำเร็จ");
    } else {
      toast.error(res.message || "ส่งออกรายงานไม่สำเร็จ");
    }
    setIsExporting(false);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-slate-400 text-sm font-semibold animate-pulse">กำลังสกัดข้อมูลบัญชี...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* 🧭 Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">วิเคราะห์ผลกำไรและขาดทุน (P&L)</h2>
            <p className="text-slate-500 text-sm font-medium">วิเคราะห์กำไร-ขาดทุน และกระแสเงินสดข้ามสาขา</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl ring-1 ring-slate-200">
            {(() => {
              const currentYear = new Date().getFullYear();
              return [currentYear - 2, currentYear - 1, currentYear].map((y) => (
                <Button 
                  key={y}
                  variant={year === y ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setYear(y)}
                  className={cn(
                    "px-4 h-8 text-xs font-semibold rounded-lg transition-all",
                    year === y ? "shadow-sm bg-white" : "text-slate-500"
                  )}
                >
                  {y}
                </Button>
              ));
            })()}
            
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsYearModalOpen(true)}
                className="px-2 h-8 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all ml-1"
                title="เลือกปีงบประมาณอื่น"
            >
                <Calendar className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-6 rounded-xl shadow-lg shadow-emerald-200"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            ส่งออกรายงานบัญชี
          </Button>

          <YearSelectorModal 
            isOpen={isYearModalOpen}
            onOpenChange={setIsYearModalOpen}
            selectedYear={year}
            onYearChange={setYear}
            availableYears={availableYears}
          />
        </div>
      </div>

      {/* 💰 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <SummaryCard 
          title="รายรับทั้งหมด (Gross)" 
          value={data?.summary.totalRevenue || 0} 
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-indigo-600"
          description="คอมมิชชันรวมก่อนหักเอเยนต์"
        />
        <SummaryCard 
          title="ยอดจ่ายเอเยนต์" 
          value={data?.summary.totalPayouts || 0} 
          icon={<TrendingDown className="w-5 h-5" />}
          color="bg-slate-800"
          description="ส่วนแบ่งที่จ่ายให้เอเยนต์"
        />
        <SummaryCard 
          title="รายการปรับปรุง" 
          value={data?.summary.totalAdjustments || 0} 
          icon={<PieChart className="w-5 h-5" />}
          color="bg-indigo-400"
          description="ยอดปรับปรุง (±)"
        />
        <SummaryCard 
          title="กำไรค้างรับ" 
          value={data?.summary.accruedProfit || 0} 
          icon={<Clock className="w-5 h-5" />}
          color="bg-amber-500"
          description="กำไรค้างรับ (ดีลจบแต่ยังไม่จ่าย)"
        />
        <SummaryCard 
          title="กำไรที่ได้รับจริง" 
          value={data?.summary.realizedProfit || 0} 
          icon={<ShieldCheck className="w-5 h-5" />}
          color="bg-emerald-600"
          description="กำไรที่ได้รับแล้วจริง (Cash-in)"
          highlight
        />
      </div>

      {/* 📈 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">แนวโน้มผลประกอบการรายเดือน</CardTitle>
                <CardDescription className="font-medium">แนวโน้มรายได้เปรียบเทียบกับกำไรสุทธิ (จริง vs ค้างรับ)</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-tighter">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"/> รายรับ</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/> รับจริง</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"/> ค้างรับ</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-4">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyTrends} stackOffset="sign">
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="realizedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="accruedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                    tickFormatter={(str) => new Date(str).toLocaleDateString("th-TH", { month: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => `฿${FinanceMath.format(v)}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    formatter={(v: TooltipValueType | undefined, name: string | number | undefined) => [
                      FinanceMath.format(Number(v || 0)), 
                      name === "revenue" ? "รายรับ" : name === "realizedProfit" ? "รับจริง" : "ค้างรับ"
                    ]}
                  />
                  <Bar dataKey="revenue" name="revenue" fill="url(#revGradient)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="realizedProfit" name="realizedProfit" stackId="a" fill="url(#realizedGradient)" barSize={20} />
                  <Bar dataKey="accruedProfit" name="accruedProfit" stackId="a" fill="url(#accruedGradient)" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color, description, highlight }: any) => (
  <Card className={cn(
    "border-none shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden group",
    highlight ? "ring-2 ring-emerald-500 ring-offset-2" : "bg-white"
  )}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl text-white shadow-lg", color)}>
          {icon}
        </div>
        {value > 0 && <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+ มีรายการ</span>}
      </div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-slate-900 mb-1">฿ {FinanceMath.format(value)}</p>
      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{description}</p>
      
    </CardContent>
  </Card>
);
