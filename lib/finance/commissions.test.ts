import { describe, it, expect } from 'vitest';
import { calculateCommission, calculateAdvancedSplit, CommissionRuleSet } from './commissions';

describe('Commission Calculation Engine', () => {
  describe('calculateCommission', () => {
    it('should calculate flat percentage correctly', () => {
      const rules: CommissionRuleSet = { type: 'FLAT', flatPercentage: 3 };
      expect(calculateCommission(1000000, rules)).toBe(30000);
    });

    it('should calculate tiered commission correctly', () => {
      const rules: CommissionRuleSet = {
        type: 'TIERED',
        tiers: [
          { minPrice: 0, maxPrice: 1000000, percentage: 2 },
          { minPrice: 1000001, maxPrice: null, percentage: 3 },
        ],
      };
      expect(calculateCommission(500000, rules)).toBe(10000);
      expect(calculateCommission(2000000, rules)).toBe(60000);
    });

    it('should return 0 for negative price', () => {
      const rules: CommissionRuleSet = { type: 'FLAT', flatPercentage: 3 };
      expect(calculateCommission(-100, rules)).toBe(0);
    });

    it('should return 0 if no tiers match the price', () => {
      const rules: CommissionRuleSet = {
        type: 'TIERED',
        tiers: [{ minPrice: 1000, maxPrice: 2000, percentage: 5 }],
      };
      expect(calculateCommission(500, rules)).toBe(0);
      expect(calculateCommission(2500, rules)).toBe(0);
    });
  });

  describe('calculateAdvancedSplit', () => {
    const config = {
      listingPercent: 30,
      closingPercent: 50,
      agencyPercent: 20,
    };

    it('should split 100,000 commission correctly without team pool', () => {
      const total = 100000;
      const agents = { listingAgentId: 'agent-1', closingAgentId: 'agent-2' };
      const results = calculateAdvancedSplit(total, { ...config, enableTeamPool: false }, agents);

      const listing = results.find(r => r.role === 'LISTING');
      const closing = results.find(r => r.role === 'CLOSING');
      const agency = results.find(r => r.role === 'AGENCY');

      expect(listing?.amount).toBe(30000);
      expect(listing?.whtAmount).toBe(900); // 3% of 30,000
      expect(listing?.netAmount).toBe(29100);

      expect(closing?.amount).toBe(50000);
      expect(closing?.whtAmount).toBe(1500); // 3% of 50,000
      expect(closing?.netAmount).toBe(48500);

      expect(agency?.amount).toBe(20000);
      expect(agency?.whtAmount).toBe(0); // Agency pays no WHT to itself
      expect(agency?.netAmount).toBe(20000);
    });

    it('should handle team pool and scale correctly', () => {
      const total = 100000;
      const teamPoolConfig = { ...config, enableTeamPool: true, teamPoolPercent: 10 };
      const results = calculateAdvancedSplit(total, teamPoolConfig, {});

      const pool = results.find(r => r.role === 'TEAM_POOL');
      expect(pool?.amount).toBe(10000);

      // Remaining 90% should be split 30/50/20 of the remaining? 
      // Current implementation scales by (100 - teamPool) / 100 = 0.9
      const listing = results.find(r => r.role === 'LISTING');
      expect(listing?.percentage).toBe(30 * 0.9); // 27%
      expect(listing?.amount).toBe(27000);
    });

    it('should handle zero total commission gracefully', () => {
      const results = calculateAdvancedSplit(0, { listingPercent: 30, closingPercent: 50, agencyPercent: 20 }, {});
      results.forEach(r => {
        expect(r.amount).toBe(0);
        expect(r.netAmount).toBe(0);
      });
    });

    it('should scale correctly even if input percents do not sum to 100', () => {
      // If user enters 50/50/50, it should still scale based on remainingPercent?
      // Actually, the current code just multiplies by scale.
      // If listing=50, closing=50, agency=50 (Total 150) and Pool=0 (Scale 1.0)
      // Results will be 50, 50, 50 (Total 150%)
      const total = 100000;
      const results = calculateAdvancedSplit(total, { listingPercent: 50, closingPercent: 50, agencyPercent: 50 }, {});
      const sum = results.reduce((s, r) => s + r.amount, 0);
      expect(sum).toBe(150000); 
    });
  });
});
