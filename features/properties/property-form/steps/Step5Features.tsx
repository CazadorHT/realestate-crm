"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Box,
  Shield,
  Sparkles,
  Armchair,
  Utensils,
  Bath,
  Trees,
  Wifi,
  Dumbbell,
  MapPin,
  MoreHorizontal,
  Baby, // Kids
  ConciergeBell, // Services
  Home,
  Briefcase,
  Building2,
  Layout,
} from "lucide-react";
import { FeaturesManagementDialog } from "@/features/amenities/components/FeaturesManagementDialog";
import { PropertyFormValues } from "../../schema";
import { DynamicIcon } from "@/components/dynamic-icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Feature = {
  id: string;
  name: string;
  name_en?: string | null;
  icon_key: string | null;
  category: string | null;
};

const CATEGORY_MAP: Record<string, { th: string; en: string; icon: any }> = {
  RESIDENTIAL: { th: "ที่พักอาศัย (Residential)", en: "Residential Features", icon: Home },
  OFFICE: { th: "สำนักงาน (Office)", en: "Office Features", icon: Briefcase },
  FACILITY: { th: "ส่วนกลาง (Facilities)", en: "Building Facilities", icon: Building2 },
  FACILITIES: { th: "ส่วนกลาง (Facilities)", en: "Building Facilities", icon: Building2 },
  UNIT: { th: "ในยูนิต (Unit Features)", en: "In-Unit Features", icon: Layout },
  INTERIOR: { th: "ในยูนิต (Unit Features)", en: "In-Unit Features", icon: Layout },
  EXTERIOR: { th: "ภายนอก (Exterior)", en: "Exterior Features", icon: Trees },
  COMFORT: { th: "ความสะดวกสบาย (Comfort)", en: "Comfort & Living", icon: Armchair },
  GENERAL: { th: "ทั่วไป (General)", en: "General", icon: Box },
  SECURITY: { th: "ความปลอดภัย (Security)", en: "Security", icon: Shield },
  KITCHEN: { th: "ครัว (Kitchen)", en: "Kitchen", icon: Utensils },
  BATHROOM: { th: "ห้องน้ำ (Bathroom)", en: "Bathroom", icon: Bath },
  TECH: { th: "เทคโนโลยี (Tech)", en: "Technology & Smart Home", icon: Wifi },
  TECHNOLOGY: { th: "เทคโนโลยี (Tech)", en: "Technology & Smart Home", icon: Wifi },
  RECREATION: { th: "สันทนาการ (Recreation)", en: "Recreation & Sports", icon: Dumbbell },
  NEARBY: { th: "สถานที่ใกล้เคียง (Nearby)", en: "Nearby Places", icon: MapPin },
  OTHER: { th: "อื่นๆ (Other)", en: "Other", icon: MoreHorizontal },
  KIDS: { th: "สำหรับเด็ก (Kids)", en: "Kids & Family", icon: Baby },
  SERVICES: { th: "บริการ (Services)", en: "Services", icon: ConciergeBell },
};

const FEATURE_TRANSLATION_MAP: Record<string, string> = {
  "อ่างอาบน้ำ": "Bathtub",
  "คลับเฮ้าส์": "Clubhouse",
  "คลับเฮ้าส์ / เลานจ์": "Clubhouse / Lounge",
  "โซล่าเซลล์": "Solar Cells",
  "โซลาร์เซลล์": "Solar Cells",
  "วิวทะเล": "Sea View",
  "วิวภูเขา": "Mountain View",
  "วิวเมือง": "City View",
  "วิวแม่น้ำ": "River View",
  "สวน": "Garden",
  "สวนหย่อม": "Garden",
  "สวนขั้นดาดฟ้า": "Rooftop Garden",
  "สวนดาดฟ้า": "Rooftop Garden",
  "สวนสาธารณะ": "Public Park",
  "เครื่องชาร์จรถยนต์ไฟฟ้า": "EV Charger",
  "จุดชาร์จรถยนต์ไฟฟ้า": "EV Charging Station",
  "โซนสัตว์เลี้ยง": "Pet Friendly Zone",
  "ที่จอดรถ": "Parking",
  "โรงยิม / ฟิตเนส": "Fitness / Gym",
  "ฟิตเนส": "Fitness Gym",
  "ลิฟต์": "Elevator",
  "ลิฟต์โดยสาร": "Passenger Lift",
  "สระว่ายน้ำ": "Swimming Pool",
  "ห้องซาวน่า / ห้องอบไอน้ำ": "Sauna / Steam Room",
  "ห้องซาวน่า": "Sauna",
  "ห้องอบไอน้ำ": "Steam Room",
  "สตรีม": "Steam Room",
  "สนามเด็กเล่น": "Playground",
  "ระบบรักษาความปลอดภัย": "24/7 Security",
  "ระบบรักษาความปลอดภัย 24 ชม.": "24-Hour Security",
  "กล้องวงจรปิด": "CCTV",
  "กล้องวงจรปิด (CCTV)": "CCTV Security",
  "คีย์การ์ด": "Keycard Access",
  "เข้า-ออกด้วยคีย์การ์ด": "Key Card Access",
  "ล็อบบี้": "Lobby",
  "ล็อบบี้ / แผนกต้อนรับ": "Lobby / Reception",
  "ห้องสมุด": "Library",
  "ห้องสมุด / Co-working Space": "Library / Co-working Space",
  "co-working space": "Co-Working Space",
  "เพดานสูง": "High Ceiling",
  "เพดานสูงโปร่ง": "High Ceiling",
  "ระบบสมาร์ทโฮม": "Smart Home System",
  "ห้องแม่บ้าน": "Maid Quarter",
  "บริการรถรับส่ง": "Shuttle Service",
  "พนักงานต้อนรับ": "Concierge",
  "อินเทอร์เน็ต / wifi": "High-Speed Wi-Fi",
  "wifi": "Wi-Fi",
  "เครื่องปรับอากาศ": "Air Conditioning",
  "แอร์": "Air Conditioning",
  "เครื่องทำน้ำอุ่น": "Water Heater",
  "เฟอร์นิเจอร์": "Fully Furnished",
  "ตู้เย็น": "Refrigerator",
  "ไมโครเวฟ": "Microwave",
  "เตาไฟฟ้า": "Electric Stove",
  "เครื่องดูดควัน": "Cooker Hood",
  "เครื่องซักผ้า": "Washing Machine",
  "ระเบียง": "Balcony",
  "จากุซซี่": "Jacuzzi",
  "อ่างจากุซซี่": "Jacuzzi Bathtub",
};

function getFeatureDisplayName(feature: Feature, isEn: boolean): string {
  if (!isEn) return feature.name;
  if (feature.name_en && feature.name_en.trim()) return feature.name_en;

  const trimmed = feature.name.trim();
  if (FEATURE_TRANSLATION_MAP[trimmed]) return FEATURE_TRANSLATION_MAP[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(FEATURE_TRANSLATION_MAP)) {
    if (lower === key.toLowerCase()) return val;
  }

  return feature.name;
}

export const Step5Features = React.memo(Step5FeaturesComponent);
function Step5FeaturesComponent() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const { watch, setValue } = useFormContext<PropertyFormValues>();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);

  const formTitle = watch("title");
  const formDescription = watch("description");

  // Load existing selections
  const selectedFeatureIds = watch("feature_ids") || [];

  useEffect(() => {
    async function loadFeatures() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("features")
          .select("id, name, name_en, icon_key, category")
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;
        setFeatures(data || []);
      } catch (err) {
        console.error("Error loading features:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFeatures();
  }, []); // Initial load

  const reloadFeatures = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("features")
        .select("id, name, name_en, icon_key, category")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error("Error reloading features:", err);
    }
  };

  const toggleFeature = (featureId: string) => {
    const current = new Set(selectedFeatureIds);
    if (current.has(featureId)) {
      current.delete(featureId);
    } else {
      current.add(featureId);
    }
    setValue("feature_ids", Array.from(current), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const applyPreset = (type: "condo" | "house" | "office") => {
    const presetMatchers = {
      condo: [
        "สระว่ายน้ำ", "ฟิตเนส", "cctv", "รักษาความปลอดภัย", "ที่จอดรถ", 
        "สวนหย่อม", "ลิฟต์", "lobby", "คีย์การ์ด", "pool", "gym", "elevator",
        "เฟอร์", "เฟอร์นิเจอร์", "เครื่องปรับอากาศ", "แอร์", "กล้องวงจรปิด", "รปภ", "security", "air"
      ],
      house: [
        "ที่จอดรถ", "สวนหย่อม", "สวน", "สนามเด็กเล่น", "สระว่ายน้ำ", 
        "cctv", "รักษาความปลอดภัย", "ครัว", "กล้องวงจรปิด", "garden"
      ],
      office: [
        "เครื่องปรับอากาศ", "แอร์", "ห้องประชุม", "คีย์การ์ด", "ที่จอดรถ", 
        "อินเทอร์เน็ต", "wifi", "ลิฟต์", "รักษาความปลอดภัย"
      ]
    };

    const matchers = presetMatchers[type];
    const matchedIds = features
      .filter((f) => {
        const nameLower = f.name.toLowerCase();
        // ถ้าเป็นคอนโด ไม่เลือก "สระว่ายน้ำส่วนตัว" หรือ "สระส่วนตัว"
        if (type === "condo" && (nameLower.includes("ส่วนตัว") || nameLower.includes("private"))) {
          return false;
        }
        return matchers.some((keyword) => nameLower.includes(keyword.toLowerCase()));
      })
      .map((f) => f.id);

    setValue("feature_ids", matchedIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
    const typeLabel = isEn
      ? (type === "condo" ? "Condo" : type === "house" ? "House" : "Office")
      : (type === "condo" ? "คอนโด" : type === "house" ? "บ้านเดี่ยว" : "สำนักงาน");
    toast.success(
      isEn
        ? `Applied ${typeLabel} preset! (${matchedIds.length} items)`
        : `เลือกสิ่งอำนวยความสะดวกสำหรับ${typeLabel}สำเร็จแล้ว! (${matchedIds.length} รายการ)`
    );
  };

  const handleAiDetectFeatures = async () => {
    if (!formTitle && !formDescription) {
      toast.error(isEn ? "Please enter a listing title or description first." : "กรุณากรอกชื่อหัวข้อหรือคำอธิบายทรัพย์สินก่อนครับ");
      return;
    }

    setIsDetecting(true);
    try {
      const { detectPropertyFeaturesAction } = await import("@/features/properties/property-form/actions/ai-actions");
      const res = await detectPropertyFeaturesAction(formTitle || "", formDescription || "");
      if (res.success && res.matchedFeatureIds) {
        setValue("feature_ids", res.matchedFeatureIds, {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast.success(
          isEn
            ? `AI detected ${res.matchedFeatureIds.length} suitable amenities! ✨`
            : `AI ตรวจพบสิ่งอำนวยความสะดวกที่เหมาะสม ${res.matchedFeatureIds.length} รายการ! ✨`
        );
      } else {
        throw new Error(res.message || (isEn ? "Cannot analyze features" : "ไม่สามารถวิเคราะห์ได้"));
      }
    } catch (err: any) {
      console.error("AI Feature detection failed:", err);
      toast.error(err.message || (isEn ? "AI amenity analysis failed" : "วิเคราะห์สิ่งอำนวยความสะดวกด้วย AI ล้มเหลว"));
    } finally {
      setIsDetecting(false);
    }
  };

  // Group by category (Memoized for performance)
  const groupedFeatures = React.useMemo(() => {
    if (!features || features.length === 0) return {};
    return features.reduce(
      (acc, feature) => {
        // Normalize category key
        const rawCat = feature.category || "General";
        const upperCat = rawCat.toUpperCase();
        const mapped = CATEGORY_MAP[upperCat];
        const cat = mapped ? (isEn ? mapped.en : mapped.th) : rawCat;

        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(feature);
        return acc;
      },
      {} as Record<string, Feature[]>,
    );
  }, [features, isEn]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div id="tour-property-facilities" className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-blue-900 leading-tight">
                {isEn ? "Facilities & Amenities" : "สิ่งอำนวยความสะดวก"}
              </h3>
              <p className="text-[10px] sm:text-xs text-blue-700/70 font-medium">
                {isEn
                  ? "Select features available for this listing (auto-populated from selected project ✨)"
                  : "เลือกสิ่งอำนวยความสะดวกที่ทรัพย์สินนี้มี (ระบบจะช่วยดึงรายการจากโครงการที่เลือกให้อัตโนมัติ ✨)"}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto self-end sm:self-center">
            <FeaturesManagementDialog onUpdate={reloadFeatures} />
          </div>
        </div>
      </div>

      {/* Quick Presets & AI Analyzer Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mr-1.5">
            {isEn ? "Presets:" : "เลือกด่วน (Presets):"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("condo")}
            className="h-8 text-xs font-semibold bg-white border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/20 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            🏢 {isEn ? "Condo" : "คอนโด (Condo)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("house")}
            className="h-8 text-xs font-semibold bg-white border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/20 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            🏡 {isEn ? "House / Townhome" : "บ้าน / ทาวน์โฮม (House)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("office")}
            className="h-8 text-xs font-semibold bg-white border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/20 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            💼 {isEn ? "Office" : "สำนักงาน (Office)"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleAiDetectFeatures}
            disabled={isDetecting || (!formTitle && !formDescription)}
            className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDetecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isDetecting
              ? (isEn ? "Analyzing..." : "กำลังวิเคราะห์...")
              : (isEn ? "AI Analyze Amenities" : "AI วิเคราะห์สิ่งอำนวยความสะดวก")}
          </Button>
          {!formTitle && !formDescription && (
            <span className="text-[10px] text-slate-400 italic hidden sm:inline">
              {isEn ? "💡 Enter title or description before using AI" : "💡 กรอกชื่อหรือรายละเอียดก่อนใช้ AI"}
            </span>
          )}
        </div>
      </div>

      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
        const matchingKey = Object.keys(CATEGORY_MAP).find(
          (k) => CATEGORY_MAP[k].th === category || CATEGORY_MAP[k].en === category
        );
        const CategoryIcon = matchingKey ? CATEGORY_MAP[matchingKey].icon : Box;
        return (
          <div key={category} className="space-y-3 sm:space-y-4">
            <h4 className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 sm:pb-3">
              <CategoryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              {category}
              <span className="ml-auto text-[9px] font-normal text-slate-400 lowercase">
                {categoryFeatures.length} {isEn ? "items" : "รายการ"}
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-4">
              {categoryFeatures.map((feature) => {
                const isSelected = selectedFeatureIds.includes(feature.id);

                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    className={cn(
                      "relative flex flex-row lg:flex-col items-center gap-2.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl border text-left lg:text-center transition-all duration-200 group",
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md hover:bg-slate-50/50",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 sm:p-2.5 rounded-lg transition-colors shrink-0",
                        isSelected
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-500",
                      )}
                    >
                      <DynamicIcon
                        name={feature.icon_key || "check"}
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[11px] sm:text-xs font-semibold line-clamp-2 transition-colors",
                        isSelected
                          ? "text-emerald-900"
                          : "text-slate-600 group-hover:text-slate-900",
                      )}
                    >
                      {getFeatureDisplayName(feature, isEn)}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-in zoom-in" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {features.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{isEn ? "No amenities found in system" : "ไม่พบรายการในระบบ"}</p>
        </div>
      )}
    </div>
  );
}
