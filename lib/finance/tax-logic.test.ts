import { describe, it, expect } from "vitest";
import { TaxLogic } from "./tax-logic";

describe("TaxLogic - Hierarchy & Sanitization Hardening", () => {
  describe("resolveTaxRate", () => {
    it("should prioritize Agent rate over Tenant and Global", () => {
      const rate = TaxLogic.resolveTaxRate({
        agentTaxRate: 0.05,
        tenantTaxRate: 0.03,
        globalDefaultRate: 0.01,
      });
      expect(rate).toBe(0.05);
    });

    it("should prioritize Tenant rate over Global if Agent rate is missing", () => {
      const rate = TaxLogic.resolveTaxRate({
        agentTaxRate: null,
        tenantTaxRate: 0.03,
        globalDefaultRate: 0.01,
      });
      expect(rate).toBe(0.03);
    });

    it("should fallback to Global default if both Agent and Tenant rates are missing", () => {
      const rate = TaxLogic.resolveTaxRate({
        agentTaxRate: undefined,
        tenantTaxRate: null,
        globalDefaultRate: 0.03,
      });
      expect(rate).toBe(0.03);
    });

    it("should use 3% as the hard-coded global default if nothing is provided", () => {
      const rate = TaxLogic.resolveTaxRate({});
      expect(rate).toBe(0.03);
    });
  });

  describe("sanitizeRate", () => {
    it("should prevent negative tax rates", () => {
      expect(TaxLogic.sanitizeRate(-0.01)).toBe(0);
    });

    it("should cap tax rates at 100% (1.0)", () => {
      expect(TaxLogic.sanitizeRate(1.5)).toBe(1);
    });

    it("should allow valid rates between 0 and 1", () => {
      expect(TaxLogic.sanitizeRate(0.03)).toBe(0.03);
      expect(TaxLogic.sanitizeRate(0)).toBe(0);
      expect(TaxLogic.sanitizeRate(1)).toBe(1);
    });
  });

  describe("percentToDecimal", () => {
    it("should convert percentage numbers to decimals", () => {
      expect(TaxLogic.percentToDecimal(3)).toBe(0.03);
      expect(TaxLogic.percentToDecimal(5.5)).toBe(0.055);
    });

    it("should handle string inputs safely", () => {
      expect(TaxLogic.percentToDecimal("3")).toBe(0.03);
      expect(TaxLogic.percentToDecimal("5.5")).toBe(0.055);
    });

    it("should return 0 for invalid inputs", () => {
      expect(TaxLogic.percentToDecimal(null)).toBe(0);
      expect(TaxLogic.percentToDecimal(undefined)).toBe(0);
      expect(TaxLogic.percentToDecimal("invalid")).toBe(0);
    });

    it("should handle mixed numeric strings safely", () => {
      expect(TaxLogic.percentToDecimal("3.5%")).toBe(0.035);
    });
  });

  describe("Fail-safe & Edge Cases", () => {
    it("should handle extremely large tax rates by capping them", () => {
      // 500% should be capped at 100% by sanitizeRate
      const rawRate = TaxLogic.percentToDecimal(500);
      expect(TaxLogic.sanitizeRate(rawRate)).toBe(1);
    });

    it("should treat negative input as 0% tax", () => {
      const rawRate = TaxLogic.percentToDecimal(-10);
      expect(TaxLogic.sanitizeRate(rawRate)).toBe(0);
    });

    it("should handle 0% tax explicitly", () => {
      const rate = TaxLogic.resolveTaxRate({
        agentTaxRate: 0,
        tenantTaxRate: 0.03,
      });
      expect(rate).toBe(0);
    });
  });
});
