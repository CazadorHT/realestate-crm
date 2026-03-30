import {
  Province,
  District,
  SubDistrict,
  provinceSchema,
  districtSchema,
  subDistrictSchema,
} from "./types";
import { z } from "zod";

const GITHUB_BASE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest";
const PROXY_BASE_URL = "/api/thai-address";

const ENDPOINTS = {
  provinces: "province.json",
  districts: "district.json",
  subDistricts: "sub_district.json",
};

// In-memory cache
type CacheData = {
  provinces: Province[] | null;
  districts: District[] | null;
  subDistricts: SubDistrict[] | null;
  // Index Maps for O(1) lookup
  districtsByProvince: Map<number, District[]> | null;
  subDistrictsByDistrict: Map<number, SubDistrict[]> | null;
};

export class ThaiAddressService {
  private static cache: CacheData = {
    provinces: null,
    districts: null,
    subDistricts: null,
    districtsByProvince: null,
    subDistrictsByDistrict: null,
  };

  private static pendingRequests: Record<string, Promise<any>> = {};

  /**
   * Validates a sample of the data array to ensure structure is correct.
   * Checks first, middle, and last items.
   */
  private static validateSample<T>(data: T[], schema: z.ZodSchema<T>) {
    if (!Array.isArray(data) || data.length === 0) return;
    
    // Sample indexes
    const indexes = [0, Math.floor(data.length / 2), data.length - 1];
    indexes.forEach(idx => {
      if (data[idx]) {
        schema.parse(data[idx]);
      }
    });
  }

  private static async fetchWithFallback<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
  ): Promise<T[]> {
    try {
      const response = await fetch(`${GITHUB_BASE_URL}/${endpoint}`);
      if (!response.ok) throw new Error("GitHub Direct Fetch Failed");
      const data = await response.json();
      
      // Hardening: Sampling Validation
      this.validateSample(data, schema);
      
      return data as T[];
    } catch (error) {
      console.warn(
        `[ThaiAddressService] Direct fetch failed for ${endpoint}, switching to proxy.`,
        error,
      );

      try {
        const response = await fetch(`${PROXY_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error("Proxy Fetch Failed");
        const data = await response.json();
        
        // Hardening: Sampling Validation even on proxy
        this.validateSample(data, schema);
        
        return data as T[];
      } catch (proxyError) {
        console.error(
          `[ThaiAddressService] All fetch methods failed for ${endpoint}`,
          proxyError,
        );
        throw proxyError;
      }
    }
  }

  static async getProvinces(): Promise<Province[]> {
    if (ThaiAddressService.cache.provinces) return ThaiAddressService.cache.provinces;
    const pending = ThaiAddressService.pendingRequests["provinces"];
    if (pending) return pending;

    const promise = this.fetchWithFallback(
      ENDPOINTS.provinces,
      provinceSchema,
    ).then((data) => {
      ThaiAddressService.cache.provinces = data;
      delete ThaiAddressService.pendingRequests["provinces"];
      return data;
    });

    ThaiAddressService.pendingRequests["provinces"] = promise;
    return promise;
  }

  static async getDistricts(ensureLoaded = false): Promise<District[]> {
    if (ThaiAddressService.cache.districts) return ThaiAddressService.cache.districts;
    const pending = ThaiAddressService.pendingRequests["districts"];
    if (pending) return pending;

    const promise = this.fetchWithFallback(
      ENDPOINTS.districts,
      districtSchema,
    ).then((data) => {
      ThaiAddressService.cache.districts = data;
      const map = new Map<number, District[]>();
      data.forEach((d) => {
        const list = map.get(d.province_id) || [];
        list.push(d);
        map.set(d.province_id, list);
      });
      ThaiAddressService.cache.districtsByProvince = map;
      delete ThaiAddressService.pendingRequests["districts"];
      return data;
    });

    ThaiAddressService.pendingRequests["districts"] = promise;
    return promise;
  }

  static async getSubDistricts(): Promise<SubDistrict[]> {
    if (ThaiAddressService.cache.subDistricts) return ThaiAddressService.cache.subDistricts;
    const pending = ThaiAddressService.pendingRequests["subDistricts"];
    if (pending) return pending;

    const promise = this.fetchWithFallback(
      ENDPOINTS.subDistricts,
      subDistrictSchema,
    ).then((data) => {
      ThaiAddressService.cache.subDistricts = data;
      const map = new Map<number, SubDistrict[]>();
      data.forEach((s) => {
        const list = map.get(s.district_id) || [];
        list.push(s);
        map.set(s.district_id, list);
      });
      ThaiAddressService.cache.subDistrictsByDistrict = map;
      delete ThaiAddressService.pendingRequests["subDistricts"];
      return data;
    });

    ThaiAddressService.pendingRequests["subDistricts"] = promise;
    return promise;
  }

  // --- Synchronous Accessors ---

  static getDistrictsByProvinceId(provinceId: number): District[] {
    if (!ThaiAddressService.cache.districtsByProvince) return [];
    return ThaiAddressService.cache.districtsByProvince.get(provinceId) || [];
  }

  static getSubDistrictsByDistrictId(districtId: number): SubDistrict[] {
    if (!ThaiAddressService.cache.subDistrictsByDistrict) return [];
    return ThaiAddressService.cache.subDistrictsByDistrict.get(districtId) || [];
  }

  /**
   * Verifies if the hierarchical relationship between names is valid.
   */
  static async validateHierarchy(provinceName: string, districtName: string, subDistrictName: string): Promise<boolean> {
    await this.ensureAllLoaded();
    
    const province = ThaiAddressService.cache.provinces?.find((p: Province) => p.name_th === provinceName || p.name_en === provinceName);
    if (!province) return false;

    const district = ThaiAddressService.cache.districts?.find((d: District) => 
      (d.name_th === districtName || d.name_en === districtName) && 
      d.province_id === province.id
    );
    if (!district) return false;

    const subDistrict = ThaiAddressService.cache.subDistricts?.find((s: SubDistrict) => 
      (s.name_th === subDistrictName || s.name_en === subDistrictName) && 
      s.district_id === district.id
    );
    
    return !!subDistrict;
  }

  /**
   * Resolves ID triplet to a full address object.
   */
  static async resolveFullAddress(provinceId: number, districtId: number, subDistrictId: number) {
    await this.ensureAllLoaded();
    const p = ThaiAddressService.cache.provinces?.find((x: Province) => x.id === provinceId);
    const d = ThaiAddressService.cache.districts?.find((x: District) => x.id === districtId);
    const s = ThaiAddressService.cache.subDistricts?.find((x: SubDistrict) => x.id === subDistrictId);
    
    return {
      province: p?.name_th || null,
      district: d?.name_th || null,
      subDistrict: s?.name_th || null,
      zipCode: s?.zip_code || null,
      fullTh: `${s?.name_th || ""} ${d?.name_th || ""} ${p?.name_th || ""} ${s?.zip_code || ""}`.trim()
    };
  }

  private static async ensureAllLoaded() {
    if (ThaiAddressService.cache.provinces && ThaiAddressService.cache.districts && ThaiAddressService.cache.subDistricts) return;
    await Promise.all([
      this.getProvinces(),
      this.getDistricts(true),
      this.getSubDistricts(),
    ]);
  }

  static getZipCode(subDistrictId: number): string | null {
    if (!ThaiAddressService.cache.subDistricts) return null;
    const found = ThaiAddressService.cache.subDistricts.find((s: SubDistrict) => s.id === subDistrictId);
    return found ? String(found.zip_code) : null;
  }

  static reset() {
    ThaiAddressService.cache.provinces = null;
    ThaiAddressService.cache.districts = null;
    ThaiAddressService.cache.subDistricts = null;
    ThaiAddressService.cache.districtsByProvince = null;
    ThaiAddressService.cache.subDistrictsByDistrict = null;
  }

  static async searchByZipCode(zipCode: string): Promise<
    {
      subDistrict: SubDistrict;
      district: District;
      province: Province;
    }[]
  > {
    await this.ensureAllLoaded();

    if (!ThaiAddressService.cache.subDistricts || !ThaiAddressService.cache.districts || !ThaiAddressService.cache.provinces) {
      return [];
    }

    const query = Number(zipCode);
    if (isNaN(query)) return [];

    const matches = ThaiAddressService.cache.subDistricts.filter((s: SubDistrict) => s.zip_code === query);

    return matches
      .map((sub) => {
        const dist = ThaiAddressService.cache.districts?.find((d: District) => d.id === sub.district_id);
        const prov = dist ? ThaiAddressService.cache.provinces?.find((p: Province) => p.id === dist.province_id) : undefined;
        if (sub && dist && prov) {
          return { subDistrict: sub, district: dist, province: prov };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  static isDistrictsLoaded(): boolean {
    return !!ThaiAddressService.cache.districts;
  }

  static isSubDistrictsLoaded(): boolean {
    return !!ThaiAddressService.cache.subDistricts;
  }
}
