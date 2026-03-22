import { describe, it, expect } from 'vitest';
import { generateKeywords } from './seo';
import { PropertyFormValues } from '../schema';

describe('Property SEO Logic - generateKeywords', () => {
  const baseValues: Partial<PropertyFormValues> = {
    is_pet_friendly: false,
    is_foreigner_quota: false,
    is_renovated: false,
  };

  it('should add keywords when conditions are met', () => {
    const values = { ...baseValues, is_pet_friendly: true, is_renovated: true } as unknown as PropertyFormValues;
    const keywords = generateKeywords(values, []);
    
    expect(keywords).toContain('Pet Friendly');
    expect(keywords).toContain('Renovated');
    expect(keywords).not.toContain('Foreigner Friendly');
  });

  it('should remove keywords when conditions are false', () => {
    const values = { ...baseValues, is_pet_friendly: false } as unknown as PropertyFormValues;
    const existing = ['Pet Friendly', 'Existing Keyword'];
    const keywords = generateKeywords(values, existing);
    
    expect(keywords).not.toContain('Pet Friendly');
    expect(keywords).toContain('Existing Keyword');
  });

  it('should handle dynamic ceiling height', () => {
    const values = { ...baseValues, ceiling_height: 3.5 } as unknown as PropertyFormValues;
    const keywords = generateKeywords(values, ['High Ceiling 2.8m']);
    
    expect(keywords).toContain('High Ceiling 3.5m');
    expect(keywords).not.toContain('High Ceiling 2.8m');
  });

  it('should handle orientation updates', () => {
    const values = { ...baseValues, orientation: 'N' } as unknown as PropertyFormValues;
    const keywords = generateKeywords(values, ['Facing South']);
    
    expect(keywords).toContain('Facing N');
    expect(keywords).not.toContain('Facing South');
  });

  it('should handle parking type updates', () => {
    const values = { ...baseValues, parking_type: 'FIXED' } as unknown as PropertyFormValues;
    const keywords = generateKeywords(values, ['None Parking']);
    
    expect(keywords).toContain('FIXED Parking');
    expect(keywords).not.toContain('None Parking');
  });
});
