import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from './matching';

describe('Smart Match Logic - Hardened Engine', () => {
  const mockProperty: any = {
    id: 'prop-1',
    title: 'Luxury Condo',
    property_type: 'CONDO',
    listing_type: 'RENT',
    rental_price: 50000,
    popular_area: 'ทองหล่อ',
    district: 'วัฒนา',
    subdistrict: 'คลองตันเหนือ',
    near_transit: false,
  };

  const baseCriteria: any = {
    purpose: 'RENT',
    budgetMin: 40000,
    budgetMax: 60000,
    area: 'ทองหล่อ',
    propertyType: 'CONDO',
    nearTransit: false,
  };

  it('should give 100% score for a perfect match', () => {
    const result = calculateMatchScore(mockProperty, baseCriteria);
    expect(result.score).toBe(100); 
    expect(result.reasons).toContain('budget_ok');
    expect(result.reasons).toContain('area_exact');
  });

  it('should handle inverted budget ranges (Hardening: Min > Max)', () => {
    // Min 60k, Max 40k -> Should swap to Min 40k, Max 60k
    const criteria = { ...baseCriteria, budgetMin: 60000, budgetMax: 40000 };
    const result = calculateMatchScore(mockProperty, criteria);
    expect(result.reasons).toContain('budget_ok');
    expect(result.score).toBe(100);
  });

  it('should strictly penalize purpose mismatch', () => {
    // Asking for BUY but property is RNT (Rent)
    const critForSale = { ...baseCriteria, purpose: 'BUY' };
    const result = calculateMatchScore(mockProperty, critForSale);
    // Purpose score should be 0. 
    // Price(40) + Area(30) + Type(30) = 100? 
    // Wait, let's check purpose points. Score breakdown should show purpose: 0.
    const purposeEntry = result.scoreBreakdown.find(b => b.label === 'purpose');
    expect(purposeEntry).toBeUndefined(); // No points given for mismatched purpose
    expect(result.reasons).not.toContain('investment');
  });

  it('should resolve Office Building per-sqm price', () => {
    const officeProp: any = {
      property_type: 'OFFICE_BUILDING',
      size_sqm: 100,
      rent_price_per_sqm: 500, // 50,000 total
      listing_type: 'RENT'
    };
    const result = calculateMatchScore(officeProp, baseCriteria);
    expect(result.reasons).toContain('budget_ok');
  });

  it('should handle missing critical fields gracefully (Broken Data)', () => {
    const brokenProp: any = {
      id: 'broken-1',
      title: 'Unknown',
      // Missing price, area, type
    };
    const result = calculateMatchScore(brokenProp, baseCriteria);
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });

  it('should handle partial budget matches (Near/Slightly Over)', () => {
    const propertyAt55k = { ...mockProperty, rental_price: 55000 };
    const criteriaWith50kMax = { ...baseCriteria, budgetMax: 50000, budgetMin: undefined };
    const result = calculateMatchScore(propertyAt55k, criteriaWith50kMax);
    
    // 55000 <= 50000 * 1.1 (55000) -> Slightly Over
    expect(result.reasons).toContain('budget_slightly_over');
    // Result score = Purpose(20) + Area(30) + Type(30) + Price(40 * 0.625 = 25) = 105 -> 100
    expect(result.score).toBe(100);
  });

  it('should handle transit requested vs bonus', () => {
    // Case 1: Requested and Has it
    const criteriaWithTransit = { ...baseCriteria, nearTransit: true };
    const propWithTransit = { ...mockProperty, near_transit: true };
    const result1 = calculateMatchScore(propWithTransit, criteriaWithTransit);
    expect(result1.reasons).toContain('transit_requested');

    // Case 2: Not requested but Has it (Bonus)
    const result2 = calculateMatchScore(propWithTransit, baseCriteria);
    expect(result2.reasons).toContain('transit_bonus');
  });
});
