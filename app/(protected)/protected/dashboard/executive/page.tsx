import {
  getExecutiveStats,
  getMonthlyRevenueData,
  getQuarterlyRevenueData,
  getSetupProgress,
} from "@/features/dashboard/executive-queries";
import { getAdvancedTopAgents } from "@/features/dashboard/queries";
import { getAgentKpiStats } from "@/features/analytics/agent-kpis";
import { ExecutiveDashboardView } from "@/features/dashboard/components/ExecutiveDashboardView";
import { requireAuthContext, assertAdminOrManager } from "@/lib/authz";
import { getTenantsAction } from "@/lib/actions/tenant-management";

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; compareId?: string }>;
}) {
  const { role, tenantId: authTenantId } = await requireAuthContext();
  assertAdminOrManager(role);

  const awaitedParams = await searchParams;
  
  // SECURITY: Only ADMIN can spoof or view other tenants' data.
  // Others are STRICTLY locked to their own authTenantId.
  let selectedTenantId = authTenantId || "ALL";
  if (role === "ADMIN" && awaitedParams.tenantId) {
    selectedTenantId = awaitedParams.tenantId;
  }
  
  const compareId = role === "ADMIN" ? (awaitedParams.compareId || null) : null;

  const year = new Date().getFullYear();

  // Fetch all branches for selection if admin
  const branchesResult = role === "ADMIN" ? await getTenantsAction() : { data: [] };
  const allBranches = branchesResult.data || [];

  // Fetch primary data in parallel
  const [stats, monthlyData, quarterlyData, agentStats, topAgents, setupProgress] =
    await Promise.all([
      getExecutiveStats(selectedTenantId, year),
      getMonthlyRevenueData(selectedTenantId, year),
      getQuarterlyRevenueData(selectedTenantId, year),
      getAgentKpiStats(selectedTenantId),
      getAdvancedTopAgents(selectedTenantId),
      getSetupProgress(selectedTenantId === "ALL" ? "" : selectedTenantId),
    ]);

  // Fetch comparison data if compareId is present
  let compareStats = null;
  let compareMonthlyData = null;

  if (compareId) {
    const [cStats, cMonthly] = await Promise.all([
      getExecutiveStats(compareId, year),
      getMonthlyRevenueData(compareId, year),
    ]);
    compareStats = cStats;
    compareMonthlyData = cMonthly;
  }

  return (
    <div className="container mx-auto ax-w-screen-2xl">
      <ExecutiveDashboardView
        stats={stats}
        monthlyData={monthlyData}
        quarterlyData={quarterlyData}
        agentStats={agentStats}
        topAgents={topAgents}
        allBranches={allBranches}
        selectedTenantId={selectedTenantId}
        role={role}
        compareStats={compareStats}
        compareMonthlyData={compareMonthlyData}
        compareTenantId={compareId}
        setupProgress={setupProgress}
      />
    </div>
  );
}
