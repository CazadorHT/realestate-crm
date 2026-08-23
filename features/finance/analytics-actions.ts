"use server";

import { requireAuthContext, assertAdminOrManager, authzFail } from "@/lib/authz";
import { FinanceMath } from "@/lib/finance/precision";
import { generateExcelBuffer, generateMultiSheetExcelBuffer, ExcelColumn } from "@/lib/excel-export";
import { Database } from "@/lib/database.types.generated";
import { CommissionStatus } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database as LegacyDatabase } from "@/lib/database.types.generated";

export type ExtendedDatabase = Database & {
  public: {
    Functions: Database["public"]["Functions"] & {
      get_financial_analytics_v1: {
        Args: { p_year: number; p_tenant_id?: string };
        Returns: FinancialAnalyticsData;
      };
      get_distinct_finance_years: {
        Args: Record<string, never>;
        Returns: number[];
      };
    };
  };
};

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

type DealRevenueRow = { commission_total: number | null; closed_at: string | null };
type DealCommissionRow = { amount: number | null; created_at: string | null; status: string | null };

/**
 * Fetches deep financial analytics for the P&L Dashboard.
 * Supports cross-branch (tenant) visualization if tenantId is not provided in context.
 */
export async function getFinancialAnalyticsAction(year?: number): Promise<{ success: boolean; data?: FinancialAnalyticsData; error?: string }> {
  try {
    const { supabase, role, tenantId: currentTenantId } = await requireAuthContext();
    assertAdminOrManager(role);

    const legacySupabase = supabase as unknown as SupabaseClient<ExtendedDatabase>;
    const targetYear = year || new Date().getFullYear();
    const tId = currentTenantId && currentTenantId !== "ALL" ? currentTenantId : undefined;

    // 🛡️ Phase 1: High-Performance SQL Aggregation (Primary)
    const { data: rpcData, error: rpcErr } = await legacySupabase.rpc("get_financial_analytics_v1", {
      p_year: targetYear,
      p_tenant_id: tId
    });

    if (!rpcErr && rpcData) {
      console.log(`[getFinancialAnalyticsAction] RPC Success for year ${targetYear}`);
      return { success: true, data: rpcData as unknown as FinancialAnalyticsData };
    }

    // 🛡️ Phase 2: Manual JS Fallback (If RPC is missing or fails)
    console.warn("[getFinancialAnalyticsAction] RPC Failed or Missing, falling back to manual aggregation:", rpcErr);
    
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // 1. Fetch Revenue (Deals)
    let dealsQuery = legacySupabase
      .from("crm_deals_v3")
      .select("commission_total, closed_at")
      .not("commission_total", "is", null)
      .gte("closed_at", startDate)
      .lte("closed_at", endDate)
      .eq("status", "CLOSED_WIN");
    
    if (tId) dealsQuery = dealsQuery.eq("tenant_id", tId);
    const { data: dealsData, error: dealsErr } = await dealsQuery;
    if (dealsErr) throw dealsErr;

    // 2. Fetch Payouts (Agent Shares)
    let payoutsQuery = legacySupabase
      .from("crm_deal_commissions_v3")
      .select("amount, created_at, status")
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (tId) payoutsQuery = payoutsQuery.eq("tenant_id", tId);
    const { data: payoutsData, error: payoutsErr } = await payoutsQuery;
    if (payoutsErr) throw payoutsErr;

    const typedDeals = (dealsData as unknown as DealRevenueRow[]) || [];
    const typedPayouts = (payoutsData as unknown as DealCommissionRow[]) || [];

    // --- High-Precision Calculation Engine ---
    const totalRevenue = typedDeals.reduce((acc, d) => acc + (d.commission_total || 0), 0);
    const totalPayouts = typedPayouts.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalAdjustments = 0; // Adjustments are deprecated in V3 Core
    
    let realizedProfitTotal = 0;
    let accruedProfitTotal = 0;

    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${targetYear}-${(i + 1).toString().padStart(2, "0")}`;
      
      const monRevenue = typedDeals
        .filter((d) => (d.closed_at || "")?.startsWith(monthStr))
        .reduce((acc, d) => acc + (d.commission_total || 0), 0);
      
      const monPayouts = typedPayouts
        .filter((p) => (p.created_at || "")?.startsWith(monthStr))
        .reduce((acc, p) => acc + (p.amount || 0), 0);

      const monAdjustmentsView = 0;

      const monPaidPayouts = typedPayouts
        .filter((p) => (p.created_at || "")?.startsWith(monthStr) && p.status === "PAID")
        .reduce((acc, p) => acc + (p.amount || 0), 0);
      
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

    realizedProfitTotal = monthlyTrends.reduce((acc, m) => acc + m.realizedProfit, 0);
    accruedProfitTotal = monthlyTrends.reduce((acc, m) => acc + m.accruedProfit, 0);

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
  commission_total: number | null;
  property: { 
    details: { 
      title: { th?: string; en?: string } | null 
    } | null 
  } | null;
  commissions: {
    amount: number;
    status: CommissionStatus;
    tax_amount: number;
    net_amount: number;
    recipient: {
      display_name: string | null;
    } | null;
  }[];
};

/**
 * Exports a full yearly financial report to Excel (Cross-branch supported).
 */
export async function exportYearlyFinanceAction(year?: number): Promise<ExportActionResponse> {
  try {
    const { supabase, role } = await requireAuthContext();
    assertAdminOrManager(role);

    const legacySupabase = supabase as unknown as SupabaseClient<Database>;
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // 1. Fetch Deals with their related commissions and adjustments
    const { data, error } = await legacySupabase
      .from("crm_deals_v3")
      .select(`
        id,
        closed_at,
        commission_total,
        property:properties_core(
          details:properties_details(title)
        ),
        commissions:crm_deal_commissions_v3(
          amount, 
          status, 
          tax_amount, 
          net_amount, 
          recipient:identities_v3(display_name)
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
      
      const totalAdjustments = 0;
      
      const revenue = Number(deal.commission_total) || 0;
      
      // Sheet 1: Main Summary
      summaryData.push({
        date: deal.closed_at,
        property: deal.property?.details?.title?.th || deal.property?.details?.title?.en || "-",
        revenue: revenue,
        payouts: totalPayouts,
        adjustments: totalAdjustments,
        profit: revenue - totalPayouts + totalAdjustments
      });

      // Sheet 2 & 3: WHT Categories
      commissions.forEach((c) => {
        if (c.tax_amount > 0) {
          const whtRow = {
            date: deal.closed_at,
            agent: c.recipient?.display_name || "-",
            tax_id: "-", // Obfuscated in V3 Identity Engine
            address: "-", // Obfuscated in V3 Identity Engine
            gross: c.amount,
            wht: c.tax_amount,
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
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const isEn = (cookieStore.get("language")?.value || "th") === "en";

    const summaryColumns = [
      { 
        key: "date", 
        header: isEn ? "Closed Date" : "วันที่ดีลจบ", 
        width: 15, 
        format: (v: unknown) => new Date(v as string).toLocaleDateString(isEn ? "en-US" : "th-TH") 
      },
      { key: "property", header: isEn ? "Property / Project" : "ทรัพย์/โครงการ", width: 35 },
      { key: "revenue", header: isEn ? "Company Revenue" : "รายได้บริษัท", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "payouts", header: isEn ? "Agent Payouts" : "ยอดจ่ายเอเยนต์", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "adjustments", header: isEn ? "Adjustments (±)" : "ยอดปรับปรุง (±)", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "profit", header: isEn ? "Net Profit" : "กำไรสุทธิ", width: 18, format: (v: unknown) => FinanceMath.format(v as number) }
    ];

    const whtColumns = [
      { 
        key: "date", 
        header: isEn ? "Transaction Date" : "วันที่รายการ", 
        width: 15, 
        format: (v: unknown) => new Date(v as string).toLocaleDateString(isEn ? "en-US" : "th-TH") 
      },
      { key: "agent", header: isEn ? "Payee Name" : "ชื่อผู้รับเงิน", width: 25 },
      { key: "tax_id", header: isEn ? "Tax ID" : "เลขผู้เสียภาษี/ID", width: 20 },
      { key: "address", header: isEn ? "Address" : "ที่อยู่ตามบัตร", width: 40 },
      { key: "gross", header: isEn ? "Gross Amount" : "ยอดก่อนหัก (Gross)", width: 18, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "wht", header: isEn ? "Tax (3%)" : "ภาษี (3%)", width: 15, format: (v: unknown) => FinanceMath.format(v as number) },
      { key: "net", header: isEn ? "Net Payout" : "ยอดรับสุทธิ", width: 18, format: (v: unknown) => FinanceMath.format(v as number) }
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

    const legacySupabase = supabase as unknown as SupabaseClient<ExtendedDatabase>;
    const { data: dealYears, error: dealErr } = await legacySupabase.rpc("get_distinct_finance_years");

    if (dealErr) {
       const err = dealErr as { code?: string; message?: string };
       // 🛡️ Silent Fallback: Only log if it's NOT a "Function not found" error
       if (err.code !== "PGRST202") {
          console.error("RPC Error:", err);
       }
       
       console.log("Switching to high-reliability manual query fallback...");
       
       const { data: dData } = await legacySupabase.from("crm_deals_v3").select("closed_at").not("closed_at", "is", null);
       const { data: cData } = await legacySupabase.from("crm_deal_commissions_v3").select("created_at").not("created_at", "is", null);

       const typedDeals = (dData as unknown as { closed_at: string | null }[]) || [];
       const typedComms = (cData as unknown as { created_at: string | null }[]) || [];

       const years = new Set<number>();
       typedDeals.forEach((d) => {
         if (d.closed_at) years.add(new Date(d.closed_at).getFullYear());
       });
       typedComms.forEach((c) => {
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
