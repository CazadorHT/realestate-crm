import { describe, it, expect } from "vitest";
import { FinanceMath } from "./precision";

describe("FinanceMath Precision Engine", () => {
  it("should handle floating point addition correctly (0.1 + 0.2)", () => {
    // Standard JS: 0.1 + 0.2 = 0.30000000000000004
    // FinanceMath: should be 0.30
    const res = FinanceMath.add([0.1, 0.2]);
    expect(FinanceMath.format(res)).toBe("0.30");
  });

  it("should calculate WHT 3% correctly with rounding", () => {
    // 1,250.75 * 0.03 = 37.5225 -> Should round to 37.52
    const res = FinanceMath.calculateWht(1250.75);
    expect(FinanceMath.format(res)).toBe("37.52");
    
    // 1,250.85 * 0.03 = 37.5255 -> Should round to 37.53 (Round half up)
    const res2 = FinanceMath.calculateWht(1250.85);
    expect(FinanceMath.format(res2)).toBe("37.53");
  });

  it("should calculate Net Payout with adjustments correctly", () => {
    const gross = 10000;
    const wht = 300;
    const adjs = [
      { amount: -500 }, // Marketing fee
      { amount: 1000 }, // Bonus
      { amount: -25.50 } // Transfer fee
    ];
    
    // Logic: (10000 - 300) + (-500 + 1000 - 25.50)
    // 9700 + 474.50 = 10174.50
    const res = FinanceMath.calculateNetPayout(gross, wht, adjs);
    expect(FinanceMath.format(res)).toBe("10,174.50"); // Note: format uses toLocaleString now
  });

  it("should handle null/undefined values safely", () => {
    const res = FinanceMath.add([100, null, undefined, 50] as any);
    expect(res.toNumber()).toBe(150);
  });
});
