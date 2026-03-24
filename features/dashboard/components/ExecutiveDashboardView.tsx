"use client";

import { useState, useEffect } from "react";
import {
  ExecutiveStats,
  MonthlyRevenue,
  QuarterlyRevenue,
  SetupProgress,
} from "../executive-queries";
import { SetupChecklist } from "./SetupChecklist";
import { TrendingUp, Users, Settings as SettingsIcon } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentPerformanceTable } from "./AgentPerformanceTable";
import { CommissionSettings } from "./CommissionSettings";
import { TopAgent } from "../queries";
import { AgentKpiStats } from "@/features/analytics/agent-kpis";
import { BranchOnboardingDialog } from "./BranchOnboardingDialog";
import { AiExecutiveBriefing } from "./AiExecutiveBriefing";

// New Modular Components
import { DashboardHeader } from "./executive-dashboard/DashboardHeader";
import { PerformanceStats } from "./executive-dashboard/PerformanceStats";
import { RevenueChartSection } from "./executive-dashboard/RevenueChartSection";
import { TransactionSummary } from "./executive-dashboard/TransactionSummary";
import { CommissionCalculator } from "./executive-dashboard/CommissionCalculator";

import {
  exportExecutiveExcelAction,
  exportExecutivePdfAction,
  ExportActionResponse,
} from "../executive-export-actions";
import {
  generateExecutiveAiInsightsAction,
  ExecutiveAiInsights,
} from "../executive-ai-actions";

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
  const [aiInsights, setAiInsights] = useState<ExecutiveAiInsights | null>(
    null,
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    role === "ADMIN" && allBranches.length === 0,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    const toastId = toast.loading("AI กำลังวิเคราะห์ข้อมูลและจัดทำกลยุทธ์...");
    try {
      const result = await generateExecutiveAiInsightsAction();
      if (result.success && result.data) {
        setAiInsights(result.data);
        toast.success("AI วิเคราะห์ข้อมูลสำเร็จ", { id: toastId });
      } else {
        toast.error(result.message || "AI ไม่สามารถวิเคราะห์ได้ในขณะนี้", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเรียก AI", { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleExport = async (type: "excel" | "pdf") => {
    const toastId = toast.loading(`กำลังเตรียมไฟล์ ${type.toUpperCase()}...`);
    try {
      const action =
        type === "excel"
          ? exportExecutiveExcelAction
          : exportExecutivePdfAction;
      const result: ExportActionResponse = await action(undefined, aiInsights);

      if (result.success && result.data) {
        const link = document.createElement("a");
        link.href = `data:application/${type === "excel" ? "vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "pdf"};base64,${result.data}`;
        link.download =
          result.filename || `report.${type === "excel" ? "xlsx" : "pdf"}`;
        link.click();
        toast.success(`ดาวน์โหลดไฟล์ ${type.toUpperCase()} สำเร็จ`, {
          id: toastId,
        });
      } else {
        toast.error(result.message || "ล้มเหลวในการสร้างไฟล์รายงาน", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด", { id: toastId });
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-8 p-1">
        <BranchOnboardingDialog 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
        />

        <DashboardHeader
          allBranches={allBranches}
          selectedTenantId={selectedTenantId}
          compareTenantId={compareTenantId}
          isGeneratingAi={isGeneratingAi}
          aiInsights={aiInsights}
          onGenerateAi={handleGenerateAi}
          onExport={handleExport}
        />

        {aiInsights && <AiExecutiveBriefing insights={aiInsights} />}

        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <TabsList className="bg-slate-100/50 p-1">
              <TabsTrigger value="overview" className="gap-2 px-6">
                <TrendingUp className="h-4 w-4" />
                ภาพรวม (Overview)
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2 px-6">
                <Users className="h-4 w-4" />
                ผลงานตัวแทน (Agents)
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 px-6">
                <SettingsIcon className="h-4 w-4" />
                ตั้งค่าคอมมิชชั่น
              </TabsTrigger>
            </TabsList>

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
