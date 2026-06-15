"use client";

import * as React from "react";
import {
  Loader2,
  Map as MapIcon,
  MapPinned,
  SignpostBig,
  Mail,
  MapPin,
  Languages,
  Sparkles,
  Check,
  Search,
} from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useThaiAddress } from "@/hooks/useThaiAddress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useAITranslation } from "../../hooks/use-ai-translation";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

interface AddressSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
}

export function AddressSection({ form: formProp }: AddressSectionProps) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const {
    provinces,
    getDistricts,
    getSubDistricts,
    ensureDistrictsLoaded,
    ensureSubDistrictsLoaded,
    loading: addressLoading,
  } = useThaiAddress();
  const { isTranslating, translateAddress } = useAITranslation(form);

  const [provinceOpen, setProvinceOpen] = React.useState(false);
  const [districtOpen, setDistrictOpen] = React.useState(false);
  const [subdistrictOpen, setSubdistrictOpen] = React.useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState(false);

  const [provinceSearch, setProvinceSearch] = React.useState("");
  const [districtSearch, setDistrictSearch] = React.useState("");
  const [subdistrictSearch, setSubdistrictSearch] = React.useState("");

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1535px)");
    const onChange = () => setIsMobileOrTablet(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

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

  const filteredProvinces = React.useMemo(() => {
    const q = provinceSearch.trim().toLowerCase();
    if (!q) return provinces;
    return provinces.filter(
      (p) =>
        p.name_th.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q),
    );
  }, [provinces, provinceSearch]);

  const filteredDistricts = React.useMemo(() => {
    const q = districtSearch.trim().toLowerCase();
    if (!q) return districtOptions;
    return districtOptions.filter(
      (d) =>
        d.name_th.toLowerCase().includes(q) ||
        d.name_en.toLowerCase().includes(q),
    );
  }, [districtOptions, districtSearch]);

  const filteredSubdistricts = React.useMemo(() => {
    const q = subdistrictSearch.trim().toLowerCase();
    if (!q) return subDistrictOptions;
    return subDistrictOptions.filter(
      (s) =>
        s.name_th.toLowerCase().includes(q) ||
        s.name_en.toLowerCase().includes(q),
    );
  }, [subDistrictOptions, subdistrictSearch]);

  // Note: Postal code auto-fill is handled in subdistrict onValueChange

  return (
    <Card className="border-slate-200/70 bg-white shadow-sm">
      <CardHeader className="space-y-4 pb-0">
        <SectionHeader
          icon={MapPin}
          title="ที่ตั้งและทำเล"
          desc="ระบุพิกัดให้แม่นยำเพื่อการค้นหาที่ดีขึ้น"
          tone="blue"
          right={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold px-3 shadow-xs transition-all active:scale-95"
              disabled={isTranslating}
              onClick={() => translateAddress()}
            >
              {isTranslating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI {isTranslating ? "กำลังแปล..." : "แปลที่อยู่"}
            </Button>
          }
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent className="pt-6 px-4 sm:px-6">
        {/* Address Grid */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Province */}
          <FormField
            control={form.control}
            name="province"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                  <MapIcon className="h-3.5 w-3.5 text-blue-500" />
                  จังหวัด <span className="text-red-500">*</span>{" "}
                  {addressLoading && (
                    <Loader2 className="inline h-3 w-3 animate-spin text-slate-400" />
                  )}
                </FormLabel>
                {isMobileOrTablet ? (
                  <ResponsiveDialog
                    open={provinceOpen}
                    onOpenChange={(open) => {
                      setProvinceOpen(open);
                      if (!open) setProvinceSearch("");
                    }}
                    title="เลือกจังหวัด"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs justify-start text-left text-slate-800"
                      >
                        <span>{field.value || "เลือกจังหวัด"}</span>
                      </Button>
                    }
                  >
                    <div className="flex flex-col h-full max-h-[70vh] bg-white">
                      <div className="flex items-center border-b border-slate-100 px-4 py-2 shrink-0 bg-white">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                        <Input
                          value={provinceSearch}
                          onChange={(e) => setProvinceSearch(e.target.value)}
                          placeholder="ค้นหาชื่อจังหวัด..."
                          className="h-10 w-full border-0 bg-transparent pr-2 placeholder:text-sm text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-slate-50/30">
                        {filteredProvinces.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs font-medium bg-white border border-slate-100 rounded-xl">
                            ไม่พบจังหวัดที่คุณค้นหา
                          </div>
                        ) : (
                          [...filteredProvinces]
                            .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
                            .map((p) => {
                              const isSelected = field.value === p.name_th;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(p.name_th);
                                    // Reset dependent fields
                                    form.setValue("district", "");
                                    form.setValue("subdistrict", "");
                                    form.setValue("postal_code", "");
                                    setProvinceOpen(false);
                                    setProvinceSearch("");
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                    isSelected
                                      ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                      : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                                  )}
                                >
                                  <span className="text-xs font-bold">{p.name_th}</span>
                                  {isSelected && (
                                    <div className="bg-blue-600 rounded-full p-1 text-white">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  )}
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </ResponsiveDialog>
                ) : (
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
                      {[...provinces]
                        .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
                        .map((p) => (
                          <SelectItem key={p.id} value={p.name_th}>
                            {p.name_th}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1 min-h-[32px]" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 min-h-[32px]">
                    เลือกจังหวัดที่ตั้งของทรัพย์สิน
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* District */}
          <FormField
            control={form.control}
            name="district"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                  <MapPinned className="h-3.5 w-3.5 text-blue-500" />
                  เขต / อำเภอ <span className="text-red-500">*</span>
                </FormLabel>
                {isMobileOrTablet ? (
                  <ResponsiveDialog
                    open={districtOpen}
                    onOpenChange={(open) => {
                      setDistrictOpen(open);
                      if (!open) setDistrictSearch("");
                    }}
                    title="เลือกเขต / อำเภอ"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!activeProvinceId}
                        className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs justify-start text-left text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{field.value || "เลือกอำเภอ"}</span>
                      </Button>
                    }
                  >
                    <div className="flex flex-col h-full max-h-[70vh] bg-white">
                      {districtOptions.length > 0 && (
                        <div className="flex items-center border-b border-slate-100 px-4 py-2 shrink-0 bg-white">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                          <Input
                            value={districtSearch}
                            onChange={(e) => setDistrictSearch(e.target.value)}
                            placeholder="ค้นหาเขต/อำเภอ..."
                            className="h-10 w-full border-0 bg-transparent pr-2 placeholder:text-sm text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                      )}
                      <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-slate-50/30">
                        {districtOptions.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white border border-slate-100 rounded-xl">
                            กรุณาเลือกจังหวัดก่อน
                          </div>
                        ) : filteredDistricts.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs font-medium bg-white border border-slate-100 rounded-xl">
                            ไม่พบเขต/อำเภอที่คุณค้นหา
                          </div>
                        ) : (
                          [...filteredDistricts]
                            .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
                            .map((d) => {
                              const isSelected = field.value === d.name_th;
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(d.name_th);
                                    form.setValue("subdistrict", "");
                                    form.setValue("postal_code", "");
                                    setDistrictOpen(false);
                                    setDistrictSearch("");
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                    isSelected
                                      ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                      : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                                  )}
                                >
                                  <span className="text-xs font-bold">{d.name_th.replace(/^เขต/, "")}</span>
                                  {isSelected && (
                                    <div className="bg-blue-600 rounded-full p-1 text-white">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  )}
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </ResponsiveDialog>
                ) : (
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
                      {[...districtOptions]
                        .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
                        .map((d) => (
                          <SelectItem key={d.id} value={d.name_th}>
                            {d.name_th.replace(/^เขต/, "")}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1 min-h-[32px]" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 min-h-[32px]">
                    เลือกเขตหรืออำเภอ
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* SubDistrict */}
          <FormField
            control={form.control}
            name="subdistrict"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                  <SignpostBig className="h-3.5 w-3.5 text-blue-500" />
                  แขวง / ตำบล <span className="text-red-500">*</span>
                </FormLabel>
                {isMobileOrTablet ? (
                  <ResponsiveDialog
                    open={subdistrictOpen}
                    onOpenChange={(open) => {
                      setSubdistrictOpen(open);
                      if (!open) setSubdistrictSearch("");
                    }}
                    title="เลือกแขวง / ตำบล"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!activeDistrictId}
                        className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs justify-start text-left text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{field.value || "เลือกตำบล"}</span>
                      </Button>
                    }
                  >
                    <div className="flex flex-col h-full max-h-[70vh] bg-white">
                      {subDistrictOptions.length > 0 && (
                        <div className="flex items-center border-b border-slate-100 px-4 py-2 shrink-0 bg-white">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                          <Input
                            value={subdistrictSearch}
                            onChange={(e) => setSubdistrictSearch(e.target.value)}
                            placeholder="ค้นหาแขวง/ตำบล..."
                            className="h-10 w-full border-0 bg-transparent pr-2 placeholder:text-sm text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                      )}
                      <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-slate-50/30">
                        {subDistrictOptions.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white border border-slate-100 rounded-xl">
                            กรุณาเลือกอำเภอก่อน
                          </div>
                        ) : filteredSubdistricts.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs font-medium bg-white border border-slate-100 rounded-xl">
                            ไม่พบแขวง/ตำบลที่คุณค้นหา
                          </div>
                        ) : (
                          [...filteredSubdistricts]
                            .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
                            .map((s) => {
                              const isSelected = field.value === s.name_th;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(s.name_th);
                                    // Auto-fill postal code
                                    form.setValue("postal_code", String(s.zip_code));
                                    setSubdistrictOpen(false);
                                    setSubdistrictSearch("");
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                    isSelected
                                      ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                      : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                                  )}
                                >
                                  <span className="text-xs font-bold">{s.name_th}</span>
                                  {isSelected && (
                                    <div className="bg-blue-600 rounded-full p-1 text-white">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  )}
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </ResponsiveDialog>
                ) : (
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
                      {[...subDistrictOptions]
                        .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.name_th}>
                            {s.name_th}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1 min-h-[32px]" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 min-h-[32px]">
                    เลือกแขวงหรือตำบล ระบบจะเติมรหัสไปรษณีย์ให้อัตโนมัติ
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* Postal Code */}
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  รหัสไปรษณีย์
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    readOnly
                    placeholder="-"
                    className="h-11 rounded-lg bg-slate-100 border-slate-200 font-medium px-4 shadow-sm text-xs cursor-not-allowed text-left"
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1 min-h-[32px]" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 min-h-[32px]">
                    รหัสไปรษณีย์จะถูกเติมตามตำบลที่เลือก
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* Address Line 1 / Project Name */}
          <FormField
            control={form.control}
            name="address_line1"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 md:col-span-4 lg:col-span-1">
                <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                  <SignpostBig className="w-4 h-4 text-blue-500" />
                  ที่อยู่ / โครงการ
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="เลขที่บ้าน / ชื่อโครงการ..."
                    className="h-11 rounded-lg border-slate-200 bg-white px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1">
                    บ้านเลขที่, ชื่อหมู่บ้าน หรือชื่อโครงการ (ถ้ามี)
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* Address English */}
          <FormField
            control={form.control}
            name="address_line1_en"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 md:col-span-4 lg:col-span-1">
                <FormLabel className="flex items-center gap-2 text-slate-500 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                  <Languages className="w-3.5 h-3.5" />
                  Address (English)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Project Name / Address in English..."
                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1">
                    ชื่อโครงการในภาษาอังกฤษ
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* Address Chinese */}
          <FormField
            control={form.control}
            name="address_line1_cn"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 md:col-span-4 lg:col-span-1">
                <FormLabel className="flex items-center gap-2 text-slate-500 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                  <Languages className="w-3.5 h-3.5" />
                  地址 (Chinese)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="项目名称 / 地址 (中文)..."
                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1">
                    ชื่อโครงการในภาษาจีน
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* Address Russian */}
          <FormField
            control={form.control}
            name="address_line1_ru"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 md:col-span-4 lg:col-span-1">
                <FormLabel className="flex items-center gap-2 text-slate-500 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                  <Languages className="w-3.5 h-3.5" />
                  Адрес (Russian)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Название проекта / Адрес на русском..."
                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1">
                    ชื่อโครงการในภาษารัสเซีย
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* Google Maps Link */}
          <FormField
            control={form.control}
            name="google_maps_link"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 md:col-span-4 lg:col-span-2">
                <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                  <MapIcon className="w-4 h-4 text-blue-500" />
                  Google Maps Link
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="วลิงก์จาก Google Maps..."
                    className="h-11 rounded-lg border-slate-200 bg-white px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 leading-relaxed">
                     google map ตัวอย่าง "https://maps.app.goo.gl/....."
                  </FormDescription>
                )}
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
