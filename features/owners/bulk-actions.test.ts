import { describe, it, expect } from "vitest";
import { chunkArray } from "@/lib/utils";

describe("features/owners/bulk-actions", () => {
  describe("chunkArray", () => {
    it("should split array into exact chunk sizes", () => {
      const items = ["owner-1", "owner-2", "owner-3", "owner-4", "owner-5"];
      const result = chunkArray(items, 2);
      expect(result).toEqual([
        ["owner-1", "owner-2"],
        ["owner-3", "owner-4"],
        ["owner-5"],
      ]);
    });

    it("should handle empty array gracefully", () => {
      const result = chunkArray([], 100);
      expect(result).toEqual([]);
    });

    it("should handle null or invalid input gracefully", () => {
      expect(chunkArray(null as any, 50)).toEqual([]);
      expect(chunkArray(["a", "b"], 0)).toEqual([]);
      expect(chunkArray(["a", "b"], -1)).toEqual([]);
    });

    it("should handle chunk size larger than array length", () => {
      const items = ["owner-1", "owner-2"];
      const result = chunkArray(items, 100);
      expect(result).toEqual([["owner-1", "owner-2"]]);
    });

    it("should split 1,000 items into 10 chunks of 100", () => {
      const items = Array.from({ length: 1000 }, (_, i) => `owner-${i}`);
      const result = chunkArray(items, 100);
      expect(result.length).toBe(10);
      expect(result[0].length).toBe(100);
      expect(result[9].length).toBe(100);
      expect(result.flat().length).toBe(1000);
    });
  });
});
