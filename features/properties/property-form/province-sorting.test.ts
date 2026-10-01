import { describe, it, expect } from "vitest";
import { sortAndPartitionProvinces } from "@/lib/utils/provinces";

describe("sortAndPartitionProvinces (Step 1 Basic Info Province Selector)", () => {
  const mockProvinces = [
    { id: 1, name_th: "กรุงเทพมหานคร", name_en: "Bangkok" },
    { id: 2, name_th: "สมุทรปราการ", name_en: "Samut Prakan" },
    { id: 3, name_th: "นนทบุรี", name_en: "Nonthaburi" },
    { id: 4, name_th: "ปทุมธานี", name_en: "Pathum Thani" },
    { id: 5, name_th: "ชลบุรี", name_en: "Chon Buri" },
    { id: 6, name_th: "ภูเก็ต", name_en: "Phuket" },
    { id: 7, name_th: "เชียงใหม่", name_en: "Chiang Mai" },
    { id: 8, name_th: "กระบี่", name_en: "Krabi" },
    { id: 9, name_th: "กาญจนบุรี", name_en: "Kanchanaburi" },
    { id: 10, name_th: "ขอนแก่น", name_en: "Khon Kaen" },
    { id: 11, name_th: "อุบลราชธานี", name_en: "Ubon Ratchathani" },
  ];

  const mockCounts: Record<string, number> = {
    "กรุงเทพมหานคร": 121,
    "สมุทรปราการ": 23,
    "ภูเก็ต": 6,
    "ปทุมธานี": 4,
    "ชลบุรี": 2,
    "นนทบุรี": 2,
  };

  it("should sort provinces with properties descending by count (มากไปน้อย)", () => {
    const result = sortAndPartitionProvinces(mockProvinces, mockCounts, "", "th");

    expect(result.withProperties.map((p) => ({ name: p.name_th, count: p.count }))).toEqual([
      { name: "กรุงเทพมหานคร", count: 121 },
      { name: "สมุทรปราการ", count: 23 },
      { name: "ภูเก็ต", count: 6 },
      { name: "ปทุมธานี", count: 4 },
      // Equal counts (2): sorted alphabetically ก-ฮ (ชลบุรี before นนทบุรี)
      { name: "ชลบุรี", count: 2 },
      { name: "นนทบุรี", count: 2 },
    ]);
  });

  it("should sort provinces without properties alphabetically ก-ฮ", () => {
    const result = sortAndPartitionProvinces(mockProvinces, mockCounts, "", "th");

    const namesWithout = result.withoutProperties.map((p) => p.name_th);
    expect(namesWithout).toEqual([
      "กระบี่",
      "กาญจนบุรี",
      "ขอนแก่น",
      "เชียงใหม่",
      "อุบลราชธานี",
    ]);
  });

  it("should filter both groups by search query (Thai)", () => {
    // "ภู" should match ภูเก็ต
    const result = sortAndPartitionProvinces(mockProvinces, mockCounts, "ภู", "th");
    expect(result.withProperties.map((p) => p.name_th)).toEqual(["ภูเก็ต"]);
    expect(result.withoutProperties).toHaveLength(0);

    // "กา" should match สมุทรปราการ (with properties) and กาญจนบุรี (without properties)
    const res2 = sortAndPartitionProvinces(mockProvinces, mockCounts, "กา", "th");
    expect(res2.withProperties.map((p) => p.name_th)).toEqual(["สมุทรปราการ"]);
    expect(res2.withoutProperties.map((p) => p.name_th)).toEqual(["กาญจนบุรี"]);

    // "เชียง" should only match เชียงใหม่ in withoutProperties
    const res3 = sortAndPartitionProvinces(mockProvinces, mockCounts, "เชียง", "th");
    expect(res3.withProperties).toHaveLength(0);
    expect(res3.withoutProperties.map((p) => p.name_th)).toEqual(["เชียงใหม่"]);
  });

  it("should filter both groups by search query (English)", () => {
    const result = sortAndPartitionProvinces(mockProvinces, mockCounts, "bangkok", "th");
    expect(result.withProperties.map((p) => p.name_th)).toEqual(["กรุงเทพมหานคร"]);
    expect(result.withoutProperties).toHaveLength(0);
  });

  it("should sort by English alphabet when language is 'en'", () => {
    const result = sortAndPartitionProvinces(mockProvinces, mockCounts, "", "en");

    // with properties: count desc, tie-breaker English alphabet
    expect(result.withProperties.map((p) => p.name_en)).toEqual([
      "Bangkok",
      "Samut Prakan",
      "Phuket",
      "Pathum Thani",
      "Chon Buri",
      "Nonthaburi",
    ]);

    // without properties: A-Z
    expect(result.withoutProperties.map((p) => p.name_en)).toEqual([
      "Chiang Mai",
      "Kanchanaburi",
      "Khon Kaen",
      "Krabi",
      "Ubon Ratchathani",
    ]);
  });
});
