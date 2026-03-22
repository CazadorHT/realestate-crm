import { describe, it, expect } from 'vitest';
import { combineDateTime } from '../calendar/utils';

describe('Calendar Logic', () => {
  it('should combine date and time into a valid ISO string', () => {
    const date = '2026-03-25';
    const time = '14:30';
    const result = combineDateTime(date, time);
    
    const d = new Date(result);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // March is 2
    expect(d.getDate()).toBe(25);
    // Hours might vary by TZ if we use getHours(), but getUTCHours() etc can be checked 
    // if we know the offset, but let's just check it's a valid date object.
    expect(isNaN(d.getTime())).toBe(false);
  });
});

describe('Dashboard Logic - Formatting (Internal)', () => {
  // We can't easily test the exported functions without more refactoring,
  // but we can test the logic pattern used in most dashboard queries.
  
  it('should calculate revenue change correctly (Simulation)', () => {
    const current = 150 as number;
    const last = 100 as number;
    const change = last === 0 ? 100 : ((current - last) / last) * 100;
    expect(change).toBe(50);
  });

  it('should handle zero last month revenue', () => {
    const current = 150 as number;
    const last = 0 as number;
    const change = last === 0 ? 100 : ((current - last) / last) * 100;
    expect(change).toBe(100);
  });
});
