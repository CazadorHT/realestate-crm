"use client";

import React, { useCallback, useState, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { type PropertyFormValues } from "@/features/properties/schema";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { NearbyPlaces } from "@/components/public/NearbyPlaces";
import { PropertySuitability } from "@/components/public/PropertySuitability";
import { PropertyHeader } from "@/components/public/property-detail/PropertyHeader";
import { PropertyBadgesSection } from "@/components/public/property-detail/PropertyBadgesSection";
import { PropertyDescription } from "@/components/public/property-detail/PropertyDescription";
import { PropertyAmenities } from "@/components/public/property-detail/PropertyAmenities";
import { PropertyMapSection } from "@/components/public/property-detail/PropertyMapSection";
import { SmartEditor } from "../components/SmartEditor";
import { Button } from "@/components/ui/button";
import { generatePropertyDescription } from "../utils/description-generator";
import { toast } from "sonner";
import { Sparkles, Pencil, Check, X, FileCheck } from "lucide-react";
import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";
import { createClient } from "@/lib/supabase/client";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { cn } from "@/lib/utils";

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
    values.is_pet_friendly && { name: "เลี้ยงสัตว์ได้", icon: "dog" },
    values.is_corner_unit && { name: "ห้องมุม", icon: "layout" },
    values.is_renovated && { name: "รีโนเวทใหม่", icon: "sparkles" },
    values.is_fully_furnished && { name: "ตกแต่งครบ", icon: "armchair" },
    (values.floor || 0) > 15 && {
      name: `วิวสวยชั้นสูง (ชั้น ${values.floor})`,
      icon: "building-2",
    },
    values.has_city_view && { name: "วิวเมือง", icon: "building-2" },
    values.has_pool_view && { name: "วิวสระว่ายน้ำ", icon: "waves" },
    values.has_garden_view && { name: "วิวสวน", icon: "trees" },
    values.is_selling_with_tenant && { name: "ขายพร้อมผู้เช่า", icon: "users" },
    values.is_tax_registered && {
      name: "จดทะเบียนบริษัทได้",
      icon: "file-check",
    },
    values.is_foreigner_quota && { name: "โควต้าต่างชาติ", icon: "globe" },
    values.near_transit &&
      values.transit_station_name && {
        name: `ใกล้ ${values.transit_station_name}`,
        icon: "map-pin",
      },
  ]
    .filter((f): f is { name: string; icon: string } => !!f)
    .slice(0, 6);

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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden pb-12">
        {/* 1. Header & Breadcrumb */}
        <PropertyHeader
          property={
            {
              ...values,
              id: (values as any).id || "preview-id",
              listing_type: values.listing_type as any,
              price: values.price ?? null,
              original_price: values.original_price ?? null,
              rental_price: values.rental_price ?? null,
              original_rental_price: values.original_rental_price ?? null,
              min_contract_months: values.min_contract_months ?? null,
            } as any
          }
          locationParts={locationParts}
          keySellingPoints={keySellingPoints}
        />
        <div className="pt-20 md:pt-24 px-5 md:px-6 lg:px-8 bg-white relative">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8 mt-4 md:mt-8">
            {/* 2. Gallery */}
            <section className="mb-6 md:mb-10">
              <PropertyGallery
                images={images}
                title={values.title}
                isHot={false}
                verified={values.verified}
                petFriendly={values.is_pet_friendly}
              />
            </section>

            {/* 3. Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
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

                {/* Badges Section */}
                <PropertyBadgesSection
                  property={
                    {
                      ...values,
                      id: (values as any).id || "preview-id",
                      created_at: new Date().toISOString(),
                    } as any
                  }
                />

                {/* Description Editor / Preview Content */}
                <div className="space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      แก้ไขรายละเอียด
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

                  {isEditingDesc ? (
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 min-h-[300px] animate-in fade-in zoom-in-95 duration-200">
                      <SmartEditor
                        value={values.description || ""}
                        onChange={(val) =>
                          form.setValue("description", val, {
                            shouldDirty: true,
                          })
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
                    <PropertyDescription
                      description={values.description || null}
                    />
                  )}
                </div>

                {/* Nearby */}
                <NearbyPlaces
                  location={values.popular_area || undefined}
                  data={[
                    ...(values.nearby_places || []),
                    ...(values.near_transit && values.transit_station_name
                      ? [
                          {
                            category: "Transport",
                            name: `${values.transit_type || "BTS/MRT"} ${
                              values.transit_station_name
                            }`,
                            distance: values.transit_distance_meters
                              ? (
                                  values.transit_distance_meters / 1000
                                ).toString()
                              : undefined,
                          },
                        ]
                      : []),
                    ...(values.nearby_transits || []).map((t) => ({
                      category: "Transport",
                      name: `${t.type} ${t.station_name}`,
                      distance: t.distance_meters
                        ? (t.distance_meters / 1000).toString()
                        : undefined,
                    })),
                  ]}
                />

                <hr className="border-slate-100" />

                {/* Amenities */}
                <PropertyAmenities features={activeFeatures} />

                <hr className="border-slate-100" />

                {/* Map */}
                <PropertyMapSection
                  googleMapsLink={values.google_maps_link || null}
                />
              </div>

              {/* Right Column (Sidebar) */}
              <div className="space-y-6">
                <PropertySuitability
                  listingType={values.listing_type || "SALE"}
                  price={values.price ?? null}
                  rentalPrice={values.rental_price ?? null}
                />

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
      </div>
    </div>
  );
}
