"use client";

import React, { useCallback, useState, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { type PropertyFormValues } from "@/features/properties/schema";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { KeySellingPoints } from "@/components/public/KeySellingPoints";
import { NearbyPlaces } from "@/components/public/NearbyPlaces";
import { PropertySuitability } from "@/components/public/PropertySuitability";
import { Badge } from "@/components/ui/badge";
import { SmartEditor } from "../components/SmartEditor";
import { Button } from "@/components/ui/button";
import { generatePropertyDescription } from "../utils/description-generator";
import { toast } from "sonner";
import {
  MapPin,
  Sparkles,
  RefreshCw,
  Pencil,
  Check,
  X,
  FileCheck,
  PawPrint,
  Home,
  LayoutDashboard,
  Globe2,
  Cigarette,
  BoxSelect,
  TreePine,
  Waves,
  Building2,
  Compass,
  Medal,
  Layers,
  Wind,
  Maximize,
  Wifi,
  CheckCircle2,
  UserCheck,
  Sunset,
  ArrowUpFromLine,
  Scan,
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";
import { createClient } from "@/lib/supabase/client";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { cn } from "@/lib/utils";

const BADGE_STYLE =
  "h-9 px-4 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg border-0 transition-colors";

interface Step6ReviewProps {
  form: UseFormReturn<PropertyFormValues>;
  mode: "create" | "edit";
}

type Feature = {
  id: string;
  name: string;
  icon_key: string;
  category: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  line_id: string | null;
};

export function Step6Review({ form, mode }: Step6ReviewProps) {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [activeFeatures, setActiveFeatures] = useState<Feature[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const values = form.watch();

  // Load features and user profile
  React.useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      // 1. Load Features
      if (values.feature_ids && values.feature_ids.length > 0) {
        const { data } = await supabase
          .from("features")
          .select("*")
          .in("id", values.feature_ids);
        if (data) setActiveFeatures(data);
      } else {
        setActiveFeatures([]);
      }

      // 2. Load Current User Profile (Agent)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, phone, line_id")
          .eq("id", user.id)
          .single();

        if (profile) setCurrentUser(profile);
      }
    }

    loadData();
  }, [values.feature_ids]);

  // Transform images for Gallery (using real URLs from form)
  const images = useMemo(() => {
    return (values.images || []).map((url, index) => {
      // Ensure URL is public
      const publicUrl = url.startsWith("http") ? url : getPublicImageUrl(url);

      return {
        id: `preview-${index}`,
        image_url: publicUrl,
        is_cover: index === 0,
        sort_order: index,
        created_at: new Date().toISOString(),
        property_id: "preview-id",
        storage_path: null,
      };
    }) as any[];
  }, [values.images]);

  const locationParts = [
    values.popular_area,
    values.subdistrict,
    values.district,
    values.province,
  ]
    .filter(Boolean)
    .join(", ");

  const formatPrice = (val?: number | null) =>
    val !== null && val !== undefined
      ? new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(val)
      : "-";

  const keySellingPoints = [
    // 1. Transit
    values.near_transit && values.transit_station_name
      ? `ใกล้ ${values.transit_station_name}`
      : "",

    // 2. Special Rules & Status
    values.verified ? "Verified Listing" : "",
    values.is_pet_friendly ? "Pet Friendly" : "",
    values.is_foreigner_quota ? "รับชาวต่างชาติ" : "",
    values.is_exclusive ? "Sole Agent" : "",
    values.is_selling_with_tenant ? "ขายพร้อมผู้เช่า" : "",

    // 3. Condition & Furnishing
    values.is_renovated ? "รีโนเวทใหม่" : "",
    values.is_fully_furnished ? "แต่งครบพร้อมอยู่" : "",
    values.is_bare_shell ? "Bare Shell" : "",

    // 4. Unit Features
    values.is_corner_unit ? "ห้องมุม" : "",
    values.has_private_pool ? "สระว่ายน้ำส่วนตัว" : "",
    values.has_garden_view ? "วิวสวน" : "",
    values.has_pool_view ? "วิวสระว่ายน้ำ" : "",
    values.has_city_view ? "วิวเมือง" : "",

    // 5. Office Features
    values.is_grade_a ? "Office Grade A" : "",
    values.is_column_free ? "พื้นที่ไม่มีเสา (Column Free)" : "",
    values.has_raised_floor ? "พื้นยก (Raised Floor)" : "",
    values.has_247_access ? "เข้าออกได้ 24 ชม." : "",
    values.is_tax_registered ? "จดทะเบียนบริษัทได้" : "",
  ]
    .filter(Boolean)
    .slice(0, 6); // Increased limit to 6 for better coverage

  const handleRegenerateDescription = useCallback(async () => {
    try {
      const newDesc = generatePropertyDescription(form.getValues());
      form.setValue("description", newDesc, {
        shouldDirty: true,
        shouldTouch: true,
      });
      toast.success("อัปเดตรายละเอียดเรียบร้อย");
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการสร้างรายละเอียด");
    }
  }, [form]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Review Header Alert */}
      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-4 shadow-sm">
        <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600">
          <FileCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-blue-700">
            ขั้นตอนสุดท้าย: ตรวจสอบและยืนยัน (Review & Publish)
          </h3>
          <p className="text-sm text-blue-600/80 leading-relaxed">
            นี่คือตัวอย่างหน้าประกาศของคุณที่จะแสดงให้ลูกค้าเห็นจริง
            กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมด โดยเฉพาะ "รายละเอียดทรัพย์"
            หากต้องการแก้ไขส่วนไหน สามารถกดย้อนกลับไปแก้ไขได้ทันที
          </p>
        </div>
      </div>

      {/* --- PREVIEW CONTENT (Based on public/properties/[slug]/page.tsx) --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* 1. Header Section */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 grow min-w-0">
              <div className="flex items-center gap-3">
                <Badge
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    values.listing_type === "SALE"
                      ? "bg-emerald-600"
                      : "bg-blue-600"
                  }`}
                >
                  {values.listing_type === "SALE" ? "ขาย" : "เช่า"}
                </Badge>
                <span className="text-slate-400 text-xs font-medium">
                  PREVIEW ID: #XXXXX
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {values.title || "ไม่ได้ระบุชื่อประกาศ"}
              </h2>

              <div className="flex items-center text-slate-600 gap-2 font-medium text-sm">
                <MapPin className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                <span>{locationParts || "ไม่ระบุทำเล"}</span>
              </div>

              <KeySellingPoints
                points={keySellingPoints}
                listingType={values.listing_type || "SALE"}
              />
            </div>

            {/* Price Block */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 min-w-[200px] text-right">
              <div className="space-y-1">
                {values.listing_type === "SALE_AND_RENT" ? (
                  <div className="flex flex-col items-end space-y-1">
                    {/* SALE PART */}
                    <div className="flex flex-col items-end">
                      {values.original_price &&
                        values.price &&
                        values.original_price > values.price && (
                          <div className="text-xs text-slate-400 line-through">
                            {formatPrice(values.original_price)}
                          </div>
                        )}
                      <div className="text-3xl font-bold text-blue-600 leading-none">
                        {formatPrice(values.price || values.original_price)}
                      </div>
                    </div>

                    {/* RENT PART */}
                    <div className="flex flex-col items-end">
                      {/* Price Per Unit (Office/Land) */}
                      {(values.property_type === "OFFICE_BUILDING" ||
                        values.property_type === "LAND") &&
                        values.rent_price_per_sqm && (
                          <div className="text-sm font-medium text-slate-500 mb-0.5">
                            {formatPrice(values.rent_price_per_sqm)}{" "}
                            {values.property_type === "LAND"
                              ? "฿/ตร.ว."
                              : "฿/ตร.ม."}
                          </div>
                        )}

                      {values.original_rental_price &&
                        values.rental_price &&
                        values.original_rental_price > values.rental_price && (
                          <div className="text-xs text-slate-400 line-through">
                            {formatPrice(values.original_rental_price)}
                          </div>
                        )}
                      <div className="text-lg font-semibold text-slate-500">
                        เช่า{" "}
                        {formatPrice(
                          values.rental_price || values.original_rental_price,
                        )}
                        <span className="text-sm font-normal">/เดือน</span>
                      </div>
                      {values.min_contract_months && (
                        <div className="text-sm text-slate-400">
                          สัญญาขั้นต่ำ {values.min_contract_months} เดือน{" "}
                          {values.min_contract_months % 12 === 0 &&
                            `(หรือ ${values.min_contract_months / 12} ปี)`}
                        </div>
                      )}
                    </div>
                  </div>
                ) : values.listing_type === "RENT" ? (
                  <div className="flex flex-col items-end">
                    {/* Price Per Unit (Office/Land) */}
                    {(values.property_type === "OFFICE_BUILDING" ||
                      values.property_type === "LAND") &&
                      values.rent_price_per_sqm && (
                        <div className="text-sm font-medium text-slate-500 mb-0.5">
                          {formatPrice(values.rent_price_per_sqm)}{" "}
                          {values.property_type === "LAND"
                            ? "฿/ตร.ว."
                            : "฿/ตร.ม."}
                        </div>
                      )}

                    {values.original_rental_price &&
                      values.rental_price &&
                      values.original_rental_price > values.rental_price && (
                        <div className="text-sm text-slate-400 line-through">
                          {formatPrice(values.original_rental_price)}
                        </div>
                      )}
                    <div className="text-3xl font-bold text-blue-600">
                      {formatPrice(
                        values.rental_price || values.original_rental_price,
                      )}
                      <span className="text-sm text-slate-500 font-normal ml-1">
                        /เดือน
                      </span>
                    </div>
                    {values.min_contract_months && (
                      <div className="text-sm text-slate-400 mt-1">
                        สัญญาขั้นต่ำ {values.min_contract_months} เดือน{" "}
                        {values.min_contract_months % 12 === 0 &&
                          `(หรือ ${values.min_contract_months / 12} ปี)`}
                      </div>
                    )}
                  </div>
                ) : (
                  // SALE ONLY
                  <div className="flex flex-col items-end">
                    {values.original_price &&
                      values.price &&
                      values.original_price > values.price && (
                        <div className="text-sm text-slate-400 line-through">
                          {formatPrice(values.original_price)}
                        </div>
                      )}
                    <div className="text-3xl font-bold text-blue-600">
                      {formatPrice(values.price || values.original_price)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Gallery */}
        <div className="px-6 md:px-8 mb-8">
          <PropertyGallery
            images={images}
            title={values.title}
            isHot={false}
            verified={values.verified}
            petFriendly={values.is_pet_friendly}
          />
        </div>

        {/* 3. Main Grid */}
        <div className="px-6 md:px-8 pb-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
          {/* Left Column */}
          <div className="space-y-10">
            {/* Specs */}
            <PropertySpecs
              bedrooms={values.bedrooms}
              bathrooms={values.bathrooms}
              parking={values.parking_slots}
              sizeSqm={values.size_sqm}
              landSize={values.land_size_sqwah}
              floor={values.floor}
              type={values.property_type}
            />

            {/* Badges Row - Scrollable Horizontal */}
            <div className="flex overflow-x-auto pb-4 gap-2.5 border-b border-slate-100 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent max-w-4xl px-6 md:px-8">
              {values.is_pet_friendly && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-orange-100 text-orange-700")}
                >
                  <PawPrint className="w-3.5 h-3.5 mr-1" /> Pet Friendly
                </Badge>
              )}
              {values.is_renovated && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-emerald-100 text-emerald-700")}
                >
                  <Home className="w-3.5 h-3.5 mr-1" /> Renovated
                </Badge>
              )}
              {values.is_corner_unit && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-purple-100 text-purple-700")}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> Corner Unit
                </Badge>
              )}
              {values.near_transit && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-blue-100 text-blue-700")}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  ติด{values.transit_station_name || "รถไฟฟ้า"}
                </Badge>
              )}
              {values.is_fully_furnished && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-indigo-100 text-indigo-700")}
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> แต่งครบพร้อมอยู่
                </Badge>
              )}
              {values.is_selling_with_tenant && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-teal-100 text-teal-700")}
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" /> ขายพร้อมผู้เช่า
                </Badge>
              )}
              {values.is_exclusive && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-amber-100 text-amber-700")}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Exclusive (Sole
                  Agent)
                </Badge>
              )}
              {/* --- Added Missing Badges --- */}
              {values.is_foreigner_quota && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-blue-100 text-blue-700")}
                >
                  <Globe2 className="w-3.5 h-3.5 mr-1" />{" "}
                  {values.listing_type === "RENT"
                    ? "รับชาวต่างชาติ"
                    : "Foreigner Quota"}
                </Badge>
              )}
              {values.allow_smoking && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-red-100 text-red-700")}
                >
                  <Cigarette className="w-3.5 h-3.5 mr-1" /> สูบบุหรี่ได้
                </Badge>
              )}
              {values.is_bare_shell && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-slate-100 text-slate-700")}
                >
                  <BoxSelect className="w-3.5 h-3.5 mr-1" /> ห้องเปล่า/Bare
                  Shell
                </Badge>
              )}

              {/* Views */}
              {values.has_garden_view && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-green-100 text-green-700")}
                >
                  <TreePine className="w-3.5 h-3.5 mr-1" /> วิวสวน
                </Badge>
              )}
              {values.has_pool_view && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-cyan-100 text-cyan-700")}
                >
                  <Waves className="w-3.5 h-3.5 mr-1" /> วิวสระ
                </Badge>
              )}
              {values.has_private_pool && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-cyan-100 text-cyan-700")}
                >
                  <Waves className="w-3.5 h-3.5 mr-1" /> สระส่วนตัว
                </Badge>
              )}
              {values.has_city_view && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-violet-100 text-violet-700")}
                >
                  <Building2 className="w-3.5 h-3.5 mr-1" /> วิวเมือง
                </Badge>
              )}
              {values.has_unblocked_view && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-sky-100 text-sky-700")}
                >
                  <Scan className="w-3.5 h-3.5 mr-1" /> วิวไม่บล็อก
                </Badge>
              )}
              {values.has_river_view && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-blue-100 text-blue-700")}
                >
                  <Waves className="w-3.5 h-3.5 mr-1" /> วิวแม่น้ำ
                </Badge>
              )}

              {/* Orientation */}
              {values.facing_east && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-amber-100 text-amber-700")}
                >
                  <Compass className="w-3.5 h-3.5 mr-1" /> ทิศตะวันออก
                </Badge>
              )}
              {values.facing_north && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-blue-100 text-blue-700")}
                >
                  <Compass className="w-3.5 h-3.5 mr-1" /> ทิศเหนือ
                </Badge>
              )}
              {values.facing_south && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-teal-100 text-teal-700")}
                >
                  <Wind className="w-3.5 h-3.5 mr-1" /> ทิศใต้
                </Badge>
              )}
              {values.facing_west && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-orange-100 text-orange-700")}
                >
                  <Sunset className="w-3.5 h-3.5 mr-1" /> ทิศตะวันตก
                </Badge>
              )}

              {/* Office Specs */}
              {values.is_grade_a && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-purple-100 text-purple-700")}
                >
                  <Medal className="w-3.5 h-3.5 mr-1" /> Grade A
                </Badge>
              )}
              {values.is_grade_b && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-blue-100 text-blue-700")}
                >
                  <Medal className="w-3.5 h-3.5 mr-1" /> Grade B
                </Badge>
              )}
              {values.is_grade_c && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-slate-100 text-slate-700")}
                >
                  <Medal className="w-3.5 h-3.5 mr-1" /> Grade C
                </Badge>
              )}
              {values.has_raised_floor && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-sky-100 text-sky-700")}
                >
                  <Layers className="w-3.5 h-3.5 mr-1" /> พื้นยก (Raised Floor)
                </Badge>
              )}
              {values.is_high_ceiling && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-indigo-100 text-indigo-700")}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5 mr-1" /> เพดานสูง
                </Badge>
              )}
              {values.is_column_free && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-cyan-100 text-cyan-700")}
                >
                  <Maximize className="w-3.5 h-3.5 mr-1" /> ไม่มีเสากลาง
                </Badge>
              )}
              {values.is_central_air && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-teal-100 text-teal-700")}
                >
                  <Wind className="w-3.5 h-3.5 mr-1" /> แอร์รวม
                </Badge>
              )}
              {values.is_split_air && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-cyan-100 text-cyan-700")}
                >
                  <Wind className="w-3.5 h-3.5 mr-1" /> แอร์แยก
                </Badge>
              )}

              {/* Services/Other */}
              {values.has_247_access && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-indigo-100 text-indigo-700")}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> เข้า-ออก 24 ชม.
                </Badge>
              )}
              {values.has_fiber_optic && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-sky-100 text-sky-700")}
                >
                  <Wifi className="w-3.5 h-3.5 mr-1" /> Fiber Optic
                </Badge>
              )}
              {values.is_tax_registered && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-fuchsia-100 text-fuchsia-700")}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{" "}
                  จดทะเบียนบริษัทได้
                </Badge>
              )}
              {values.has_multi_parking && (
                <Badge
                  variant="secondary"
                  className={cn(BADGE_STYLE, "bg-slate-100 text-slate-700")}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> จอดรถ {">"} 1
                  คัน
                </Badge>
              )}
            </div>

            {/* DESCRIPTION EDITOR / PREVIEW SWITCHER */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden relative group">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  รายละเอียดทรัพย์
                </h3>

                <div className="flex gap-2">
                  {isEditingDesc ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingDesc(false)}
                        className="text-slate-500"
                      >
                        <X className="w-4 h-4 mr-1" /> ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsEditingDesc(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" /> เสร็จสิ้น
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingDesc(true)}
                      className="gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> แก้ไขรายละเอียด
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white min-h-[300px]">
                {isEditingDesc ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <SmartEditor
                      value={values.description || ""}
                      onChange={(val) =>
                        form.setValue("description", val, { shouldDirty: true })
                      }
                      onAiGenerate={async () => {
                        const newDesc = generatePropertyDescription(
                          form.getValues(),
                          activeFeatures,
                        );
                        toast.success("อัปเดตรายละเอียดเรียบร้อย");
                        return newDesc;
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none leading-relaxed prose-headings:font-bold prose-h3:text-lg prose-p:text-slate-600"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        values.description ||
                          "<p class='text-slate-400 italic text-center py-10'>ยังไม่มีรายละเอียด</p>",
                      ),
                    }}
                  />
                )}
              </div>
            </div>

            {/* Nearby */}
            <NearbyPlaces
              location={values.popular_area || undefined}
              data={[
                ...(values.nearby_places || []),
                // Main Transit
                ...(values.near_transit && values.transit_station_name
                  ? [
                      {
                        category: "Transport",
                        name: `${values.transit_type || "BTS/MRT"} ${
                          values.transit_station_name
                        }`,
                        distance: values.transit_distance_meters
                          ? (values.transit_distance_meters / 1000).toString()
                          : undefined,
                      },
                    ]
                  : []),
                // Additional Transits
                ...(values.nearby_transits || []).map((t) => ({
                  category: "Transport",
                  name: `${t.type} ${t.station_name}`,
                  distance: t.distance_meters
                    ? (t.distance_meters / 1000).toString()
                    : undefined,
                })),
              ]}
            />

            {/* Facilities Grid - Categorized */}
            {activeFeatures.length > 0 && (
              <div className="space-y-6">
                {Object.entries(
                  activeFeatures.reduce(
                    (acc, feature) => {
                      const cat = feature.category || "ทั่วไป (General)";
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(feature);
                      return acc;
                    },
                    {} as Record<string, Feature[]>,
                  ),
                )
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([category, features]) => {
                    const label = category;

                    return (
                      <div key={category}>
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {label}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {features.map((f, i) => {
                            const Icon = ICON_MAP[f.icon_key] || DEFAULT_ICON;
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 text-slate-700 text-sm hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                              >
                                <Icon className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="truncate">{f.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Map */}
            {values.google_maps_link && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    ตำแหน่งที่ตั้งทรัพย์สิน
                  </p>
                  <p className="text-sm text-slate-500">Google Maps Location</p>
                </div>
                <Button variant="outline" className="rounded-full" asChild>
                  <a href={values.google_maps_link} target="_blank">
                    เปิดดูแผนที่
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <PropertySuitability
              listingType={values.listing_type || "SALE"}
              price={values.price ?? null}
              rentalPrice={values.rental_price ?? null}
            />

            {/* Agent Sidebar (Real User Data) */}
            <div className="sticky top-24">
              <AgentSidebar
                agentName={currentUser?.full_name}
                agentImage={currentUser?.avatar_url}
                agentPhone={currentUser?.phone}
                agentLine={currentUser?.line_id}
                isVerified={true}
                propertyId="preview-id"
                propertyTitle={values.title}
                shareUrl="#"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
