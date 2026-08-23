"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Building2,
  MapPin,
  Users2,
  User,
  ChevronDown,
  Loader2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

// Charts (Assuming they are client components or can be used as such)
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";

import {
  RevenueChartData,
  FunnelData,
  PipelineData,
} from "@/features/dashboard/queries/types";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface AnalyticsSectionProps {
  initialRange?: string;
  initialBranchId?: string;
  initialTeamId?: string;
  initialView?: string;
  role?: string;
  userId?: string;
  multiTenantEnabled?: boolean;
}

type AnalyticsScope = "company" | "branch" | "team" | "personal";

export function AnalyticsSection({
  initialRange = "all",
  initialBranchId,
  initialTeamId,
  initialView,
  role,
  userId,
  multiTenantEnabled = true,
}: AnalyticsSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isEn = language === "en";
  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "OWNER";

  // --- Sync from URL ---
  const range = searchParams.get("range") || initialRange;
  const scope = (searchParams.get("view") as AnalyticsScope) || (initialView as AnalyticsScope) || (isAdmin ? "company" : "personal");
  const selectedBranchId = searchParams.get("branchId") || initialBranchId || "ALL";
  const selectedTeamId = searchParams.get("teamId") || initialTeamId || "ALL";

  const [loading, setLoading] = useState(false);

  // Data States
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  
  // Lists for dropdowns
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [teams, setTeams] = useState<{id: string, name: string}[]>([]);

  const fetchAllStats = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        range,
        view: scope,
        tenantId: selectedBranchId, // Use the reactive value from searchParams
        ...(scope === "personal" && userId ? { agentId: userId } : {}),
        ...(scope === "branch" && selectedBranchId !== "ALL" ? { branchId: selectedBranchId } : {}),
        ...(scope === "team" && selectedTeamId !== "ALL" ? { teamId: selectedTeamId } : {}),
      });

      // 🔄 Fetch all 3 data sets in parallel with signal
      const [revRes, funnelRes, pipeRes] = await Promise.all([
        fetch(`/api/dashboard/revenue?${queryParams}`, { signal }),
        fetch(`/api/dashboard/funnel?${queryParams}`, { signal }),
        fetch(`/api/dashboard/pipeline?${queryParams}`, { signal }),
      ]);

      if (revRes.ok && funnelRes.ok && pipeRes.ok) {
        const [revJson, funnelJson, pipeJson] = await Promise.all([
          revRes.json(),
          funnelRes.json(),
          pipeRes.json(),
        ]);
        setRevenueData(revJson.data || []);
        setFunnelData(funnelJson.data || []);
        setPipelineData(pipeJson.data || []);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to fetch analytics data", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (updates: Record<string, string | null>) => {
    if (typeof window !== "undefined" && window.location.pathname !== "/protected") {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all") params.delete(key);
      else params.set(key, value);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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

  useEffect(() => {
    const controller = new AbortController();
    
    // ⏲️ Debounce requests by 300ms to reduce database pressure
    const timeoutId = setTimeout(() => {
      fetchAllStats(controller.signal);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [range, scope, selectedBranchId, selectedTeamId]);

  useEffect(() => {
    // Fetch filter lists
    if (isAdmin) {
      fetch("/api/dashboard/tenants").then(res => res.json()).then(data => setBranches(data.data || []));
      fetch("/api/dashboard/teams").then(res => res.json()).then(data => setTeams(data.data || []));
    }
  }, [isAdmin]);

  const getDynamicScopeLabel = () => {
    if (scope === "company") return isEn ? "Company Overview" : "ภาพรวมบริษัท";
    if (scope === "branch") {
      const branch = branches.find(b => b.id === selectedBranchId);
      return branch ? `${isEn ? "Branch" : "สาขา"}: ${branch.name}` : (isEn ? "All Branches" : "ทุกสาขา");
    }
    if (scope === "team") {
      const team = teams.find(t => t.id === selectedTeamId);
      return team ? `${isEn ? "Team" : "ทีม"}: ${team.name}` : (isEn ? "All Teams" : "ทุกทีม");
    }
    if (scope === "personal") return isEn ? "Personal Performance" : "ข้อมูลส่วนตัว";
    return isEn ? "Overview" : "ภาพรวม";
  };

  const rangeLabels = {
    today: isEn ? "Today" : "วันนี้",
    week: isEn ? "This Week" : "สัปดาห์นี้",
    month: isEn ? "This Month" : "เดือนนี้",
    "6months": isEn ? "Last 6 Months" : "6 เดือนล่าสุด",
    q1: isEn ? "Quarter 1 (Q1)" : "ไตรมาส 1 (Q1)",
    q2: isEn ? "Quarter 2 (Q2)" : "ไตรมาส 2 (Q2)",
    q3: isEn ? "Quarter 3 (Q3)" : "ไตรมาส 3 (Q3)",
    q4: isEn ? "Quarter 4 (Q4)" : "ไตรมาส 4 (Q4)",
    year: isEn ? "This Year" : "ปีนี้",
    lastYear: isEn ? "Last Year" : "ปีที่แล้ว",
    year2024: isEn ? "Year 2024" : "ปี 2024",
    year2023: isEn ? "Year 2023" : "ปี 2023",
    year2022: isEn ? "Year 2022" : "ปี 2022",
    all: isEn ? "All Time" : "ทั้งหมด",
  };

  return (
    <div className="space-y-6">
      {/* 🕹️ Unified Analytics Header (Simplified) */}
      <div className="relative z-10 flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isEn ? "Executive Deep Analytics" : "การวิเคราะห์เชิงลึก"}
          </h2>
          <p className="text-xs text-slate-500">
            {getDynamicScopeLabel()} • {rangeLabels[range as keyof typeof rangeLabels]}
          </p>
        </div>
      </div>

      {/* 📊 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart (Full Width) */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm rounded-4xl overflow-hidden relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                {isEn ? "Revenue Trajectory" : "แนวโน้มรายได้"} ({getDynamicScopeLabel()}) • 
                <p className="text-xs text-blue-600">
                  {rangeLabels[range as keyof typeof rangeLabels]}
                </p>
                </h3>
            </div>
            <RevenueChart data={revenueData} />
          </div>
        </Card>

        {/* Funnel & Pipeline Row (Side-by-side) */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <Card className="border-slate-200 shadow-sm rounded-4xl overflow-hidden relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            )}
            <div className="p-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-6 min-w-0">
                <PieChart className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="truncate" title={`${isEn ? "Lead Funnel Status" : "สรุปสถานะลีด"} (${getDynamicScopeLabel()})`}>
                  {isEn ? "Lead Funnel Status" : "สรุปสถานะลีด"} ({getDynamicScopeLabel()})
                </span>
                <span className="text-slate-400 shrink-0">•</span>
                <span className="text-xs font-semibold text-blue-600 whitespace-nowrap shrink-0">
                  {rangeLabels[range as keyof typeof rangeLabels]}
                </span>
              </h3>
              <FunnelChart data={funnelData} />
            </div>
          </Card>

          {/* Pipeline Summary */}
          <Card className="border-slate-200 shadow-sm rounded-4xl overflow-hidden relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            )}
            <div className="p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 min-w-0">
                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="truncate" title={`${isEn ? "Pipeline Deals Progress" : "ความคืบหน้าโครงการ"} (${getDynamicScopeLabel()})`}>
                  {isEn ? "Pipeline Deals Progress" : "ความคืบหน้าโครงการ"} ({getDynamicScopeLabel()})
                </span>
                <span className="text-slate-400 shrink-0">•</span>
                <span className="text-xs font-semibold text-blue-600 whitespace-nowrap shrink-0">
                  {rangeLabels[range as keyof typeof rangeLabels]}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                {isEn ? "Timeframe:" : "ระยะเวลา:"} {rangeLabels[range as keyof typeof rangeLabels]}
              </p>
              <PipelineSummary data={pipelineData || []} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
