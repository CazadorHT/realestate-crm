"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TopAgent } from "@/features/dashboard/queries";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Building2, Users, Loader2, Filter, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { getFilterOptionsAction } from "@/features/dashboard/queries/filter-options";
import { getTopAgentsAction } from "@/features/dashboard/queries/performance";
import { Button } from "@/components/ui/button";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { Trophy } from "lucide-react";

interface TopAgentsProps {
  data: TopAgent[];
  role?: string;
  multiTenantEnabled?: boolean;
  range?: string;
}

export function TopAgents({ data: initialData, role, multiTenantEnabled, range: initialRange }: TopAgentsProps) {
  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopAgent[]>(initialData);

  // Filters State
  const [filters, setFilters] = useState({
    branchId: "ALL",
    teamId: "ALL",
    range: initialRange || "month",
  });

  const [options, setOptions] = useState<{
    branches: { id: string; name: string }[];
    teams: { id: string; name: string; tenant_id: string | null }[];
  }>({
    branches: [],
    teams: [],
  });

  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  // 1. Fetch Filter Options
  useEffect(() => {
    if (role === "AGENT") return;
    const fetchOptions = async () => {
      const res = await getFilterOptionsAction();
      setOptions({
        branches: res.branches,
        teams: res.teams,
      });
    };
    fetchOptions();
  }, [role]);

  // Sync range from props
  useEffect(() => {
    if (initialRange) {
      setFilters(prev => ({ ...prev, range: initialRange }));
    }
  }, [initialRange]);

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

  // 2. Fetch Top Agents when filters change
  useEffect(() => {
    if (role === "AGENT") return;
    
    // Skip first render only if we have data or if it's already fetching
    const isFirstRender = filters.branchId === "ALL" && filters.teamId === "ALL" && filters.range === initialRange && data === initialData && initialData.length > 0;
    if (isFirstRender) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getTopAgentsAction({ 
          tenantId: filters.branchId, 
          teamId: filters.teamId,
          range: filters.range
        });
        setData(res);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters.branchId, filters.teamId, filters.range, role]);

  // 🛡️ RBAC: Agents are not allowed to see this performance board
  if (role === "AGENT") return null;

  const currentBranch = options.branches.find((b) => b.id === filters.branchId);
  const currentTeam = options.teams.find((t) => t.id === filters.teamId);

  return (
    <Card className="h-full shadow-lg border-none bg-white overflow-hidden relative group">
      {/* Subtle decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-400/10 transition-colors duration-500" />

      {loading && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Loading Top 5...</span>
          </div>
        </div>
      )}

      <CardHeader className="pb-3 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="text-xl">🏆</span> ตัวแทนยอดเยี่ยม
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">
                จัดอันดับตามค่าคอมมิชชั่น • {
                  {
                    today: "วันนี้",
                    week: "สัปดาห์นี้",
                    month: "เดือนนี้",
                    "6months": "6 เดือนล่าสุด",
                    q1: "ไตรมาส 1",
                    q2: "ไตรมาส 2",
                    q3: "ไตรมาส 3",
                    q4: "ไตรมาส 4",
                    year: "ปีนี้",
                    all: "ทั้งหมด"
                  }[initialRange as string] || initialRange
                }
              </p>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Top 5
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {multiTenantEnabled && (
              <ResponsiveDialog
                open={branchDialogOpen}
                onOpenChange={setBranchDialogOpen}
                className="sm:max-w-sm!"
                title="เลือกสาขา"
                description="กรองข้อมูลตามสาขาที่ต้องการ"
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 rounded-full text-[10px] font-bold transition-all duration-200 active:scale-95",
                      filters.branchId !== "ALL"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "text-slate-500 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <Building2 className="h-3 w-3 mr-1.5" />
                    {currentBranch?.name || "ทุกสาขา"}
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                }
              >
                <div className="p-4">
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          branchId: "ALL",
                          teamId: "ALL",
                        }));
                        setBranchDialogOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                        filters.branchId === "ALL"
                          ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <span>ทุกสาขา</span>
                      {filters.branchId === "ALL" && <Check className="h-4 w-4" />}
                    </button>
                    {options.branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            branchId: b.id,
                            teamId: "ALL",
                          }));
                          setBranchDialogOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                          filters.branchId === b.id
                            ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        )}
                      >
                        <span className="truncate pr-4">{b.name}</span>
                        {filters.branchId === b.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </ResponsiveDialog>
            )}

            <ResponsiveDialog
              open={teamDialogOpen}
              onOpenChange={setTeamDialogOpen}
              className="sm:max-w-sm!"
              title="เลือกทีม"
              description="กรองข้อมูลตามทีมที่ต้องการ"
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 rounded-full text-[10px] font-bold transition-all duration-200 active:scale-95",
                    filters.teamId !== "ALL"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                      : "text-slate-500 border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <Users className="h-3 w-3 mr-1.5" />
                  {currentTeam?.name || "ทุกทีม"}
                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                </Button>
              }
            >
              <div className="p-4">
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, teamId: "ALL" }));
                      setTeamDialogOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                      filters.teamId === "ALL"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <span>ทุกทีม</span>
                    {filters.teamId === "ALL" && <Check className="h-4 w-4" />}
                  </button>
                  {options.teams
                    .filter(
                      (t) =>
                        filters.branchId === "ALL" ||
                        t.tenant_id === filters.branchId,
                    )
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, teamId: t.id }));
                          setTeamDialogOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                          filters.teamId === t.id
                            ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        )}
                      >
                        <span className="truncate pr-4">{t.name}</span>
                        {filters.teamId === t.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </ResponsiveDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-6 relative z-10">
        <div className="space-y-4">
          {data.map((agent, index) => (
            <div
              key={agent.id}
              onClick={() => {
                setNavigatingId(agent.id);
                router.push(`/protected/settings/users/${agent.id}`);
              }}
              className="flex items-center justify-between group/item p-2 -mx-1 sm:-mx-2 rounded-xl hover:bg-slate-50 transition-colors gap-2 cursor-pointer relative"
            >
              {navigatingId === agent.id && (
                <div className="absolute -left-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black text-xs shadow-sm
                  ${
                    index === 0
                      ? "bg-linear-to-br from-yellow-300 to-yellow-500 text-white ring-4 ring-yellow-50"
                      : index === 1
                        ? "bg-linear-to-br from-slate-300 to-slate-400 text-white ring-4 ring-slate-50"
                        : index === 2
                          ? "bg-linear-to-br from-orange-300 to-orange-400 text-white ring-4 ring-orange-50"
                          : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {index + 1}
                </div>

                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={agent.avatar_url || ""} alt={agent.name} />
                    <AvatarFallback className="bg-slate-200 font-bold text-slate-600">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 text-xs">👑</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {agent.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {multiTenantEnabled && (
                      <span
                        className={cn(
                          "text-xs font-bold flex items-center gap-1",
                          agent.branch_name
                            ? "text-indigo-600"
                            : "text-slate-400 italic font-medium",
                        )}
                      >
                        <Building2 className="h-2.5 w-2.5" />
                        {agent.branch_name || "ยังไม่ได้สังกัดสาขา"}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs font-semibold flex items-center gap-1",
                        agent.team_name
                          ? "text-slate-500"
                          : "text-slate-400 italic font-medium",
                      )}
                    >
                      <Users className="h-2.5 w-2.5 text-slate-400" />
                      {agent.team_name || "ยังไม่ได้สังกัดทีม"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className=" text-emerald-600 font-medium ">{agent.deals_count} ดีลสำเร็จ</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] text-emerald-600 font-bold mb-0.5 uppercase tracking-tighter">
                  COMMISSION
                </div>
                <div className="font-black text-sm text-blue-600">
                  ฿{agent.total_commission.toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <DashboardEmptyState
                icon={Trophy}
                title="ยังไม่มีข้อมูลผลงานในส่วนนี้"
                description="ไม่พบข้อมูลยอดขายหรือค่าคอมมิชชั่นสำหรับทีมหรือสาขาที่คุณเลือกในขณะนี้"
                action={
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                    Waiting for data
                  </div>
                }
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
