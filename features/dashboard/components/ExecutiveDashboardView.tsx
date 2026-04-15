"use client";

import {
  ExecutiveStats,
  MonthlyRevenue,
  QuarterlyRevenue,
  SetupProgress,
} from "../executive-queries";
import { SetupChecklist } from "./SetupChecklist";
import { TrendingUp, Users, Settings as SettingsIcon } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentPerformanceTable } from "./AgentPerformanceTable";
import { CommissionSettings } from "./CommissionSettings";
import { TopAgent } from "../queries";
import { AgentKpiStats } from "@/features/analytics/agent-kpis";
import { BranchOnboardingDialog } from "./BranchOnboardingDialog";
import { AiExecutiveBriefing } from "./AiExecutiveBriefing";

// New Modular Components
import { DashboardHeader } from "./executive-dashboard/DashboardHeader";
import { DashboardToolbar } from "./executive-dashboard/DashboardToolbar";
import { PerformanceStats } from "./executive-dashboard/PerformanceStats";
import { RevenueChartSection } from "./executive-dashboard/RevenueChartSection";
import { TransactionSummary } from "./executive-dashboard/TransactionSummary";
import { CommissionCalculator } from "./executive-dashboard/CommissionCalculator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExecutiveDashboard } from "../useExecutiveDashboard";

interface ExecutiveDashboardViewProps {
  stats: ExecutiveStats;
  monthlyData: MonthlyRevenue[];
  quarterlyData: QuarterlyRevenue[];
  agentStats: AgentKpiStats[];
  topAgents: TopAgent[];
  allBranches: { id: string; name: string }[];
  selectedTenantId: string;
  compareStats?: ExecutiveStats | null;
  compareMonthlyData?: MonthlyRevenue[] | null;
  compareTenantId?: string | null;
  setupProgress: SetupProgress;
  role: string;
}

export function ExecutiveDashboardView({
  stats,
  monthlyData,
  quarterlyData,
  agentStats,
  topAgents,
  allBranches,
  selectedTenantId,
  compareStats,
  compareMonthlyData,
  compareTenantId,
  setupProgress,
  role,
}: ExecutiveDashboardViewProps) {
  const {
    activeTab,
    setActiveTab,
    aiInsights,
    isGeneratingAi,
    mounted,
    showOnboarding,
    setShowOnboarding,
    handleGenerateAi,
    handleExport,
  } = useExecutiveDashboard(
    role, 
    allBranches.length, 
    selectedTenantId, 
    compareTenantId
  );

  return (
    <ErrorBoundary>
      <div className="space-y-8 p-1">
        <BranchOnboardingDialog 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
        />

        <DashboardHeader />

        <DashboardToolbar
          allBranches={allBranches}
          selectedTenantId={selectedTenantId}
          compareTenantId={compareTenantId}
          isGeneratingAi={isGeneratingAi}
          aiInsights={aiInsights}
          onGenerateAi={handleGenerateAi}
          onExport={handleExport}
        />

        {(aiInsights || isGeneratingAi) && (
          <AiExecutiveBriefing insights={aiInsights} isLoading={isGeneratingAi} />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 px-2">
          <div className="flex flex-col xl:flex-row md:items-center justify-between gap-6 mb-2">
            <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant={activeTab === "overview" ? "default" : "outline"}
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "gap-2 px-3 sm:px-6 py-2.5 h-11 rounded-xl transition-all font-bold text-xs sm:text-sm",
                  activeTab === "overview"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600 "
                    : "bg-white/50 text-slate-500 border-slate-200 hover:bg-white hover:text-blue-600",
                )}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span className="truncate">ภาพรวม</span>
              </Button>
              <Button
                variant={activeTab === "agents" ? "default" : "outline"}
                onClick={() => setActiveTab("agents")}
                className={cn(
                  "gap-2 px-3 sm:px-6 py-2.5 h-11 rounded-xl transition-all font-bold text-xs sm:text-sm",
                  activeTab === "agents"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600 "
                    : "bg-white/50 text-slate-500 border-slate-200 hover:bg-white hover:text-blue-600",
                )}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="truncate">ตัวแทน</span>
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "outline"}
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "gap-2 px-3 sm:px-6 py-2.5 h-11 rounded-xl transition-all font-bold text-xs sm:text-sm",
                  activeTab === "settings"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600 "
                    : "bg-white/50 text-slate-500 border-slate-200 hover:bg-white hover:text-blue-600",
                )}
              >
                <SettingsIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">ตั้งค่า</span>
              </Button>
            </div>

            <CommissionCalculator />
          </div>

          <TabsContent
            value="overview"
            className="space-y-8 animate-in fade-in-50 duration-500"
          >
            <SetupChecklist progress={setupProgress} />
            
            <PerformanceStats 
              stats={stats} 
              compareStats={compareStats}
              allBranches={allBranches}
              compareTenantId={compareTenantId}
            />

            <RevenueChartSection
              monthlyData={monthlyData}
              compareMonthlyData={compareMonthlyData}
              topAgents={topAgents}
              mounted={mounted}
            />

            <TransactionSummary 
              stats={stats} 
              quarterlyData={quarterlyData} 
            />
          </TabsContent>

          <TabsContent
            value="agents"
            className="animate-in slide-in-from-left-4 duration-500"
          >
            <AgentPerformanceTable agents={agentStats} />
          </TabsContent>

          <TabsContent
            value="settings"
            className="animate-in slide-in-from-right-4 duration-500"
          >
            <CommissionSettings />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
