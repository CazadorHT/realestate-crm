import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  generateExecutiveAiInsightsAction, 
  ExecutiveAiInsights 
} from "./executive-ai-actions";
import { 
  exportExecutiveExcelAction, 
  exportExecutivePdfAction,
  ExportActionResponse 
} from "./executive-export-actions";

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
  }, []); // Actions are stable

  const handleExport = useCallback(async (type: "excel" | "pdf") => {
    const toastId = toast.loading(`กำลังเตรียมไฟล์ ${type.toUpperCase()}...`);
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
        toast.success(`ดาวน์โหลดไฟล์ ${type.toUpperCase()} สำเร็จ`, { id: toastId });
      } else {
        toast.error(result.message || "ล้มเหลวในการสร้างไฟล์รายงาน", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด", { id: toastId });
    }
  }, [aiInsights]); // Export depends on current AI insights

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
