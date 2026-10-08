import { describe, it, expect } from "vitest";
import { chunkArray } from "./bulk-actions";

describe("features/leads/bulk-actions", () => {
  describe("chunkArray", () => {
    it("should split array into exact chunk sizes", () => {
      const items = [1, 2, 3, 4, 5, 6, 7];
      const result = chunkArray(items, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it("should handle empty array gracefully", () => {
      const result = chunkArray([], 10);
      expect(result).toEqual([]);
    });

    it("should handle null or invalid input gracefully", () => {
      expect(chunkArray(null as any, 10)).toEqual([]);
      expect(chunkArray([1, 2], 0)).toEqual([]);
      expect(chunkArray([1, 2], -5)).toEqual([]);
    });

    it("should handle chunk size larger than array length", () => {
      const items = ["a", "b", "c"];
      const result = chunkArray(items, 100);
      expect(result).toEqual([["a", "b", "c"]]);
    });

    it("should split 1,000 items into 10 chunks of 100", () => {
      const items = Array.from({ length: 1000 }, (_, i) => `id-${i}`);
      const result = chunkArray(items, 100);
      expect(result.length).toBe(10);
      expect(result[0].length).toBe(100);
      expect(result[9].length).toBe(100);
      expect(result.flat().length).toBe(1000);
    });
  });
});
