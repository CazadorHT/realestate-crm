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
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Pencil,
  Check,
  X,
  FileCheck,
  Languages,
  Loader2,
  Clock,
} from "lucide-react";
import { useAITranslation } from "../hooks/use-ai-translation";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [previewLanguage, setPreviewLanguage] = useState<"th" | "en" | "cn">(
    "th",
  );
  const values = form.watch();

  const {
    isTranslating,
    isTranslatingAll,
    translateDescription,
    translateAll,
  } = useAITranslation(form);

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
      <div className="bg-blue-50/50 border border-blue-100 p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 bg-blue-100/50 rounded-xl text-blue-600 shrink-0">
            <FileCheck className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-blue-700">
              ขั้นตอนที่ 6: ตรวจสอบหน้าประกาศ (Review & Publish)
            </h3>
            <p className="text-[11px] sm:text-sm text-blue-600/80 leading-relaxed max-w-2xl">
              นี่คือตัวอย่างหน้าประกาศของคุณที่จะแสดงให้ลูกค้าเห็นจริง
              กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมด
              และสามารถเลือกดูพรีวิวในภาษาต่างๆ ได้ทางขวามือครับ
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row bg-white/50 backdrop-blur-sm border border-blue-100 p-1.5 rounded-2xl shadow-sm items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={translateAll}
            disabled={isTranslatingAll}
            className="w-full sm:w-auto h-9 gap-2 border-blue-200 text-blue-600 bg-blue-50 hover:bg-white font-bold px-4 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
          >
            {isTranslatingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            )}
            AI Global Fix
          </Button>

          <Separator
            orientation="vertical"
            className="hidden sm:block h-5 bg-blue-100"
          />
          <Separator
            orientation="horizontal"
            className="sm:hidden w-full bg-blue-100/50"
          />

          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar rounded-xl">
            {(["th", "en", "cn"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setPreviewLanguage(lang)}
                className={cn(
                  "flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap",
                  previewLanguage === lang
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10"
                    : "text-slate-500 hover:text-blue-600 hover:bg-blue-50",
                )}
              >
                <Languages
                  className={cn(
                    "w-3.5 h-3.5 sm:w-4 sm:h-4",
                    previewLanguage === lang
                      ? "text-blue-200"
                      : "text-slate-400",
                  )}
                />
                {lang === "th" ? "ไทย" : lang === "en" ? "English" : "中文"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- PREVIEW CONTENT --- */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden pb-8 sm:pb-12 relative">
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
          language={previewLanguage}
        />
        <div className="pt-16 sm:pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 bg-white relative">
          <div className="max-w-screen-2xl mx-auto mt-4 sm:mt-6 md:mt-8">
            <section className="mb-6 md:mb-10">
              <PropertyGallery
                images={images}
                title={values.title}
                isHot={false}
                verified={values.verified}
                petFriendly={values.is_pet_friendly}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
              <div className="space-y-10">
                <PropertySpecs
                  bedrooms={values.bedrooms}
                  bathrooms={values.bathrooms}
                  parking={values.parking_slots}
                  sizeSqm={values.size_sqm}
                  landSize={values.land_size_sqwah}
                  floor={values.floor}
                  type={values.property_type}
                  language={previewLanguage}
                />

                <PropertyBadgesSection
                  property={
                    {
                      ...values,
                      id: (values as any).id || "preview-id",
                      created_at: new Date().toISOString(),
                    } as any
                  }
                  language={previewLanguage}
                />

                <div className="space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
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
                    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                      <Tabs defaultValue="th" className="w-full">
                        <div className="flex items-center justify-between mb-4 bg-white/50 p-1.5 rounded-2xl border border-slate-200/50">
                          <TabsList className="bg-transparent h-auto p-0 gap-1 flex-1 sm:flex-none">
                            <TabsTrigger
                              value="th"
                              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-bold border-transparent"
                            >
                              ไทย
                            </TabsTrigger>
                            <TabsTrigger
                              value="en"
                              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-bold border-transparent"
                            >
                              English
                            </TabsTrigger>
                            <TabsTrigger
                              value="cn"
                              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-bold border-transparent"
                            >
                              中文
                            </TabsTrigger>
                          </TabsList>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => translateDescription()}
                            disabled={isTranslating}
                            className="w-full sm:w-auto mt-2 sm:mt-0 border-blue-100 text-blue-600 hover:bg-white gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 text-[11px] sm:text-xs"
                          >
                            {isTranslating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <span className="sm:inline">AI แปลรวดเดียว</span>
                          </Button>
                        </div>

                        <TabsContent
                          value="th"
                          className="mt-0 focus-visible:outline-none"
                        >
                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
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
                        </TabsContent>
                        <TabsContent
                          value="en"
                          className="mt-0 focus-visible:outline-none"
                        >
                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <SmartEditor
                              value={values.description_en || ""}
                              onChange={(val) =>
                                form.setValue("description_en", val, {
                                  shouldDirty: true,
                                })
                              }
                              height={300}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent
                          value="cn"
                          className="mt-0 focus-visible:outline-none"
                        >
                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <SmartEditor
                              value={values.description_cn || ""}
                              onChange={(val) =>
                                form.setValue("description_cn", val, {
                                  shouldDirty: true,
                                })
                              }
                              height={300}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <PropertyDescription
                      property={values as any}
                      language={previewLanguage}
                    />
                  )}
                </div>

                <NearbyPlaces
                  location={values.popular_area || undefined}
                  data={[
                    ...(values.nearby_places || []),
                    ...(values.near_transit && values.transit_station_name
                      ? [
                          {
                            category: "Transport",
                            name: `${values.transit_type || "BTS/MRT"} ${values.transit_station_name}`,
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
                  language={previewLanguage}
                />
                <hr className="border-slate-100" />
                <PropertyAmenities
                  features={activeFeatures}
                  language={previewLanguage}
                />
                <hr className="border-slate-100" />
                <PropertyMapSection
                  googleMapsLink={values.google_maps_link || null}
                />
              </div>

              <div className="space-y-6">
                <PropertySuitability
                  listingType={values.listing_type || "SALE"}
                  price={values.price ?? null}
                  rentalPrice={values.rental_price ?? null}
                  propertyType={values.property_type || undefined}
                  language={previewLanguage}
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
