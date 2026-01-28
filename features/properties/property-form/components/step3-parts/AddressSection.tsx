"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useThaiAddress } from "@/hooks/useThaiAddress";
import { Map, MapPinned, SignpostBig, Mail } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import { MapPin } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

interface AddressSectionProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function AddressSection({ form }: AddressSectionProps) {
  const {
    provinces,
    getDistricts,
    getSubDistricts,
    ensureDistrictsLoaded,
    ensureSubDistrictsLoaded,
    loading: addressLoading,
  } = useThaiAddress();

  // Preload all address data once on mount
  React.useEffect(() => {
    ensureDistrictsLoaded();
    ensureSubDistrictsLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedProvince = form.watch("province");
  const watchedDistrict = form.watch("district");
  const watchedSubDistrict = form.watch("subdistrict");

  // Compute IDs and options directly for reactivity
  const activeProvinceId = provinces.find(
    (p) => p.name_th === watchedProvince,
  )?.id;

  const districtOptions = activeProvinceId
    ? getDistricts(activeProvinceId)
    : [];

  const activeDistrictId = districtOptions.find(
    (d) => d.name_th === watchedDistrict,
  )?.id;

  const subDistrictOptions = activeDistrictId
    ? getSubDistricts(activeDistrictId)
    : [];

  // Note: Postal code auto-fill is handled in subdistrict onValueChange

  return (
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
        <div className="flex gap-6">
          {/* Province */}
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem className="w-[175px]">
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
                    // Reset dependent fields
                    form.setValue("district", "");
                    form.setValue("subdistrict", "");
                    form.setValue("postal_code", "");
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs focus:ring-0">
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

          {/* District */}
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem className="w-[175px]">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                  <MapPinned className="h-3.5 w-3.5 text-blue-500" />
                  เขต / อำเภอ
                </FormLabel>
                <Select
                  key={`district-${activeProvinceId || "none"}`}
                  value={field.value ?? ""}
                  disabled={!activeProvinceId}
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("subdistrict", "");
                    form.setValue("postal_code", "");
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs focus:ring-0">
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

          {/* SubDistrict */}
          <FormField
            control={form.control}
            name="subdistrict"
            render={({ field }) => (
              <FormItem className="w-[175px]">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                  <SignpostBig className="h-3.5 w-3.5 text-blue-500" />
                  แขวง / ตำบล
                </FormLabel>
                <Select
                  key={`subdistrict-${activeDistrictId || "none"}`}
                  value={field.value ?? ""}
                  disabled={!activeDistrictId}
                  onValueChange={(val) => {
                    field.onChange(val);
                    // Auto-fill postal code
                    const sub = subDistrictOptions.find(
                      (s) => s.name_th === val,
                    );
                    if (sub) {
                      form.setValue("postal_code", String(sub.zip_code));
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs focus:ring-0">
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

          {/* Postal Code */}
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem className="w-[175px]">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  รหัสไปรษณีย์
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    readOnly
                    placeholder="-"
                    className="rounded-lg bg-slate-100 border-slate-200 font-medium px-4 shadow-sm text-xs cursor-not-allowed text-left"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Google Maps Link */}
          <FormField
            control={form.control}
            name="google_maps_link"
            render={({ field }) => (
              <FormItem className="flex-1">
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
  );
}
