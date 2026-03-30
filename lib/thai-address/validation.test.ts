import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThaiAddressService } from "./service";

// Mock Sample Data
const mockProvinces = [{ id: 1, name_th: "กรุงเทพมหานคร", name_en: "Bangkok", geography_id: 1 }];
const mockDistricts = [{ id: 10, name_th: "วัฒนา", name_en: "Watthana", province_id: 1 }];
const mockSubDistricts = [{ id: 100, name_th: "คลองตันเหนือ", name_en: "Khlong Tan Nuea", district_id: 10, zip_code: 10110 }];

describe("Thai Address Hardening - Logic & Hierarchy", () => {
  beforeEach(() => {
    ThaiAddressService.reset();
    
    // Mock internal fetch or cache for speed and consistency
    vi.spyOn(ThaiAddressService, "getProvinces" as any).mockResolvedValue(mockProvinces);
    vi.spyOn(ThaiAddressService, "getDistricts" as any).mockResolvedValue(mockDistricts);
    vi.spyOn(ThaiAddressService, "getSubDistricts" as any).mockResolvedValue(mockSubDistricts);
    
    // Inject into cache manually for sync methods
    (ThaiAddressService as any).cache = {
      provinces: mockProvinces,
      districts: mockDistricts,
      subDistricts: mockSubDistricts,
      districtsByProvince: new Map([[1, mockDistricts]]),
      subDistrictsByDistrict: new Map([[10, mockSubDistricts]])
    };
  });

  it("should validate a correct hierarchy", async () => {
    const isValid = await ThaiAddressService.validateHierarchy("กรุงเทพมหานคร", "วัฒนา", "คลองตันเหนือ");
    expect(isValid).toBe(true);
  });

  it("should fail an incorrect hierarchy (Cross-province district)", async () => {
    // Watthana doesn't belong to Chiang Mai (hypothetically if Chiang Mai was id 2)
    const isValid = await ThaiAddressService.validateHierarchy("เชียงใหม่", "วัฒนา", "คลองตันเหนือ");
    expect(isValid).toBe(false);
  });

  it("should resolve full address correctly from IDs", async () => {
    const res = await ThaiAddressService.resolveFullAddress(1, 10, 100);
    expect(res.province).toBe("กรุงเทพมหานคร");
    expect(res.district).toBe("วัฒนา");
    expect(res.subDistrict).toBe("คลองตันเหนือ");
    expect(res.zipCode).toBe(10110);
    expect(res.fullTh).toContain("คลองตันเหนือ วัฒนา กรุงเทพมหานคร 10110");
  });

  it("should correctly search by zip code using pre-loaded data", async () => {
    const results = await ThaiAddressService.searchByZipCode("10110");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].subDistrict.name_th).toBe("คลองตันเหนือ");
    expect(results[0].province.name_th).toBe("กรุงเทพมหานคร");
  });

  it("should handle invalid zip codes without crashing", async () => {
    const results = await ThaiAddressService.searchByZipCode("ABCD");
    expect(results).toEqual([]);
  });
});
