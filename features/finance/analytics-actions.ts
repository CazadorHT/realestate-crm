"use server";

import { requireAuthContext, assertAdminOrManager, authzFail } from "@/lib/authz";
import { FinanceMath } from "@/lib/finance/precision";
import { generateExcelBuffer, generateMultiSheetExcelBuffer, ExcelColumn } from "@/lib/excel-export";

export type ExportActionResponse = {
  success: boolean;
  message?: string;
  data?: string; // base64
  filename?: string;
};

export type FinancialAnalyticsData = {
  summary: {
    totalRevenue: number;
    totalPayouts: number;
    totalAdjustments: number;
    realizedProfit: number;  // Cash-in profit (Closed Deals + Paid Payouts)
    accruedProfit: number;   // Pending profit (Won/Closed Deals + Unpaid Payouts)
    netProfit: number;       // Total theoretical profit
  };
  monthlyTrends: {
    month: string;
    revenue: number;
    payouts: number;
    realizedProfit: number;
    accruedProfit: number;
  }[];
};

/**
 * Fetches deep financial analytics for the P&L Dashboard.
 * Supports cross-branch (tenant) visualization if tenantId is not provided in context.
 */
export async function getFinancialAnalyticsAction(year?: number): Promise<{ success: boolean; data?: FinancialAnalyticsData; error?: string }> {
  try {
    const { supabase, role, tenantId: currentTenantId } = await requireAuthContext();
    assertAdminOrManager(role);

    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // 1. Fetch Revenue (Deals)
    const { data: dealsData, error: dealsErr } = await supabase
      .from("deals")
      .select("commission_amount, closed_at")
      .not("commission_amount", "is", null)
      .gte("closed_at", startDate)
      .lte("closed_at", endDate)
      .eq("status", "CLOSED_WIN"); // Only closed deals generate revenue

    if (dealsErr) throw dealsErr;

    // 2. Fetch Payouts (Agent Shares)
    const { data: payoutsData, error: payoutsErr } = await supabase
      .from("deal_commissions")
      .select("amount, created_at, status")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (payoutsErr) throw payoutsErr;

    // 3. Fetch Adjustments
    const { data: adjustmentsData, error: adjErr } = await supabase
      .from("commission_adjustments")
      .select("amount, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (adjErr) throw adjErr;

    // --- High-Precision Calculation Engine ---
    const totalRevenue = dealsData.reduce((acc: number, d: any) => acc + (d.commission_amount || 0), 0);
    const totalPayouts = payoutsData.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
    const totalAdjustments = adjustmentsData.reduce((acc: number, a: any) => acc + (a.amount || 0), 0);
    
    // Profit Splitting Logic
    // Realized: Deals where status is CLOSED and all payouts are PAID
    // Accrued: Deals where status is CLOSED/WON but some payouts are not PAID
    let realizedProfit = 0;
    let accruedProfit = 0;

    // We correlate by month for trends
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${targetYear}-${(i + 1).toString().padStart(2, "0")}`;
      
      const monRevenue = dealsData
        .filter((d: any) => d.closed_at?.startsWith(monthStr))
        .reduce((acc: number, d: any) => acc + (d.commission_amount || 0), 0);
      
      const monPayouts = payoutsData
        .filter((p: any) => p.created_at?.startsWith(monthStr))
        .reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

      const monAdjustmentsView = adjustmentsData
        .filter((a: any) => a.created_at?.startsWith(monthStr))
        .reduce((acc: number, a: any) => acc + (a.amount || 0), 0);

      // Simple split for now: Based on payout status in that month
      const monPaidPayouts = payoutsData
        .filter((p: any) => p.created_at?.startsWith(monthStr) && p.status === "PAID")
        .reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
      
      const monPendingPayouts = monPayouts - monPaidPayouts;
      
      const monRealized = monRevenue > 0 ? (monRevenue - monPaidPayouts + monAdjustmentsView) : 0;
      const monAccrued = monPendingPayouts > 0 ? (0 - monPendingPayouts) : 0; // Negative accrued expenses

      return {
        month: monthStr,
        revenue: monRevenue,
        payouts: monPayouts,
        realizedProfit: monRealized,
        accruedProfit: monAccrued
      };
    });

    realizedProfit = months.reduce((acc, m) => acc + m.realizedProfit, 0);
    accruedProfit = months.reduce((acc, m) => acc + m.accruedProfit, 0);

    return {
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalPayouts,
          totalAdjustments,
          realizedProfit,
          accruedProfit,
          netProfit: realizedProfit + accruedProfit
        },
        monthlyTrends: months
      }
    };

  } catch (error: any) {
    console.error("[getFinancialAnalyticsAction] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Exports a full yearly financial report to Excel (Cross-branch supported).
 */
export async function exportYearlyFinanceAction(year?: number): Promise<ExportActionResponse> {
  try {
    const { supabase, role } = await requireAuthContext();
    assertAdminOrManager(role);

    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // 1. Fetch Deals with their related commissions and adjustments
    const { data, error } = await supabase
      .from("deals")
      .select(`
        id,
        closed_at,
        commission_amount,
        property:properties(title),
        commissions:deal_commissions(
          amount, 
          status, 
          wht_amount, 
          net_amount, 
          agent:profiles(full_name, tax_id, tax_address)
        ),
        adjustments:commission_adjustments(amount, description)
      `)
      .in("status", ["CLOSED_WIN", "SIGNED"]) 
      .gte("closed_at", startDate)
      .lte("closed_at", endDate)
      .order("closed_at", { ascending: true });

    if (error) throw error;

    // 2. Data Aggregation for Sheets
    const summaryData: any[] = [];
    const whtPaidData: any[] = [];
    const whtReadyData: any[] = [];

    data.forEach((deal: any) => {
      const totalPayouts = (deal.commissions as any[]).reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
      const totalAdjustments = (deal.adjustments as any[]).reduce((acc: number, a: any) => acc + (a.amount || 0), 0);
      const revenue = deal.commission_amount || 0;
      
      // Sheet 1: Main Summary
      summaryData.push({
        date: deal.closed_at,
        property: (deal.property as any)?.title || "-",
        revenue: revenue,
        payouts: totalPayouts,
        adjustments: totalAdjustments,
        profit: revenue - totalPayouts + totalAdjustments
      });

      // Sheet 2 & 3: WHT Categories
      (deal.commissions as any[]).forEach((c) => {
        if (c.wht_amount > 0) {
          const whtRow = {
            date: deal.closed_at,
            agent: c.agent?.full_name || "-",
            tax_id: c.agent?.tax_id || "-",
            address: c.agent?.tax_address || "-",
            gross: c.amount,
            wht: c.wht_amount,
            net: c.net_amount
          };

          if (c.status === "PAID") {
            whtPaidData.push(whtRow);
          } else if (c.status === "READY_TO_PAY") {
            whtReadyData.push(whtRow);
          }
        }
      });
    });

    // 3. Define Sheet Structures
    const summaryColumns = [
      { key: "date", header: "วันที่ดีลจบ", width: 15, format: (v: any) => new Date(v).toLocaleDateString("th-TH") },
      { key: "property", header: "ทรัพย์/โครงการ", width: 35 },
      { key: "revenue", header: "รายได้บริษัท", width: 18, format: (v: any) => FinanceMath.format(v) },
      { key: "payouts", header: "ยอดจ่ายเอเยนต์", width: 18, format: (v: any) => FinanceMath.format(v) },
      { key: "adjustments", header: "ยอดปรับปรุง (±)", width: 18, format: (v: any) => FinanceMath.format(v) },
      { key: "profit", header: "กำไรสุทธิ", width: 18, format: (v: any) => FinanceMath.format(v) }
    ];

    const whtColumns = [
      { key: "date", header: "วันที่รายการ", width: 15, format: (v: any) => new Date(v).toLocaleDateString("th-TH") },
      { key: "agent", header: "ชื่อผู้รับเงิน", width: 25 },
      { key: "tax_id", header: "เลขผู้เสียภาษี/ID", width: 20 },
      { key: "address", header: "ที่อยู่ตามบัตร", width: 40 },
      { key: "gross", header: "ยอดก่อนหัก (Gross)", width: 18, format: (v: any) => FinanceMath.format(v) },
      { key: "wht", header: "ภาษี (3%)", width: 15, format: (v: any) => FinanceMath.format(v) },
      { key: "net", header: "ยอดรับสุทธิ", width: 18, format: (v: any) => FinanceMath.format(v) }
    ];

    // 4. Generate Multi-Sheet Buffer
    const buffer = await generateMultiSheetExcelBuffer([
      { name: "Yearly_Financial_Summary", data: summaryData, columns: summaryColumns },
      { name: "WHT_PAID_Report", data: whtPaidData, columns: whtColumns },
      { name: "WHT_READY_Accrued", data: whtReadyData, columns: whtColumns },
    ]);

    return {
      success: true,
      data: buffer.toString("base64"),
      filename: `Accounting_Export_${targetYear}.xlsx`
    };

  } catch (error: any) {
    console.error("[exportYearlyFinanceAction] Error:", error);
    const fail = authzFail(error);
    return { success: false, message: fail.message };
  }
}

/**
 * Fetches all unique years that have financial data (deals and commissions).
 */
export async function getAvailableFinancialYearsAction(): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    const { supabase, role } = await requireAuthContext();
    assertAdminOrManager(role);

    // Using "any" cast for RPC as it might not be in the generated types yet
    const { data: dealYears, error: dealErr } = await (supabase.rpc as any)("get_distinct_finance_years");

    if (dealErr) {
       // 🛡️ Silent Fallback: Only log if it's NOT a "Function not found" error
       if (dealErr.code !== "PGRST202") {
          console.error("RPC Error:", dealErr);
       }
       
       console.log("Switching to high-reliability manual query fallback...");
       
       const { data: dData } = await supabase.from("deals").select("closed_at").not("closed_at", "is", null);
       const { data: cData } = await supabase.from("deal_commissions").select("created_at").not("created_at", "is", null);

       const years = new Set<number>();
       dData?.forEach(d => {
         if (d.closed_at) years.add(new Date(d.closed_at).getFullYear());
       });
       cData?.forEach(c => {
         if (c.created_at) years.add(new Date(c.created_at).getFullYear());
       });
       return { 
         success: true, 
         data: Array.from(years).sort((a, b) => b - a) 
       };
    }

    return { success: true, data: (dealYears as any) as number[] };

  } catch (error: any) {
    console.error("[getAvailableFinancialYearsAction] Error:", error);
    return { success: false, error: error.message };
  }
}
