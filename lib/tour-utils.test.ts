import { describe, it, expect } from 'vitest';
import { calculateTooltipPosition } from './tour-utils';

describe('Guided Tour Utilities - Positioning', () => {
  const mockRect = {
    top: 100,
    left: 100,
    width: 200,
    height: 50,
    bottom: 150,
    right: 300,
  };

  it('should calculate default position below target', () => {
    const result = calculateTooltipPosition(mockRect, 1000, 1000, false);
    
    // bottom (150) + spacing (20) = 170
    expect(result.top).toBe(170);
    // left (100) + half-width (100) = 200, but shifted to 210 to keep within bounds (min 20px padding)
    expect(result.left).toBe(210);
    expect(result.width).toBe('380px');
  });

  it('should flip to top if cutting off at bottom', () => {
    const result = calculateTooltipPosition(mockRect, 1000, 300, false);
    
    // top (100) - approx-height (200) - spacing (20) = -120
    // Note: In real world, we might want to cap this at 0, but logic currently just subtracts.
    expect(result.top).toBe(100 - 200 - 20);
  });

  it('should shift right if cutting off at left bound', () => {
    const edgeRect = { ...mockRect, left: 10, right: 210 };
    const result = calculateTooltipPosition(edgeRect, 1000, 1000, false);
    
    // tooltip half-width is 190. Left must be at least 190 + 20 = 210
    expect(result.left).toBe(210);
  });

  it('should shift left if cutting off at right bound', () => {
    const edgeRect = { ...mockRect, left: 800, width: 200, right: 1000 }; // right at 1000
    const result = calculateTooltipPosition(edgeRect, 1000, 1000, false);
    
    // windowWidth (1000) - half-width (190) - 20 = 790
    expect(result.left).toBe(790);
  });

  it('should handle mobile width correctly', () => {
    const result = calculateTooltipPosition(mockRect, 375, 812, true);
    
    expect(result.width).toBe('calc(100vw - 40px)');
  });
});
