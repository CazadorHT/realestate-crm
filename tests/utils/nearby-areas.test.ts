import { describe, it, expect } from "vitest";
import { getNearbyNeighborhoods, NEARBY_AREAS_MAP } from "@/lib/utils/nearby-areas";

describe("getNearbyNeighborhoods Unit Tests", () => {
  it("should return curated adjacent neighborhoods for 'ทองหล่อ'", () => {
    const results = getNearbyNeighborhoods("ทองหล่อ", "กรุงเทพมหานคร", 6);
    expect(results.length).toBeGreaterThan(0);
    const names = results.map((r) => r.name);
    expect(names).toContain("เอกมัย");
    expect(names).toContain("พร้อมพงษ์");
    // All results must be within Bangkok
    results.forEach((r) => expect(r.province).toBe("กรุงเทพมหานคร"));
  });

  it("should resolve English aliases like 'thonglor' to Thai hub mapping", () => {
    const results = getNearbyNeighborhoods("thonglor", "กรุงเทพมหานคร", 4);
    expect(results.length).toBe(4);
    const names = results.map((r) => r.name);
    expect(names).toContain("เอกมัย");
    expect(names).toContain("พร้อมพงษ์");
  });

  it("should strictly respect province boundaries for Phuket", () => {
    const results = getNearbyNeighborhoods("เชิงทะเล", "ภูเก็ต", 5);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.province).toBe("ภูเก็ต"));
    const names = results.map((r) => r.name);
    expect(names).toContain("บางเทา");
    // Must NOT contain Bangkok areas
    expect(names).not.toContain("ทองหล่อ");
    expect(names).not.toContain("เอกมัย");
  });

  it("should strictly respect province boundaries for Chonburi / Pattaya", () => {
    const results = getNearbyNeighborhoods("จอมเทียน", "ชลบุรี", 5);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.province).toBe("ชลบุรี"));
    const names = results.map((r) => r.name);
    expect(names).toContain("เขาพระตำหนัก");
    expect(names).not.toContain("ทองหล่อ");
  });

  it("should respect the limit parameter", () => {
    const results = getNearbyNeighborhoods("ทองหล่อ", "กรุงเทพมหานคร", 2);
    expect(results.length).toBe(2);
  });

  it("should fallback gracefully if area is not directly in map", () => {
    const results = getNearbyNeighborhoods("NonExistentAreaXYZ", "ภูเก็ต", 4);
    expect(results.length).toBe(4);
    results.forEach((r) => expect(r.province).toBe("ภูเก็ต"));
  });
});
