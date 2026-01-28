import { useState, useEffect, useCallback, useRef } from "react";
import { ThaiAddressService } from "@/lib/thai-address/service";
import type { Province, District, SubDistrict } from "@/lib/thai-address/types";

export function useThaiAddress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [allDistricts, setAllDistricts] = useState<District[]>([]);
  const [allSubDistricts, setAllSubDistricts] = useState<SubDistrict[]>([]);

  const [isReady, setIsReady] = useState(false);

  // Use refs to track if data is already loaded (avoids callback recreations)
  const districtsLoadedRef = useRef(false);
  const subDistrictsLoadedRef = useRef(false);

  // Initial Load (Provinces)
  useEffect(() => {
    let mounted = true;
    const loadProvinces = async () => {
      try {
        setLoading(true);
        const data = await ThaiAddressService.getProvinces();
        if (mounted) {
          setProvinces(data);
          setIsReady(true);
        }
      } catch (err) {
        if (mounted)
          setError(
            err instanceof Error ? err.message : "Failed to load provinces",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProvinces();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to ensure dependent data is loaded (stable callback using refs)
  const ensureDistrictsLoaded = useCallback(async () => {
    if (districtsLoadedRef.current) return; // Already loaded
    districtsLoadedRef.current = true; // Mark as loading/loaded
    try {
      const data = await ThaiAddressService.getDistricts(true);
      setAllDistricts(data);
    } catch (err) {
      districtsLoadedRef.current = false; // Reset on error
      setError(err instanceof Error ? err.message : "Failed to load districts");
    }
  }, []); // Empty deps - callback never changes

  const ensureSubDistrictsLoaded = useCallback(async () => {
    if (subDistrictsLoadedRef.current) return; // Already loaded
    subDistrictsLoadedRef.current = true; // Mark as loading/loaded
    try {
      const data = await ThaiAddressService.getSubDistricts();
      setAllSubDistricts(data);
    } catch (err) {
      subDistrictsLoadedRef.current = false; // Reset on error
      setError(
        err instanceof Error ? err.message : "Failed to load sub-districts",
      );
    }
  }, []); // Empty deps - callback never changes

  // Synchronous Getters (Memoized using state)
  // We use the Service's logic for filtering but rely on local state "trigger" to ensure we have data.
  // Actually, we can just filter the local state to be pure React.

  const getDistricts = useCallback(
    (provinceId: number) => {
      return allDistricts.filter((d) => d.province_id === provinceId);
    },
    [allDistricts],
  );

  const getSubDistricts = useCallback(
    (districtId: number) => {
      return allSubDistricts.filter((d) => d.district_id === districtId);
    },
    [allSubDistricts],
  );

  const getZipCode = useCallback(
    (subDistrictId: number) => {
      const found = allSubDistricts.find((s) => s.id === subDistrictId);
      return found ? String(found.zip_code) : null;
    },
    [allSubDistricts],
  );

  const reload = useCallback(async () => {
    ThaiAddressService.reset();
    setIsReady(false);
    setError(null);
    setProvinces([]);
    setAllDistricts([]);
    setAllSubDistricts([]);
    try {
      setLoading(true);
      const data = await ThaiAddressService.getProvinces();
      setProvinces(data);
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchAddress = useCallback(async (zipCode: string) => {
    try {
      setLoading(true);
      return await ThaiAddressService.searchByZipCode(zipCode);
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    provinces,
    loading,
    error,
    isReady,
    ensureDistrictsLoaded,
    ensureSubDistrictsLoaded,
    getDistricts,
    getSubDistricts,
    getZipCode,
    reload,
    searchAddress,
  };
}
