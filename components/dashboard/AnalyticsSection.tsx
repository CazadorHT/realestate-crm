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

      if (revRes.ok) setRevenueData((await revRes.json()).data);
      if (funnelRes.ok) setFunnelData((await funnelRes.json()).data);
      if (pipeRes.ok) setPipelineData((await pipeRes.json()).data);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Failed to fetch analytics:", error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
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
    if (scope === "company") return "ภาพรวมบริษัท";
    if (scope === "branch") {
      const branch = branches.find(b => b.id === selectedBranchId);
      return branch ? `สาขา: ${branch.name}` : "ทุกสาขา";
    }
    if (scope === "team") {
      const team = teams.find(t => t.id === selectedTeamId);
      return team ? `ทีม: ${team.name}` : "ทุกทีม";
    }
    if (scope === "personal") return "ข้อมูลส่วนตัว";
    return "ภาพรวม";
  };

  const rangeLabels = {
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

  return (
    <div className="space-y-6">
      {/* 🕹️ Unified Analytics Header (Simplified) */}
      <div className="relative z-10 flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            การวิเคราะห์เชิงลึก
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
                แนวโน้มรายได้ ({getDynamicScopeLabel()}) • 
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
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-6">
                <PieChart className="h-4 w-4 text-violet-500" />
                สรุปสถานะลีด ({getDynamicScopeLabel()}) • 
                <p className="text-xs text-blue-600">
                  {rangeLabels[range as keyof typeof rangeLabels]}
                </p>
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
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                ความคืบหน้าโครงการ ({getDynamicScopeLabel()}) • 
                <p className="text-xs text-blue-600">
                  {rangeLabels[range as keyof typeof rangeLabels]}
                </p>
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                ระยะเวลา: {rangeLabels[range as keyof typeof rangeLabels]}
              </p>
              <PipelineSummary data={pipelineData || []} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
