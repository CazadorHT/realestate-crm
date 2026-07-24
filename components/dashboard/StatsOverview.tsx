"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRightLeft,
  ChevronRight,
  Filter,
  Check,
  Building2,
  Users2,
  User,
  Loader2,
} from "lucide-react";
import type { DashboardStats } from "@/features/dashboard/queries/types";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatsOverviewProps {
  initialStats: DashboardStats;
  userId?: string;
  role?: string;
  multiTenantEnabled?: boolean;
  initialRange?: string;
  initialView?: string;
  initialBranchId?: string;
  initialTeamId?: string;
}

const timeRangeLabels: Record<string, string> = {
  today: "วันนี้",
  week: "สัปดาห์นี้",
  month: "เดือนนี้",
  "6months": "6 เดือนล่าสุด",
  q1: "ไตรมาส 1 (Q1)",
  q2: "ไตรมาส 2 (Q2)",
  q3: "ไตรมาส 3 (Q3)",
  q4: "ไตรมาส 4 (Q4)",
  year: "ปีนี้",
  lastYear: "ปีที่แล้ว",
  year2024: "ปี 2024",
  year2023: "ปี 2023",
  year2022: "ปี 2022",
  all: "ทั้งหมด",
};

interface MetadataItem {
  id: string;
  name: string;
}

export function StatsOverview({ 
  initialStats, 
  userId, 
  role,
  multiTenantEnabled = true,
  initialRange = "all",
  initialView = "company",
  initialBranchId = "all",
  initialTeamId = "all"
}: StatsOverviewProps) {
  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "OWNER";
  const searchParams = useSearchParams();
  
  // --- States ---
  const [context, setContext] = useState(initialView);
  const [timeRange, setTimeRange] = useState(initialRange);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);

  // Compare States (Now read from URL)
  const isCompareMode = searchParams.get("compare") === "true";
  const compareId = searchParams.get("compareId") || "ALL";
  const [compareStats, setCompareStats] = useState<DashboardStats | null>(null);

  // Metadata for Warnings
  const [branches, setBranches] = useState<MetadataItem[]>([]);
  const [teams, setTeams] = useState<MetadataItem[]>([]);
  const [agents, setAgents] = useState<MetadataItem[]>([]);

  // --- Initial Metadata Fetch (For Warnings) ---
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/dashboard/tenants").then(res => res.json()).then(data => setBranches(data.data || []));
    fetch("/api/dashboard/teams").then(res => res.json()).then(data => setTeams(data.data || []));
    fetch("/api/dashboard/agents").then(res => res.json()).then(data => setAgents(data.data || []));
  }, [isAdmin]);

  // --- Global Loading Listener ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleUpdating = () => {
      setLoading(true);
      clearTimeout(timer);
      timer = setTimeout(() => setLoading(false), 1200);
    };
    const handleUpdated = () => {
      setLoading(false);
      clearTimeout(timer);
    };
    window.addEventListener("dashboard:updating", handleUpdating);
    window.addEventListener("dashboard:updated", handleUpdated);
    return () => {
      window.removeEventListener("dashboard:updating", handleUpdating);
      window.removeEventListener("dashboard:updated", handleUpdated);
      clearTimeout(timer);
    };
  }, []);

  // --- Sync stats with props (Global Filter) ---
  useEffect(() => {
    setContext(initialView);
    setTimeRange(initialRange);
    setStats(initialStats);
    setLoading(false); // ✅ Stop loading once new props arrive
  }, [initialView, initialRange, initialStats]);

  // --- Comparison Fetch ---
  useEffect(() => {
    if (!isCompareMode) {
      setCompareStats(null);
      return;
    }

    const fetchCompareStats = async () => {
      try {
        let params = `?range=${timeRange}`;
        const targetId = compareId === "ALL" ? "all" : compareId;
        
        if (context === "branch") params += `&view=branch&targetId=${targetId}`;
        else if (context === "team") params += `&view=team&targetId=${targetId}`;
        else if (context === "staff" || context === "personal") params += `&view=personal&agentId=${targetId === "all" ? userId : targetId}`;
        else params += `&view=company`; // Compare company with all (average)

        const res = await fetch(`/api/dashboard/stats${params}`);
        if (res.ok) {
          const result = await res.json();
          setCompareStats(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch compare stats", err);
      }
    };

    fetchCompareStats();
  }, [isCompareMode, compareId, context, timeRange, userId]);

  const getContextLabel = () => {
    if (context === "personal") return "ส่วนตัว";
    
    if (context === "staff") {
      // searchParams agentId might be what's active
      const activeAgentId = searchParams.get("agentId") || "all";
      if (activeAgentId === "all") return "พนักงานทั้งหมด";
      const agent = agents.find(a => a.id === activeAgentId);
      return agent ? `พนักงาน: ${agent.name}` : "พนักงาน";
    }
    
    if (context === "team") {
      if (initialTeamId === "all") return "ทุกทีม";
      const team = teams.find(t => t.id === initialTeamId);
      return team ? `ทีม: ${team.name}` : "รายทีม";
    }
    
    if (context === "branch") {
      if (initialBranchId === "all") return "ทุกสาขา";
      const branch = branches.find(b => b.id === initialBranchId);
      return branch ? `สาขา: ${branch.name}` : "รายสาขา";
    }
    
    return "ภาพรวมบริษัท";
  };

  const getTitleSuffix = () => ` (${timeRangeLabels[timeRange] || "เดือนนี้"})`;

  const renderValue = (val: number, compVal: number | undefined, isCurrency = false) => {
    const displayVal = isCurrency ? `฿${val.toLocaleString()}` : val.toLocaleString();
    
    if (!isCompareMode || compVal === undefined) {
      return <h3 className="text-3xl font-medium tracking-tight text-slate-900">{displayVal}</h3>;
    }

    const diff = val - compVal;
    const diffColor = diff >= 0 ? "text-emerald-800 bg-emerald-100" : "text-rose-800 bg-rose-100";
    const diffText = `${diff >= 0 ? "+" : ""}${isCurrency ? `฿${Math.abs(diff).toLocaleString()}` : Math.abs(diff).toLocaleString()}`;

    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-3xl font-medium tracking-tight text-slate-900">{displayVal}</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-lg w-fit text-[11px] font-bold cursor-help", diffColor)}>
              {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {diffText} <span className="opacity-60 font-medium ml-1">เทียบเป้า</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-900 text-white border-slate-800">
            <p className="font-bold">เปรียบเทียบผลงาน</p>
            <p className="text-[10px] opacity-70">เทียบกับ {compareId === "ALL" ? "ค่าเฉลี่ยบริษัท" : "คู่เทียบที่เลือก"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  };

  const statItems = [
    {
      title: `รายได้${getContextLabel()}${getTitleSuffix()}`,
      value: stats.revenueThisMonth,
      compareValue: compareStats?.revenueThisMonth,
      change: stats.revenueChange,
      context: "ยอดขาย + เช่า (สุทธิ)",
      icon: DollarSign,
      isCurrency: true,
      color: "blue",
    },
    {
      title: `ลีดใหม่${getContextLabel()}${getTitleSuffix()}`,
      value: stats.leadsThisMonth,
      compareValue: compareStats?.leadsThisMonth,
      change: stats.leadsChange,
      context: `รวมสะสม ${stats.leadsTotal} ราย`,
      icon: Briefcase,
      color: "indigo",
    },
    {
      title: `คอมมิชชั่นรวม${getTitleSuffix()}`,
      value: stats.totalCommission,
      compareValue: compareStats?.totalCommission,
      change: stats.revenueChange,
      context: "ค่าคอมฯ ทุกดีลในองค์กร (ก่อนหัก)",
      icon: DollarSign,
      isCurrency: true,
      color: "amber",
    },
    {
      title: `ปิดการขาย${getTitleSuffix()}`,
      value: stats.dealsWon,
      compareValue: compareStats?.dealsWon,
      change: stats.dealsWonChange,
      context: `เป้าหมาย: ${stats.dealsTarget}`,
      icon: CheckCircle2,
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-6 bg-linear-to-br from-blue-50/50 via-white to-indigo-50/50 p-4 sm:p-6 lg:p-8 rounded-3xl border border-indigo-100/50 shadow-sm relative overflow-hidden">
      {/* 🔄 Global Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center transition-all duration-300">
          <div className="bg-white/90 p-4 rounded-2xl shadow-xl border border-indigo-50 flex items-center gap-3 animate-in zoom-in-95 duration-200">
             <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
             <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">กำลังอัปเดตสถิติ...</span>
          </div>
        </div>
      )}

      {/* 🌟 Premium Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/20 blur-3xl rounded-full -ml-32 -mb-32 pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* 🛡️ EXECUTIVE WARNINGS */}
      {isAdmin && (
        <div className="space-y-3 relative z-10">
          {context === "team" && teams.length === 0 && (
            <Alert className="rounded-2xl border-amber-200 bg-amber-50/80 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-sm font-bold text-amber-800">ยังไม่ได้สร้างทีม</AlertTitle>
              <AlertDescription className="text-xs text-amber-700">กรุณาไปที่หน้าตั้งค่าเพื่อสร้างทีมและมอบหมายพนักงาน</AlertDescription>
            </Alert>
          )}
          {context === "branch" && branches.length === 0 && (
            <Alert className="rounded-2xl border-amber-200 bg-amber-50/80 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-sm font-bold text-amber-800">ยังไม่ได้เพิ่มสาขา</AlertTitle>
              <AlertDescription className="text-xs text-amber-700">คุณมีเพียงสาขาเดียวในขณะนี้ ไม่สามารถดูข้อมูลเปรียบเทียบระหว่างสาขาได้</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* 🚫 NO DATA STATE */}
      {!loading && stats.revenueThisMonth === 0 && stats.leadsThisMonth === 0 && stats.dealsWon === 0 && (
        <Alert className="rounded-2xl border-blue-200 bg-blue-50/80 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2 relative z-10 mb-4">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-sm font-bold text-blue-800">ยังไม่มีข้อมูลสถิติในช่วงเวลานี้</AlertTitle>
          <AlertDescription className="text-xs text-blue-700">ระบบตรวจสอบพบว่ายังไม่มีธุรกรรม ยอดขาย หรือลีดใหม่เกิดขึ้นในช่วงเวลาหรือตัวกรองที่คุณเลือก</AlertDescription>
        </Alert>
      )}


      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {statItems.map((item, index) => (
          <Card 
            key={index} 
            className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-500 rounded-3xl bg-white/80 backdrop-blur-sm"
          >
            {/* Animated Line Decoration */}
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-all duration-500",
              item.color === "blue" ? "bg-blue-500" :
              item.color === "indigo" ? "bg-indigo-500" :
              item.color === "amber" ? "bg-amber-500" :
              "bg-emerald-500"
            )} />

            <CardContent className="p-6">
              {/* Visual Accent Bar - Expanding on Hover */}
              <div className={cn(
                "absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:w-full rounded-full",
                item.color === "blue" ? "bg-blue-500" :
                item.color === "indigo" ? "bg-indigo-500" :
                item.color === "amber" ? "bg-amber-500" :
                "bg-emerald-500",
                "w-10 ml-0 mb-0"
              )} />

              {/* Icon & Trend */}
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                  item.color === "blue" ? "bg-blue-50 text-blue-600" :
                  item.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                  item.color === "amber" ? "bg-amber-50 text-amber-600" :
                  "bg-emerald-50 text-emerald-600"
                )}>
                  <item.icon size={24} />
                </div>
                
                {item.change && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs cursor-help",
                        item.change.startsWith("+") 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      )}>
                        {item.change.startsWith("+") ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {item.change}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 text-white border-slate-800">
                      <p className="font-bold">Trend Analysis</p>
                      <p className="text-[10px] opacity-70">เทียบกับช่วงเวลาเดียวกันในรอบก่อนหน้า</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Value & Title */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.title}</p>
                {renderValue(item.value, item.compareValue, item.isCurrency)}
                <p className="text-[11px] font-medium text-slate-500 mt-2">{item.context}</p>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}