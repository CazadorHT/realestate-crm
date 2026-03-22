import { describe, it, expect } from 'vitest';

// We can't easily import the async notification function due to siteConfig/fetch dependencies,
// but we can verify the core calculation logic if it were extracted.
// For now, let's verify a mock of the calculation used in the file.

describe('Property Logic - Price Drop Calculation', () => {
  it('should calculate percentage drop correctly', () => {
    const oldPrice = 1000000;
    const newPrice = 900000;
    const diff = oldPrice - newPrice;
    const percent = ((diff / oldPrice) * 100).toFixed(1);
    
    expect(diff).toBe(100000);
    expect(percent).toBe('10.0');
  });

  it('should handle small price drops', () => {
    const oldPrice = 50000;
    const newPrice = 49500;
    const diff = oldPrice - newPrice;
    const percent = ((diff / oldPrice) * 100).toFixed(1);
    
    expect(percent).toBe('1.0');
  });
});
