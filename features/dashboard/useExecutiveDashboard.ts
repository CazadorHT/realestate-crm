import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { 
  generateExecutiveAiInsightsAction, 
  ExecutiveAiInsights 
} from "./executive-ai-actions";
import { 
  exportExecutiveExcelAction, 
  exportExecutivePdfAction,
  ExportActionResponse 
} from "./executive-export-actions";

import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * 🛡️ Custom Hook: useExecutiveDashboard
 * Encapsulates all dashboard logic: AI generation, Exports, and view state.
 */
export function useExecutiveDashboard(
  role: string, 
  branchCount: number,
  selectedTenantId: string,
  compareTenantId?: string | null
) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [activeTab, setActiveTab] = useState("overview");
  const [aiInsights, setAiInsights] = useState<ExecutiveAiInsights | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    role === "ADMIN" && branchCount === 0
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * 🛡️ Data Context Protection
   * Automatically clear AI insights when the tenant context changes to prevent 
   * viewing stale analysis for different branches.
   */
  useEffect(() => {
    if (aiInsights) {
      setAiInsights(null);
    }
  }, [selectedTenantId, compareTenantId]);

  const handleGenerateAi = useCallback(async () => {
    async function execute() {
      setIsGeneratingAi(true);
      const processId = startProcess(
        isEn ? "AI is analyzing data and generating strategic insights" : "AI กำลังวิเคราะห์ข้อมูลและจัดทำกลยุทธ์", 
        {
          type: "AI_GENERATION",
          onRetry: execute
        }
      );
      try {
        const result = await generateExecutiveAiInsightsAction(undefined, language);
        if (result.success && result.data) {
          setAiInsights(result.data);
          finishProcess(processId, "SUCCESS", isEn ? "AI analysis completed successfully" : "AI วิเคราะห์ข้อมูลสำเร็จ");
        } else {
          finishProcess(processId, "ERROR", result.message || (isEn ? "AI analysis temporarily unavailable" : "AI ไม่สามารถวิเคราะห์ได้ในขณะนี้"));
        }
      } catch (error: unknown) {
        console.error(error);
        const msg = error instanceof Error ? error.message : (isEn ? "Error running AI analysis" : "เกิดข้อผิดพลาดในการเรียก AI");
        finishProcess(processId, "ERROR", msg);
      } finally {
        setIsGeneratingAi(false);
      }
    }
    await execute();
  }, [isEn]);

  const handleExport = useCallback(async (type: "excel" | "pdf") => {
    const processId = startProcess(
      isEn ? `Preparing ${type.toUpperCase()} report file` : `เตรียมไฟล์รายงาน ${type.toUpperCase()}`, 
      {
        type: "EXPORT"
      }
    );
    try {
      const action = type === "excel" ? exportExecutiveExcelAction : exportExecutivePdfAction;
      const result: ExportActionResponse = await action(undefined, aiInsights);

      if (result.success && result.data) {
        const link = document.createElement("a");
        link.href = `data:application/${
          type === "excel" 
            ? "vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
            : "pdf"
        };base64,${result.data}`;
        link.download = result.filename || `report.${type === "excel" ? "xlsx" : "pdf"}`;
        link.click();
        finishProcess(processId, "SUCCESS", isEn ? `Downloaded ${type.toUpperCase()} file successfully ✨` : `ดาวน์โหลดไฟล์ ${type.toUpperCase()} สำเร็จ ✨`);
      } else {
        finishProcess(processId, "ERROR", result.message || (isEn ? "Failed to generate report file" : "ล้มเหลวในการสร้างไฟล์รายงาน"));
      }
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : (isEn ? "Error downloading report" : "เกิดข้อผิดพลาดในการดาวน์โหลด");
      finishProcess(processId, "ERROR", msg);
    }
  }, [aiInsights, isEn]);

  return {
    activeTab,
    setActiveTab,
    aiInsights,
    isGeneratingAi,
    mounted,
    showOnboarding,
    setShowOnboarding,
    handleGenerateAi,
    handleExport,
  };
}
