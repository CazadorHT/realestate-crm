import { describe, it, expect } from "vitest";
import { FinanceMath } from "./precision";
import Decimal from "decimal.js";

describe("FinanceMath - Precision Engine Hardening", () => {
  describe("toDecimal", () => {
    it("should convert numbers, strings and handle null/undefined safely", () => {
      expect(FinanceMath.toDecimal(100).toNumber()).toBe(100);
      expect(FinanceMath.toDecimal("100.50").toNumber()).toBe(100.5);
      expect(FinanceMath.toDecimal(null).toNumber()).toBe(0);
      expect(FinanceMath.toDecimal(undefined).toNumber()).toBe(0);
      expect(FinanceMath.toDecimal("invalid").toNumber()).toBe(0);
    });
  });

  describe("calculateWht", () => {
    it("should calculate 3% tax correctly with standard rounding", () => {
      // 1,000 * 0.03 = 30
      expect(FinanceMath.calculateWht(1000).toNumber()).toBe(30);
      
      // 333.33 * 0.03 = 9.9999 -> 10.00
      expect(FinanceMath.calculateWht(333.33, 0.03).toNumber()).toBe(10);
      
      // 100.45 * 0.03 = 3.0135 -> 3.01
      expect(FinanceMath.calculateWht(100.45, 0.03).toNumber()).toBe(3.01);
    });

    it("should handle custom tax rates", () => {
      // 1,000 * 0.05 = 50
      expect(FinanceMath.calculateWht(1000, 0.05).toNumber()).toBe(50);
      // 1,000 * 0.01 = 10
      expect(FinanceMath.calculateWht(1000, 0.01).toNumber()).toBe(10);
    });
  });

  describe("calculateNetPayout", () => {
    it("should calculate (Gross - WHT) + Adjustments accurately", () => {
      const gross = 10000;
      const wht = 300;
      const adjustments = [
        { amount: 500 },  // Bonus
        { amount: -200 }, // Fee
        { amount: -50.25 } // Small deduction
      ];

      // (10000 - 300) + (500 - 200 - 50.25) = 9700 + 249.75 = 9949.75
      const result = FinanceMath.calculateNetPayout(gross, wht, adjustments);
      expect(result.toNumber()).toBe(9949.75);
    });

    it("should handle empty adjustments", () => {
      const result = FinanceMath.calculateNetPayout(1000, 30, []);
      expect(result.toNumber()).toBe(970);
    });

    it("should handle adjustments with null/undefined values", () => {
      const adjustments = [
        { amount: 100 },
        { amount: null },
        { amount: undefined }
      ];
      const result = FinanceMath.calculateNetPayout(1000, 30, adjustments as any);
      expect(result.toNumber()).toBe(1070);
    });
  });

  describe("Formatting", () => {
    it("should format numbers to Thai currency style string", () => {
      expect(FinanceMath.format(1250)).toBe("1,250.00");
      expect(FinanceMath.format(1250.5)).toBe("1,250.50");
      expect(FinanceMath.format(1000000)).toBe("1,000,000.00");
    });
  });

  describe("Rounding Edge Cases", () => {
    it("should follow Banker's Rounding or Standard Round Half Up as configured", () => {
      // Currently configured to ROUND_HALF_UP in precision.ts
      // 1.005 -> 1.01
      expect(FinanceMath.round(1.005).toNumber()).toBe(1.01);
      // 1.004 -> 1.00
      expect(FinanceMath.round(1.004).toNumber()).toBe(1);
    });
  });
});
