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
    
    // bottom (150) + spacing (12) = 162
    expect(result.top).toBe(162);
    // left (100) + half-width (100) = 200. 
    // 200 - 190 (halfWidth) = 10 (< 20 boundary). 
    // So it should be pushed to halfWidth + 20 = 210.
    expect(result.left).toBe(210);
    expect(result.width).toBe('380px');
  });

  it('should flip to top if cutting off at bottom', () => {
    // Height is 1000, tooltip is 250. 150 + 12 + 250 = 412. 
    // If window height is 300, it should definitely flip.
    const result = calculateTooltipPosition(mockRect, 1000, 300, false);
    
    // top (100) - tooltipHeight (250) - spacing (12) = -162
    // But logic checks topSpace > 20. 100 - 250 - 12 = -162 (Not > 20)
    // So it should go to desktop "side" logic (right) because it's not mobile
    expect(result.side).toBe('right');
  });

  it('should shift right if cutting off at left bound', () => {
    const edgeRect = { ...mockRect, left: 10, width: 20, right: 30 };
    const result = calculateTooltipPosition(edgeRect, 1000, 1000, false);
    
    // target mid is 20. halfWidth is 190. left is 20.
    // 20 - 190 = -170 (< 20). So left becomes halfWidth + 20 = 190 + 20 = 210
    expect(result.left).toBe(210);
  });

  it('should shift left if cutting off at right bound', () => {
    const edgeRect = { ...mockRect, left: 900, width: 20, right: 920 };
    const result = calculateTooltipPosition(edgeRect, 1000, 1000, false);
    
    // target mid is 910. halfWidth is 190. 910 + 190 = 1100 (> 980).
    // left becomes windowWidth - halfWidth - 20 = 1000 - 190 - 20 = 790
    expect(result.left).toBe(790);
  });

  it('should handle mobile width correctly', () => {
    const result = calculateTooltipPosition(mockRect, 375, 812, true);
    
    expect(result.width).toBe('calc(100vw - 40px)');
    // Mobile always centers horizontally
    expect(result.left).toBe(375 / 2);
  });

  it('should handle very large targets by centering', () => {
    const largeRect = { top: 0, left: 0, width: 1000, height: 900, bottom: 900, right: 1000 };
    const result = calculateTooltipPosition(largeRect, 1000, 1000, false);
    
    expect(result.position).toBe('fixed');
    expect(result.top).toBe(500);
    expect(result.left).toBe(500);
  });
});
