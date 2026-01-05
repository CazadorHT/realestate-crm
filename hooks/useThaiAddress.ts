import { useState, useEffect, useCallback, useMemo } from "react";
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
            err instanceof Error ? err.message : "Failed to load provinces"
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

  // Helper to ensure dependent data is loaded
  const ensureDistrictsLoaded = useCallback(async () => {
    if (allDistricts.length > 0) return; // Already loaded in state
    try {
      setLoading(true);
      const data = await ThaiAddressService.getDistricts(true);
      setAllDistricts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load districts");
    } finally {
      setLoading(false);
    }
  }, [allDistricts.length]);

  const ensureSubDistrictsLoaded = useCallback(async () => {
    if (allSubDistricts.length > 0) return; // Already loaded in state
    try {
      setLoading(true);
      const data = await ThaiAddressService.getSubDistricts();
      setAllSubDistricts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sub-districts"
      );
    } finally {
      setLoading(false);
    }
  }, [allSubDistricts.length]);

  // Synchronous Getters (Memoized using state)
  // We use the Service's logic for filtering but rely on local state "trigger" to ensure we have data.
  // Actually, we can just filter the local state to be pure React.

  const getDistricts = useCallback(
    (provinceId: number) => {
      return allDistricts.filter((d) => d.province_id === provinceId);
    },
    [allDistricts]
  );

  const getSubDistricts = useCallback(
    (districtId: number) => {
      return allSubDistricts.filter((d) => d.district_id === districtId);
    },
    [allSubDistricts]
  );

  const getZipCode = useCallback(
    (subDistrictId: number) => {
      const found = allSubDistricts.find((s) => s.id === subDistrictId);
      return found ? String(found.zip_code) : null;
    },
    [allSubDistricts]
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
  };
}
