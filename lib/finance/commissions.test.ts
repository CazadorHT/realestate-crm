import { describe, it, expect } from 'vitest';
import { 
  calculateCommission, 
  calculateAdvancedSplit, 
  CommissionRuleSet, 
  roundToTwo,
  FinanceError
} from './commissions';

describe('Commission Calculation Engine (Hardened)', () => {
  describe('roundToTwo Utility', () => {
    it('should round standard decimals correctly', () => {
      expect(roundToTwo(10.555)).toBe(10.56);
      expect(roundToTwo(10.554)).toBe(10.55);
    });

    it('should handle floating point drift (0.1 + 0.2)', () => {
      expect(roundToTwo(0.1 + 0.2)).toBe(0.3);
    });
  });

  describe('calculateCommission (Precision & Boundaries)', () => {
    it('should calculate flat percentage with rounding', () => {
      const rules: CommissionRuleSet = { type: 'FLAT', flatPercentage: 3.33 };
      // 1,000,000 * 0.0333 = 33300
      expect(calculateCommission(1000000, rules)).toBe(33300);
      
      // 99.99 * 0.0333 = 3.329667 -> 3.33
      expect(calculateCommission(99.99, rules)).toBe(3.33);
    });

    it('should handle continuous boundaries in tiered commissions', () => {
      const rules: CommissionRuleSet = {
        type: 'TIERED',
        tiers: [
          { minPrice: 0, maxPrice: 1000000, percentage: 2 },
          { minPrice: 1000000, maxPrice: null, percentage: 3 },
        ],
      };
      
      // Boundary value: 1,000,000 should belong to Tier 1 [0, 1000000]
      expect(calculateCommission(1000000, rules)).toBe(20000);
      
      // Just above boundary: 1,000,000.01 should belong to Tier 2 (1000000, null]
      expect(calculateCommission(1000000.01, rules)).toBe(30000);
    });

    it('should throw FinanceError for invalid FLAT rules', () => {
      const rules: CommissionRuleSet = { type: 'FLAT', flatPercentage: 150 };
      expect(() => calculateCommission(100, rules)).toThrow(FinanceError);
    });

    it('should throw FinanceError for empty TIERED rules', () => {
      const rules: CommissionRuleSet = { type: 'TIERED', tiers: [] };
      expect(() => calculateCommission(100, rules)).toThrow(FinanceError);
    });

    it('should throw FinanceError for overlapping tiers', () => {
      const rules: CommissionRuleSet = {
        type: 'TIERED',
        tiers: [
          { minPrice: 0, maxPrice: 1000000, percentage: 2 },
          { minPrice: 500000, maxPrice: null, percentage: 3 }, // Overlap with Tier 1
        ],
      };
      expect(() => calculateCommission(1200000, rules)).toThrow(/ซ้อนทับกัน/);
    });
  });

  describe('calculateAdvancedSplit (Safety & Scaling)', () => {
    const validConfig = {
      listingPercent: 30,
      closingPercent: 50,
      agencyPercent: 20,
    };

    it('should prevent invalid team pool percentage', () => {
      expect(() => calculateAdvancedSplit(1000, { ...validConfig, enableTeamPool: true, teamPoolPercent: 150 }, {})).toThrow(/Team Pool/);
      expect(() => calculateAdvancedSplit(1000, { ...validConfig, enableTeamPool: true, teamPoolPercent: -10 }, {})).toThrow(/Team Pool/);
    });

    it('should split with high precision including WHT', () => {
      const total = 999.99;
      const agents = { listingAgentId: 'agent-1', closingAgentId: 'agent-2' };
      const results = calculateAdvancedSplit(total, { ...validConfig, enableTeamPool: false }, agents);

      const listing = results.find(r => r.role === 'LISTING');
      const closing = results.find(r => r.role === 'CLOSING');
      const agency = results.find(r => r.role === 'AGENCY');

      // Manual calc: 999.99 * 0.3 = 299.997 -> 300.00
      expect(listing?.amount).toBe(300.00);
      expect(listing?.whtAmount).toBe(9.00); // 3% of 300
      expect(listing?.netAmount).toBe(291.00);

      // Total sum check
      const sum = results.reduce((s, r) => s + r.amount, 0);
      expect(sum).toBe(1000.00); // due to precision rounding from 999.997 / 499.995 / 199.998
    });

    it('should prevent over-allocation (Sum > 100%)', () => {
      const invalidConfig = {
        listingPercent: 50,
        closingPercent: 50,
        agencyPercent: 50, // Sum = 150
      };
      expect(() => calculateAdvancedSplit(1000, invalidConfig, {})).toThrow(FinanceError);
    });

    it('should scale listing/closing based on team pool', () => {
      const total = 100000;
      const poolConfig = { ...validConfig, enableTeamPool: true, teamPoolPercent: 10 };
      const results = calculateAdvancedSplit(total, poolConfig, {});

      const pool = results.find(r => r.role === 'TEAM_POOL');
      const listing = results.find(r => r.role === 'LISTING');

      expect(pool?.amount).toBe(10000);
      // Listing: 30% of remaining 90% = 27%
      expect(listing?.percentage).toBe(27);
      expect(listing?.amount).toBe(27000);
    });
  });
});
