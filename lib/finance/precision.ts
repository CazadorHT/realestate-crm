import Decimal from "decimal.js";

/**
 * 💰 Financial Precision Engine
 * Uses decimal.js to prevent floating point errors in currency calculations.
 */

// Global configuration for currency math
// Standard for THB: 20 precision digits, Round half up (0.5+)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export const FinanceMath = {
  /**
   * Safe Decimal Creation
   */
  toDecimal: (val: any): Decimal => {
    if (val === null || val === undefined || isNaN(Number(val))) return new Decimal(0);
    return new Decimal(val);
  },

  /**
   * Adds multiple amounts with high precision
   */
  add: (amounts: (number | string | Decimal | null | undefined)[]): Decimal => {
    return amounts.reduce(
      (acc: Decimal, val) => acc.plus(FinanceMath.toDecimal(val)), 
      new Decimal(0)
    );
  },

  /**
   * Subtracts amounts from a base
   */
  sub: (
    base: number | string | Decimal, 
    toSub: (number | string | Decimal | null | undefined)[]
  ): Decimal => {
    const totalSub = toSub.reduce(
      (acc: Decimal, val) => acc.plus(FinanceMath.toDecimal(val)), 
      new Decimal(0)
    );
    return FinanceMath.toDecimal(base).minus(totalSub);
  },

  /**
   * Calculates WHT (3%) for Thailand tax standards
   */
  calculateWht: (grossAmount: number | string | Decimal): Decimal => {
    return FinanceMath.toDecimal(grossAmount)
      .mul(0.03)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  },

  /**
   * Calculates Net Payout after Tax and Adjustments
   * Logic: (Gross - WHT) + Sum(Adjustments)
   */
  calculateNetPayout: (
    grossAmount: number | string | Decimal,
    whtAmount: number | string | Decimal,
    adjustments: { amount: number | string | Decimal | null | undefined }[]
  ): Decimal => {
    const baseNet = FinanceMath.toDecimal(grossAmount).minus(FinanceMath.toDecimal(whtAmount));
    const totalAdjustments = adjustments.reduce(
      (acc: Decimal, adj) => acc.plus(FinanceMath.toDecimal(adj?.amount)), 
      new Decimal(0)
    );
    return baseNet.plus(totalAdjustments).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  },

  /**
   * Formats for DB storage (converts Decimal to plain number)
   */
  toNumber: (value: Decimal | number | string): number => {
    return FinanceMath.toDecimal(value).toNumber();
  },

  /**
   * Formats for UI display (Thai Currency Style)
   * Example: 1,250.50
   */
  format: (value: Decimal | number | string): string => {
    return FinanceMath.toDecimal(value).toNumber().toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
};