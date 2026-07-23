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
  Plus,
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
import { useThaiAddress } from "@/hooks/useThaiAddress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useAITranslation } from "../../hooks/use-ai-translation";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

import { getProjectSuggestions } from "../../../actions/project-suggestions";
import { AddressSelectorField } from "./AddressSelectorField";
import { QuickCreateProjectDialog } from "./QuickCreateProjectDialog";

interface AddressSectionProps {
  form?: UseFormReturn<PropertyFormValues>;
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

  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);

  const watchedAddressLine1 = form.watch("address_line1") || "";
  const watchedAddressLine1En = form.watch("address_line1_en") || "";
  const watchedProvince = form.watch("province") || "";
  const watchedDistrict = form.watch("district") || "";
  const watchedSubdistrict = form.watch("subdistrict") || "";

  const fetchSuggestions = React.useCallback(async (val: string) => {
    setIsLoadingSuggestions(true);
    try {
      const res = await getProjectSuggestions(val);
      setSuggestions(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  React.useEffect(() => {
    if (!showDropdown) return;
    const timer = setTimeout(() => {
      fetchSuggestions(watchedAddressLine1);
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedAddressLine1, showDropdown, fetchSuggestions]);

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleSelectProject = (proj: any) => {
    form.setValue("address_line1", proj.address_line1, { shouldValidate: true });
    if (proj.address_line1_en) {
      form.setValue("address_line1_en", proj.address_line1_en, { shouldValidate: true });
    }
    form.setValue("project_id", proj.id, { shouldValidate: true });
    
    const cleanWord = (val: string) => {
      if (!val) return "";
      return val.replace(/^(จังหวัด|เขต|อำเภอ|แขวง|ตำบล)/, "").trim();
    };

    if (proj.province) {
      const provOpt = provinces.find(p => cleanWord(p.name_th) === cleanWord(proj.province));
      if (provOpt) {
        form.setValue("province", provOpt.name_th, { shouldValidate: true });
        if (proj.district) {
          const dists = getDistricts(provOpt.id);
          const distOpt = dists.find(d => cleanWord(d.name_th) === cleanWord(proj.district));
          if (distOpt) {
            form.setValue("district", distOpt.name_th, { shouldValidate: true });
            if (proj.subdistrict) {
              const subs = getSubDistricts(distOpt.id);
              const subOpt = subs.find(s => cleanWord(s.name_th) === cleanWord(proj.subdistrict));
              if (subOpt) {
                form.setValue("subdistrict", subOpt.name_th, { shouldValidate: true });
                form.setValue("postal_code", String(subOpt.zip_code), { shouldValidate: true });
              } else {
                form.setValue("subdistrict", cleanWord(proj.subdistrict), { shouldValidate: true });
              }
            }
          } else {
            form.setValue("district", cleanWord(proj.district), { shouldValidate: true });
            form.setValue("subdistrict", cleanWord(proj.subdistrict), { shouldValidate: true });
          }
        }
      } else {
        form.setValue("province", proj.province, { shouldValidate: true });
        form.setValue("district", proj.district, { shouldValidate: true });
        form.setValue("subdistrict", proj.subdistrict, { shouldValidate: true });
      }
    } else {
      form.setValue("province", proj.province, { shouldValidate: true });
      form.setValue("district", proj.district, { shouldValidate: true });
      form.setValue("subdistrict", proj.subdistrict, { shouldValidate: true });
    }

    if (proj.postal_code) {
      form.setValue("postal_code", proj.postal_code, { shouldValidate: true });
    }
    if (proj.google_maps_link) {
      form.setValue("google_maps_link", proj.google_maps_link, { shouldValidate: true });
    }
    
    if (proj.transit_station_code) {
      form.setValue("transit_station_name", proj.transit_station_code, { shouldValidate: true });
      form.setValue("near_transit", true, { shouldValidate: true });
      if (proj.transit_distance_meters) {
        form.setValue("transit_distance_meters", proj.transit_distance_meters, { shouldValidate: true });
      }
    }
    setShowDropdown(false);
  };

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1535px)");
    const onChange = () => setIsMobileOrTablet(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    ensureDistrictsLoaded();
    ensureSubDistrictsLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanWordGlobal = (val: string) => {
    if (!val) return "";
    return val.replace(/^(จังหวัด|เขต|อำเภอ|แขวง|ตำบล)/, "").trim();
  };

  const activeProvinceId = provinces.find(
    (p) => cleanWordGlobal(p.name_th) === cleanWordGlobal(watchedProvince),
  )?.id;

  const districtOptions = activeProvinceId
    ? getDistricts(activeProvinceId)
    : [];

  const activeDistrictId = districtOptions.find(
    (d) => cleanWordGlobal(d.name_th) === cleanWordGlobal(watchedDistrict),
  )?.id;

  const subDistrictOptions = activeDistrictId
    ? getSubDistricts(activeDistrictId)
    : [];

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
              className="h-8 gap-1.5 text-blue-600! border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold px-3 shadow-xs transition-all active:scale-95"
              disabled={isTranslating}
              onClick={() => translateAddress()}
            >
              {isTranslating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>AI {isTranslating ? "กำลังแปล..." : "แปลที่อยู่"}</span>
            </Button>
          }
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent className="pt-6 px-4 sm:px-6">
        <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          
          <AddressSelectorField
            control={form.control}
            name="province"
            label="จังหวัด"
            icon={MapIcon}
            placeholder="เลือกจังหวัด"
            description="เลือกจังหวัดที่ตั้งของทรัพย์สิน"
            options={provinces}
            isOpen={provinceOpen}
            setIsOpen={setProvinceOpen}
            searchQuery={provinceSearch}
            setSearchQuery={setProvinceSearch}
            isMobileOrTablet={isMobileOrTablet}
            loading={addressLoading}
            onSelect={(p) => {
              form.setValue("province", p.name_th, { shouldValidate: true, shouldDirty: true });
              form.setValue("district", "", { shouldDirty: true });
              form.setValue("subdistrict", "", { shouldDirty: true });
              form.setValue("postal_code", "", { shouldDirty: true });
            }}
          />

          <AddressSelectorField
            control={form.control}
            name="district"
            label="เขต / อำเภอ"
            icon={MapPinned}
            placeholder="เลือกอำเภอ"
            description="เลือกเขตหรืออำเภอ"
            disabled={!activeProvinceId}
            options={districtOptions}
            isOpen={districtOpen}
            setIsOpen={setDistrictOpen}
            searchQuery={districtSearch}
            setSearchQuery={setDistrictSearch}
            isMobileOrTablet={isMobileOrTablet}
            formatOptionName={(n) => n.replace(/^เขต/, "")}
            onSelect={(d) => {
              form.setValue("district", d.name_th, { shouldValidate: true, shouldDirty: true });
              form.setValue("subdistrict", "", { shouldDirty: true });
              form.setValue("postal_code", "", { shouldDirty: true });
            }}
          />

          <AddressSelectorField
            control={form.control}
            name="subdistrict"
            label="แขวง / ตำบล"
            icon={SignpostBig}
            placeholder="เลือกตำบล"
            description="เลือกแขวงหรือตำบล ระบบจะเติมรหัสไปรษณีย์ให้อัตโนมัติ"
            disabled={!activeDistrictId}
            options={subDistrictOptions}
            isOpen={subdistrictOpen}
            setIsOpen={setSubdistrictOpen}
            searchQuery={subdistrictSearch}
            setSearchQuery={setSubdistrictSearch}
            isMobileOrTablet={isMobileOrTablet}
            onSelect={(s) => {
              form.setValue("subdistrict", s.name_th, { shouldValidate: true, shouldDirty: true });
              form.setValue("postal_code", String(s.zip_code), { shouldValidate: true, shouldDirty: true });
            }}
          />

          {/* Postal Code */}
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  <span>รหัสไปรษณีย์</span>
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
                  <span>ที่อยู่ / โครงการ</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        form.setValue("project_id", null, { shouldDirty: true });
                      }}
                      onFocus={() => {
                        setShowDropdown(true);
                        fetchSuggestions(field.value || "");
                      }}
                      onBlur={() => {
                        field.onBlur();
                        handleBlur();
                      }}
                      placeholder="เลขที่บ้าน / ชื่อโครงการ..."
                      className="h-11 rounded-lg border-slate-200 bg-white px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                      autoComplete="off"
                    />

                    {showDropdown && (suggestions.length > 0 || isLoadingSuggestions || (watchedAddressLine1.trim().length >= 2 && !form.getValues("project_id"))) && (
                      <div className="absolute z-[999] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {isLoadingSuggestions && suggestions.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                            <span>กำลังค้นหาโครงการ...</span>
                          </div>
                        ) : (
                          <>
                            {suggestions.map((proj) => (
                              <button
                                key={proj.address_line1}
                                type="button"
                                onMouseDown={() => handleSelectProject(proj)}
                                className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                              >
                                <span className="font-semibold text-slate-800">{proj.address_line1}</span>
                                <span className="text-[10px] text-slate-400">
                                  {[proj.subdistrict, proj.district, proj.province].filter(Boolean).join(" » ")}
                                </span>
                              </button>
                            ))}
                            {watchedAddressLine1.trim().length >= 2 && !form.getValues("project_id") && (
                              <button
                                type="button"
                                onMouseDown={() => setIsCreateProjectOpen(true)}
                                className="w-full px-4 py-3 text-left text-xs bg-indigo-50/70 hover:bg-indigo-50 text-indigo-700 font-bold border-t border-indigo-100 flex items-center gap-1.5 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>สร้างโครงการใหม่: "{watchedAddressLine1}" เข้าระบบ</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
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
                  <span>Address (English)</span>
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
                  <span>地址 (Chinese)</span>
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
                  <span>Адрес (Russian)</span>
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
                  <span>Google Maps Link</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="ลิงก์จาก Google Maps..."
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

      <QuickCreateProjectDialog
        isOpen={isCreateProjectOpen}
        onClose={setIsCreateProjectOpen}
        defaultName={watchedAddressLine1}
        defaultNameEn={watchedAddressLine1En}
        defaultProvince={watchedProvince}
        defaultDistrict={watchedDistrict}
        defaultSubdistrict={watchedSubdistrict}
        onCreated={(proj) => {
          form.setValue("address_line1", proj.nameTh || proj.nameEn, { shouldValidate: true, shouldDirty: true });
          if (proj.nameEn) {
            form.setValue("address_line1_en", proj.nameEn, { shouldValidate: true, shouldDirty: true });
          }
          form.setValue("project_id", proj.id, { shouldValidate: true, shouldDirty: true });
          
          const cleanWord = (val: string) => {
            if (!val) return "";
            return val.replace(/^(จังหวัด|เขต|อำเภอ|แขวง|ตำบล)/, "").trim();
          };

          const rawProvince = proj.province;
          const rawDistrict = proj.district;
          const rawSubdistrict = proj.subdistrict;

          if (rawProvince) {
            const provOpt = provinces.find(p => cleanWord(p.name_th) === cleanWord(rawProvince));
            if (provOpt) {
              form.setValue("province", provOpt.name_th, { shouldValidate: true, shouldDirty: true });
              if (rawDistrict) {
                const dists = getDistricts(provOpt.id);
                const distOpt = dists.find(d => cleanWord(d.name_th) === cleanWord(rawDistrict));
                if (distOpt) {
                  form.setValue("district", distOpt.name_th, { shouldValidate: true, shouldDirty: true });
                  if (rawSubdistrict) {
                    const subs = getSubDistricts(distOpt.id);
                    const subOpt = subs.find(s => cleanWord(s.name_th) === cleanWord(rawSubdistrict));
                    if (subOpt) {
                      form.setValue("subdistrict", subOpt.name_th, { shouldValidate: true, shouldDirty: true });
                      form.setValue("postal_code", String(subOpt.zip_code), { shouldValidate: true, shouldDirty: true });
                    } else {
                      form.setValue("subdistrict", cleanWord(rawSubdistrict), { shouldValidate: true, shouldDirty: true });
                    }
                  }
                } else {
                  form.setValue("district", cleanWord(rawDistrict), { shouldValidate: true, shouldDirty: true });
                  if (rawSubdistrict) {
                    form.setValue("subdistrict", cleanWord(rawSubdistrict), { shouldValidate: true, shouldDirty: true });
                  }
                }
              }
            } else {
              form.setValue("province", rawProvince, { shouldValidate: true, shouldDirty: true });
              if (rawDistrict) form.setValue("district", rawDistrict, { shouldValidate: true, shouldDirty: true });
              if (rawSubdistrict) form.setValue("subdistrict", rawSubdistrict, { shouldValidate: true, shouldDirty: true });
            }
          }

          if (proj.googleMapsUrl) {
            form.setValue("google_maps_link", proj.googleMapsUrl, { shouldValidate: true, shouldDirty: true });
          }
        }}
      />
    </Card>
  );
}
