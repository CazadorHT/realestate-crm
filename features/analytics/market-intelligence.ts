"use server";

import { requireAuthContext } from "@/lib/authz";

export type ForecastData = {
  month: string;
  actualRevenue: number;
  predictedRevenue: number;
  confidenceScore: number;
};

// V3 Architecture uses string fields instead of Postgres Enums for flexibility
export type LeadStage = "NEW" | "CONTACTED" | "VIEWED" | "NEGOTIATING" | "CLOSED";

const STAGE_PROBABILITY: Record<LeadStage, number> = {
  "NEW": 0.05,
  "CONTACTED": 0.15,
  "VIEWED": 0.30,
  "NEGOTIATING": 0.60,
  "CLOSED": 1.00,
};

/**
 * 🔮 AI Market Intelligence Service (V3 Hardened)
 * Predicts revenue for the next 6 months based on deal pipeline and lead quality.
 * Includes full RLS compliance and tenant isolation.
 */
export async function getRevenueForecastAction(days: number = 180) {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    // 1. Get Historical Actual Revenue (Last 6 months) from crm_deals_v3
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let dealsQuery = supabase
      .from("crm_deals_v3")
      .select("commission_total, closed_at")
      .eq("status", "CLOSED_WIN")
      .gte("closed_at", sixMonthsAgo.toISOString());

    if (tenantId && tenantId !== "ALL") {
      dealsQuery = dealsQuery.eq("tenant_id", tenantId);
    }

    const { data: pastDeals, error: dealsError } = await dealsQuery;
    if (dealsError) {
      console.error("[getRevenueForecastAction] crm_deals_v3 Error:", dealsError);
    }

    // 2. Get Current Pipeline for Prediction from crm_leads_v3
    let leadsQuery = supabase
      .from("crm_leads_v3")
      .select("id, budget_max, stage, ai_score, created_at")
      .not("stage", "eq", "CLOSED");

    if (tenantId && tenantId !== "ALL") {
      leadsQuery = leadsQuery.eq("tenant_id", tenantId);
    }

    const { data: activeLeads, error: leadsError } = await leadsQuery;
    if (leadsError) {
      console.error("[getRevenueForecastAction] crm_leads_v3 Error:", leadsError);
    }

    // 3. Process Forecast Logic
    const forecast: Record<string, ForecastData> = {};

    // Initialize next 6 months
    for (let i = -6; i <= 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      forecast[monthKey] = {
        month: monthKey,
        actualRevenue: 0,
        predictedRevenue: 0,
        confidenceScore: 0
      };
    }

    // Add Actual Revenue
    pastDeals?.forEach((deal) => {
      if (!deal.closed_at) return;
      const date = new Date(deal.closed_at);
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (forecast[monthKey]) {
        forecast[monthKey].actualRevenue += Number(deal.commission_total || 0);
      }
    });

    // Calculate Predictions
    activeLeads?.forEach((lead) => {
      const baseProb = STAGE_PROBABILITY[(lead.stage as LeadStage) || "NEW"] || 0;
      // AI Score Adjustment: 0-100 score adds up to 20% bonus probability
      const aiBonus = (Number(lead.ai_score || 0) / 100) * 0.20;
      const finalProb = Math.min(baseProb + aiBonus, 0.95);
      
      const expectedValue = Number(lead.budget_max || 0) * finalProb * 0.03; // Assume 3% average commission
      
      // Distribute expected value over the next 3 months based on stage
      // Negotiation = month 1, Viewed = month 2, Others = month 3
      let monthOffset = 3;
      if (lead.stage === "NEGOTIATING") monthOffset = 1;
      else if (lead.stage === "VIEWED") monthOffset = 2;

      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + monthOffset);
      const monthKey = targetDate.toLocaleString('default', { month: 'short', year: '2-digit' });

      if (forecast[monthKey]) {
        forecast[monthKey].predictedRevenue += expectedValue;
        // Confidence is average of probabilities
        forecast[monthKey].confidenceScore = (forecast[monthKey].confidenceScore + finalProb) / 2;
      }
    });

    return Object.values(forecast);
  } catch (error) {
    console.error("getRevenueForecastAction Error:", error);
    return [];
  }
}
