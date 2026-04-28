/**
 * 🏛️ Tax Logic Engine
 * Handles resolution and sanitization of tax rates based on hierarchy:
 * Agent (Specific) > Tenant (Branch Default) > Global (System Default)
 */

export interface TaxResolutionInput {
  agentTaxRate?: number | null;
  tenantTaxRate?: number | null;
  globalDefaultRate?: number;
}

export const TaxLogic = {
  /**
   * Resolves the effective tax rate based on the hierarchy.
   * Rates are expected as decimals (e.g., 0.03 for 3%).
   */
  resolveTaxRate(input: TaxResolutionInput): number {
    const { agentTaxRate, tenantTaxRate, globalDefaultRate = 0.03 } = input;

    // 1. Agent-specific rate has highest priority
    if (typeof agentTaxRate === "number" && agentTaxRate >= 0) {
      return agentTaxRate;
    }

    // 2. Tenant (Branch) default rate
    if (typeof tenantTaxRate === "number" && tenantTaxRate >= 0) {
      return tenantTaxRate;
    }

    // 3. System-wide global fallback (Default 3%)
    return globalDefaultRate;
  },

  /**
   * Sanitizes a tax rate value to ensure it's within logical bounds.
   * Prevents negative taxes or rates exceeding 100%.
   */
  sanitizeRate(rate: number): number {
    if (rate < 0) return 0;
    if (rate > 1) return 1; // 100% cap
    return rate;
  },

  /**
   * Helper to convert percentage (e.g. 3) to decimal (0.03) safely
   */
  percentToDecimal(percent: number | string | null | undefined): number {
    if (percent === null || percent === undefined) return 0;
    const val = typeof percent === "string" ? parseFloat(percent) : percent;
    if (isNaN(val)) return 0;
    return val / 100;
  }
};
