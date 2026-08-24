"use client";

import * as React from "react";
import { toast } from "sonner";
import slugify from "slugify";
import { 
  upsertProjectAction,
  generateAIProjectDataAction,
  type ProjectAdminItem
} from "@/features/properties/actions/projects";
import { useLanguage } from "@/lib/i18n/language-context";

const CATEGORY_MAPPING_TH: Record<string, string> = {
  RESIDENTIAL: "ที่พักอาศัย",
  OFFICE: "สำนักงาน",
  FACILITY: "ส่วนกลาง",
  UNIT: "ในยูนิต",
  EXTERIOR: "ภายนอก",
  INTERIOR: "ในยูนิต",
  FACILITIES: "ส่วนกลาง",
  COMFORT: "ความสะดวกสบาย",
  GENERAL: "ทั่วไป",
  SECURITY: "ความปลอดภัย",
  KITCHEN: "ครัว",
  BATHROOM: "ห้องน้ำ",
  TECH: "เทคโนโลยี",
  TECHNOLOGY: "เทคโนโลยี",
  RECREATION: "สันทนาการ",
  NEARBY: "สถานที่ใกล้เคียง",
  OTHER: "อื่นๆ",
  KIDS: "สำหรับเด็ก",
  SERVICES: "บริการ",
};

const CATEGORY_MAPPING_EN: Record<string, string> = {
  RESIDENTIAL: "Residential",
  OFFICE: "Office",
  FACILITY: "Facilities",
  UNIT: "Unit Features",
  EXTERIOR: "Exterior",
  INTERIOR: "Unit Features",
  FACILITIES: "Facilities",
  COMFORT: "Comfort",
  GENERAL: "General",
  SECURITY: "Security",
  KITCHEN: "Kitchen",
  BATHROOM: "Bathroom",
  TECH: "Tech",
  TECHNOLOGY: "Tech",
  RECREATION: "Recreation",
  NEARBY: "Nearby",
  OTHER: "Other",
  KIDS: "Kids",
  SERVICES: "Services",
};

function parseCoordinatesFromGoogleMaps(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  const qMatch = url.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  const pathMatch = url.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (pathMatch) {
    return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };
  }
  return null;
}

interface UseProjectFormProps {
  isOpen: boolean;
  project: ProjectAdminItem | null;
  dbFeatures: any[];
  onClose: (open: boolean) => void;
  onSaveSuccess: () => void;
}

export function useProjectForm({
  isOpen,
  project,
  dbFeatures,
  onClose,
  onSaveSuccess,
}: UseProjectFormProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isSaving, setIsSaving] = React.useState(false);
  const [isFormDirty, setIsFormDirty] = React.useState(false);
  const [formStep, setFormStep] = React.useState(1);
  const [googleMapsUrl, setGoogleMapsUrl] = React.useState("");
  const [isAiGenerating, setIsAiGenerating] = React.useState(false);

  // Form fields
  const [nameTh, setNameTh] = React.useState("");
  const [nameEn, setNameEn] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [developer, setDeveloper] = React.useState("");
  const [propertyType, setPropertyType] = React.useState("1");
  const [province, setProvince] = React.useState("กรุงเทพมหานคร");
  const [district, setDistrict] = React.useState("");
  const [subdistrict, setSubdistrict] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [yearCompleted, setYearCompleted] = React.useState("");
  const [totalUnits, setTotalUnits] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  
  const [descTh, setDescTh] = React.useState("");
  const [descEn, setDescEn] = React.useState("");
  const [descCn, setDescCn] = React.useState("");
  const [descRu, setDescRu] = React.useState("");

  const [seoTitleTh, setSeoTitleTh] = React.useState("");
  const [seoTitleEn, setSeoTitleEn] = React.useState("");
  const [seoDescTh, setSeoDescTh] = React.useState("");
  const [seoDescEn, setSeoDescEn] = React.useState("");

  const [selectedFacilities, setSelectedFacilities] = React.useState<string[]>([]);
  const [nearestStation, setNearestStation] = React.useState("");
  const [stationDistance, setStationDistance] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState("0");

  // Transit station selector states
  const [selectedStationCodes, setSelectedStationCodes] = React.useState<string[]>([]);
  const [stationDistancesMap, setStationDistancesMap] = React.useState<Record<string, string>>({});
  const [isStationSelectorOpen, setIsStationSelectorOpen] = React.useState(false);

  // Reset form when project changes
  React.useEffect(() => {
    if (isOpen) {
      if (project) {
        setNameTh(project.name.th || "");
        setNameEn(project.name.en || "");
        setSlug(project.slug || "");
        setDeveloper(project.developer || "");
        setPropertyType(project.property_type.toString());
        setProvince(project.province || "กรุงเทพมหานคร");
        setDistrict(project.district || "");
        setSubdistrict(project.subdistrict || "");
        setLat(project.latitude?.toString() || "");
        setLng(project.longitude?.toString() || "");
        setYearCompleted(project.year_completed?.toString() || "");
        setTotalUnits(project.total_units?.toString() || "");
        setImageUrl(project.image_url || "");
        
        setDescTh(project.description?.th || "");
        setDescEn(project.description?.en || "");
        setDescCn(project.description?.cn || "");
        setDescRu(project.description?.ru || "");

        setSeoTitleTh(project.seo_title?.th || "");
        setSeoTitleEn(project.seo_title?.en || "");
        setSeoDescTh(project.seo_description?.th || "");
        setSeoDescEn(project.seo_description?.en || "");

        setSelectedFacilities(project.facilities || []);
        setNearestStation(project.nearest_station_code || "");
        setStationDistance(project.nearest_station_distance?.toString() || "");
        setIsActive(project.is_active);
        setSortOrder(project.sort_order.toString());
        setFormStep(1);

        const initialMapsLink = project.latitude && project.longitude
          ? `https://www.google.com/maps/place/${project.latitude},${project.longitude}`
          : "";
        setGoogleMapsUrl(initialMapsLink);

        const rawStationCodeStr = project.nearest_station_code || "";
        const parts = rawStationCodeStr.split(",").map(s => s.trim()).filter(Boolean);
        const codes: string[] = [];
        const dists: Record<string, string> = {};
        
        parts.forEach((part: string, index: number) => {
          const subparts = part.split(":");
          const code = subparts[0].trim();
          if (code) {
            codes.push(code);
            if (subparts[1]) {
              const meters = Number(subparts[1]);
              if (meters > 0) {
                if (meters >= 1000) {
                  dists[code] = (meters / 1000).toString();
                } else {
                  dists[code] = meters.toString();
                }
              }
            } else if (index === 0 && project.nearest_station_distance) {
              const meters = Number(project.nearest_station_distance);
              if (meters > 0) {
                if (meters >= 1000) {
                  dists[code] = (meters / 1000).toString();
                } else {
                  dists[code] = meters.toString();
                }
              }
            }
          }
        });

        setSelectedStationCodes(codes);
        setStationDistancesMap(dists);
      } else {
        setNameTh("");
        setNameEn("");
        setSlug("");
        setDeveloper("");
        setPropertyType("1");
        setProvince("กรุงเทพมหานคร");
        setDistrict("");
        setSubdistrict("");
        setLat("");
        setLng("");
        setYearCompleted("");
        setTotalUnits("");
        setImageUrl("");
        setDescTh("");
        setDescEn("");
        setDescCn("");
        setDescRu("");
        setSeoTitleTh("");
        setSeoTitleEn("");
        setSeoDescTh("");
        setSeoDescEn("");
        setSelectedFacilities([]);
        setNearestStation("");
        setStationDistance("");
        setIsActive(true);
        setSortOrder("0");
        setFormStep(1);
        setGoogleMapsUrl("");
        setSelectedStationCodes([]);
        setStationDistancesMap({});
      }
      setIsFormDirty(false);
    }
  }, [isOpen, project]);

  // Auto-generate slug from English name
  React.useEffect(() => {
    if (!project && nameEn && !slug) {
      const generated = slugify(nameEn, { lower: true, strict: true });
      setSlug(generated);
    }
  }, [nameEn, project, slug]);

  const parseDistanceToMeters = React.useCallback((val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^\d.]/g, "");
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    if (num <= 15) {
      return Math.round(num * 1000);
    }
    return Math.round(num);
  }, []);

  const groupedFeatures = React.useMemo(() => {
    if (!dbFeatures || dbFeatures.length === 0) return {};
    const mapping = isEn ? CATEGORY_MAPPING_EN : CATEGORY_MAPPING_TH;
    return dbFeatures.reduce(
      (acc, feature) => {
        const rawCat = feature.category || "General";
        const upperCat = rawCat.toUpperCase();
        const cat = mapping[upperCat] || rawCat;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(feature);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }, [dbFeatures, isEn]);

  const handleFacilityToggle = (value: string) => {
    setIsFormDirty(true);
    setSelectedFacilities(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleGoogleMapsUrlChange = (url: string) => {
    setGoogleMapsUrl(url);
    setIsFormDirty(true);
    const coords = parseCoordinatesFromGoogleMaps(url);
    if (coords) {
      setLat(coords.lat.toString());
      setLng(coords.lng.toString());
    }
  };

  const handleAiAutoFill = async () => {
    const nameToUse = nameEn || nameTh;
    if (!nameToUse.trim()) {
      toast.error(isEn ? "Please enter a project name in Thai or English for AI lookup." : "กรุณาระบุชื่อโครงการ (ไทย หรือ อังกฤษ) เพื่อให้ AI ค้นข้อมูลครับ");
      return;
    }

    setIsAiGenerating(true);
    const toastId = toast.loading(isEn ? "🤖 Gemini is searching and generating all project details..." : "🤖 Gemini กำลังค้นหาและเจนข้อมูลโครงการทั้งหมดให้คุณ...");
    try {
      const res = await generateAIProjectDataAction(nameToUse);
      if (res.success && res.data) {
        const d = res.data;
        if (d.nameTh) setNameTh(d.nameTh);
        if (d.nameEn) setNameEn(d.nameEn);
        if (d.developer) setDeveloper(d.developer);
        if (d.propertyType) setPropertyType(d.propertyType.toString());
        if (d.yearCompleted) setYearCompleted(d.yearCompleted.toString());
        if (d.totalUnits) setTotalUnits(d.totalUnits.toString());
        if (d.province) setProvince(d.province);
        if (d.district) setDistrict(d.district);
        if (d.subdistrict) setSubdistrict(d.subdistrict);
        if (d.googleMapsUrl) setGoogleMapsUrl(d.googleMapsUrl);
        if (d.latitude) setLat(d.latitude.toString());
        if (d.longitude) setLng(d.longitude.toString());
        if (d.facilities) setSelectedFacilities(d.facilities);
        if (d.nearestStationCode) {
          setNearestStation(d.nearestStationCode);
          const parts = d.nearestStationCode.split(",").map((s: string) => s.trim()).filter(Boolean);
          const codes: string[] = [];
          const dists: Record<string, string> = {};
          
          parts.forEach((part: string, index: number) => {
            const subparts = part.split(":");
            const code = subparts[0].trim();
            if (code) {
              codes.push(code);
              if (subparts[1]) {
                const meters = Number(subparts[1]);
                if (meters > 0) {
                  if (meters >= 1000) {
                    dists[code] = (meters / 1000).toString();
                  } else {
                    dists[code] = meters.toString();
                  }
                }
              } else if (index === 0 && d.nearestStationDistance) {
                const meters = Number(d.nearestStationDistance);
                if (meters > 0) {
                  if (meters >= 1000) {
                    dists[code] = (meters / 1000).toString();
                  } else {
                    dists[code] = meters.toString();
                  }
                }
              }
            }
          });
          
          setSelectedStationCodes(codes);
          setStationDistancesMap(dists);
        }
        if (d.descriptionTh) setDescTh(d.descriptionTh);
        if (d.descriptionEn) setDescEn(d.descriptionEn);
        if (d.descriptionCn) setDescCn(d.descriptionCn);
        if (d.descriptionRu) setDescRu(d.descriptionRu);
        if (d.seoTitleTh) setSeoTitleTh(d.seoTitleTh);
        if (d.seoTitleEn) setSeoTitleEn(d.seoTitleEn);
        if (d.seoDescTh) setSeoDescTh(d.seoDescTh);
        if (d.seoDescEn) setSeoDescEn(d.seoDescEn);

        if (d.nameEn) {
          const generated = slugify(d.nameEn, { lower: true, strict: true });
          setSlug(generated);
        }

        toast.success(isEn ? "AI project auto-fill complete! ✨" : "AI กรอกข้อมูลโครงการสำเร็จเสร็จสิ้น! ✨", { id: toastId });
      } else {
        throw new Error(res.message || (isEn ? "Failed to retrieve project information" : "ล้มเหลวในการดึงข้อมูล"));
      }
    } catch (err: any) {
      console.error(err);
      toast.error((isEn ? "AI failed to find project details: " : "AI ไม่สามารถค้นหาข้อมูลโครงการได้: ") + (err.message || ""), { id: toastId });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!nameTh.trim() || !nameEn.trim()) {
      toast.error(isEn ? "Please enter project names in Thai and English" : "กรุณาระบุชื่อโครงการ (ไทย และ อังกฤษ)");
      return;
    }
    if (!slug.trim()) {
      toast.error(isEn ? "Please enter a URL slug" : "กรุณาระบุ URL Slug");
      return;
    }

    setIsSaving(true);
    try {
      const payload: ProjectAdminItem = {
        id: project?.id,
        name: { th: nameTh.trim(), en: nameEn.trim() },
        slug: slug.trim().toLowerCase(),
        developer: developer.trim() || null,
        property_type: Number(propertyType),
        province: province.trim() || "กรุงเทพมหานคร",
        district: district.trim() || null,
        subdistrict: subdistrict.trim() || null,
        latitude: lat.trim() ? Number(lat) : null,
        longitude: lng.trim() ? Number(lng) : null,
        year_completed: yearCompleted.trim() ? Number(yearCompleted) : null,
        total_units: totalUnits.trim() ? Number(totalUnits) : null,
        image_url: imageUrl.trim() || null,
        description: {
          th: descTh.trim() || undefined,
          en: descEn.trim() || undefined,
          cn: descCn.trim() || undefined,
          ru: descRu.trim() || undefined,
        },
        seo_title: {
          th: seoTitleTh.trim() || undefined,
          en: seoTitleEn.trim() || undefined,
        },
        seo_description: {
          th: seoDescTh.trim() || undefined,
          en: seoDescEn.trim() || undefined,
        },
        facilities: selectedFacilities,
        nearest_station_code: (() => {
          if (selectedStationCodes.length === 0) return null;
          return selectedStationCodes.map((code) => {
            const rawDist = stationDistancesMap[code] || "";
            const meters = parseDistanceToMeters(rawDist);
            return meters > 0 ? `${code}:${meters}` : code;
          }).join(",");
        })(),
        nearest_station_distance: (() => {
          const distances = selectedStationCodes
            .map((code) => parseDistanceToMeters(stationDistancesMap[code] || ""))
            .filter((d) => d > 0);
          return distances.length > 0 ? Math.min(...distances) : (stationDistance.trim() ? Number(stationDistance) : null);
        })(),
        is_active: isActive,
        sort_order: Number(sortOrder) || 0,
      };

      const res = await upsertProjectAction(payload);
      if (res.success) {
        toast.success(res.message || (isEn ? "Project saved successfully" : "บันทึกโครงการสำเร็จ"));
        setIsFormDirty(false);
        onClose(false);
        onSaveSuccess();
      } else {
        toast.error(res.message || (isEn ? "Failed to save project" : "ไม่สามารถบันทึกโครงการได้"));
      }
    } catch {
      toast.error(isEn ? "An error occurred while saving project" : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    isFormDirty,
    setIsFormDirty,
    formStep,
    setFormStep,
    googleMapsUrl,
    isAiGenerating,
    nameTh,
    setNameTh,
    nameEn,
    setNameEn,
    slug,
    setSlug,
    developer,
    setDeveloper,
    propertyType,
    setPropertyType,
    province,
    setProvince,
    district,
    setDistrict,
    subdistrict,
    setSubdistrict,
    lat,
    lng,
    yearCompleted,
    setYearCompleted,
    totalUnits,
    setTotalUnits,
    imageUrl,
    setImageUrl,
    descTh,
    setDescTh,
    descEn,
    setDescEn,
    descCn,
    setDescCn,
    descRu,
    setDescRu,
    seoTitleTh,
    setSeoTitleTh,
    seoTitleEn,
    setSeoTitleEn,
    seoDescTh,
    setSeoDescTh,
    seoDescEn,
    setSeoDescEn,
    selectedFacilities,
    setSelectedFacilities,
    isActive,
    setIsActive,
    sortOrder,
    setSortOrder,
    selectedStationCodes,
    setSelectedStationCodes,
    stationDistancesMap,
    setStationDistancesMap,
    isStationSelectorOpen,
    setIsStationSelectorOpen,
    handleFacilityToggle,
    handleGoogleMapsUrlChange,
    handleAiAutoFill,
    handleSave,
    groupedFeatures,
  };
}

