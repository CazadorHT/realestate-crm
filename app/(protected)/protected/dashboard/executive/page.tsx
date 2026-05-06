import {
  getExecutiveStats,
  getMonthlyRevenueData,
  getQuarterlyRevenueData,
  getSetupProgress,
} from "@/features/dashboard/executive-queries";
import { getAdvancedTopAgents } from "@/features/dashboard/queries/performance";
import { getAgentKpiStats } from "@/features/analytics/agent-kpis";
import { ExecutiveDashboardView } from "@/features/dashboard/components/ExecutiveDashboardView";
import { requireAuthContext, assertAdminOrManager } from "@/lib/authz";
import { getTenantsAction } from "@/lib/actions/tenant-management";

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; compareId?: string; range?: string }>;
}) {
  const { role, tenantId: authTenantId } = await requireAuthContext();
  assertAdminOrManager(role);

  const awaitedParams = await searchParams;
  const range = (awaitedParams.range as string) || "month";
  
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
  const [stats, monthlyData, quarterlyData, agentStats, topAgents, setupProgress, forecastData] =
    await Promise.all([
      getExecutiveStats(selectedTenantId, year, range),
      getMonthlyRevenueData(selectedTenantId, year, range),
      getQuarterlyRevenueData(selectedTenantId, year, range),
      getAgentKpiStats(selectedTenantId, undefined, (range === "year" || range === "month" || range === "quarter") ? range as any : "month"),
      getAdvancedTopAgents({ tenantId: selectedTenantId, range }),
      getSetupProgress(selectedTenantId === "ALL" ? "" : selectedTenantId),
      import("@/features/analytics/market-intelligence").then(m => m.getRevenueForecastAction())
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
        forecastData={forecastData as any}
      />
    </div>
  );
}
