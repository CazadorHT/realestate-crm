"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useThaiAddress } from "@/hooks/useThaiAddress";
import {
  TRANSIT_TYPE_LABELS,
  TRANSIT_TYPE_ENUM,
} from "@/features/properties/labels";
import type { Step3Props } from "../types";

// Util function for parsing numbers
const parseNumber = (s: string) => {
  const cleaned = s.replace(/[^0-9.-]/g, "");
  return cleaned === "" ? undefined : Number(cleaned);
};

/**
 * Step 3: Location
 * Address fields and transit information
 * Uses useThaiAddress hook internally for province/district/subdistrict
 */
export function Step3Location({ form, mode }: Step3Props) {
  const {
    provinces,
    getDistricts,
    getSubDistricts,
    ensureDistrictsLoaded,
    ensureSubDistrictsLoaded,
    loading: addressLoading,
  } = useThaiAddress();

  const watchedProvince = form.watch("province");
  const watchedDistrict = form.watch("district");
  const watchedSubDistrict = form.watch("subdistrict");

  // Load dependent data when needed
  React.useEffect(() => {
    if (watchedProvince) {
      ensureDistrictsLoaded();
    }
  }, [watchedProvince, ensureDistrictsLoaded]);

  React.useEffect(() => {
    if (watchedDistrict) {
      ensureSubDistrictsLoaded();
    }
  }, [watchedDistrict, ensureSubDistrictsLoaded]);

  const activeProvinceId = React.useMemo(() => {
    return provinces.find((p) => p.name_th === watchedProvince)?.id;
  }, [provinces, watchedProvince]);

  const activeDistrictId = React.useMemo(() => {
    if (!activeProvinceId) return undefined;
    const districts = getDistricts(activeProvinceId);
    return districts.find((d) => d.name_th === watchedDistrict)?.id;
  }, [activeProvinceId, watchedDistrict, getDistricts]);

  const districtOptions = React.useMemo(() => {
    if (!activeProvinceId) return [];
    return getDistricts(activeProvinceId);
  }, [activeProvinceId, getDistricts]);

  const subDistrictOptions = React.useMemo(() => {
    if (!activeDistrictId) return [];
    return getSubDistricts(activeDistrictId);
  }, [activeDistrictId, getSubDistricts]);

  // Auto-fill zip code
  React.useEffect(() => {
    if (watchedSubDistrict && activeDistrictId) {
      const sub = subDistrictOptions.find(
        (s) => s.name_th === watchedSubDistrict
      );
      if (sub) {
        form.setValue("postal_code", String(sub.zip_code));
      }
    }
  }, [watchedSubDistrict, activeDistrictId, subDistrictOptions, form]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-700">
      <section className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-10">
        <div className="border-b border-slate-50 pb-6">
          <h3 className="text-2xl font-black text-slate-900">
            ระบุตำแหน่งที่ตั้ง
          </h3>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
            ที่อยู่และการเชื่อมต่อระบบขนส่ง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-slate-700">
                  จังหวัด{" "}
                  {addressLoading && (
                    <Loader2 className="inline h-3 w-3 animate-spin text-slate-400" />
                  )}
                </FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(val) => {
                    field.onChange(val);
                    // Reset dependencies
                    form.setValue("district", "");
                    form.setValue("subdistrict", "");
                    form.setValue("postal_code", "");
                    ensureDistrictsLoaded();
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-sm">
                      <SelectValue placeholder="เลือกจังหวัด" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.name_th}>
                        {p.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-slate-700">
                  เขต / อำเภอ
                </FormLabel>
                <Select
                  value={field.value ?? ""}
                  disabled={!activeProvinceId}
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("subdistrict", "");
                    form.setValue("postal_code", "");
                    ensureSubDistrictsLoaded();
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-sm">
                      <SelectValue placeholder="เลือกอำเภอ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {districtOptions.map((d) => (
                      <SelectItem key={d.id} value={d.name_th}>
                        {d.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subdistrict"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-slate-700">
                  แขวง / ตำบล
                </FormLabel>
                <Select
                  value={field.value ?? ""}
                  disabled={!activeDistrictId}
                  onValueChange={(val) => {
                    field.onChange(val);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-sm">
                      <SelectValue placeholder="เลือกตำบล" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {subDistrictOptions.map((s) => (
                      <SelectItem key={s.id} value={s.name_th}>
                        {s.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-slate-700">
                  รหัสไปรษณีย์
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    readOnly
                    className="h-14 rounded-2xl bg-slate-100/50 border-none font-bold px-6 shadow-sm text-slate-500"
                    placeholder="อัตโนมัติ"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="google_maps_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-2 block">
                พิกัดบน Google Maps
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="วางลิงก์จาก Google Maps ที่นี่..."
                  className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
          <FormField
            control={form.control}
            name="near_transit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-6 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-8 h-8 rounded-xl border-slate-300 data-[state=checked]:bg-blue-600"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-xl font-black text-slate-800 cursor-pointer">
                    ตั้งอยู่ใกล้ระบบขนส่งสาธารณะ
                  </FormLabel>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    ใกล้ BTS / MRT หรือรถสาธารณะ
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch("near_transit") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-200/40 animate-in fade-in slide-in-from-top-4 duration-500">
              <FormField
                control={form.control}
                name="transit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                      ประเภทรถไฟฟ้า
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "BTS"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-14 bg-white rounded-2xl border-none shadow-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white rounded-2xl">
                        {TRANSIT_TYPE_ENUM.map((t: any) => (
                          <SelectItem
                            key={t}
                            value={t}
                            className="font-bold py-3"
                          >
                            {(TRANSIT_TYPE_LABELS as any)[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transit_station_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                      ชื่อสถานี
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        className="h-14 rounded-2xl bg-white border-none shadow-sm font-black px-6"
                        placeholder="ทองหล่อ"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transit_distance_meters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                      ระยะทาง (เมตร)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        className="h-14 rounded-2xl bg-white border-none shadow-sm font-black text-center"
                        placeholder="350"
                        onChange={(e) =>
                          field.onChange(parseNumber(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
