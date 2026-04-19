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
    const totalRevenue = (dealsData || []).reduce((acc: number, d: { commission_amount: number | null }) => acc + (d.commission_amount || 0), 0);
    const totalPayouts = (payoutsData || []).reduce((acc: number, p: { amount: number | null }) => acc + (p.amount || 0), 0);
    const totalAdjustments = (adjustmentsData || []).reduce((acc: number, a: { amount: number | null }) => acc + (a.amount || 0), 0);
    
    // Profit Splitting Logic
    // Realized: Deals where status is CLOSED and all payouts are PAID
    // Accrued: Deals where status is CLOSED/WON but some payouts are not PAID
    let realizedProfit = 0;
    let accruedProfit = 0;

    // We correlate by month for trends
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${targetYear}-${(i + 1).toString().padStart(2, "0")}`;
      
      const monRevenue = (dealsData || [])
        .filter((d) => (d.closed_at as string)?.startsWith(monthStr))
        .reduce((acc: number, d: { commission_amount: number | null }) => acc + (d.commission_amount || 0), 0);
      
      const monPayouts = (payoutsData || [])
        .filter((p) => (p.created_at as string)?.startsWith(monthStr))
        .reduce((acc: number, p: { amount: number | null }) => acc + (p.amount || 0), 0);

      const monAdjustmentsView = (adjustmentsData || [])
        .filter((a) => (a.created_at as string)?.startsWith(monthStr))
        .reduce((acc: number, a: { amount: number | null }) => acc + (a.amount || 0), 0);

      // Simple split for now: Based on payout status in that month
      const monPaidPayouts = (payoutsData || [])
        .filter((p) => (p.created_at as string)?.startsWith(monthStr) && p.status === "PAID")
        .reduce((acc: number, p: { amount: number | null }) => acc + (p.amount || 0), 0);
      
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

    realizedProfit = months.reduce((acc: number, m: { realizedProfit: number }) => acc + m.realizedProfit, 0);
    accruedProfit = months.reduce((acc: number, m: { accruedProfit: number }) => acc + m.accruedProfit, 0);

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

  } catch (error: unknown) {
    console.error("[getFinancialAnalyticsAction] Error:", error);
    return { success: false, error: (error as Error).message };
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
          agent:profiles(full_name, tax_id, tax_address),
          adjustments:commission_adjustments(amount, description)
        )
      `)
      .in("status", ["CLOSED_WIN", "SIGNED"]) 
      .gte("closed_at", startDate)
      .lte("closed_at", endDate)
      .order("closed_at", { ascending: true });

    if (error) throw error;

    // 2. Data Aggregation for Sheets
    const summaryData: Record<string, unknown>[] = [];
    const whtPaidData: Record<string, unknown>[] = [];
    const whtReadyData: Record<string, unknown>[] = [];

    (data || []).forEach((deal) => {
      const commissions = (deal.commissions || []) as any[];
      const totalPayouts = commissions.reduce((acc: number, c: any) => acc + (Number(c.amount) || 0), 0);
      
      const allAdjustments = commissions.flatMap(c => (c.adjustments || []) as any[]);
      const totalAdjustments = allAdjustments.reduce((acc: number, a: any) => acc + (Number(a.amount) || 0), 0);
      
      const revenue = Number(deal.commission_amount) || 0;
      
      // Sheet 1: Main Summary
      summaryData.push({
        date: deal.closed_at,
        property: (deal.property as { title: string } | null)?.title || "-",
        revenue: revenue,
        payouts: totalPayouts,
        adjustments: totalAdjustments,
        profit: revenue - totalPayouts + totalAdjustments
      });

      // Sheet 2 & 3: WHT Categories
      commissions.forEach((c) => {
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
      { key: "date", header: "วันที่ดีลจบ", width: 15, format: (v: unknown) => new Date(v as string).toLocaleDateString("th-TH") },
      { key: "property", header: "ทรัพย์/โครงการ", width: 35 },
      { key: "revenue", header: "รายได้บริษัท", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "payouts", header: "ยอดจ่ายเอเยนต์", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "adjustments", header: "ยอดปรับปรุง (±)", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "profit", header: "กำไรสุทธิ", width: 18, format: (v: unknown) => FinanceMath.format(v as number) }
    ];

    const whtColumns = [
      { key: "date", header: "วันที่รายการ", width: 15, format: (v: unknown) => new Date(v as string).toLocaleDateString("th-TH") },
      { key: "agent", header: "ชื่อผู้รับเงิน", width: 25 },
      { key: "tax_id", header: "เลขผู้เสียภาษี/ID", width: 20 },
      { key: "address", header: "ที่อยู่ตามบัตร", width: 40 },
      { key: "gross", header: "ยอดก่อนหัก (Gross)", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "wht", header: "ภาษี (3%)", width: 15, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "net", header: "ยอดรับสุทธิ", width: 18, format: (v: unknown) => FinanceMath.format(v as number) }
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

  } catch (error: unknown) {
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

    // Using unknown cast for RPC as it might not be in the generated types yet
    const { data: dealYears, error: dealErr } = await (supabase.rpc as unknown as (name: string) => Promise<{ data: number[] | null; error: unknown }>)("get_distinct_finance_years");

    if (dealErr) {
       const err = dealErr as { code?: string; message?: string };
       // 🛡️ Silent Fallback: Only log if it's NOT a "Function not found" error
       if (err.code !== "PGRST202") {
          console.error("RPC Error:", err);
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

    return { success: true, data: (dealYears || []) as number[] };

  } catch (error: unknown) {
    console.error("[getAvailableFinancialYearsAction] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
