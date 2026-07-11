"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import {
  Calendar,
  Building2,
  MapPin,
  Users2,
  User,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "../ui/responsive-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardFiltersProps {
  role?: string;
  multiTenantEnabled?: boolean;
}

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

export function DashboardFilters({
  role,
  multiTenantEnabled = true,
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "OWNER";

  // Dialog states
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUpdating, setIsUpdating] = useState(false);

  // --- Sync from URL ---
  const range = searchParams.get("range") || "all";
  const view = searchParams.get("view") || (isAdmin ? "company" : "personal");
  const branchId = searchParams.get("branchId") || "ALL";
  const teamId = searchParams.get("teamId") || "ALL";
  const agentId = searchParams.get("agentId") || "ALL";
  const isCompareMode = searchParams.get("compare") === "true";
  const compareId = searchParams.get("compareId") || "ALL";

  // Lists for dropdowns
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [pendingFilters, setPendingFilters] = useState<Record<string, string | null>>({});

  // --- Filter Debouncing (Phase 4) ---
  useEffect(() => {
    if (Object.keys(pendingFilters).length === 0) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(pendingFilters).forEach(([key, value]) => {
        const isDefaultAll = (value === null || value === "ALL" || value === "all") && key !== "range";
        if (isDefaultAll) params.delete(key);
        else if (value !== null) params.set(key, value);
      });
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        setPendingFilters({}); // Clear pending after push
        setIsUpdating(false);
        setTimeout(() => window.dispatchEvent(new CustomEvent("dashboard:updated")), 50);
      });
    }, 150); // Reduced from 400ms to 150ms for snappier feel

    return () => clearTimeout(timer);
  }, [pendingFilters, router, pathname, searchParams]);

  useEffect(() => {
    if (!isPending && !isUpdating) {
      window.dispatchEvent(new CustomEvent("dashboard:updated"));
    }
  }, [isPending, isUpdating]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/dashboard/tenants")
        .then((res) => res.json())
        .then((data) => setBranches(data.data || []));
      fetch("/api/dashboard/teams")
        .then((res) => res.json())
        .then((data) => setTeams(data.data || []));
      fetch("/api/dashboard/agents")
        .then((res) => res.json())
        .then((data) => setAgents(data.data || []));
    }
  }, [isAdmin]);

  function updateFilter(updates: Record<string, string | null>) {
    setIsUpdating(true);
    // 📢 Dispatch global event so other components can spin immediately
    window.dispatchEvent(new CustomEvent("dashboard:updating"));
    
    setPendingFilters(prev => ({ ...prev, ...updates }));
    setIsRangeOpen(false);
    setIsSelectorOpen(false);
  }

  // --- Smart Persistence (Phase 3) ---
  useEffect(() => {
    // 1. Restore from localStorage on mount if no URL params
    const hasParams =
      searchParams.has("range") ||
      searchParams.has("view") ||
      searchParams.has("branchId") ||
      searchParams.has("teamId");

    if (!hasParams) {
      const saved = localStorage.getItem("dashboard_preferences");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Small delay to ensure router is ready
          setTimeout(() => updateFilter(parsed), 100);
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    // 2. Save current state to localStorage
    const prefs = {
      range,
      view,
      branchId,
      teamId,
      agentId,
      compare: isCompareMode ? "true" : "false",
      compareId,
    };
    localStorage.setItem("dashboard_preferences", JSON.stringify(prefs));
  }, [range, view, branchId, teamId, agentId, isCompareMode, compareId]);

  return (
    <div className="relative z-20 flex flex-col gap-4 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm w-full transition-all duration-300">
      {/* 🟢 TOP ROW: Global Context Switcher & Range Picker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Context Switcher (Pill/Segmented UI) */}
        <div className={cn(
          "flex items-center p-1.5 bg-slate-100/80 rounded-2xl w-fit overflow-x-auto no-scrollbar transition-opacity",
          (isPending || isUpdating) && "opacity-60 pointer-events-none"
        )}>
          {isAdmin ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateFilter({
                        view: "company",
                        branchId: "ALL",
                        teamId: "ALL",
                        agentId: "ALL",
                      })
                    }
                    disabled={isPending || isUpdating}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                      view === "company"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:text-blue-600",
                    )}
                  >
                    <Building2 size={14} /> บริษัท
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  <p className="font-bold">มุมมองบริษัท</p>
                  <p className="text-[10px] opacity-70">
                    ดูภาพรวมยอดขายและสถิติทั้งองค์กร
                  </p>
                </TooltipContent>
              </Tooltip>

              {multiTenantEnabled && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          updateFilter({
                            view: "branch",
                            branchId: "ALL",
                            teamId: "ALL",
                            agentId: "ALL",
                          })
                        }
                        disabled={isPending || isUpdating}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                          view === "branch"
                            ? "bg-white text-blue-500 shadow-sm"
                            : "text-slate-500 hover:text-blue-600",
                        )}
                      >
                        <MapPin size={14} /> สาขา
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-slate-900 text-white border-slate-800"
                    >
                      <p className="font-bold">มุมมองสาขา</p>
                      <p className="text-[10px] opacity-70">
                        เจาะลึกข้อมูลแยกตามสาขาต่างๆ
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          updateFilter({
                            view: "team",
                            branchId: "ALL",
                            teamId: "ALL",
                            agentId: "ALL",
                          })
                        }
                        disabled={isPending || isUpdating}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                          view === "team"
                            ? "bg-white text-blue-500 shadow-sm"
                            : "text-slate-500 hover:text-blue-600",
                        )}
                      >
                        <Users2 size={14} /> ทีม
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-slate-900 text-white border-slate-800"
                    >
                      <p className="font-bold">มุมมองทีม</p>
                      <p className="text-[10px] opacity-70">
                        วิเคราะห์ผลงานแยกตามทีมขาย
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateFilter({
                        view: "staff",
                        branchId: "ALL",
                        teamId: "ALL",
                        agentId: "ALL",
                      })
                    }
                    disabled={isPending || isUpdating}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                      view === "staff"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:text-blue-600",
                    )}
                  >
                    <User size={14} /> พนักงาน
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  <p className="font-bold">มุมมองพนักงาน</p>
                  <p className="text-[10px] opacity-70">
                    ติดตามผลงานรายบุคคลของ Agent ทุกคน
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateFilter({
                        view: "personal",
                        branchId: "ALL",
                        teamId: "ALL",
                        agentId: "ALL",
                      })
                    }
                    disabled={isPending || isUpdating}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                      view === "personal"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:text-blue-600",
                    )}
                  >
                    <User size={14} /> ส่วนตัว
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  <p className="font-bold">ผลงานส่วนตัว</p>
                  <p className="text-[10px] opacity-70">
                    สรุปข้อมูลเฉพาะของคุณเอง
                  </p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateFilter({
                        view: "company",
                        branchId: "ALL",
                        teamId: "ALL",
                        agentId: "ALL",
                      })
                    }
                    disabled={isPending || isUpdating}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                      view === "company"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:text-blue-600",
                    )}
                  >
                    <Building2 size={14} /> บริษัท
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  <p className="font-bold">มุมมองบริษัท</p>
                  <p className="text-[10px] opacity-70">
                    ดูภาพรวมแยกตามสาขาที่คุณเป็นสมาชิก
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      updateFilter({
                        view: "personal",
                        branchId: "ALL",
                        teamId: "ALL",
                        agentId: "ALL",
                      })
                    }
                    disabled={isPending || isUpdating}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                      view === "personal"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:text-blue-600",
                    )}
                  >
                    <User size={14} /> ส่วนตัว
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  <p className="font-bold">ผลงานส่วนตัว</p>
                  <p className="text-[10px] opacity-70">
                    สรุปข้อมูลเฉพาะของคุณเอง
                  </p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* 🔵 Range Picker (Rich Dialog) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            ช่วงเวลา:{" "}
            <span className="font-semibold text-blue-600 underline decoration-slate-300 underline-offset-4">
              {rangeLabels[range as keyof typeof rangeLabels] || "เดือนนี้"}
            </span>
          </div>
          <ResponsiveDialog
            open={isRangeOpen}
            onOpenChange={setIsRangeOpen}
            className="sm:max-w-2xl!"
            title="เลือกช่วงเวลา"
            description="เลือกช่วงเวลาที่คุณต้องการดูข้อมูลทั้งหน้า Dashboard"
            trigger={
              <Button
                variant="secondary"
                size="sm"
                disabled={isPending || isUpdating}
                className={cn(
                  "h-9 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors",
                  (isPending || isUpdating) && "opacity-70"
                )}
              >
                {isPending || isUpdating ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Calendar size={14} className="mr-2" />
                )}
                เลือกช่วงเวลา
              </Button>
            }
          >
            <div className="p-4 space-y-6">
              {/* 📍 Standard Ranges */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  ช่วงเวลายอดนิยม
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {["today", "week", "month", "6months", "all"].map((key) => (
                    <Button
                      key={key}
                      variant={range === key ? "default" : "ghost"}
                      onClick={() => updateFilter({ range: key })}
                      className={cn(
                        "justify-between h-10 rounded-xl text-xs font-semibold transition-all",
                        range === key
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                          : "hover:bg-blue-50 text-slate-600 hover:text-blue-600",
                      )}
                    >
                      {rangeLabels[key as keyof typeof rangeLabels]}
                      {range === key && <Check className="h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 📅 Quarters */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest ml-1">
                  รายไตรมาส
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["q1", "q2", "q3", "q4"].map((key) => (
                    <Button
                      key={key}
                      variant={range === key ? "default" : "ghost"}
                      onClick={() => updateFilter({ range: key })}
                      className={cn(
                        "flex flex-col items-center justify-center h-14 rounded-xl text-xs font-semibold transition-all gap-0.5",
                        range === key
                          ? "bg-amber-500 text-white shadow-md shadow-amber-100"
                          : "hover:bg-amber-50 text-slate-600 hover:text-amber-600",
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {rangeLabels[key as keyof typeof rangeLabels]}
                        {range === key && <Check className="h-3 w-3" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium opacity-70",
                        range === key ? "text-white" : "text-slate-400"
                      )}>
                        {key === "q1" ? "(ม.ค. - มี.ค.)" : 
                         key === "q2" ? "(เม.ย. - มิ.ย.)" : 
                         key === "q3" ? "(ก.ค. - ก.ย.)" : 
                         "(ต.ค. - ธ.ค.)"}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 🗓️ Yearly & History */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest ml-1">
                  รายปีและย้อนหลัง
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {["year", "lastYear", "year2024", "year2023", "year2022"].map(
                    (key) => (
                      <Button
                        key={key}
                        variant={range === key ? "default" : "ghost"}
                        onClick={() => updateFilter({ range: key })}
                        className={cn(
                          "justify-between h-10 rounded-xl text-xs font-semibold transition-all",
                          range === key
                            ? "bg-violet-600 text-white shadow-md shadow-violet-100"
                            : "hover:bg-violet-50 text-slate-600 hover:text-violet-600",
                        )}
                      >
                        {rangeLabels[key as keyof typeof rangeLabels]}
                        {range === key && <Check className="h-3 w-3" />}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </ResponsiveDialog>
        </div>
      </div>

      {/* 📍 DRILL-DOWN: Branch / Team / Agent Selector */}
      {isAdmin &&
        (view === "branch" || view === "team" || view === "staff") && (
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-slate-400">
              <Filter size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                เจาะลึกข้อมูล:
              </span>
            </div>

            <ResponsiveDialog
              open={isSelectorOpen}
              onOpenChange={setIsSelectorOpen}
              className="sm:max-w-sm!"
              title={
                view === "branch"
                  ? "เลือกสาขา"
                  : view === "team"
                    ? "เลือกทีม"
                    : "เลือกพนักงาน"
              }
              description={`เลือก${view === "branch" ? "สาขา" : view === "team" ? "ทีม" : "พนักงาน"}ที่คุณต้องการดูข้อมูล`}
              trigger={
                <Button
                  variant="outline"
                  disabled={isPending || isUpdating}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold hover:bg-slate-100 text-blue-500!"
                >
                  {isPending || isUpdating ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    view === "branch"
                      ? branchId === "ALL"
                        ? "ทุกสาขา"
                        : branches.find((b) => b.id === branchId)?.name ||
                          "เลือกสาขา"
                      : view === "team"
                        ? teamId === "ALL"
                          ? "ทุกทีม"
                          : teams.find((t) => t.id === teamId)?.name || "เลือกทีม"
                        : agentId === "ALL"
                          ? "พนักงานทุกคน"
                          : agents.find((a) => a.id === agentId)?.name ||
                            "เลือกพนักงาน"
                  )}
                  <ChevronRight size={14} className="ml-2 opacity-50" />
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-2 p-4">
                <Button
                  variant={
                    (view === "branch"
                      ? branchId
                      : view === "team"
                        ? teamId
                        : agentId) === "ALL"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => {
                    if (view === "branch") updateFilter({ branchId: "ALL" });
                    else if (view === "team") updateFilter({ teamId: "ALL" });
                    else updateFilter({ agentId: "ALL" });
                  }}
                  className="justify-start h-12 rounded-xl text-sm font-semibold"
                >
                  ✨ ทั้งหมด (ภาพรวม)
                </Button>
                {(view === "branch"
                  ? branches
                  : view === "team"
                    ? teams
                    : agents
                ).map((item) => (
                  <Button
                    key={item.id}
                    variant={
                      (view === "branch"
                        ? branchId
                        : view === "team"
                          ? teamId
                          : agentId) === item.id
                        ? "default"
                        : "ghost"
                    }
                    onClick={() =>
                      updateFilter(
                        view === "branch"
                          ? { branchId: item.id }
                          : view === "team"
                            ? { teamId: item.id }
                            : { agentId: item.id },
                      )
                    }
                    className="justify-start h-12 rounded-xl text-sm font-semibold"
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </ResponsiveDialog>

            {/* 🔄 COMPARE MODE (Moved here for better UX) */}
            {(branches.length > 1 || teams.length > 1) && (
              <div className="flex items-center gap-2 ml-auto pl-4 border-l border-slate-100 group">
                <div className="flex-col items-end mr-2 text-right hidden sm:flex">
                  <span className="text-[10px] font-bold text-slate-900 leading-tight">
                    โหมดเปรียบเทียบ
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    วิเคราะห์ผลงานเทียบเป้า
                  </span>
                </div>

                {isCompareMode && (
                  <ResponsiveDialog
                    open={false} // Managed by button click if needed or simplify
                    onOpenChange={() => {}}
                    title="เลือกคู่เทียบ"
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSelectorOpen(true)} // Re-use selector for now or make new
                        className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-bold text-blue-500 shadow-sm"
                      >
                        เทียบกับ:{" "}
                        {compareId === "ALL"
                          ? "ค่าเฉลี่ย"
                          : branches.find((b) => b.id === compareId)?.name ||
                            teams.find((t) => t.id === compareId)?.name ||
                            "เลือก"}
                      </Button>
                    }
                  >
                    {/* Selector content similar to drill-down */}
                    <div className="p-4 grid grid-cols-1 gap-2">
                      <Button
                        variant={compareId === "ALL" ? "default" : "ghost"}
                        onClick={() => updateFilter({ compareId: "ALL" })}
                        className="justify-start h-12 rounded-xl text-sm font-semibold"
                      >
                        ✨ ค่าเฉลี่ยบริษัท
                      </Button>
                      {(view === "branch" ? branches : teams).map((item) => (
                        <Button
                          key={item.id}
                          variant={compareId === item.id ? "default" : "ghost"}
                          onClick={() => updateFilter({ compareId: item.id })}
                          className="justify-start h-12 rounded-xl text-sm font-semibold"
                        >
                          {item.name}
                        </Button>
                      ))}
                    </div>
                  </ResponsiveDialog>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateFilter({
                          compare: isCompareMode ? "false" : "true",
                        })
                      }
                      className={cn(
                        "h-8 px-3 rounded-xl text-[10px] font-bold transition-all duration-300",
                        isCompareMode
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                      )}
                    >
                      <ArrowRightLeft
                        size={12}
                        className={cn(
                          "mr-1.5",
                          isCompareMode && "animate-pulse",
                        )}
                      />
                      {isCompareMode ? "ปิดโหมดเทียบ" : "เปิดโหมดเทียบ"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="bg-slate-900 text-white border-slate-800"
                  >
                    <p className="font-bold">Benchmarking</p>
                    <p className="text-[10px] opacity-70">
                      วิเคราะห์ผลงานเทียบกับเป้าหมายหรือสาขาอื่น
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
