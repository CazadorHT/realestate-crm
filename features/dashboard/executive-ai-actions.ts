"use server";

import { requireAuthContext, assertAdminOrManager } from "@/lib/authz";
import {
  getExecutiveStats,
  getMonthlyRevenueData,
  getPipelineStats,
} from "./executive-queries";
import { generateText } from "@/lib/ai/gemini";
import { logAiUsage } from "@/features/ai-monitor/actions";

export type ExecutiveAiInsights = {
  summary: string;
  trends: string[];
  recommendations: string[];
  forecast: string;
};

export async function generateExecutiveAiInsightsAction(year?: number) {
  try {
    const { role } = await requireAuthContext();
    assertAdminOrManager(role);

    const targetYear = year || new Date().getFullYear();

    // Fetch context data
    const [stats, monthlyData, pipeline] = await Promise.all([
      getExecutiveStats(targetYear),
      getMonthlyRevenueData(targetYear),
      getPipelineStats(),
    ]);

    const prompt = `
      You are an expert real estate business analyst. Analyze the following financial data for the year ${targetYear} and provide strategic insights for the executive team.
      
      Business Statistics:
      - Total Revenue: ฿${stats.totalRevenue.toLocaleString()}
      - Total Commission: ฿${stats.totalCommission.toLocaleString()}
      - Total Deals Closed: ${stats.totalDeals} (Sales: ${stats.salesCount}, Rentals: ${stats.rentalCount})
      
      Monthly Revenue Trend (Last 12 Months):
      ${monthlyData.map((m) => `- ${m.month}: Sales ฿${m.sales.toLocaleString()}, Rent ฿${m.rent.toLocaleString()}`).join("\n")}
      
      Current Sales Pipeline (Open Deals):
      - Total Open Deals: ${pipeline.totalOpenDeals}
      - Estimated Value: ฿${pipeline.expectedValue.toLocaleString()}
      - Stage Breakdown: ${JSON.stringify(pipeline.stageBreakdown)}
      
      Provide the response in JSON format with the following keys (all values in Thai language):
      - summary: A professional 2-3 sentence overview of current business health.
      - trends: An array of 3-4 key observations about growth or market shifts.
      - recommendations: An array of 3 actionable strategic advice items.
      - forecast: A prediction for the next month's performance based on the pipeline.
      
      The tone should be executive, data-driven, and professional. Use Thai (ภาษาไทย) for all textual content.
    `;

    const result = await generateText(prompt, "gemini-1.5-flash");

    // Log AI usage
    await logAiUsage({
      model: "gemini-1.5-flash",
      feature: "executive_insights",
      status: "success",
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
    });

    try {
      // Clean the response if Gemini wraps it in markdown code blocks
      const cleanJson = result.text.replace(/```json\n?|\n?```/g, "").trim();
      const insights: ExecutiveAiInsights = JSON.parse(cleanJson);
      return { success: true, data: insights };
    } catch (parseError) {
      console.error(
        "[generateExecutiveAiInsightsAction] Parse Error:",
        parseError,
        result.text,
      );
      return {
        success: false,
        message: "AI ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง",
      };
    }
  } catch (error: any) {
    console.error("[generateExecutiveAiInsightsAction] Failed:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการขอข้อมูล AI",
    };
  }
}
