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

const cache: CacheData = {
  provinces: null,
  districts: null,
  subDistricts: null,
  districtsByProvince: null,
  subDistrictsByDistrict: null,
};

// Promise deduplication
const pendingRequests: Record<string, Promise<any>> = {};

export class ThaiAddressService {
  private static async fetchWithFallback<T>(
    endpoint: string,
    schema: z.ZodSchema<T>
  ): Promise<T[]> {
    // 1. Try Direct GitHub
    try {
      const response = await fetch(`${GITHUB_BASE_URL}/${endpoint}`);
      if (!response.ok) throw new Error("GitHub Direct Fetch Failed");
      const data = await response.json();
      // Validate first item to be reasonably sure it's correct data without parsing exact schema of 7k items
      if (Array.isArray(data) && data.length > 0) {
        // Optional: validate a sample in dev mode?
        // schema.parse(data[0]);
      }
      return data as T[];
    } catch (error) {
      console.warn(
        `[ThaiAddressService] Direct fetch failed for ${endpoint}, switching to proxy.`,
        error
      );

      // 2. Fallback to Proxy
      try {
        const response = await fetch(`${PROXY_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error("Proxy Fetch Failed");
        const data = await response.json();
        return data as T[];
      } catch (proxyError) {
        console.error(
          `[ThaiAddressService] All fetch methods failed for ${endpoint}`,
          proxyError
        );
        throw proxyError;
      }
    }
  }

  static async getProvinces(): Promise<Province[]> {
    if (cache.provinces) return cache.provinces;
    const pending = pendingRequests["provinces"];
    if (pending) return pending;

    const promise = this.fetchWithFallback(
      ENDPOINTS.provinces,
      provinceSchema
    ).then((data) => {
      cache.provinces = data;
      delete pendingRequests["provinces"];
      return data;
    });

    pendingRequests["provinces"] = promise;
    return promise;
  }

  static async getDistricts(ensureLoaded = false): Promise<District[]> {
    if (cache.districts) return cache.districts;
    const pending = pendingRequests["districts"];
    if (pending) return pending;

    if (!ensureLoaded) {
      // Optimisation: If we don't strictly need them yet, we could delay.
      // But for now, simple implementation is to just fetch.
    }

    const promise = this.fetchWithFallback(
      ENDPOINTS.districts,
      districtSchema
    ).then((data) => {
      cache.districts = data;
      // Build Index Map
      const map = new Map<number, District[]>();
      data.forEach((d) => {
        const list = map.get(d.province_id) || [];
        list.push(d);
        map.set(d.province_id, list);
      });
      cache.districtsByProvince = map;

      delete pendingRequests["districts"];
      return data;
    });

    pendingRequests["districts"] = promise;
    return promise;
  }

  static async getSubDistricts(): Promise<SubDistrict[]> {
    if (cache.subDistricts) return cache.subDistricts;
    const pending = pendingRequests["subDistricts"];
    if (pending) return pending;

    const promise = this.fetchWithFallback(
      ENDPOINTS.subDistricts,
      subDistrictSchema
    ).then((data) => {
      cache.subDistricts = data;
      // Build Index Map
      const map = new Map<number, SubDistrict[]>();
      data.forEach((s) => {
        const list = map.get(s.district_id) || [];
        list.push(s);
        map.set(s.district_id, list);
      });
      cache.subDistrictsByDistrict = map;

      delete pendingRequests["subDistricts"];
      return data;
    });

    pendingRequests["subDistricts"] = promise;
    return promise;
  }

  // --- Synchronous Accessors (must call fetch methods first) ---

  static getDistrictsByProvinceId(provinceId: number): District[] {
    if (!cache.districtsByProvince) return [];
    return cache.districtsByProvince.get(provinceId) || [];
  }

  static getSubDistrictsByDistrictId(districtId: number): SubDistrict[] {
    if (!cache.subDistrictsByDistrict) return [];
    return cache.subDistrictsByDistrict.get(districtId) || [];
  }

  static getZipCode(subDistrictId: number): string | null {
    if (!cache.subDistricts) return null;
    const found = cache.subDistricts.find((s) => s.id === subDistrictId);
    return found ? String(found.zip_code) : null;
  }

  static reset() {
    // Useful for testing reload
    cache.provinces = null;
    cache.districts = null;
    cache.subDistricts = null;
    cache.districtsByProvince = null;
    cache.subDistrictsByDistrict = null;
  }
}
