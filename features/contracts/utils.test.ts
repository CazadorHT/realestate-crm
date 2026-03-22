import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getContractStatus } from './utils';

describe('getContractStatus', () => {
  beforeEach(() => {
    // Mock "now" to 2026-03-22
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(' should return "expired" if the end date is in the past', () => {
    const result = getContractStatus('2026-03-21');
    expect(result.status).toBe('expired');
    expect(result.label).toBe('หมดอายุ');
    expect(result.variant).toBe('destructive');
  });

  it('should return "expiring-soon" if the end date is within 30 days', () => {
    const result = getContractStatus('2026-04-10');
    expect(result.status).toBe('expiring-soon');
    expect(result.label).toBe('ใกล้หมดอายุ');
    expect(result.days).toBeGreaterThanOrEqual(0);
    expect(result.days).toBeLessThanOrEqual(30);
  });

  it('should return "active" if the end date is more than 30 days away', () => {
    const result = getContractStatus('2026-05-22');
    expect(result.status).toBe('active');
    expect(result.label).toBe('ใช้งาน');
    expect(result.days).toBeGreaterThan(30);
  });

  it('should handle boundaries correctly (exactly 30 days away)', () => {
    // 30 days from 2026-03-22 is 2026-04-21
    const result = getContractStatus('2026-04-21T10:00:00Z');
    expect(result.status).toBe('expiring-soon');
  });

  it('should handle boundaries correctly (exactly today)', () => {
    const result = getContractStatus('2026-03-22T10:00:00Z');
    expect(result.status).toBe('expiring-soon'); // 0 days is <= 30
    expect(result.days).toBe(0);
  });
});
