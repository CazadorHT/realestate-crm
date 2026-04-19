/**
 * Financial Calculation Utilities for Real Estate CRM
 */

export class FinanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceError";
  }
}

/**
 * Ensures financial precision by rounding to 2 decimal places (standard for THB).
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

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
  
  // Tax Settings
  defaultWhtRate?: number; // Example: 3 for 3%
}

/**
 * Validates that a rule set is logically sound.
 */
export function validateRuleSet(ruleSet: CommissionRuleSet): void {
  if (ruleSet.type === "FLAT") {
    if (
      ruleSet.flatPercentage === undefined ||
      ruleSet.flatPercentage < 0 ||
      ruleSet.flatPercentage > 100
    ) {
      throw new FinanceError("เปอร์เซ็นต์คอมมิชชันต้องอยู่ระหว่าง 0 ถึง 100");
    }
  }

  if (ruleSet.type === "TIERED") {
    if (!ruleSet.tiers || ruleSet.tiers.length === 0) {
      throw new FinanceError("ระบบคอมมิชชันแบบขั้นบันไดต้องมีอย่างน้อย 1 ขั้น");
    }

    let lastMax: number | null = -1;
    ruleSet.tiers.forEach((t: CommissionTier, idx: number) => {
      if (t.percentage < 0 || t.percentage > 100) {
        throw new FinanceError(`เปอร์เซ็นต์ในขั้นที่ ${idx + 1} ต้องอยู่ระหว่าง 0 ถึง 100`);
      }
      if (t.minPrice < 0) {
        throw new FinanceError(`ราคาขั้นต่ำในขั้นที่ ${idx + 1} ต้องไม่ติดลบ`);
      }
      if (lastMax !== null && t.minPrice < lastMax) {
        throw new FinanceError(`รอยต่อของขั้นที่ ${idx + 1} ไม่ควรซ้อนทับกัน (ขั้นต่ำปัจุบัน: ${t.minPrice} < ขั้นสูงสุดก่อนหน้า: ${lastMax})`);
      }
      lastMax = t.maxPrice;
    });
  }
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
 * Hardened to handle boundary continuity and precision.
 */
export function calculateCommission(
  price: number,
  ruleSet: CommissionRuleSet,
): number {
  if (price <= 0) return 0;
  validateRuleSet(ruleSet);

  let amount = 0;

  if (ruleSet.type === "FLAT") {
    amount = (price * (ruleSet.flatPercentage || 0)) / 100;
  } else if (ruleSet.type === "TIERED" && ruleSet.tiers) {
    // Gapless boundary matching: [min, max)
    const tier = ruleSet.tiers.find(
      (t) =>
        price > t.minPrice && (t.maxPrice === null || price <= t.maxPrice),
    );

    if (tier) {
      amount = (price * tier.percentage) / 100;
    }
  }

  return roundToTwo(amount);
}

/**
 * Split commission between company and agent based on a split ratio (agent's cut).
 */
export function splitCommission(
  totalCommission: number,
  agentCutPercentage: number,
): { companyAmount: number; agentAmount: number } {
  const agentAmount = roundToTwo((totalCommission * agentCutPercentage) / 100);
  return {
    companyAmount: roundToTwo(totalCommission - agentAmount),
    agentAmount,
  };
}

/**
 * Advanced Commission Splitting (Listing 30%, Closing 50%, Agency 20%)
 * Includes WHT 3% calculation.
 * Hardened with Over-allocation protection and Scaling validation.
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
  taxRate: number = 3,
): CommissionSplitResult[] {
  const results: CommissionSplitResult[] = [];
  const WHT_RATE = taxRate;

  // 1. Input Validation (Hardening)
  if (config.enableTeamPool && (config.teamPoolPercent === undefined || config.teamPoolPercent < 0 || config.teamPoolPercent > 100)) {
    throw new FinanceError("เปอร์เซ็นต์กองกลาง (Team Pool) ต้องอยู่ระหว่าง 0 ถึง 100");
  }

  const inputSum = 
    config.listingPercent + 
    config.closingPercent + 
    config.agencyPercent;
  
  if (inputSum > 100.01 || inputSum < 99.99) {
    throw new FinanceError(`ผลรวมเปอร์เซ็นต์ส่วนแบ่งต้องเท่ากับ 100% (ปัจจุบัน: ${inputSum}%)`);
  }

  let remainingPercent = 100;

  // 1. Team Pool (Optional)
  if (config.enableTeamPool && config.teamPoolPercent) {
    const amount = roundToTwo((totalCommission * config.teamPoolPercent) / 100);
    results.push({
      role: "TEAM_POOL",
      percentage: config.teamPoolPercent,
      amount,
      whtAmount: 0,
      netAmount: amount,
    });
    remainingPercent -= config.teamPoolPercent;
  }

  // Calculate scaling factor based on remaining pool
  const scale = remainingPercent / 100;

  const roles: { role: CommissionRole; pct: number; id?: string }[] = [
    { role: "LISTING", pct: config.listingPercent, id: agents.listingAgentId },
    { role: "CLOSING", pct: config.closingPercent, id: agents.closingAgentId },
    { role: "AGENCY", pct: config.agencyPercent },
  ];

  roles.forEach((r: any) => {
    const actualPct = r.pct * scale;
    const amount = roundToTwo((totalCommission * actualPct) / 100);
    const whtAmount = r.role !== "AGENCY" && r.id ? roundToTwo((amount * WHT_RATE) / 100) : 0;

    results.push({
      role: r.role,
      percentage: roundToTwo(actualPct),
      amount,
      whtAmount,
      netAmount: roundToTwo(amount - whtAmount),
      agentId: r.id,
    });
  });

  return results;
}
