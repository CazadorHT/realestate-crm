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
      const total = 100000;
      const agents = { listingAgentId: 'agent-1', closingAgentId: 'agent-2' };
      const results = calculateAdvancedSplit(total, { ...validConfig, enableTeamPool: false }, agents);

      const listing = results.find(r => r.role === 'LISTING');
      const closing = results.find(r => r.role === 'CLOSING');
      const agency = results.find(r => r.role === 'AGENCY');

      // Manual calc: 100,000 * 0.3 = 30,000
      expect(listing?.amount).toBe(30000);
      expect(listing?.whtAmount).toBe(900); // 3% of 30,000
      expect(listing?.netAmount).toBe(29100);

      // Manual calc: 100,000 * 0.5 = 50,000
      expect(closing?.amount).toBe(50000);
      expect(closing?.whtAmount).toBe(1500); // 3% of 50,000
      expect(closing?.netAmount).toBe(48500);

      expect(agency?.amount).toBe(20000);
      expect(agency?.whtAmount).toBe(0); // Agency role (company) has no WHT in this model
    });

    it('should scale listing/closing based on team pool correctly (Multi-Step Split)', () => {
      const total = 100000;
      // 10% goes to Team Pool first.
      // Remaining 90% is split 30/50/20.
      const poolConfig = { ...validConfig, enableTeamPool: true, teamPoolPercent: 10 };
      const results = calculateAdvancedSplit(total, poolConfig, { listingAgentId: 'agent-1' });

      const pool = results.find(r => r.role === 'TEAM_POOL');
      const listing = results.find(r => r.role === 'LISTING');
      const agency = results.find(r => r.role === 'AGENCY');

      expect(pool?.amount).toBe(10000);
      
      // Listing: 30% of 90% = 27%
      expect(listing?.percentage).toBe(27);
      expect(listing?.amount).toBe(27000);
      expect(listing?.whtAmount).toBe(810); // 3% of 27,000

      // Agency: 20% of 90% = 18%
      expect(agency?.percentage).toBe(18);
      expect(agency?.amount).toBe(18000);
    });

    it('should prevent over-allocation (Sum > 100%)', () => {
      const invalidConfig = {
        listingPercent: 50,
        closingPercent: 50,
        agencyPercent: 50, // Sum = 150
      };
      expect(() => calculateAdvancedSplit(1000, invalidConfig, {})).toThrow(FinanceError);
    });

    it('should handle zero commission gracefully', () => {
      const results = calculateAdvancedSplit(0, validConfig, {});
      expect(results.every(r => r.amount === 0)).toBe(true);
    });
  });
});
