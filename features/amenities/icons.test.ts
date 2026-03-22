import { describe, it, expect } from 'vitest';
import { ICON_MAP, DEFAULT_ICON } from './icons';
import { Box } from 'lucide-react';

describe('Amenity Icon Mapping', () => {
  it('should return the correct icon component for a known key', () => {
    expect(ICON_MAP['waves']).toBeDefined();
    expect(ICON_MAP['dumbbell']).toBeDefined();
    expect(ICON_MAP['wifi']).toBeDefined();
  });

  it('should have a default icon defined', () => {
    expect(DEFAULT_ICON).toBe(Box);
  });

  it('should include essential property icons', () => {
    const essentialKeys = ['car', 'sofa', 'utensils', 'tv', 'zap'];
    essentialKeys.forEach(key => {
      expect(ICON_MAP[key]).toBeDefined();
    });
  });

  it('should include common nearby facility icons', () => {
    const nearbyKeys = ['school', 'hospital', 'shopping', 'train', 'bus'];
    nearbyKeys.forEach(key => {
      expect(ICON_MAP[key]).toBeDefined();
    });
  });
});
