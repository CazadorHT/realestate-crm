export interface CommissionTier {
  minPrice: number;
  maxPrice: number | null; // null means no upper limit
  percentage: number;
}

export interface CommissionRuleSet {
  type: "FLAT" | "TIERED";
  flatPercentage?: number;
  tiers?: CommissionTier[];

  // Advanced Split Settings
  defaultListingPercent?: number;
  defaultClosingPercent?: number;
  defaultAgencyPercent?: number;
  defaultTeamPoolPercent?: number;
  enableTeamPoolByDefault?: boolean;
  enableAdvancedSplit?: boolean;
}

export type CommissionRole =
  | "LISTING"
  | "CLOSING"
  | "AGENCY"
  | "CO_AGENT"
  | "TEAM_POOL";

export interface CommissionSplitResult {
  role: CommissionRole;
  percentage: number;
  amount: number;
  whtAmount: number;
  netAmount: number;
  agentId?: string;
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
 * Traditional simple split.
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

/**
 * Advanced Commission Splitting (Listing 30%, Closing 50%, Agency 20%)
 * Includes WHT 3% calculation.
 */
export function calculateAdvancedSplit(
  totalCommission: number,
  config: {
    listingPercent: number;
    closingPercent: number;
    agencyPercent: number;
    teamPoolPercent?: number;
    enableTeamPool?: boolean;
  },
  agents: {
    listingAgentId?: string;
    closingAgentId?: string;
    coAgentId?: string;
  },
): CommissionSplitResult[] {
  const results: CommissionSplitResult[] = [];
  const WHT_RATE = 3;

  let remainingPercent = 100;

  // 1. Team Pool (Optional)
  if (config.enableTeamPool && config.teamPoolPercent) {
    const amount = (totalCommission * config.teamPoolPercent) / 100;
    results.push({
      role: "TEAM_POOL",
      percentage: config.teamPoolPercent,
      amount,
      whtAmount: 0, // Usually no WHT for internal pool
      netAmount: amount,
    });
    remainingPercent -= config.teamPoolPercent;
  }

  // Calculate ratios based on remaining 100% or adjusted?
  // User said: Listing 30%, Closing 50%, Agency 20% (Total 100%)
  // If Team Pool 2% is enabled, we might want to scale or just subtract from Agency.
  // Standard agency behavior: Team pool comes out of Agency cut or is fixed.
  // Let's assume the user wants it fixed and the rest split proportionally.

  const scale = remainingPercent / 100;

  const roles: { role: CommissionRole; pct: number; id?: string }[] = [
    { role: "LISTING", pct: config.listingPercent, id: agents.listingAgentId },
    { role: "CLOSING", pct: config.closingPercent, id: agents.closingAgentId },
    { role: "AGENCY", pct: config.agencyPercent },
  ];

  roles.forEach((r) => {
    const actualPct = r.pct * scale;
    const amount = (totalCommission * actualPct) / 100;
    const whtAmount = r.role !== "AGENCY" ? (amount * WHT_RATE) / 100 : 0; // Agency doesn't pay WHT to itself

    results.push({
      role: r.role,
      percentage: actualPct,
      amount,
      whtAmount,
      netAmount: amount - whtAmount,
      agentId: r.id,
    });
  });

  return results;
}
