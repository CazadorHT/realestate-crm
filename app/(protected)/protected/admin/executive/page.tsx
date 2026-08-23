"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw } from "lucide-react";
import { getExecutiveStatsAction } from "@/lib/actions/executive-stats";
import { toast } from "sonner";
import { ExecutiveData } from "./types";
import { useLanguage } from "@/lib/i18n/language-context";

// 🛡️ Elite Modular Components
import { ExecutiveStats } from "./components/ExecutiveStats";
import { ExecutiveBranchList } from "./components/ExecutiveBranchList";

// ⚡ Performance Optimized Dynamic Import
const ExecutiveChartsContainer = dynamic(
  () =>
    import("./components/ExecutiveChartsContainer").then(
      (mod) => mod.ExecutiveChartsContainer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-slate-50/50 animate-pulse rounded-2xl border border-slate-100" />
    ),
  },
);

export default function ExecutiveDashboard() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [data, setData] = useState<ExecutiveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const stats = await getExecutiveStatsAction();
      setData(stats as ExecutiveData[]);
    } catch {
      toast.error(isEn ? "Failed to load executive statistics" : "ไม่สามารถดึงข้อมูลสถิติได้");
    } finally {
      // 🛡️ Deliberate slight delay for smooth transition (UX Polish)
      setTimeout(() => setLoading(false), 300);
    }
  }

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const totalLeads = data.reduce(
    (acc: number, curr: ExecutiveData) => acc + curr.leadCount,
    0,
  );
  const totalDeals = data.reduce(
    (acc: number, curr: ExecutiveData) => acc + curr.dealCount,
    0,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title={isEn ? "Executive Dashboard" : "แผงควบคุมระดับบริหาร (Executive Dashboard)"}
        subtitle={
          isEn
            ? "Real-time enterprise-wide performance across all nationwide branches"
            : "ภาพรวมผลการดำเนินงานแบบ Real-time ของทุกสาขาทั่วประเทศ"
        }
        icon="trendingUp"
        gradient="blue"
        breadcrumbs={[
          { label: isEn ? "Home" : "หน้าแรก", href: "/protected" },
          { label: isEn ? "Analytics" : "ผู้ดูแลระบบ", href: "/protected/admin/analytics" },
          { label: isEn ? "Executive Dashboard" : "แดชบอร์ดผู้บริหาร" },
        ]}
        actionSlot={
          <div className="flex flex-col md:flex-row items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="rounded-xl font-semibold h-11 border-slate-200"
            >
              <RefreshCcw
                className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              {isEn ? "Refresh Data" : "รีเฟรชข้อมูล"}
            </Button>
            <Button
              size="sm"
              className="rounded-xl font-semibold h-11 bg-slate-900 hover:bg-black text-white shadow-lg"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              {isEn ? "Export Report" : "ส่งออกรายงาน"}
            </Button>
          </div>
        }
      />

      {/* 🚀 Layer 1: Executive Summary (Unified Loading) */}
      <ExecutiveStats
        totalLeads={totalLeads}
        totalDeals={totalDeals}
        branchCount={data.length}
        isLoading={loading}
      />

      {/* 📊 Layer 2: Visual Intelligence & AI Briefing */}
      {mounted && (
        <ExecutiveChartsContainer
          data={data}
          totalLeads={totalLeads}
          totalDeals={totalDeals}
          isLoading={loading}
        />
      )}

      {/* 🏛️ Layer 3: Branch Performance Matrix (Adaptive Dual-View) */}
      <ExecutiveBranchList data={data} isLoading={loading} />
    </div>
  );
}

