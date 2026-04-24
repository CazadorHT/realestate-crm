"use server";

import { requireAuthContext, assertAdminOrManager, authzFail } from "@/lib/authz";
import { FinanceMath } from "@/lib/finance/precision";
import { generateExcelBuffer, generateMultiSheetExcelBuffer, ExcelColumn } from "@/lib/excel-export";
import { Database } from "@/lib/database.types";
import { CommissionStatus } from "./types";

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
    const tId = currentTenantId && currentTenantId !== "ALL" ? currentTenantId : undefined;

    // 🛡️ Phase 1: High-Performance SQL Aggregation (Primary)
    const { data: rpcData, error: rpcErr } = await supabase.rpc("get_financial_analytics_v1", {
      p_year: targetYear,
      p_tenant_id: tId
    });

    if (!rpcErr && rpcData) {
      console.log(`[getFinancialAnalyticsAction] RPC Success for year ${targetYear}`);
      return { success: true, data: rpcData as FinancialAnalyticsData };
    }

    // 🛡️ Phase 2: Manual JS Fallback (If RPC is missing or fails)
    console.warn("[getFinancialAnalyticsAction] RPC Failed or Missing, falling back to manual aggregation:", rpcErr);
    
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // 1. Fetch Revenue (Deals)
    let dealsQuery = supabase
      .from("deals")
      .select("commission_amount, closed_at")
      .not("commission_amount", "is", null)
      .gte("closed_at", startDate)
      .lte("closed_at", endDate)
      .eq("status", "CLOSED_WIN");
    
    if (tId) dealsQuery = dealsQuery.eq("tenant_id", tId);
    const { data: dealsData, error: dealsErr } = await dealsQuery;
    if (dealsErr) throw dealsErr;

    // 2. Fetch Payouts (Agent Shares)
    let payoutsQuery = supabase
      .from("deal_commissions")
      .select("amount, created_at, status")
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (tId) payoutsQuery = payoutsQuery.eq("tenant_id", tId);
    const { data: payoutsData, error: payoutsErr } = await payoutsQuery;
    if (payoutsErr) throw payoutsErr;

    // 3. Fetch Adjustments
    let adjQuery = supabase
      .from("commission_adjustments")
      .select("amount, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (tId) adjQuery = adjQuery.eq("tenant_id", tId);
    const { data: adjustmentsData, error: adjErr } = await adjQuery;
    if (adjErr) throw adjErr;

    // --- High-Precision Calculation Engine ---
    const totalRevenue = (dealsData || []).reduce((acc: number, d: { commission_amount: number | null }) => acc + (d.commission_amount || 0), 0);
    const totalPayouts = (payoutsData || []).reduce((acc: number, p: { amount: number | null }) => acc + (p.amount || 0), 0);
    const totalAdjustments = (adjustmentsData || []).reduce((acc: number, a: { amount: number | null }) => acc + (a.amount || 0), 0);
    
    let realizedProfitTotal = 0;
    let accruedProfitTotal = 0;

    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
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

      const monPaidPayouts = (payoutsData || [])
        .filter((p) => (p.created_at as string)?.startsWith(monthStr) && p.status === "PAID")
        .reduce((acc: number, p: { amount: number | null }) => acc + (p.amount || 0), 0);
      
      const monPendingPayouts = monPayouts - monPaidPayouts;
      const monRealized = monRevenue - monPaidPayouts + monAdjustmentsView;
      const monAccrued = -monPendingPayouts;

      return {
        month: monthStr,
        revenue: monRevenue,
        payouts: monPayouts,
        realizedProfit: monRealized,
        accruedProfit: monAccrued
      };
    });

    realizedProfitTotal = monthlyTrends.reduce((acc: number, m) => acc + m.realizedProfit, 0);
    accruedProfitTotal = monthlyTrends.reduce((acc: number, m) => acc + m.accruedProfit, 0);

    return {
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalPayouts,
          totalAdjustments,
          realizedProfit: realizedProfitTotal,
          accruedProfit: accruedProfitTotal,
          netProfit: realizedProfitTotal + accruedProfitTotal
        },
        monthlyTrends
      }
    };

  } catch (error: unknown) {
    console.error("[getFinancialAnalyticsAction] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Deep type for Yearly Finance Export to prevent 'any' in result mapping
 */
type ExportFinanceDealRow = {
  id: string;
  closed_at: string | null;
  commission_amount: number | null;
  property: { title: string } | null;
  commissions: {
    amount: number;
    status: CommissionStatus;
    wht_amount: number;
    net_amount: number;
    agent: {
      full_name: string | null;
      tax_id: string | null;
      tax_address: string | null;
    } | null;
    adjustments: {
      amount: number;
      description: string;
    }[];
  }[];
};

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

    (data as unknown as ExportFinanceDealRow[] || []).forEach((deal) => {
      const commissions = (deal.commissions || []);
      const totalPayouts = commissions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
      
      const allAdjustments = commissions.flatMap(c => (c.adjustments || []));
      const totalAdjustments = allAdjustments.reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
      
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

    const { data: dealYears, error: dealErr } = await supabase.rpc("get_distinct_finance_years");

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

    return { success: true, data: (dealYears as unknown as number[]) || [] };

  } catch (error: unknown) {
    console.error("[getAvailableFinancialYearsAction] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
