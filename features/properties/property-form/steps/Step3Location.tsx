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
import {
  Trash2,
  MapPin,
  TrainFront,
  Landmark,
  Map,
  MapPinned,
  SignpostBig,
  Mail,
} from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../components/SectionHeader";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      {/* ===== LOCATION & ADDRESS ===== */}
      <Card className="border-slate-200/70 bg-white shadow-sm">
        <CardHeader className="space-y-4 pb-0">
          <SectionHeader
            icon={MapPin}
            title="ที่ตั้งและทำเล"
            desc="ระบุพิกัดให้แม่นยำเพื่อการค้นหาที่ดีขึ้น"
            tone="blue"
          />
          <Separator className="bg-slate-200/70" />
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {/* Address Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                    <Map className="h-3.5 w-3.5 text-blue-500" />
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
                      <SelectTrigger className="h-11 rounded-lg bg-slate-50 zborder-slate-200 font-medium px-4 shadow-sm text-xs focus:ring-0">
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
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                    <MapPinned className="h-3.5 w-3.5 text-blue-500" />
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
                      <SelectTrigger className="h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs focus:ring-0">
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
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                    <SignpostBig className="h-3.5 w-3.5 text-blue-500" />
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
                      <SelectTrigger className="h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs focus:ring-0">
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
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    รหัสไปรษณีย์
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="h-11 rounded-lg w-32 bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-slate-900 text-xs focus:ring-0"
                      placeholder="อัตโนมัติ"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="google_maps_link"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-3">
                  <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-xs uppercase tracking-wider">
                    <Map className="w-4 h-4 text-blue-500" />
                    Google Maps Link
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="วางลิงก์จาก Google Maps ที่นี่ (https://maps.google.com/...)"
                      className="h-11 rounded-lg border-slate-200 bg-white px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

        </CardContent>
      </Card>

      {/* ===== TRANSPORTATION & NEARBY PLACES GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ===== TRANSPORTATION ===== */}
        <Card className="border-slate-200/70 bg-white shadow-sm h-full">
          <CardHeader className="space-y-4 pb-0">
            <SectionHeader
              icon={TrainFront}
              title="การเดินทาง"
              desc="รถไฟฟ้าและจุดเชื่อมต่อสำคัญ"
              tone="default"
            />
            <Separator className="bg-slate-200/70" />
          </CardHeader>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="near_transit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-base font-bold text-slate-800 cursor-pointer">
                      ตั้งอยู่ใกล้รถไฟฟ้า / รถสาธารณะ
                    </FormLabel>
                    <p className="text-xs text-slate-500 font-medium">
                      หากติ๊กเลือก จะมีช่องให้กรอกรายละเอียดเพิ่มเติม
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("near_transit") && (
              <div className="grid grid-cols-1 gap-5 pt-6 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <FormField
                  control={form.control}
                  name="transit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5 block">
                        ประเภท
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? "BTS"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-white rounded-lg border-slate-200 shadow-sm font-medium text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white rounded-xl">
                          {TRANSIT_TYPE_ENUM.map((t) => (
                            <SelectItem
                              key={t}
                              value={t}
                              className="font-medium py-2 text-sm"
                            >
                              {TRANSIT_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="transit_station_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5 block">
                          ชื่อสถานี
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium px-4 text-sm"
                            placeholder="เช่น สถานีทองหล่อ"
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
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5 block">
                          ระยะทาง (ม.)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium text-center text-sm"
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== NEARBY PLACES ===== */}
        <Card className="border-slate-200/70 bg-white shadow-sm h-full">
          <CardHeader className="space-y-4 pb-0">
            <SectionHeader
              icon={Landmark}
              title="สถานที่ใกล้เคียง"
              desc="เพิ่มจุดเด่นรอบๆ ทรัพย์สิน"
              tone="default"
              right={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      category: "Other",
                      name: "",
                      distance: "",
                      time: "",
                    })
                  }
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs font-bold"
                >
                  + เพิ่ม
                </Button>
              }
            />
            <Separator className="bg-slate-200/70" />
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-3 items-end p-4 rounded-xl bg-slate-50 border border-slate-100 relative group transition-all hover:bg-slate-100/80"
                >
                  {/* Category */}
                  <div className="col-span-12 md:col-span-4">
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-400">
                      ประเภท
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name={`nearby_places.${index}.category`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="mt-1 h-9 bg-white border-slate-200 text-sm">
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
                  <div className="col-span-12 md:col-span-8">
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
                            placeholder="ชื่อสถานที่"
                            className="mt-1 h-9 bg-white border-slate-200 text-sm"
                          />
                        </FormControl>
                      )}
                    />
                  </div>

                  {/* Distance */}
                  <div className="col-span-6 md:col-span-5">
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
                            placeholder="1 กม."
                            className="mt-1 h-9 bg-white border-slate-200 text-sm"
                          />
                        </FormControl>
                      )}
                    />
                  </div>

                  {/* Time */}
                  <div className="col-span-6 md:col-span-5">
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-400">
                      เวลา
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name={`nearby_places.${index}.time`}
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="5 นาที"
                            className="mt-1 h-9 bg-white border-slate-200 text-sm"
                          />
                        </FormControl>
                      )}
                    />
                  </div>

                  {/* Remove */}
                  <div className="col-span-12 md:col-span-2 flex justify-end md:justify-center mt-2 md:mt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500 hover:bg-white"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  <Landmark className="w-8 h-8 text-slate-300 mb-2" />
                  <p>ยังไม่มีสถานที่ใกล้เคียง</p>
                  <Button
                    variant="link"
                    onClick={() =>
                      append({
                        category: "Other",
                        name: "",
                        distance: "",
                        time: "",
                      })
                    }
                    className="text-blue-500 font-bold"
                  >
                    + เพิ่มรายการแรก
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
