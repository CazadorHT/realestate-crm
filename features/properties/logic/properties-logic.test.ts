import { describe, it, expect } from 'vitest';
import { validatePropertyImagePaths } from './images';

describe('Property Logic - Images', () => {
  it('should validate correct property image paths', () => {
    const paths = ['properties/123/img1.jpg', 'properties/abc/cover.webp'];
    const result = validatePropertyImagePaths(paths);
    expect(result.ok).toBe(true);
  });

  it('should fail on paths outside the properties directory', () => {
    const paths = ['avatars/user1.png'];
    const result = validatePropertyImagePaths(paths);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Invalid image path');
  });

  it('should fail on path traversal attempts', () => {
    const paths = ['properties/../../etc/passwd'];
    const result = validatePropertyImagePaths(paths);
    expect(result.ok).toBe(false);
  });

  it('should fail on absolute paths', () => {
    const paths = ['/properties/123.jpg'];
    const result = validatePropertyImagePaths(paths);
    expect(result.ok).toBe(false);
  });
});

describe('Property Logic - Price Drops (Simulation)', () => {
  // Logic matches features/properties/logic/notifications.ts
  const calculatePercent = (oldPrice: number, newPrice: number) => {
    const diff = oldPrice - newPrice;
    return ((diff / oldPrice) * 100).toFixed(1);
  };

  it('should calculate price drop percentage correctly', () => {
    expect(calculatePercent(100, 80)).toBe('20.0');
    expect(calculatePercent(100, 95.5)).toBe('4.5');
    expect(calculatePercent(1000000, 900000)).toBe('10.0');
  });
});
