"use client";

import React, { useCallback, useState, useMemo } from "react";
import { UseFormReturn, useFormContext } from "react-hook-form";
import { type PropertyFormValues } from "@/features/properties/schema";
import dynamic from "next/dynamic";

// --- Dynamic Preview Components (Bundle Optimization) ---
const PropertyGallery = dynamic(
  () =>
    import("@/components/public/PropertyGallery").then(
      (m) => m.PropertyGallery,
    ),
  { ssr: false },
);
const PropertySpecs = dynamic(
  () =>
    import("@/components/public/PropertySpecs").then((m) => m.PropertySpecs),
  { ssr: false },
);
const NearbyPlaces = dynamic(
  () => import("@/components/public/NearbyPlaces").then((m) => m.NearbyPlaces),
  { ssr: false },
);
const PropertySuitability = dynamic(
  () =>
    import("@/components/public/PropertySuitability").then(
      (m) => m.PropertySuitability,
    ),
  { ssr: false },
);
const PropertyHeader = dynamic(
  () =>
    import("@/components/public/property-detail/PropertyHeader").then(
      (m) => m.PropertyHeader,
    ),
  { ssr: false },
);
const PropertyBadgesSection = dynamic(
  () =>
    import("@/components/public/property-detail/PropertyBadgesSection").then(
      (m) => m.PropertyBadgesSection,
    ),
  { ssr: false },
);
const PropertyDescription = dynamic(
  () =>
    import("@/components/public/property-detail/PropertyDescription").then(
      (m) => m.PropertyDescription,
    ),
  { ssr: false },
);
const PropertyAmenities = dynamic(
  () =>
    import("@/components/public/property-detail/PropertyAmenities").then(
      (m) => m.PropertyAmenities,
    ),
  { ssr: false },
);
const PropertyMapClient = dynamic(
  () =>
    import("@/components/public/property-detail/PropertyMapClient").then(
      (m) => m.PropertyMapClient,
    ),
  { ssr: false },
);
const AgentSidebar = dynamic(
  () => import("@/components/public/AgentSidebar").then((m) => m.AgentSidebar),
  { ssr: false },
);
const SmartEditor = dynamic(
  () => import("../components/SmartEditor").then((m) => m.SmartEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full bg-slate-50 animate-pulse rounded-xl border border-slate-200" />
    ),
  },
);
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
  MapPin,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  BarChart3,
  Globe,
  Shield,
} from "lucide-react";
import { useAITranslation } from "../hooks/use-ai-translation";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { type Database } from "@/lib/database.types.generated";
import { type SupabaseClient } from "@supabase/supabase-js";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { cn } from "@/lib/utils";
import { AiWriterButton } from "../components/AiWriterButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Hardened types for tables that might be missing from generated types
interface ExtendedDatabase extends Database {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      features: {
        Row: Feature;
        Insert: Feature;
        Update: Partial<Feature>;
        Relationships: [];
      };
      popular_areas_v3: {
        Row: {
        name: string;
        name_en: string | null;
        name_cn: string | null;
        name_ru: string | null;
        };
        Insert: any;
        Update: any;
        Relationships: [];
      };
    };
  };
}

interface Step6ReviewProps {
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
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  line_id: string | null;
  wechat_user_id: string | null;
  whatsapp_user_id: string | null;
};

const isStringWithContent = (val: any): boolean => {
  return typeof val === 'string' && val.trim() !== '';
};

export function Step6Review({ mode }: Step6ReviewProps) {
  const form = useFormContext<PropertyFormValues>();
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [activeFeatures, setActiveFeatures] = useState<Feature[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<"th" | "en" | "cn" | "ru">(
    "th",
  );
  const values = form.watch();

  const {
    isTranslating,
    isTranslatingAll,
    translateDescription,
    translateAll,
    generateAndTranslateAll,
  } = useAITranslation(form);

  // Load features and user profile
  React.useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      // Use ExtendedDatabase to ensure type safety for V3 tables
      const db = supabase as unknown as SupabaseClient<ExtendedDatabase>;

      // 1. Load Features
      if (values.feature_ids && values.feature_ids.length > 0) {
        const { data } = await db
          .from("features")
          .select("id, name, name_en, name_cn, name_ru, icon_key, category")
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
          .select("id, full_name, display_name, email, avatar_url, phone, line_id, wechat_user_id, whatsapp_user_id")
          .eq("id", user.id)
          .single();

        if (profile) setCurrentUser(profile);
      }

      // 3. Load Popular Area Translations if missing
      if (
        values.popular_area &&
        (!values.popular_area_en || !values.popular_area_cn || !values.popular_area_ru)
      ) {
        const { data: areaData } = await db
          .from("popular_areas_v3")
          .select("name")
          .eq("name->>th", values.popular_area)
          .maybeSingle();

        if (areaData && areaData.name && typeof areaData.name === "object") {
          const nameObj = areaData.name as any;
          if (!values.popular_area_en)
            form.setValue("popular_area_en", nameObj.en || null);
          if (!values.popular_area_cn)
            form.setValue("popular_area_cn", nameObj.cn || null);
          if (!values.popular_area_ru)
            form.setValue("popular_area_ru", nameObj.ru || null);
        }
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.feature_ids, values.popular_area]);

  // Transform images for Gallery (using real URLs from form)
  const images = useMemo(() => {
    return (values.images || []).map((url: string, index: number) => {
      const publicUrl = url.startsWith("http") ? url : getPublicImageUrl(url);

      return {
        id: `preview-${index}`,
        url: publicUrl, // Change image_url to url
        is_cover: index === 0,
        sort_order: index,
        created_at: new Date().toISOString(),
        property_id: "preview-id",
        storage_path: "",
        media_type: "image",
        ai_scan_status: "not_started",
        ai_scan_result: {},
      };
    });
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
    values.is_pet_friendly && {
      name:
        previewLanguage === "en"
          ? "Pet Friendly"
          : previewLanguage === "cn"
            ? "允许携带宠物"
            : previewLanguage === "ru"
              ? "Можно с животными"
              : "เลี้ยงสัตว์ได้",
      icon: "dog",
    },
    values.is_corner_unit && {
      name:
        previewLanguage === "en"
          ? "Corner Unit"
          : previewLanguage === "cn"
            ? "边间房"
            : previewLanguage === "ru"
              ? "Угловой юнит"
              : "ห้องมุม",
      icon: "layout",
    },
    values.is_renovated && {
      name:
        previewLanguage === "en"
          ? "Recently Renovated"
          : previewLanguage === "cn"
            ? "新装修"
            : previewLanguage === "ru"
              ? "Недавний ремонт"
              : "รีโนเวทใหม่",
      icon: "sparkles",
    },
    values.is_fully_furnished && {
      name:
        previewLanguage === "en"
          ? "Fully Furnished"
          : previewLanguage === "cn"
            ? "全家具"
            : previewLanguage === "ru"
              ? "Полностью меблирована"
              : "ตกแต่งครบ",
      icon: "armchair",
    },
    (values.floor || 0) > 15 && {
      name:
        previewLanguage === "en"
          ? `High Floor (Fl. ${values.floor})`
          : previewLanguage === "cn"
            ? `高层 (第 ${values.floor} 层)`
            : previewLanguage === "ru"
              ? `Высокий этаж (${values.floor}-й этаж)`
              : `วิวสวยชั้นสูง (ชั้น ${values.floor})`,
      icon: "building-2",
    },
    values.has_city_view && {
      name:
        previewLanguage === "en"
          ? "City View"
          : previewLanguage === "cn"
            ? "城市景观"
            : previewLanguage === "ru"
              ? "Вид на город"
              : "วิวเมือง",
      icon: "building-2",
    },
    values.has_pool_view && {
      name:
        previewLanguage === "en"
          ? "Pool View"
          : previewLanguage === "cn"
            ? "泳池景观"
            : previewLanguage === "ru"
              ? "Вид на бассейн"
              : "วิวสระว่ายน้ำ",
      icon: "waves",
    },
    values.has_garden_view && {
      name:
        previewLanguage === "en"
          ? "Garden View"
          : previewLanguage === "cn"
            ? "园景"
            : previewLanguage === "ru"
              ? "Вид на сад"
              : "วิวสวน",
      icon: "trees",
    },
    values.is_selling_with_tenant && {
      name:
        previewLanguage === "en"
          ? "Sold with Tenant"
          : previewLanguage === "cn"
            ? "带租约出售"
            : previewLanguage === "ru"
              ? "С арендатором"
              : "ขายพร้อมผู้เช่า",
      icon: "users",
    },
    values.is_tax_registered && {
      name:
        previewLanguage === "en"
          ? "Tax Registered"
          : previewLanguage === "cn"
            ? "可开具发票"
            : previewLanguage === "ru"
              ? "Зарегистрирован налог"
              : "จดทะเบียนบริษัทได้",
      icon: "file-check",
    },
    values.is_foreigner_quota && {
      name:
        previewLanguage === "en"
          ? "Foreigner Quota"
          : previewLanguage === "cn"
            ? "外籍配额"
            : previewLanguage === "ru"
              ? "Квота для иностранцев"
              : "โควต้าต่างชาติ",
      icon: "globe",
    },
    values.near_transit &&
      values.transit_station_name && {
        name:
          previewLanguage === "en"
            ? `Near ${values.transit_station_name_en || values.transit_station_name}`
            : previewLanguage === "cn"
              ? `靠近 ${values.transit_station_name_cn || values.transit_station_name}`
              : previewLanguage === "ru"
                ? `Рядом с ${values.transit_station_name_ru || values.transit_station_name_en || values.transit_station_name}`
                : `ใกล้ ${values.transit_station_name}`,
        icon: "map-pin",
      },
  ]
    .filter((f): f is { name: string; icon: string } => !!f)
    .slice(0, 6);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerateDescription = useCallback(async () => {
    try {
      setIsGenerating(true);
      await generateAndTranslateAll();
    } catch (e) {
      console.error("AI Writer Error:", e);
    } finally {
      setIsGenerating(false);
    }
  }, [generateAndTranslateAll]);

  // 📊 Listing Readiness Score
  const readinessChecks = useMemo(() => {
    const checks = [
      { label: "ชื่อทรัพย์", ok: isStringWithContent(values.title), weight: 15 },
      { label: "รูปภาพ ≥5 รูป", ok: (values.images?.length || 0) >= 5, weight: 20 },
      { label: "ราคา", ok: !!(values.price || values.rental_price ||values.original_price ||values.original_rental_price), weight: 15 },
      { label: "รายละเอียด (TH)", ok: isStringWithContent(values.description), weight: 10 },
      { label: "รายละเอียด (EN)", ok: isStringWithContent(values.description_en), weight: 5 },
      { label: "รายละเอียด (CN)", ok: isStringWithContent(values.description_cn), weight: 5 },
      { label: "ทำเล", ok: !!values.popular_area || !!values.district, weight: 10 },
      { label: "ข้อมูลห้อง", ok: !!(values.bedrooms || values.size_sqm), weight: 5 },
      { label: "สิ่งอำนวยความสะดวก", ok: (values.feature_ids?.length || 0) >= 1, weight: 5 },
      { label: "แผนที่ Google", ok: isStringWithContent(values.google_maps_link), weight: 5 },
      { label: "ชื่อ (EN)", ok: isStringWithContent(values.title_en), weight: 5 },
    ];
    const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
    const earned = checks.filter(c => c.ok).reduce((s, c) => s + c.weight, 0);
    const score = Math.round((earned / totalWeight) * 100);
    return { checks, score };
  }, [
    values.title, values.title_en, values.images, values.price, values.rental_price,
    values.description, values.description_en, values.description_cn,
    values.popular_area, values.district, values.bedrooms, values.size_sqm,
    values.feature_ids, values.google_maps_link,
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Review Header Alert */}
      <div id="tour-property-review" className="sticky top-38 z-101 bg-blue-50 border border-blue-100 p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 bg-blue-100/50 rounded-xl text-blue-600 shrink-0">
            <FileCheck className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-blue-700">
              {previewLanguage === "th"
                ? "ขั้นตอนที่ 6: ตรวจสอบหน้าประกาศ (Review & Publish)"
                : previewLanguage === "en"
                  ? "Step 6: Review & Publish"
                  : previewLanguage === "cn"
                    ? "第 6 步：查看并发布"
                    : "Шаг 6: Просмотр и публикация"}
            </h3>
            <p className="text-[11px] sm:text-sm text-blue-600/80 leading-relaxed max-w-2xl">
              {previewLanguage === "th"
                ? "นี่คือตัวอย่างหน้าประกาศของคุณที่จะแสดงให้ลูกค้าเห็นจริง กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมด และสามารถเลือกดูพรีวิวในภาษาต่างๆ ได้ทางขวามือครับ"
                : previewLanguage === "en"
                  ? "This is a preview of your listing as it will appear to customers. Please check all information for accuracy. You can preview in different languages using the buttons on the right."
                  : previewLanguage === "cn"
                    ? "这是房源发布的实际预览。请检查所有信息的准确性。您可以使用右侧的按钮预览不同语言。"
                    : "Это предварительный просмотр вашего объявления в том виде, в котором его увидят клиенты. Пожалуйста, проверьте точность всей информации. Вы можете просмотреть его на разных языках с помощью кнопок справа."}
            </p>
          </div>
        </div>

        <div className="flex flex-col  bg-white/50 backdrop-blur-sm border border-blue-100 p-1.5 rounded-2xl shadow-sm items-center gap-2 sm:gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <AiWriterButton />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={translateAll}
                    disabled={isTranslatingAll}
                    className="w-full sm:w-auto h-9 gap-2 border-blue-200 text-blue-600 bg-blue-50 hover:bg-white hover:text-blue-600 font-bold px-4 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                  >
                    {isTranslatingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Languages className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    AI Global Fix
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-none z-102 shadow-xl px-4 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Languages className="w-3 h-3 text-blue-400" />
                    <span>AI Global Fix: ตรวจสอบและแปลข้อมูลทุกส่วนที่ยังไม่สมบูรณ์ให้ครบถ้วน 🌐</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator
            orientation="vertical"
            className="hidden sm:block h-5 bg-blue-100"
          />
          <Separator
            orientation="horizontal"
            className="sm:hidden w-full bg-blue-100/50"
          />

          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar rounded-xl">
            {(["th", "en", "cn", "ru"] as const).map((lang) => (
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
                <span className={cn(
                  "fi shadow-xs rounded-xs",
                  lang === "th" ? "fi-th" : lang === "en" ? "fi-us" : lang === "cn" ? "fi-cn" : "fi-ru"
                )} />
                {lang === "th" ? "ไทย" : lang === "en" ? "English" : lang === "cn" ? "中文" : "Русский"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 Listing Readiness Score */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Score Ring */}
          <div className="relative h-20 w-20 shrink-0 mx-auto sm:mx-0">
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" fill="none" />
              <circle
                cx="40" cy="40" r="34"
                stroke={readinessChecks.score >= 80 ? "#10b981" : readinessChecks.score >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(readinessChecks.score / 100) * 213.6} 213.6`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                "text-lg font-black",
                readinessChecks.score >= 80 ? "text-emerald-600" : readinessChecks.score >= 50 ? "text-amber-600" : "text-red-600"
              )}>{readinessChecks.score}%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ready</span>
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                ความพร้อมประกาศ
              </h4>
              <span className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-full",
                readinessChecks.score >= 80
                  ? "bg-emerald-100 text-emerald-700"
                  : readinessChecks.score >= 50
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
              )}>
                {readinessChecks.score >= 80 ? "พร้อมเผยแพร่" : readinessChecks.score >= 50 ? "ควรเพิ่มข้อมูล" : "ข้อมูลน้อย"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
              {readinessChecks.checks.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5 text-[11px]">
                  {c.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  )}
                  <span className={cn("truncate", c.ok ? "text-slate-600" : "text-slate-400")}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Translation Status */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500 font-medium shrink-0">แปลภาษา:</span>
             {(["th", "en", "cn", "ru"] as const).map((lang) => {
                const hasDesc = lang === "th" ? isStringWithContent(values.description)
                  : lang === "en" ? isStringWithContent(values.description_en)
                    : lang === "cn" ? isStringWithContent(values.description_cn)
                      : isStringWithContent(values.description_ru);
                const hasTitle = lang === "th" ? isStringWithContent(values.title)
                  : lang === "en" ? isStringWithContent(values.title_en)
                    : lang === "cn" ? isStringWithContent(values.title_cn)
                      : isStringWithContent(values.title_ru);
                const status = hasDesc && hasTitle ? "full" : hasDesc || hasTitle ? "partial" : "none";
                return (
                  <span
                    key={lang}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      status === "full" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : status === "partial" ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                    )}
                  >
                    <span className={cn(
                      "fi shadow-xs rounded-xs scale-90",
                      lang === "th" ? "fi-th" : lang === "en" ? "fi-us" : lang === "cn" ? "fi-cn" : "fi-ru"
                    )} />
                    {status === "full" ? "✓" : status === "partial" ? "◐" : "—"}
                  </span>
                );
              })}
              {/* Image Count */}
              <div className="ml-auto flex items-center gap-1">
                <ImageIcon className={cn("h-3.5 w-3.5", (values.images?.length || 0) >= 5 ? "text-emerald-500" : "text-amber-500")} />
                <span className={cn(
                  "text-[10px] font-bold",
                  (values.images?.length || 0) >= 5 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {values.images?.length || 0} รูป
                  {(values.images?.length || 0) < 5 && " (แนะนำ ≥5)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PREVIEW CONTENT --- */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden pb-8 sm:pb-12 relative">
        <PropertyHeader
          property={
            {
              ...values,
              id: values.id || "preview-id",
              listing_type: values.listing_type,
              price: values.price ?? null,
              original_price: values.original_price ?? null,
              rental_price: values.rental_price ?? null,
              original_rental_price: values.original_rental_price ?? null,
              min_contract_months: values.min_contract_months ?? null,
              address_info: {
                address_line1: values.address_line1,
                address_line2: (values as any).address_line2 ?? null,
                subdistrict: values.subdistrict,
                district: values.district,
                province: values.province,
                postal_code: values.postal_code,
              },
              transit_info: {
                transits: [
                  ...(values.near_transit && values.transit_station_name
                    ? [
                        {
                          type: values.transit_type || "BTS",
                          station_name: values.transit_station_name,
                          station_name_en: values.transit_station_name_en,
                          station_name_cn: values.transit_station_name_cn,
                          station_name_ru: values.transit_station_name_ru,
                          distance_meters: values.transit_distance_meters,
                        },
                      ]
                    : []),
                  ...(Array.isArray(values.nearby_transits) ? values.nearby_transits : []),
                ],
                places: values.nearby_places || [],
              }
            } as unknown as any // We use unknown as bridge to avoid direct any where possible, but header expects a very specific complex type
          }
          language={previewLanguage}
        />
        <div className="px-4 sm:px-6 lg:px-8 bg-white relative">
          <div className="max-w-screen-2xl mx-auto mt-4 sm:mt-6 md:mt-8">
            <section className="mb-6 md:mb-10">
              <PropertyGallery
                images={images}
                title={values.title}
                isHot={false}
                verified={values.verified}
                petFriendly={values.is_pet_friendly}
                language={previewLanguage}
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
                  office_capacity={values.office_capacity}
                  maid_rooms={values.maid_rooms}
                  halls={values.halls}
                  dining_rooms={values.dining_rooms}
                />

                <PropertyBadgesSection
                  property={
                    {
                      ...values,
                      id: values.id || "preview-id",
                      created_at: new Date().toISOString(),
                    } as unknown as any
                  }
                  language={previewLanguage}
                />

                <div className="space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                      {previewLanguage === "en"
                        ? "Listing Details"
                        : previewLanguage === "cn"
                          ? "房源详情"
                          : previewLanguage === "ru"
                            ? "Описание объекта"
                            : "รายละเอียดประกาศ"}
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
                          id="tour-property-edit-content"
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
                              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-bold border-transparent gap-2"
                            >
                              <span className="fi fi-th rounded-sm shadow-xs" />
                              ไทย
                            </TabsTrigger>
                            <TabsTrigger
                              value="en"
                              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-bold border-transparent gap-2"
                            >
                              <span className="fi fi-us rounded-sm shadow-xs" />
                              English
                            </TabsTrigger>
                            <TabsTrigger
                              value="cn"
                              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-bold border-transparent gap-2"
                            >
                              <span className="fi fi-cn rounded-sm shadow-xs" />
                              中文
                            </TabsTrigger>
                            <TabsTrigger
                              value="ru"
                              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-bold border-transparent gap-2"
                            >
                              <span className="fi fi-ru rounded-sm shadow-xs" />
                              Русский
                            </TabsTrigger>
                          </TabsList>
                          <AiWriterButton
                            onClick={handleRegenerateDescription}
                            disabled={isGenerating}
                            className="w-full sm:w-auto mt-2 sm:mt-0 border-blue-100 text-blue-600 hover:bg-white hover:text-blue-600 gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 text-[11px] sm:text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => translateDescription()}
                            disabled={isTranslating}
                            className="w-full sm:w-auto mt-2 sm:mt-0 border-blue-100 text-blue-600 hover:bg-white hover:text-blue-600 gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 text-[11px] sm:text-xs"
                          >
                            {isTranslating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <span className="sm:inline">AI แปลรวมทุกภาษา</span>
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
                              height={600}
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
                              height={600}
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
                              height={600}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent
                          value="ru"
                          className="mt-0 focus-visible:outline-none"
                        >
                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <SmartEditor
                              value={values.description_ru || ""}
                              onChange={(val) =>
                                form.setValue("description_ru", val, {
                                  shouldDirty: true,
                                })
                              }
                              height={600}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <PropertyDescription
                      property={values as unknown as any}
                      language={previewLanguage}
                    />
                  )}
                </div>

                <NearbyPlaces
                  location={
                    (previewLanguage === "en"
                      ? values.popular_area_en
                      : previewLanguage === "cn"
                        ? values.popular_area_cn
                        : previewLanguage === "ru"
                          ? values.popular_area_ru
                          : null) ||
                    values.popular_area ||
                    undefined
                  }
                  data={(values.nearby_places || []).map(p => ({
                    category: p.category || "Other",
                    name: p.name || "",
                    name_en: p.name_en || undefined,
                    name_cn: p.name_cn || undefined,
                    name_ru: p.name_ru || undefined,
                    distance: p.distance_meters !== undefined ? (p.distance_meters / 1000).toString() : undefined,
                    time: p.time,
                  }))}
                  transits={[
                    ...(values.near_transit && values.transit_station_name
                      ? [
                          {
                            type: values.transit_type || "BTS",
                            station_name: values.transit_station_name,
                            station_name_en:
                              values.transit_station_name_en || undefined,
                            station_name_cn:
                              values.transit_station_name_cn || undefined,
                            station_name_ru:
                              values.transit_station_name_ru || undefined,
                            distance_meters: values.transit_distance_meters ?? undefined,
                          },
                        ]
                      : []),
                    ...(Array.isArray(values.nearby_transits) ? values.nearby_transits : []).map(t => ({
                      ...t,
                      station_name: t.station_name || "",
                      station_name_en: t.station_name_en || undefined,
                      station_name_cn: t.station_name_cn || undefined,
                      station_name_ru: t.station_name_ru || undefined,
                      distance_meters: t.distance_meters ?? undefined,
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
                <section id="map-section" className="scroll-mt-20">
                  <PropertyMapClient
                    googleMapsLink={values.google_maps_link || null}
                    language={previewLanguage}
                  />
                </section>
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
                    agentName={currentUser?.full_name || currentUser?.display_name || currentUser?.email}
                    agentImage={currentUser?.avatar_url}
                    agentPhone={currentUser?.phone}
                    agentLine={currentUser?.line_id}
                    agentWechat={currentUser?.wechat_user_id}
                    agentWhatsapp={currentUser?.whatsapp_user_id}
                    isVerified={true}
                    propertyId="preview-id"
                    propertyTitle={values.title}
                    shareUrl="#"
                    language={previewLanguage}
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
