import { ExecutiveStats } from "./executive-queries";

/**
 * 🛡️ Elite BI Mathematics Utility
 * Centralized logic for all executive dashboard calculations.
 */

/**
 * Helper: getComparisonDisplayLabel
 * Maps branch IDs to human-readable labels for contextual analysis.
 */
export const getComparisonDisplayLabel = (
  compareTenantId?: string | null,
  allBranches: { id: string; name: string }[] = [],
  isEn: boolean = false
): string => {
  if (!compareTenantId || compareTenantId === "none") return isEn ? "vs last period" : "เทียบงวดก่อน";
  if (compareTenantId === "ALL") return isEn ? "vs All Branches (Global)" : "vs ทุกสาขา (Global)";
  const branch = allBranches.find((b) => b.id === compareTenantId);
  return `vs ${branch?.name || (isEn ? "Selection" : "สาขาที่เลือก")}`;
};

/**
 * Helper: calculateTrendPercentage
 * Robust growth calculation with handle division by zero (Zero-Baseline).
 */
export const calculateTrendPercentage = (
  current: number,
  previous?: number | null,
  compareLabel: string = "vs last period"
): { text: string; value: number } => {
  if (previous === undefined || previous === null) {
    return { text: "No baseline", value: 0 };
  }

  if (previous === 0) {
    return current > 0
      ? { text: `+100% (New) ${compareLabel}`, value: 100 }
      : { text: `0% (Stable) ${compareLabel}`, value: 0 };
  }

  const growth = ((current - previous) / previous) * 100;
  const formatter = new Intl.NumberFormat("th-TH", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "always",
  });

  return {
    text: `${formatter.format(growth / 100)} ${compareLabel}`,
    value: growth,
  };
};

/**
 * Helper: calculateWeightedEfficiencyScore
 * Calculates an overall performance index (0-100) based on weighted metrics.
 * Strategy: Revenue (40%), Deals (30%), Commission (30%)
 */
export const calculateWeightedEfficiencyScore = (
  stats: ExecutiveStats,
  compareStats?: ExecutiveStats | null
): { score: number; trend: string; value: number } => {
  if (!compareStats) {
    return { score: 85, trend: "+0.0% vs target", value: 0 };
  }

  // Achievement Ratios (Baseline is comparison period)
  const revRatio = compareStats.totalRevenue > 0 ? stats.totalRevenue / compareStats.totalRevenue : 1;
  const dealRatio = compareStats.totalDeals > 0 ? stats.totalDeals / compareStats.totalDeals : 1;
  const commRatio = compareStats.totalCommission > 0 ? stats.totalCommission / compareStats.totalCommission : 1;

  // Apply Weights
  const compositeAchievement = revRatio * 0.4 + dealRatio * 0.3 + commRatio * 0.3;
  
  // Baseline 85 is our 'Standard' achievement score
  const score = Math.min(Math.round(compositeAchievement * 85), 100);
  const growth = (compositeAchievement - 1) * 100;

  return {
    score,
    trend: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% efficiency change`,
    value: growth,
  };
};
