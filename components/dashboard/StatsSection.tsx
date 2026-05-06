import { Suspense } from "react";
import { getDashboardStats } from "@/features/dashboard/queries/stats";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { StatsSkeleton } from "./skeletons/StatsSkeleton";
import { getSystemConfig } from "@/lib/actions/system-config";

export interface StatsSectionProps {
  tenantId?: string | null;
  userId?: string;
  role?: string;
  range?: string;
  view?: "company" | "team" | "branch" | "personal" | "staff";
  branchId?: string;
  teamId?: string;
}

export async function StatsSection({ 
  tenantId, 
  userId, 
  role,
  range = "month",
  view = "company",
  branchId,
  teamId
}: StatsSectionProps) {
  const isAdmin = role === "ADMIN" || role === "MANAGER";
  
  // 🏢 Fetch dynamic system config to know if multi-branch is active
  // 🚀 Fetch stats based on role to avoid initial mismatch and redundant client-side fetching
  const [config, stats] = await Promise.all([
    getSystemConfig(),
    getDashboardStats({
      tenantId, 
      agentId: userId, 
      view,
      targetId: branchId || teamId,
      range
    })
  ]);
  
  return (
    <StatsOverview 
      initialStats={stats} 
      userId={userId} 
      role={role} 
      multiTenantEnabled={config.multi_tenant_enabled}
      initialRange={range as any}
      initialView={view}
      initialBranchId={branchId}
      initialTeamId={teamId}
    />
  );
}

export function StatsSectionSuspense({ 
  tenantId,
  userId,
  role,
  range,
  view,
  branchId,
  teamId
}: StatsSectionProps) {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsSection 
        tenantId={tenantId} 
        userId={userId} 
        role={role} 
        range={range}
        view={view}
        branchId={branchId}
        teamId={teamId}
      />
    </Suspense>
  );
}
