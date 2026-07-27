"use client";

import * as React from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, Building2, ChevronDown, MapPin, Search, Check } from "lucide-react";
import { 
  upsertProjectAction, 
  generateAIProjectDataAction 
} from "@/features/properties/actions/projects";
import slugify from "slugify";
import { useThaiAddress } from "@/hooks/useThaiAddress";
import { cn } from "@/lib/utils";

// Property types mapping
const PROPERTY_TYPES = [
  { value: "1", label: "คอนโด (Condo)" },
  { value: "2", label: "บ้านเดี่ยว (House)" },
  { value: "3", label: "ทาวน์โฮม (Townhome)" },
  { value: "4", label: "ที่ดิน (Land)" },
  { value: "5", label: "อาคารพาณิชย์ (Commercial)" },
  { value: "6", label: "โกดัง / โรงงาน (Warehouse)" },
  { value: "7", label: "สำนักงาน (Office)" },
  { value: "8", label: "วิลล่า (Villa)" },
  { value: "9", label: "พูลวิลล่า (Pool Villa)" },
  { value: "10", label: "อื่นๆ (Other)" },
];

function parseCoordinatesFromGoogleMaps(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  const pathMatch = url.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (pathMatch) return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };
  return null;
}

interface QuickCreateProjectDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  defaultName: string;
  defaultNameEn: string;
  defaultProvince: string;
  defaultDistrict: string;
  defaultSubdistrict: string;
  onCreated: (project: { 
    id: string; 
    nameTh: string; 
    nameEn: string; 
    province?: string;
    district?: string;
    subdistrict?: string;
    googleMapsUrl?: string;
  }) => void;
}

const cleanAddressWord = (val: string) => {
  if (!val) return "";
  return val.replace(/^(จังหวัด|เขต|อำเภอ|แขวง|ตำบล)/, "").trim();
};

export function QuickCreateProjectDialog({
  isOpen,
  onClose,
  defaultName,
  defaultNameEn,
  defaultProvince,
  defaultDistrict,
  defaultSubdistrict,
  onCreated,
}: QuickCreateProjectDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAiGenerating, setIsAiGenerating] = React.useState(false);

  // Fields
  const [nameTh, setNameTh] = React.useState("");
  const [nameEn, setNameEn] = React.useState("");
  const [developer, setDeveloper] = React.useState("");
  const [propertyType, setPropertyType] = React.useState("1");
  const [province, setProvince] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [subdistrict, setSubdistrict] = React.useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = React.useState("");
  const [yearCompleted, setYearCompleted] = React.useState("");
  const [totalUnits, setTotalUnits] = React.useState("");

  // Other AI filled states
  const [aiData, setAiData] = React.useState<any>(null);

  // Thai address cascading
  const {
    provinces,
    getDistricts,
    getSubDistricts,
    ensureDistrictsLoaded,
    ensureSubDistrictsLoaded,
    loading: addressLoading,
  } = useThaiAddress();

  // Province/District search state
  const [provinceSearch, setProvinceSearch] = React.useState("");
  const [districtSearch, setDistrictSearch] = React.useState("");
  const [subdistrictSearch, setSubdistrictSearch] = React.useState("");

  React.useEffect(() => {
    ensureDistrictsLoaded();
    ensureSubDistrictsLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived cascading options
  const activeProvinceId = provinces.find((p) => p.name_th === province)?.id;
  const districtOptions = activeProvinceId ? getDistricts(activeProvinceId) : [];
  const activeDistrictId = districtOptions.find((d) => d.name_th === district)?.id;
  const subDistrictOptions = activeDistrictId ? getSubDistricts(activeDistrictId) : [];

  // Filtered options for search
  const filteredProvinces = React.useMemo(() => {
    const q = provinceSearch.trim().toLowerCase();
    if (!q) return provinces;
    return provinces.filter((p) => p.name_th.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q));
  }, [provinces, provinceSearch]);

  const filteredDistricts = React.useMemo(() => {
    const q = districtSearch.trim().toLowerCase();
    if (!q) return districtOptions;
    return districtOptions.filter((d) => d.name_th.toLowerCase().includes(q) || d.name_en.toLowerCase().includes(q));
  }, [districtOptions, districtSearch]);

  const filteredSubDistricts = React.useMemo(() => {
    const q = subdistrictSearch.trim().toLowerCase();
    if (!q) return subDistrictOptions;
    return subDistrictOptions.filter((s) => s.name_th.toLowerCase().includes(q) || s.name_en.toLowerCase().includes(q));
  }, [subDistrictOptions, subdistrictSearch]);

  // Initialize fields
  React.useEffect(() => {
    if (isOpen) {
      const nameThVal = defaultName.trim();
      const nameEnVal = defaultNameEn.trim();
      
      const isEnglish = /^[A-Za-z0-9\s\-_,&()]+$/.test(nameThVal);
      if (isEnglish && !nameEnVal) {
        setNameEn(nameThVal);
        setNameTh("");
      } else {
        setNameTh(nameThVal);
        setNameEn(nameEnVal);
      }
      setDeveloper("");
      setPropertyType("1");
      setProvince(cleanAddressWord(defaultProvince || "กรุงเทพมหานคร"));
      setDistrict(cleanAddressWord(defaultDistrict || ""));
      setSubdistrict(cleanAddressWord(defaultSubdistrict || ""));
      setGoogleMapsUrl("");
      setYearCompleted("");
      setTotalUnits("");
      setAiData(null);
    }
  }, [isOpen, defaultName, defaultNameEn, defaultProvince, defaultDistrict, defaultSubdistrict]);

  // Handle maps URL change — parse coords for payload but don't show in UI
  const handleGoogleMapsUrlChange = (url: string) => {
    setGoogleMapsUrl(url);
  };

  // Run AI auto-fill
  const handleAiAutoFill = async () => {
    const searchName = nameEn || nameTh;
    if (!searchName.trim()) {
      toast.error("กรุณาระบุชื่อโครงการ (ไทย หรือ อังกฤษ) เพื่อให้ AI ค้นข้อมูลครับ");
      return;
    }

    setIsAiGenerating(true);
    const toastId = toast.loading("🤖 Gemini กำลังค้นหาข้อมูลโครงการมาลงให้คุณ...");
    try {
      const res = await generateAIProjectDataAction(searchName);
      if (res.success && res.data) {
        const d = res.data;
        if (d.nameTh) setNameTh(d.nameTh);
        if (d.nameEn) setNameEn(d.nameEn);
        if (d.developer) setDeveloper(d.developer);
        if (d.propertyType) setPropertyType(d.propertyType.toString());
        if (d.yearCompleted) setYearCompleted(d.yearCompleted.toString());
        if (d.totalUnits) setTotalUnits(d.totalUnits.toString());
        if (d.province) setProvince(cleanAddressWord(d.province));
        if (d.district) setDistrict(cleanAddressWord(d.district));
        if (d.subdistrict) setSubdistrict(cleanAddressWord(d.subdistrict));
        // Google Maps URL — ให้ user กรอกเอง ไม่ให้ AI override
        setAiData(d);
        toast.success("AI กรอกข้อมูลโครงการสำเร็จเสร็จสิ้น! ✨", { id: toastId });
      } else {
        throw new Error(res.message || "ล้มเหลวในการสร้างข้อมูล");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("AI ไม่สามารถค้นหาข้อมูลโครงการได้: " + (err.message || ""), { id: toastId });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!nameTh.trim() || !nameEn.trim()) {
      toast.error("กรุณาระบุชื่อโครงการ (ทั้งภาษาไทย และ อังกฤษ)");
      return;
    }

    const generatedSlug = slugify(nameEn.trim(), { lower: true, strict: true });
    if (!generatedSlug) {
      toast.error("ไม่สามารถสร้าง URL Slug จากชื่อภาษาอังกฤษได้");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: { th: nameTh.trim(), en: nameEn.trim() },
        slug: generatedSlug,
        developer: developer.trim() || null,
        property_type: Number(propertyType),
        province: cleanAddressWord(province) || "กรุงเทพมหานคร",
        district: cleanAddressWord(district) || null,
        subdistrict: cleanAddressWord(subdistrict) || null,
        ...(() => {
          const coords = parseCoordinatesFromGoogleMaps(googleMapsUrl);
          return coords ? { latitude: coords.lat, longitude: coords.lng } : { latitude: null, longitude: null };
        })(),
        google_maps_url: googleMapsUrl.trim() || null,
        year_completed: yearCompleted.trim() ? Number(yearCompleted) : null,
        total_units: totalUnits.trim() ? Number(totalUnits) : null,
        is_active: true,
        sort_order: 0,
        // Carry forward AI generated items if any
        description: aiData ? {
          th: aiData.descriptionTh || undefined,
          en: aiData.descriptionEn || undefined,
          cn: aiData.descriptionCn || undefined,
          ru: aiData.descriptionRu || undefined,
        } : undefined,
        seo_title: aiData ? {
          th: aiData.seoTitleTh || undefined,
          en: aiData.seoTitleEn || undefined,
        } : undefined,
        seo_description: aiData ? {
          th: aiData.seoDescTh || undefined,
          en: aiData.seoDescEn || undefined,
        } : undefined,
        facilities: aiData?.facilities || [],
        nearest_station_code: aiData?.nearestStationCode || null,
        nearest_station_distance: aiData?.nearestStationDistance || null,
      };

      const res = await upsertProjectAction(payload);
      if (res.success) {
        toast.success("สร้างโครงการใหม่เรียบร้อยแล้ว! 🚀");
        
        onCreated({
          id: res.id || "",
          nameTh: nameTh.trim(),
          nameEn: nameEn.trim(),
          province: cleanAddressWord(province),
          district: cleanAddressWord(district),
          subdistrict: cleanAddressWord(subdistrict),
          googleMapsUrl: googleMapsUrl.trim() || undefined,
        });
        onClose(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(false); }}
      isLoading={isSaving}
      loadingText="กำลังบันทึกและสร้างโครงการ..."
      title={
        <span className="flex items-center gap-2 text-slate-900 font-semibold text-base">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          สร้างโครงการใหม่เข้าระบบ
        </span>
      }
      description={
        <div className="space-y-3 text-left">
          <p className="text-slate-450 text-[11px] leading-relaxed">
            ระบุข้อมูลที่จำเป็นขั้นต้น โครงการจะถูกเพิ่มลงระบบส่วนกลางเพื่อให้คุณผูกกับทรัพย์สินได้ทันที
          </p>
          
          {/* AI Autofill banner inside Header to prevent scroll! */}
          <div className="bg-linear-to-r from-violet-600 via-indigo-600 to-blue-600 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shadow-indigo-100 text-white border border-indigo-500/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-lg text-white shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-semibold text-white tracking-wide">กรอกข้อมูลอัตโนมัติด้วย AI</h4>
                <p className="text-[10px] text-indigo-100 mt-0.5 leading-relaxed">
                  ระบุชื่อโครงการหลัก (ไทย/อังกฤษ) และให้ Gemini ช่วยค้นหาพิกัด ค้นหาผู้พัฒนา และสิ่งอำนวยความสะดวกทั้งหมดลงฟอร์มให้ทันที
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAiAutoFill}
              disabled={isAiGenerating || isSaving}
              className="w-full sm:w-auto bg-white hover:bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg shrink-0 transition-all hover:scale-[1.02] active:scale-95 shadow-xs h-8 px-3"
            >
              {isAiGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  กำลังดึงข้อมูล...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1.5 text-indigo-600" />
                  ดึงข้อมูลด้วย AI
                </>
              )}
            </Button>
          </div>
        </div>
      }
      className="sm:max-w-2xl"
      footer={
        <div className="flex justify-end gap-2.5 w-full border-t border-slate-100 pt-3 mt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            disabled={isSaving}
            className="rounded-xl font-semibold text-xs px-4 h-9 text-slate-600! border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isAiGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs px-5 h-9 transition-all active:scale-95 shadow-sm shadow-indigo-100 hover:shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              "บันทึกโครงการ"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-1 max-h-[48vh] overflow-y-visible pr-2 scrollbar-thin">
        {/* Section 1: Basic Info */}
        <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/30 p-4">
          <h4 className="text-[11px] font-semibold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>ข้อมูลโครงการพื้นฐาน</span>
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name TH */}
            <div className="space-y-1 text-left group">
              <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-focus-within:text-indigo-600 transition-colors">
                <Building2 className="w-3 h-3 text-slate-400 group-focus-within:text-indigo-600" />
                <span>ชื่อโครงการภาษาไทย *</span>
              </Label>
              <Input 
                value={nameTh} 
                onChange={(e) => setNameTh(e.target.value)} 
                placeholder="เช่น เอลิโอ เดล เนสท์" 
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-150 focus-visible:border-indigo-500 transition-all duration-200 shadow-xs"
              />
            </div>

            {/* Name EN */}
            <div className="space-y-1 text-left group">
              <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-focus-within:text-indigo-600 transition-colors">
                <Building2 className="w-3 h-3 text-slate-400 group-focus-within:text-indigo-600" />
                <span>ชื่อโครงการภาษาอังกฤษ *</span>
              </Label>
              <Input 
                value={nameEn} 
                onChange={(e) => setNameEn(e.target.value)} 
                placeholder="เช่น Elio Del Nest" 
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-150 focus-visible:border-indigo-500 transition-all duration-200 shadow-xs"
              />
            </div>

            {/* Property Type */}
            <div className="space-y-1 text-left group">
              <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-focus-within:text-indigo-600 transition-colors">
                <Building2 className="w-3 h-3 text-slate-400 group-focus-within:text-indigo-600" />
                <span>ประเภทโครงการ</span>
              </Label>
              <div className="relative">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-xs"
                >
                  {PROPERTY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Developer */}
            <div className="space-y-1 text-left group">
              <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-focus-within:text-indigo-600 transition-colors">
                <Building2 className="w-3 h-3 text-slate-400 group-focus-within:text-indigo-600" />
                <span>ผู้พัฒนา (Developer)</span>
              </Label>
              <Input 
                value={developer} 
                onChange={(e) => setDeveloper(e.target.value)} 
                placeholder="เช่น Ananda Development" 
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-150 focus-visible:border-indigo-500 transition-all duration-200 shadow-xs"
              />
            </div>

            {/* Year Completed */}
            <div className="space-y-1 text-left group">
              <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-focus-within:text-indigo-600 transition-colors">
                <Building2 className="w-3 h-3 text-slate-400 group-focus-within:text-indigo-600" />
                <span>ปีที่สร้างเสร็จ</span>
              </Label>
              <Input 
                type="number"
                value={yearCompleted} 
                onChange={(e) => setYearCompleted(e.target.value)} 
                placeholder="เช่น 2020" 
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-150 focus-visible:border-indigo-500 transition-all duration-200 shadow-xs"
              />
            </div>

            {/* Total Units */}
            <div className="space-y-1 text-left group">
              <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-focus-within:text-indigo-600 transition-colors">
                <Building2 className="w-3 h-3 text-slate-400 group-focus-within:text-indigo-600" />
                <span>จำนวนยูนิตทั้งหมด</span>
              </Label>
              <Input 
                type="number"
                value={totalUnits} 
                onChange={(e) => setTotalUnits(e.target.value)} 
                placeholder="เช่น 1459" 
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-150 focus-visible:border-indigo-500 transition-all duration-200 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location & Address */}
        <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/30 p-4">
          <h4 className="text-[11px] font-semibold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>ตำแหน่งที่ตั้งและพิกัด</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            {/* Google Maps URL */}
            <div className="col-span-1 sm:col-span-6 space-y-1 text-left group">
              <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-focus-within:text-indigo-600 transition-colors">
                <MapPin className="w-3 h-3 text-slate-400 group-focus-within:text-indigo-600" />
                <span>พิกัดแผนที่ (Google Maps Link)</span>
              </Label>
              <Input 
                value={googleMapsUrl} 
                onChange={(e) => handleGoogleMapsUrlChange(e.target.value)} 
                placeholder="วางลิงก์ Google Maps เช่น https://maps.app.goo.gl/..." 
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-150 focus-visible:border-indigo-500 transition-all duration-200 shadow-xs"
              />
            </div>

            {/* Province */}
            <div className="col-span-1 sm:col-span-2">
              <AddressCascadeField
                label="จังหวัด"
                value={province}
                options={filteredProvinces}
                allOptions={provinces}
                search={provinceSearch}
                onSearch={setProvinceSearch}
                loading={addressLoading}
                onSelect={(opt) => {
                  setProvince(opt.name_th);
                  setDistrict("");
                  setSubdistrict("");
                  setDistrictSearch("");
                  setSubdistrictSearch("");
                }}
              />
            </div>

            {/* District */}
            <div className="col-span-1 sm:col-span-2">
              <AddressCascadeField
                label="เขต / อำเภอ"
                value={district}
                options={filteredDistricts}
                allOptions={districtOptions}
                search={districtSearch}
                onSearch={setDistrictSearch}
                disabled={!activeProvinceId}
                placeholder={!activeProvinceId ? "เลือกจังหวัดก่อน" : "เลือกเขต / อำเภอ"}
                formatOptionName={(n) => n.replace(/^(เขต|อำเภอ)/, "")}
                onSelect={(opt) => {
                  setDistrict(cleanAddressWord(opt.name_th));
                  setSubdistrict("");
                  setSubdistrictSearch("");
                }}
              />
            </div>

            {/* Subdistrict */}
            <div className="col-span-1 sm:col-span-2">
              <AddressCascadeField
                label="แขวง / ตำบล"
                value={subdistrict}
                options={filteredSubDistricts}
                allOptions={subDistrictOptions}
                search={subdistrictSearch}
                onSearch={setSubdistrictSearch}
                disabled={!activeDistrictId}
                placeholder={!activeDistrictId ? "เลือกเขต / อำเภอก่อน" : "เลือกแขวง / ตำบล"}
                formatOptionName={(n) => n.replace(/^(แขวง|ตำบล)/, "")}
                onSelect={(opt) => setSubdistrict(cleanAddressWord(opt.name_th))}
              />
            </div>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline helper: cascading address dropdown with built-in search
// ─────────────────────────────────────────────────────────────────────────────
interface AddressCascadeFieldProps {
  label: string;
  value: string;
  options: Array<{ id: number; name_th: string; name_en: string }>;
  allOptions: Array<{ id: number; name_th: string; name_en: string }>;
  search: string;
  onSearch: (q: string) => void;
  onSelect: (opt: { id: number; name_th: string; name_en: string }) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
  formatOptionName?: (name: string) => string;
}

function AddressCascadeField({
  label,
  value,
  options,
  allOptions,
  search,
  onSearch,
  onSelect,
  disabled = false,
  placeholder = "เลือก...",
  loading = false,
  formatOptionName = (n) => n,
}: AddressCascadeFieldProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onSearch]);

  return (
    <div className="space-y-1 text-left" ref={ref}>
      <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <MapPin className="w-3 h-3" />
        <span>{label}</span>
        {loading && <span className="animate-pulse text-slate-300">...</span>}
      </Label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            "w-full h-9 rounded-xl border px-3 text-xs font-medium text-left transition-all duration-200 flex items-center justify-between gap-1.5 shadow-xs",
            disabled
              ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
              : open
                ? "border-indigo-500 bg-white ring-2 ring-indigo-100 text-slate-800"
                : value
                  ? "border-indigo-200 bg-white text-slate-800 hover:border-indigo-400"
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full left-0 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Search box */}
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-100 bg-slate-50/60">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={`ค้นหา${label}...`}
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none font-medium"
              />
            </div>
            {/* Options list */}
            <div className="max-h-48 overflow-y-auto py-1">
              {allOptions.length === 0 ? (
                <p className="px-3 py-5 text-center text-xs text-slate-400">กรุณาเลือกข้อมูลก่อนหน้า</p>
              ) : options.length === 0 ? (
                <p className="px-3 py-5 text-center text-xs text-slate-400">ไม่พบ{label}ที่ค้นหา</p>
              ) : (
                options.map((opt) => {
                  const cleanedOptName = opt.name_th.replace(/^(จังหวัด|เขต|อำเภอ|แขวง|ตำบล)/, "").trim();
                  const cleanedValue = value.replace(/^(จังหวัด|เขต|อำเภอ|แขวง|ตำบล)/, "").trim();
                  const selected = cleanedOptName === cleanedValue;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSelect(opt);
                        onSearch("");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left",
                        selected
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                      )}
                    >
                      <span>{formatOptionName(opt.name_th)}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
