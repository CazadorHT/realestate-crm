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
  NEARBY_PLACE_CATEGORIES,
} from "@/features/properties/labels";
import type { Step3Props } from "../types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

// Util function for parsing numbers
const parseNumber = (s: string) => {
  const cleaned = s.replace(/[^0-9.-]/g, "");
  return cleaned === "" ? undefined : Number(cleaned);
};

/**
 * Step 3: Location
 * Address fields and transit information
 * Compact Refactor
 */
export const Step3Location = React.memo(Step3LocationComponent);
function Step3LocationComponent({ form, mode }: Step3Props) {
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nearby_places",
  });

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
        (s) => s.name_th === watchedSubDistrict,
      );
      if (sub) {
        form.setValue("postal_code", String(sub.zip_code));
      }
    }
  }, [watchedSubDistrict, activeDistrictId, subDistrictOptions, form]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/60 space-y-6">
        <div className="border-b border-slate-50 pb-4">
          <h3 className="text-lg font-bold text-slate-900">
            ระบุตำแหน่งที่ตั้ง
          </h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
            ที่อยู่และการเชื่อมต่อระบบขนส่ง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-slate-700 text-xs uppercase tracking-wide">
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
                    <SelectTrigger className="h-11 rounded-lg bg-slate-50 border-none font-bold px-4 shadow-sm text-sm">
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
                <FormLabel className="font-bold text-slate-700 text-xs uppercase tracking-wide">
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
                    <SelectTrigger className="h-11 rounded-lg bg-slate-50 border-none font-bold px-4 shadow-sm text-sm">
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
                <FormLabel className="font-bold text-slate-700 text-xs uppercase tracking-wide">
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
                    <SelectTrigger className="h-11 rounded-lg bg-slate-50 border-none font-bold px-4 shadow-sm text-sm">
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
                <FormLabel className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                  รหัสไปรษณีย์
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    readOnly
                    className="h-11 rounded-lg bg-slate-100/50 border-none font-bold px-4 shadow-sm text-slate-500 text-sm"
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
              <FormLabel className="text-blue-700 font-bold text-xs uppercase tracking-wider mb-1.5 block">
                พิกัดบน Google Maps
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="วางลิงก์จาก Google Maps ที่นี่..."
                  className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm "
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6 ">
          <FormField
            control={form.control}
            name="near_transit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-6 h-6 rounded-md border-slate-300 data-[state=checked]:bg-blue-600"
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-bold text-slate-800 cursor-pointer">
                    ตั้งอยู่ใกล้ระบบขนส่งสาธารณะ
                  </FormLabel>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    ใกล้ BTS / MRT หรือรถสาธารณะ
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch("near_transit") && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pt-6 border-t border-slate-200/40 animate-in fade-in slide-in-from-top-2 duration-300">
              <FormField
                control={form.control}
                name="transit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">
                      ประเภท
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "BTS"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-white rounded-lg border-none shadow-sm font-bold text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white rounded-xl">
                        {TRANSIT_TYPE_ENUM.map((t) => (
                          <SelectItem
                            key={t}
                            value={t}
                            className="font-bold py-2 text-sm"
                          >
                            {TRANSIT_TYPE_LABELS[t]}
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
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">
                      ชื่อสถานี
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        className="h-10 rounded-lg bg-white border-none shadow-sm font-bold px-4 text-sm"
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
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">
                      ระยะทาง (ม.)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        className="h-10 rounded-lg bg-white border-none shadow-sm font-bold text-center text-sm"
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

      {/* [NEW] Nearby Places Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/60 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              สถานที่ใกล้เคียง
            </h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
              เพิ่มจุดเด่นรอบๆ ทรัพย์สิน (เช่น โรงเรียน, ห้าง, โรงพยาบาล)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ category: "Other", name: "", distance: "", time: "" })
            }
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            + เพิ่มสถานที่
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 rounded-xl bg-slate-50 relative group"
            >
              {/* Category */}
              <div className="md:col-span-3">
                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">
                  ประเภท
                </FormLabel>
                <FormField
                  control={form.control}
                  name={`nearby_places.${index}.category`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="mt-1 h-9 bg-white border-slate-200">
                          <SelectValue placeholder="เลือก..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NEARBY_PLACE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Name */}
              <div className="md:col-span-4">
                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">
                  ชื่อสถานที่
                </FormLabel>
                <FormField
                  control={form.control}
                  name={`nearby_places.${index}.name`}
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="เช่น Central Ladprao"
                        className="mt-1 h-9 bg-white border-slate-200"
                      />
                    </FormControl>
                  )}
                />
              </div>

              {/* Distance */}
              <div className="md:col-span-2">
                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">
                  ระยะทาง
                </FormLabel>
                <FormField
                  control={form.control}
                  name={`nearby_places.${index}.distance`}
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="เช่น 1 กิโลเมตร หรือ 0.5 กิโลเมตร"
                        className="mt-1 h-9 bg-white border-slate-200"
                      />
                    </FormControl>
                  )}
                />
              </div>

              {/* Time */}
              <div className="md:col-span-2">
                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">
                  เวลา (นาที)
                </FormLabel>
                <FormField
                  control={form.control}
                  name={`nearby_places.${index}.time`}
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="เช่น 5 นาที"
                        className="mt-1 h-9 bg-white border-slate-200"
                      />
                    </FormControl>
                  )}
                />
              </div>

              {/* Remove */}
              <div className="md:col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-500"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              ยังไม่มีสถานที่ใกล้เคียง
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
