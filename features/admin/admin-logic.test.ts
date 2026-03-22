import { describe, it, expect } from 'vitest';
import { calculateNewSortOrders } from './partners-utils';
import { popularAreaSchema } from "./popular-areas-validation";

describe('Admin Logic - Partners Resequencing', () => {
  it('should identify partners that need a new sort order', () => {
    const partners = [
      { id: '1', sort_order: 1 },
      { id: '2', sort_order: 5 }, // Gap here
      { id: '3', sort_order: 10 }, 
    ];

    const updates = calculateNewSortOrders(partners);

    expect(updates).toHaveLength(2);
    expect(updates).toContainEqual({ id: '2', sort_order: 2 });
    expect(updates).toContainEqual({ id: '3', sort_order: 3 });
  });

  it('should return empty array if all partners are correctly sequenced', () => {
    const partners = [
      { id: '1', sort_order: 1 },
      { id: '2', sort_order: 2 },
    ];
    const updates = calculateNewSortOrders(partners);
    expect(updates).toHaveLength(0);
  });
});

describe('Admin Logic - Popular Areas Validation', () => {
  it("should validate a correct popular area", () => {
    const validArea = {
      name: "Sukhumvit",
      name_en: "Sukhumvit",
      name_cn: "素坤逸",
      province: "กรุงเทพมหานคร",
    };
    const result = popularAreaSchema.safeParse(validArea);
    expect(result.success).toBe(true);
  });

  it("should fail if name is missing", () => {
    const invalidArea = {
      name_en: "Sukhumvit",
      province: "กรุงเทพมหานคร",
    };
    const result = popularAreaSchema.safeParse(invalidArea);
    expect(result.success).toBe(false);
  });

  it("should fail if province is missing", () => {
    const invalidArea = {
      name: "Sukhumvit",
      name_en: "Sukhumvit",
    };
    const result = popularAreaSchema.safeParse(invalidArea);
    expect(result.success).toBe(false);
  });
});
