export interface CommissionTier {
  minPrice: number;
  maxPrice: number | null; // null means no upper limit
  percentage: number;
}

export interface CommissionRuleSet {
  type: "FLAT" | "TIERED";
  flatPercentage?: number;
  tiers?: CommissionTier[];
}

/**
 * Calculates commission based on a price and a set of rules.
 */
export function calculateCommission(
  price: number,
  ruleSet: CommissionRuleSet,
): number {
  if (price < 0) return 0;

  if (ruleSet.type === "FLAT") {
    return (price * (ruleSet.flatPercentage || 0)) / 100;
  }

  if (ruleSet.type === "TIERED" && ruleSet.tiers) {
    // Standard real estate tiered logic:
    // Usually, the price is looked up in a bracket,
    // OR it's cumulative (x% of first 1M, y% of next 5M).
    // For simplicity, we'll implement the "Bracket" logic first (most common in CRM settings),
    // but can be adjusted to "Cumulative" if needed.

    const tier = ruleSet.tiers.find(
      (t) =>
        price >= t.minPrice && (t.maxPrice === null || price <= t.maxPrice),
    );

    if (tier) {
      return (price * tier.percentage) / 100;
    }
  }

  return 0;
}

/**
 * Split commission between company and agent based on a split ratio (agent's cut).
 */
export function splitCommission(
  totalCommission: number,
  agentCutPercentage: number,
): { companyAmount: number; agentAmount: number } {
  const agentAmount = (totalCommission * agentCutPercentage) / 100;
  return {
    companyAmount: totalCommission - agentAmount,
    agentAmount,
  };
}
