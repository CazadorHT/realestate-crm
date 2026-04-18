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
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WalletWealthCards } from "@/features/finance/components/WalletWealthCards";
import { WalletHistoryList } from "@/features/finance/components/WalletHistoryList";
import { WalletPortfolioStats } from "@/features/finance/components/WalletPortfolioStats";

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
      <div className="flex items-center justify-center min-h-[60vh] animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs">กำลังโหลดเกราะป้องกันทางการเงิน...</p>
        </div>
      </div>
    );
  }

  const { stats, history } = data || { stats: {}, history: [] };

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <PageHeader
        title="กระเป๋าเงินของฉัน"
        subtitle="สรุปยอดรายได้และผลงานการปิดดีลทั้งหมดของคุณ"
        icon="trendingUp"
        gradient="emerald"
        breadcrumbs={[
          { label: "แดชบอร์ด", href: "/protected" },
          { label: "กระเป๋าเงิน" },
        ]}
      />

      <WalletWealthCards 
        stats={stats} 
        formatCurrency={formatCurrency} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <WalletHistoryList 
            history={history} 
            formatCurrency={formatCurrency} 
        />
        <WalletPortfolioStats 
            history={history} 
            formatCurrency={formatCurrency} 
        />
      </div>
    </div>
  );
}