import { describe, it, expect } from 'vitest';
import { parseUserAgent } from './utils';

describe('Audit Actions - parseUserAgent', () => {
  it('should parse Chrome on Windows correctly', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x44) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua)).toBe('Chrome on Windows');
  });

  it('should parse Safari on Mac correctly', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15';
    expect(parseUserAgent(ua)).toBe('Safari on Macintosh');
  });

  it('should parse Firefox on Android correctly', () => {
    const ua = 'Mozilla/5.0 (Android 14; Mobile; rv:124.0) Gecko/124.0 Firefox/124.0';
    expect(parseUserAgent(ua)).toBe('Firefox on Android');
  });

  it('should fallback to Unknown Device for empty UA', () => {
    expect(parseUserAgent('')).toBe('Unknown Device');
  });

  it('should fallback to Browser on OS for unrecognized UA', () => {
    expect(parseUserAgent('Some Random Bot/1.0')).toBe('Browser on Os');
  });
});
