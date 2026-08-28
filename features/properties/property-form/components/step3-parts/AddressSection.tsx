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
  Compass,
  Search,
  Building2,
  ExternalLink,
} from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
import { getExistingProjectLocationAction } from "../../actions/ai-actions";
import { getProjectDefaultFeaturesAction } from "@/features/properties/actions/projects";
import { toast } from "sonner";
import { AddressSelectorField } from "./AddressSelectorField";
import { QuickCreateProjectDialog } from "./QuickCreateProjectDialog";
import { QuickCreateAreaDialog } from "./QuickCreateAreaDialog";
import { checkPopularAreaExistsAction } from "@/features/properties/actions/popular-area-actions";
import { isCbdProperty } from "@/lib/property-utils";

import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  getProvinceName,
  getDistrictName,
  getSubdistrictName,
  registerCustomAreaTranslation,
} from "@/lib/utils/provinces";

interface AddressSectionProps {
  form?: UseFormReturn<PropertyFormValues>;
}

export function AddressSection({ form: formProp }: AddressSectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
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
  const [showDropdownEn, setShowDropdownEn] = React.useState(false);
  const [isProjectSearchModalOpen, setIsProjectSearchModalOpen] = React.useState(false);
  const [modalSearchQuery, setModalSearchQuery] = React.useState("");
  const [modalSuggestions, setModalSuggestions] = React.useState<any[]>([]);
  const [isLoadingModalSuggestions, setIsLoadingModalSuggestions] = React.useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);
  const [isCreateAreaOpen, setIsCreateAreaOpen] = React.useState(false);
  const [showAreaPrompt, setShowAreaPrompt] = React.useState(false);
  const [areaPromptName, setAreaPromptName] = React.useState("");

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

  const fetchModalSuggestions = React.useCallback(async (val: string) => {
    setIsLoadingModalSuggestions(true);
    try {
      const res = await getProjectSuggestions(val, 50);
      setModalSuggestions(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingModalSuggestions(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isProjectSearchModalOpen) return;
    const timer = setTimeout(() => {
      fetchModalSuggestions(modalSearchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [modalSearchQuery, isProjectSearchModalOpen, fetchModalSuggestions]);

  React.useEffect(() => {
    if (!showDropdown) return;
    const timer = setTimeout(() => {
      fetchSuggestions(watchedAddressLine1);
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedAddressLine1, showDropdown, fetchSuggestions]);

  React.useEffect(() => {
    if (!showDropdownEn) return;
    const timer = setTimeout(() => {
      fetchSuggestions(watchedAddressLine1En);
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedAddressLine1En, showDropdownEn, fetchSuggestions]);

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
      setShowDropdownEn(false);
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
        let foundDistrict = false;
        if (proj.district) {
          const dists = getDistricts(provOpt.id);
          const distOpt = dists.find(d => cleanWord(d.name_th) === cleanWord(proj.district));
          if (distOpt) {
            form.setValue("district", distOpt.name_th, { shouldValidate: true });
            foundDistrict = true;
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
          }
        }

        // Reverse lookup district from subdistrict if district was not matched or missing
        if (!foundDistrict && proj.subdistrict) {
          const dists = getDistricts(provOpt.id);
          for (const d of dists) {
            const subs = getSubDistricts(d.id);
            const subOpt = subs.find(s => cleanWord(s.name_th) === cleanWord(proj.subdistrict));
            if (subOpt) {
              form.setValue("district", d.name_th, { shouldValidate: true });
              form.setValue("subdistrict", subOpt.name_th, { shouldValidate: true });
              if (subOpt.zip_code) {
                form.setValue("postal_code", String(subOpt.zip_code), { shouldValidate: true });
              }
              foundDistrict = true;
              break;
            }
          }
        }

        if (!foundDistrict && proj.district) {
          form.setValue("district", cleanWord(proj.district), { shouldValidate: true });
          if (proj.subdistrict) {
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

    // Auto-fetch existing transit & nearby places from project if available
    getExistingProjectLocationAction({
      projectId: proj.id,
      addressLine1: proj.address_line1,
    }).then((res) => {
      if (res.success && res.data) {
        const { transits = [], places = [] } = res.data;
        if (transits.length > 0 || places.length > 0) {
          form.setValue("nearby_transits", transits, { shouldDirty: true, shouldTouch: true });
          form.setValue("nearby_places", places, { shouldDirty: true, shouldTouch: true });
          toast.success(isEn ? "Location & transit synced from project ✨" : "ดึงข้อมูลการเดินทางและสถานที่ใกล้เคียงจากโครงการเดิมสำเร็จ ✨");
        }
      }
    });

    // Auto-fetch default project features for Step 5
    getProjectDefaultFeaturesAction(proj.id).then((res) => {
      if (res.success && res.featureIds && res.featureIds.length > 0) {
        const currentFeatures = new Set<string>(form.getValues("feature_ids") || []);
        res.featureIds.forEach((id) => currentFeatures.add(id));
        form.setValue("feature_ids", Array.from(currentFeatures), {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast.success(isEn ? `Applied ${res.featureIds.length} project amenities ✨` : `เลือกสิ่งอำนวยความสะดวกจากโครงการสำเร็จ ✨ (${res.featureIds.length} รายการ)`);
      }
    });

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

  const activeProvinceId = React.useMemo(() => {
    if (!watchedProvince) return null;
    const p = provinces.find((item) => cleanWordGlobal(item.name_th) === cleanWordGlobal(watchedProvince));
    return p ? p.id : null;
  }, [watchedProvince, provinces]);

  // Auto reverse-lookup District if Province and Subdistrict are filled, but District is empty/missing
  React.useEffect(() => {
    if (activeProvinceId && watchedSubdistrict && !watchedDistrict) {
      const dists = getDistricts(activeProvinceId);
      for (const d of dists) {
        const subs = getSubDistricts(d.id);
        const subOpt = subs.find(
          (s) => cleanWordGlobal(s.name_th) === cleanWordGlobal(watchedSubdistrict),
        );
        if (subOpt) {
          form.setValue("district", d.name_th, { shouldValidate: true, shouldDirty: true });
          if (!form.getValues("postal_code") && subOpt.zip_code) {
            form.setValue("postal_code", String(subOpt.zip_code), { shouldValidate: true, shouldDirty: true });
          }
          break;
        }
      }
    }
  }, [activeProvinceId, watchedSubdistrict, watchedDistrict, getDistricts, getSubDistricts, form]);

  React.useEffect(() => {
    async function checkArea() {
      if (!watchedProvince) {
        setShowAreaPrompt(false);
        return;
      }

      // Check subdistrict first if selected, else district
      const targetAreaTh = watchedSubdistrict || watchedDistrict;
      if (!targetAreaTh) {
        setShowAreaPrompt(false);
        return;
      }

      try {
        const cleanName = targetAreaTh.replace(/^(จังหวัด|จ\.|เขต|อำเภอ|อ\.|แขวง|ตำบล|ต\.)/, "").trim();
        
        // 1. Check if it already has an English translation in memory/PROVINCES dictionary
        const hasEn = getSubdistrictName(cleanName, "en") !== cleanName || getDistrictName(cleanName, "en") !== cleanName;
        
        // 2. If not translated, check popular_areas_v3 DB table
        const existsInDb = await checkPopularAreaExistsAction(watchedProvince, cleanName);

        if (!hasEn && !existsInDb.exists) {
          setAreaPromptName(cleanName);
          setShowAreaPrompt(true);
        } else {
          setShowAreaPrompt(false);
        }
      } catch (err) {
        setShowAreaPrompt(false);
      }
    }
    checkArea();
  }, [watchedSubdistrict, watchedDistrict, watchedProvince]);

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  React.useEffect(() => {
    if (activeProvinceId) {
      ensureDistrictsLoaded();
    }
  }, [activeProvinceId, ensureDistrictsLoaded]);

  const districtOptions = activeProvinceId ? getDistricts(activeProvinceId) : [];

  const activeDistrictId = React.useMemo(() => {
    if (!watchedDistrict || !districtOptions.length) return null;
    const d = districtOptions.find((item) => item.name_th === watchedDistrict);
    return d ? d.id : null;
  }, [watchedDistrict, districtOptions]);

  React.useEffect(() => {
    if (activeDistrictId) {
      ensureSubDistrictsLoaded();
    }
  }, [activeDistrictId, ensureSubDistrictsLoaded]);

  const subDistrictOptions = activeDistrictId ? getSubDistricts(activeDistrictId) : [];

  return (
    <Card className="border-slate-200/70 bg-white shadow-sm relative">
      <CardHeader className="space-y-4 pb-0">
        <SectionHeader
          icon={MapPin}
          title={isEn ? "Location & Address" : "ที่ตั้งและทำเล"}
          desc={isEn ? "Accurate coordinates & location for enhanced search discovery" : "ระบุพิกัดให้แม่นยำเพื่อการค้นหาที่ดีขึ้น"}
          tone="blue"
          right={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-blue-600! border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold px-3 shadow-xs transition-all active:scale-95 cursor-pointer"
                disabled={isTranslating}
                onClick={() => translateAddress()}
              >
                {isTranslating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{isTranslating ? (isEn ? "Translating..." : "กำลังแปล...") : (isEn ? "AI Translate Address" : "AI แปลที่อยู่")}</span>
              </Button>
            </div>
          }
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent className="pt-6 px-4 sm:px-6">
        <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <AddressSelectorField
            control={form.control}
            name="province"
            label={isEn ? "Province" : "จังหวัด"}
            icon={MapIcon}
            placeholder={isEn ? "Select Province" : "เลือกจังหวัด"}
            description={isEn ? "Select province where property is located" : "เลือกจังหวัดที่ตั้งของทรัพย์สิน"}
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
            label={isEn ? "District / City" : "เขต / อำเภอ"}
            icon={MapPinned}
            placeholder={isEn ? "Select District" : "เลือกอำเภอ"}
            description={isEn ? "Select district or city" : "เลือกเขตหรืออำเภอ"}
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
            label={isEn ? "Subdistrict" : "แขวง / ตำบล"}
            icon={SignpostBig}
            placeholder={isEn ? "Select Subdistrict" : "เลือกตำบล"}
            description={isEn ? "Select subdistrict (Postal code autofilled)" : "เลือกแขวงหรือตำบล ระบบจะเติมรหัสไปรษณีย์ให้อัตโนมัติ"}
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

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  <span>{isEn ? "Postal Code" : "รหัสไปรษณีย์"}</span>
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
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1 min-h-8" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 min-h-8">
                    {isEn ? "Auto-filled based on selected subdistrict" : "รหัสไปรษณีย์จะถูกเติมตามตำบลที่เลือก"}
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {showAreaPrompt && areaPromptName && (
            <div className="col-span-full p-3.5 bg-linear-to-r from-blue-50 via-indigo-50/70 to-blue-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">
                    {isEn ? (
                      <>
                        New Area Detected: <span className="text-blue-600 font-extrabold">{areaPromptName}</span> ({getProvinceName(watchedProvince, "en")})
                      </>
                    ) : (
                      <>
                        พบทำเลใหม่: <span className="text-blue-600 font-extrabold">{areaPromptName}</span> ({watchedProvince})
                      </>
                    )}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {isEn
                      ? "Not yet indexed in 4-language area database. Let AI translate to EN/CN/RU and save to popular areas."
                      : "ยังไม่มีในฐานข้อมูลย่าน 4 ภาษา สามารถให้ AI ช่วยแปล EN/CN/RU และบันทึกเป็นย่านยอดนิยมได้ทันที"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreateAreaOpen(true)}
                className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>{isEn ? "AI Translate 4 Languages & Save" : "ให้ AI แปล 4 ภาษา & บันทึกย่าน"}</span>
              </Button>
            </div>
          )}

          <FormField
            control={form.control}
            name="address_line1"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 md:col-span-4 lg:col-span-1 relative z-20">
                <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                  <SignpostBig className="w-4 h-4 text-blue-500" />
                  <span>{isEn ? "Project / Address (TH)" : "โครงการ/ที่อยู่"}</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (form.getValues("project_id")) {
                          form.setValue("project_id", null, { shouldDirty: true });
                        }
                      }}
                      onFocus={() => {
                        setShowDropdown(true);
                        fetchSuggestions(field.value || "");
                      }}
                      onBlur={() => {
                        field.onBlur();
                        handleBlur();
                      }}
                      placeholder={isEn ? "Project Name / House No...." : "ชื่อโครงการ... / เลขที่บ้าน..."}
                      className="h-11 rounded-lg border-slate-200 bg-white px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      name="project_search_query"
                      data-form-type="other"
                      data-lpignore="true"
                    />

                    {showDropdown && (suggestions.length > 0 || isLoadingSuggestions || (watchedAddressLine1.trim().length >= 2 && !form.getValues("project_id"))) && (
                      <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/5">
                        {isLoadingSuggestions && suggestions.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                            <span>{isEn ? "Searching projects..." : "กำลังค้นหาโครงการ..."}</span>
                          </div>
                        ) : (
                          <>
                            {suggestions.map((proj) => {
                              const displayName = isEn && proj.address_line1_en ? proj.address_line1_en : proj.address_line1;
                              const secondaryName = isEn && proj.address_line1_en && proj.address_line1 !== proj.address_line1_en 
                                ? proj.address_line1 
                                : (!isEn && proj.address_line1_en && proj.address_line1_en !== proj.address_line1 ? proj.address_line1_en : null);

                              const locationBreadcrumb = [
                                isEn && proj.subdistrict ? getSubdistrictName(proj.subdistrict, "en") : proj.subdistrict,
                                isEn && proj.district ? getDistrictName(proj.district, "en") : proj.district,
                                isEn && proj.province ? getProvinceName(proj.province, "en") : proj.province,
                              ]
                                .filter(Boolean)
                                .join(" » ");

                              return (
                                <button
                                  key={proj.id || proj.address_line1}
                                  type="button"
                                  onMouseDown={() => handleSelectProject(proj)}
                                  className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-800">{displayName}</span>
                                    {secondaryName && (
                                      <span className="text-[11px] text-slate-400 font-normal">({secondaryName})</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {locationBreadcrumb}
                                  </span>
                                </button>
                              );
                            })}
                            {suggestions.length >= 5 && (
                              <button
                                type="button"
                                onMouseDown={() => {
                                  setModalSearchQuery(watchedAddressLine1);
                                  setIsProjectSearchModalOpen(true);
                                }}
                                className="w-full px-4 py-2.5 text-center text-xs bg-slate-50 hover:bg-blue-50 text-blue-600 font-bold border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>{isEn ? "View more projects..." : "ดูเพิ่มเติม / ค้นหาโครงการทั้งหมด..."}</span>
                              </button>
                            )}
                            {watchedAddressLine1.trim().length >= 2 && !form.getValues("project_id") && (
                              <button
                                type="button"
                                onMouseDown={() => setIsCreateProjectOpen(true)}
                                className="w-full px-4 py-3 text-left text-xs bg-indigo-50/70 hover:bg-indigo-50 text-indigo-700 font-bold border-t border-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>{isEn ? `Create new project: "${watchedAddressLine1}"` : `สร้างโครงการใหม่: "${watchedAddressLine1}" เข้าระบบ`}</span>
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
                    {isEn ? "House number, village or project name (optional)" : "บ้านเลขที่, ชื่อหมู่บ้าน หรือชื่อโครงการ (ถ้ามี)"}
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address_line1_en"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 md:col-span-4 lg:col-span-1 relative z-20">
                <FormLabel className="flex items-center gap-2 text-slate-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                  <SignpostBig className="w-4 h-4 text-blue-500" />
                  <span>Project / Address (English)</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                      onFocus={() => {
                        setShowDropdownEn(true);
                        fetchSuggestions(field.value || "");
                      }}
                      onBlur={() => {
                        field.onBlur();
                        handleBlur();
                      }}
                      placeholder={isEn ? "Project Name / Address in English..." : "ชื่อโครงการในภาษาอังกฤษ..."}
                      className="h-11 rounded-lg border-slate-200 bg-slate-50/50 px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      name="project_search_en"
                      data-form-type="other"
                      data-lpignore="true"
                    />

                    {showDropdownEn && (suggestions.length > 0 || isLoadingSuggestions) && (
                      <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/5">
                        {isLoadingSuggestions && suggestions.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                            <span>{isEn ? "Searching projects..." : "กำลังค้นหาโครงการ..."}</span>
                          </div>
                        ) : (
                          <>
                            {suggestions.map((proj) => {
                              const displayName = proj.address_line1_en || proj.address_line1;
                              const secondaryName = proj.address_line1_en && proj.address_line1 !== proj.address_line1_en
                                ? proj.address_line1
                                : null;

                              const locationBreadcrumb = [
                                proj.subdistrict ? getSubdistrictName(proj.subdistrict, "en") : proj.subdistrict,
                                proj.district ? getDistrictName(proj.district, "en") : proj.district,
                                proj.province ? getProvinceName(proj.province, "en") : proj.province,
                              ]
                                .filter(Boolean)
                                .join(" » ");

                              return (
                                <button
                                  key={proj.id || proj.address_line1_en || proj.address_line1}
                                  type="button"
                                  onMouseDown={() => handleSelectProject(proj)}
                                  className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-800">{displayName}</span>
                                    {secondaryName && (
                                      <span className="text-[11px] text-slate-400 font-normal">({secondaryName})</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {locationBreadcrumb}
                                  </span>
                                </button>
                              );
                            })}
                            {suggestions.length >= 5 && (
                              <button
                                type="button"
                                onMouseDown={() => {
                                  setModalSearchQuery(watchedAddressLine1En || watchedAddressLine1);
                                  setIsProjectSearchModalOpen(true);
                                }}
                                className="w-full px-4 py-2.5 text-center text-xs bg-slate-50 hover:bg-blue-50 text-blue-600 font-bold border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>{isEn ? "View more projects..." : "ดูเพิ่มเติม / ค้นหาโครงการทั้งหมด..."}</span>
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
                    {isEn ? "Project name in English" : "ชื่อโครงการในภาษาอังกฤษ"}
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

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
                    {isEn ? "Project name in Chinese" : "ชื่อโครงการในภาษาจีน"}
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

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
                    {isEn ? "Project name in Russian" : "ชื่อโครงการในภาษารัสเซีย"}
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
                    placeholder={isEn ? "Link from Google Maps..." : "ลิงก์จาก Google Maps..."}
                    className="h-11 rounded-lg border-slate-200 bg-white px-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1" />
                ) : (
                  <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {isEn ? "Google Maps link e.g. 'https://maps.app.goo.gl/...'" : "google map ตัวอย่าง 'https://maps.app.goo.gl/...'"}
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

      <QuickCreateAreaDialog
        open={isCreateAreaOpen}
        onOpenChange={setIsCreateAreaOpen}
        defaultProvince={watchedProvince || "กรุงเทพมหานคร"}
        defaultAreaName={areaPromptName || (watchedSubdistrict || watchedDistrict).replace(/^(จังหวัด|จ\.|เขต|อำเภอ|อ\.|แขวง|ตำบล|ต\.)/, "").trim()}
        onAreaCreated={(area) => {
          registerCustomAreaTranslation(area.th, {
            en: area.en,
            cn: area.cn,
            ru: area.ru,
          });
          form.setValue("popular_area", area.th, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
          form.setValue("popular_area_en", area.en, { shouldDirty: true });
          form.setValue("popular_area_cn", area.cn, { shouldDirty: true });
          form.setValue("popular_area_ru", area.ru, { shouldDirty: true });
          if (isCbdProperty({ popular_area: area.th })) {
            form.setValue("is_cbd", true, { shouldDirty: true, shouldValidate: true });
          }
          setShowAreaPrompt(false);
        }}
      />

      {/* 🏢 Project Explorer Dialog (ค้นหาโครงการทั้งหมด) */}
      <ResponsiveDialog
        open={isProjectSearchModalOpen}
        onOpenChange={setIsProjectSearchModalOpen}
        title={isEn ? "Select Project / Location" : "ค้นหาโครงการและทำเล"}
        description={isEn ? "Search through database of condominiums, housing estates, and commercial projects" : "ค้นหาโครงการ คอนโด บ้านเดี่ยว ทาวน์โฮม ทั้งหมดในระบบ"}
      >
        <div className="p-5 space-y-4 max-h-[80vh] flex flex-col">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              placeholder={isEn ? "Search by project name (Thai/English)..." : "พิมพ์ชื่อโครงการภาษาไทย หรือ อังกฤษ..."}
              className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium focus:bg-white"
              autoFocus
            />
            {isLoadingModalSuggestions && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[300px] max-h-[420px] divide-y divide-slate-100 pr-1">
            {isLoadingModalSuggestions && modalSuggestions.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                <p>{isEn ? "Searching project database..." : "กำลังค้นหาข้อมูลโครงการ..."}</p>
              </div>
            ) : modalSuggestions.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-3">
                <Building2 className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <div>
                  <p className="font-semibold text-slate-700">
                    {isEn 
                      ? (modalSearchQuery ? `No matching projects found for "${modalSearchQuery}"` : "No matching projects found") 
                      : (modalSearchQuery ? `ไม่พบโครงการ "${modalSearchQuery}"` : "ไม่พบข้อมูลโครงการ")}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEn ? "You can create this as a new project" : "คุณสามารถกดสร้างเป็นโครงการใหม่ได้ทันที"}
                  </p>
                </div>
                {modalSearchQuery.trim() && (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsProjectSearchModalOpen(false);
                      form.setValue("address_line1", modalSearchQuery);
                      setIsCreateProjectOpen(true);
                    }}
                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEn ? `Create "${modalSearchQuery}"` : `สร้างโครงการ "${modalSearchQuery}"`}</span>
                  </Button>
                )}
              </div>
            ) : (
              modalSuggestions.map((proj) => {
                const displayName = isEn && proj.address_line1_en ? proj.address_line1_en : proj.address_line1;
                const locationBreadcrumb = [
                  isEn && proj.subdistrict ? getSubdistrictName(proj.subdistrict, "en") : proj.subdistrict,
                  isEn && proj.district ? getDistrictName(proj.district, "en") : proj.district,
                  isEn && proj.province ? getProvinceName(proj.province, "en") : proj.province,
                ]
                  .filter(Boolean)
                  .join(" » ");

                return (
                  <button
                    key={proj.id || proj.address_line1}
                    type="button"
                    onClick={() => {
                      handleSelectProject(proj);
                      setIsProjectSearchModalOpen(false);
                    }}
                    className="w-full p-3 text-left rounded-xl hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs group-hover:text-blue-900">{displayName}</span>
                          {proj.address_line1_en && proj.address_line1 !== proj.address_line1_en && (
                            <span className="text-[10px] text-slate-400">({proj.address_line1})</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 group-hover:text-slate-600 mt-0.5">
                          {locationBreadcrumb}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded-lg text-xs font-bold text-blue-600 border-blue-200 group-hover:bg-blue-600 group-hover:text-white shrink-0 transition-all pointer-events-none"
                    >
                      {isEn ? "Select" : "เลือก"}
                    </Button>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </ResponsiveDialog>
    </Card>
  );
}
