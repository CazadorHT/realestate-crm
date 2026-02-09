import { useState, useEffect } from "react";
import { ThaiAddressService } from "@/lib/thai-address/service";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface LocalizedAddress {
  province?: string;
  district?: string;
  subdistrict?: string;
}

export function useAddressLocalization(
  provinceTh?: string | null,
  districtTh?: string | null,
  subdistrictTh?: string | null,
) {
  const { language } = useLanguage();
  const [localized, setLocalized] = useState<LocalizedAddress>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If language is Thai, we don't need to do anything complex, just return the inputs
    // But for consistency we might just return them as is.
    if (language === "th") {
      setLocalized({
        province: provinceTh || undefined,
        district: districtTh || undefined,
        subdistrict: subdistrictTh || undefined,
      });
      return;
    }

    if (!provinceTh && !districtTh && !subdistrictTh) return;

    let mounted = true;

    const resolveAddress = async () => {
      setLoading(true);
      try {
        // We typically need provinces loaded to start
        const provinces = await ThaiAddressService.getProvinces();
        const foundProvince = provinces.find((p) => p.name_th === provinceTh);

        let districtEn: string | undefined;
        let subdistrictEn: string | undefined;

        if (foundProvince && districtTh) {
          // Fetch all districts (cached)
          const districts = await ThaiAddressService.getDistricts(true);
          const foundDistrict = districts.find(
            (d) =>
              d.province_id === foundProvince.id && d.name_th === districtTh,
          );

          if (foundDistrict) {
            districtEn = foundDistrict.name_en;

            if (subdistrictTh) {
              const subdistricts = await ThaiAddressService.getSubDistricts();
              const foundSub = subdistricts.find(
                (s) =>
                  s.district_id === foundDistrict.id &&
                  s.name_th === subdistrictTh,
              );
              if (foundSub) {
                subdistrictEn = foundSub.name_en;
              }
            }
          }
        }

        if (mounted) {
          setLocalized({
            province: foundProvince?.name_en || provinceTh || undefined,
            district: districtEn || districtTh || undefined,
            subdistrict: subdistrictEn || subdistrictTh || undefined,
          });
        }
      } catch (error) {
        console.error("Error localizing address:", error);
        // Fallback to original
        if (mounted) {
          setLocalized({
            province: provinceTh || undefined,
            district: districtTh || undefined,
            subdistrict: subdistrictTh || undefined,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    resolveAddress();

    return () => {
      mounted = false;
    };
  }, [provinceTh, districtTh, subdistrictTh, language]);

  return { localized, loading };
}
