import {
  getExecutiveStats,
  getMonthlyRevenueData,
  getQuarterlyRevenueData,
} from "@/features/dashboard/executive-queries";
import { getAdvancedTopAgents } from "@/features/dashboard/queries";
import { getAgentKpiStats } from "@/features/analytics/agent-kpis";
import { ExecutiveDashboardView } from "@/features/dashboard/components/ExecutiveDashboardView";
import { requireAuthContext, assertAdminOrManager } from "@/lib/authz";

export default async function ExecutiveDashboardPage() {
  const { role } = await requireAuthContext();
  assertAdminOrManager(role);

  const year = new Date().getFullYear();

  // Fetch data in parallel
  const [stats, monthlyData, quarterlyData, agentStats, topAgents] =
    await Promise.all([
      getExecutiveStats(year),
      getMonthlyRevenueData(year),
      getQuarterlyRevenueData(year),
      getAgentKpiStats(),
      getAdvancedTopAgents(),
    ]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <ExecutiveDashboardView
        stats={stats}
        monthlyData={monthlyData}
        quarterlyData={quarterlyData}
        agentStats={agentStats}
        topAgents={topAgents}
      />
    </div>
  );
}
