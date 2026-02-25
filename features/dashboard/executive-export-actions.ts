"use server";

import {
  requireAuthContext,
  assertAdminOrManager,
  authzFail,
} from "@/lib/authz";
import {
  getExecutiveStats,
  getMonthlyRevenueData,
  getQuarterlyRevenueData,
} from "./executive-queries";
import { generateExcelBuffer, ExcelColumn } from "@/lib/excel-export";
import { ExecutiveAiInsights } from "./executive-ai-actions";

const MONTH_COLUMNS: ExcelColumn[] = [
  { key: "month", header: "เดือน", width: 15 },
  {
    key: "sales",
    header: "ยอดขาย (Sale)",
    width: 20,
    format: (v) => v.toLocaleString(),
  },
  {
    key: "rent",
    header: "ยอดเช่า (Rent)",
    width: 20,
    format: (v) => v.toLocaleString(),
  },
  {
    key: "total",
    header: "ยอดรวม",
    width: 20,
    format: (v) => v.toLocaleString(),
  },
];

export async function exportExecutiveExcelAction(year?: number) {
  try {
    const { role } = await requireAuthContext();
    assertAdminOrManager(role);

    const targetYear = year || new Date().getFullYear();

    const [stats, monthlyData, quarterlyData] = await Promise.all([
      getExecutiveStats(targetYear),
      getMonthlyRevenueData(targetYear),
      getQuarterlyRevenueData(targetYear),
    ]);

    const buffer = await generateExcelBuffer(
      monthlyData,
      MONTH_COLUMNS,
      `Monthly Report ${targetYear}`,
    );

    return {
      success: true,
      data: buffer.toString("base64"),
      filename: `Executive_Excel_Report_${targetYear}.xlsx`,
    };
  } catch (error) {
    console.error("[exportExecutiveExcelAction] Failed:", error);
    return authzFail(error);
  }
}

export async function exportExecutivePdfAction(
  year?: number,
  aiInsights?: ExecutiveAiInsights | null,
) {
  try {
    const { role } = await requireAuthContext();
    assertAdminOrManager(role);

    const targetYear = year || new Date().getFullYear();

    const [stats, monthlyData, quarterlyData] = await Promise.all([
      getExecutiveStats(targetYear),
      getMonthlyRevenueData(targetYear),
      getQuarterlyRevenueData(targetYear),
    ]);

    const { generateExecutivePdf } = await import("@/lib/pdf-export");
    const pdfBytes = await generateExecutivePdf(
      stats,
      monthlyData,
      quarterlyData,
      targetYear,
      aiInsights || undefined,
    );
    const base64 = Buffer.from(pdfBytes).toString("base64");

    return {
      success: true,
      data: base64,
      filename: `Executive_PDF_Report_${targetYear}.pdf`,
    };
  } catch (error) {
    console.error("[exportExecutivePdfAction] Failed:", error);
    return authzFail(error);
  }
}
