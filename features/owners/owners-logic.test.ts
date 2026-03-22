import { describe, it, expect } from 'vitest';
import { calculatePropertyCounts } from './logic';

describe('Owners Logic - Property Counts', () => {
  it('should correctly map property counts to owners', () => {
    const owners = [
      { id: 'owner-1', full_name: 'Owner A' },
      { id: 'owner-2', full_name: 'Owner B' },
      { id: 'owner-3', full_name: 'Owner C' },
    ];
    
    const propertyOwnerIds = [
      { owner_id: 'owner-1' },
      { owner_id: 'owner-1' },
      { owner_id: 'owner-2' },
      { owner_id: null }, // Orphaned property
    ];

    const result = calculatePropertyCounts(owners as any, propertyOwnerIds);

    expect(result).toHaveLength(3);
    
    const owner1 = result.find(o => o.id === 'owner-1');
    const owner2 = result.find(o => o.id === 'owner-2');
    const owner3 = result.find(o => o.id === 'owner-3');

    expect(owner1?.property_count).toBe(2);
    expect(owner2?.property_count).toBe(1);
    expect(owner3?.property_count).toBe(0);
  });

  it('should handle empty lists', () => {
    const result = calculatePropertyCounts([], []);
    expect(result).toHaveLength(0);
  });
});
