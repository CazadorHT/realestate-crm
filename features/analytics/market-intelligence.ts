"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types";

export type ForecastData = {
  month: string;
  actualRevenue: number;
  predictedRevenue: number;
  confidenceScore: number;
};

export type LeadStage = Database["public"]["Enums"]["lead_stage"];

const STAGE_PROBABILITY: Record<LeadStage, number> = {
  "NEW": 0.05,
  "CONTACTED": 0.15,
  "VIEWED": 0.30,
  "NEGOTIATING": 0.60,
  "CLOSED": 1.00,
};

/**
 * 🔮 AI Market Intelligence Service
 * Predicts revenue for the next 6 months based on deal pipeline and lead quality.
 */
export async function getRevenueForecastAction(days: number = 180) {
  const supabase = await createClient();

  // 1. Get Historical Actual Revenue (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: pastDeals } = await supabase
    .from("deals")
    .select("commission_amount, closed_at")
    .eq("status", "CLOSED_WIN")
    .gte("closed_at", sixMonthsAgo.toISOString());

  // 2. Get Current Pipeline for Prediction
  const { data: activeLeads } = await supabase
    .from("leads")
    .select("id, budget_max, stage, ai_score, created_at")
    .not("stage", "eq", "CLOSED");

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
  pastDeals?.forEach((deal: { commission_amount: number | null, closed_at: string | null }) => {
    if (!deal.closed_at) return;
    const date = new Date(deal.closed_at);
    const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (forecast[monthKey]) {
      forecast[monthKey].actualRevenue += Number(deal.commission_amount || 0);
    }
  });

  // Calculate Predictions
  activeLeads?.forEach((lead: { id: string, budget_max: number | null, stage: string, ai_score: number | null }) => {
    const baseProb = STAGE_PROBABILITY[lead.stage as LeadStage] || 0;
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

  return Object.values(forecast).sort((a, b) => {
    // Simple sort by month/year (could be improved)
    return 0; 
  });
}
