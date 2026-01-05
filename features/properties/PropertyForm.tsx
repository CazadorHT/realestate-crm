// property form.tsx

"use client";
import * as React from "react";
import { useRef } from "react";
import {
  Trash2,
  TrendingUp,
  PlusCircle,
  Loader2,
  Home,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IMAGE_UPLOAD_POLICY,
  PropertyImageUploader,
} from "@/components/property-image-uploader";
import { FormSchema, type PropertyFormValues } from "./schema";
import { DuplicateWarningDialog } from "@/components/properties/DuplicateWarningDialog";
import type { PropertyRow } from "@/features/properties/types";
import type { FieldErrors } from "react-hook-form";
import { CancelButton } from "./btn-cancel";
import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_ORDER,
  LISTING_TYPE_ORDER,
  PROPERTY_STATUS_ORDER,
  PROPERTY_STATUS_ENUM,
  POPULAR_AREAS,
  TRANSIT_TYPE_LABELS,
  TRANSIT_TYPE_ENUM,
} from "@/features/properties/labels";
import {
  createPropertyAction,
  updatePropertyAction,
  getPopularAreasAction,
  addPopularAreaAction,
  type CreatePropertyResult,
} from "./actions";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { useThaiAddress } from "@/hooks/useThaiAddress";
import { QuickInfoSection } from "@/features/properties/property-form/sections/QuickInfoSection"; // ปรับ path

const EMPTY_VALUES: PropertyFormValues = {
  title: "",
  description: "",
  property_type: "HOUSE",
  listing_type: "SALE",
  status: "DRAFT",
  price: undefined,
  rental_price: undefined,
  bedrooms: undefined,
  bathrooms: undefined,

  size_sqm: undefined,
  land_size_sqwah: undefined,
  currency: "THB",

  // New fields
  property_source: "",
  owner_id: null,
  assigned_to: null,
  agent_ids: [],

  images: [],

  commission_sale_percentage: 3,
  commission_rent_months: 1,
  popular_area: undefined,
  near_transit: false,
  transit_station_name: "",
  transit_type: "BTS",
  transit_distance_meters: undefined,

  // Co-Agent Defaults
  is_co_agent: false,
  co_agent_name: "",
  co_agent_phone: "",
  co_agent_contact_channel: "LINE",
  co_agent_contact_id: "",
  co_agent_sale_commission_percent: undefined,
  co_agent_rent_commission_months: undefined,
};
// Form schema moved to `features/properties/schema.ts` for shared type-safety
// หน้าอื่นๆ สามารถ import FormSchema และ PropertyFormValues จากที่นั่นได้

type Props = {
  mode: "create" | "edit";
  defaultValues?: PropertyRow | null;
  initialImages?: {
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }[];
};

// helper แปลง Row จาก DB → ค่า default ของฟอร์ม
function mapRowToFormValues(
  row: PropertyRow,
  images?: string[]
): PropertyFormValues {
  return {
    title: row.title ?? "",
    description: row.description ?? undefined, // ✅ null → undefined
    property_type: row.property_type ?? "HOUSE",
    listing_type: row.listing_type ?? "SALE",
    status: row.status ?? "DRAFT",
    price: row.price ?? undefined,
    rental_price: row.rental_price ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    size_sqm: row.size_sqm ?? undefined,
    land_size_sqwah: row.land_size_sqwah ?? undefined,
    currency: row.currency ?? "THB",

    address_line1: row.address_line1 ?? "",
    province: row.province ?? "",
    district: row.district ?? "",
    subdistrict: row.subdistrict ?? "",
    postal_code: row.postal_code ?? "",
    google_maps_link: row.google_maps_link ?? undefined,
    popular_area: row.popular_area ?? undefined,

    // New fields
    owner_id: row.owner_id ?? undefined,
    property_source: row.property_source ?? undefined,
    assigned_to: row.assigned_to ?? undefined,
    agent_ids: [],
    images: images ?? [],

    commission_sale_percentage: row.commission_sale_percentage ?? 3,
    commission_rent_months: row.commission_rent_months ?? 1,
    near_transit: (row as any).near_transit ?? false,
    transit_station_name: (row as any).transit_station_name ?? "",
    transit_type: (row as any).transit_type ?? "BTS",
    transit_distance_meters: (row as any).transit_distance_meters ?? undefined,

    // Co-Agent mapping (from structured_data or default)
    is_co_agent: (row.structured_data as any)?.is_co_agent || false,
    co_agent_name: (row.structured_data as any)?.co_agent_name || "",
    co_agent_phone: (row.structured_data as any)?.co_agent_phone || "",
    co_agent_contact_channel:
      (row.structured_data as any)?.co_agent_contact_channel || "LINE",
    co_agent_contact_id:
      (row.structured_data as any)?.co_agent_contact_id || "",
    co_agent_sale_commission_percent:
      (row.structured_data as any)?.co_agent_sale_commission_percent ||
      undefined,
    co_agent_rent_commission_months:
      (row.structured_data as any)?.co_agent_rent_commission_months ||
      undefined,
  };
}

export function PropertyForm({
  mode,
  defaultValues,
  initialImages = [],
}: Props) {
  const router = useRouter();
  // 🔥 ถ้า true = ออกหน้านี้โดย *ไม่* ลบรูป
  const [persistImages, setPersistImages] = React.useState(false);
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues:
      mode === "edit" && defaultValues
        ? mapRowToFormValues(
            defaultValues,
            initialImages?.map((img) => img.storage_path) ?? []
          )
        : {
            ...EMPTY_VALUES,
            currency: "THB",
          },
  });

  // Duplicate check state
  const [duplicateMatches, setDuplicateMatches] = React.useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false);
  const [pendingSubmit, setPendingSubmit] =
    React.useState<PropertyFormValues | null>(null);

  // Owners and Agents data
  const [owners, setOwners] = React.useState<
    { id: string; full_name: string; phone: string | null }[]
  >([]);
  const [agents, setAgents] = React.useState<
    { id: string; full_name: string | null; phone: string | null }[]
  >([]);

  const [popularAreas, setPopularAreas] = React.useState<string[]>([]);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [newArea, setNewArea] = React.useState("");
  const [isAddingArea, setIsAddingArea] = React.useState(false);

  // Quick Info Dialog state
  const [isQuickInfoOpen, setIsQuickInfoOpen] = React.useState(false);

  const [quickTitle, setQuickTitle] = React.useState("");
  const [quickArea, setQuickArea] = React.useState<string | undefined>(
    undefined
  );
  const [quickError, setQuickError] = React.useState(false);

  // Initialize Quick Info from default values (Edit Mode)
  React.useEffect(() => {
    if (defaultValues?.title) {
      setQuickTitle(defaultValues.title);
      // Ensure Quick Info is visible if data exists
      setIsQuickInfoOpen(true);
    }
    if (defaultValues?.popular_area) {
      setQuickArea(defaultValues.popular_area);
    }
  }, [defaultValues]);

  const handleAddArea = async () => {
    if (!newArea.trim()) return;
    setIsAddingArea(true);
    try {
      const res = await addPopularAreaAction(newArea);
      if (res.success) {
        toast.success("เพิ่มย่านสำเร็จ");
        const updated = await getPopularAreasAction();
        setPopularAreas(updated);
        setNewArea("");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มย่าน");
    } finally {
      setIsAddingArea(false);
    }
  };

  // Session ID for image uploads
  const uploadSessionId = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "fallback"
  ).current;
  // Load owners and agents on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        // Load owners
        const { getOwnersAction } = await import("@/features/owners/actions");
        const ownersData = await getOwnersAction();
        setOwners(ownersData);

        // Load agents (profiles with role AGENT)
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: agentsData } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .order("full_name");

        if (agentsData) {
          setAgents(agentsData);
        }

        // Load popular areas
        const areasData = await getPopularAreasAction();
        setPopularAreas(
          areasData.length > 0
            ? areasData
            : (POPULAR_AREAS as unknown as string[])
        );

        // If edit mode, load assigned agents
        if (mode === "edit" && defaultValues?.id) {
          const { data: rels } = await supabase
            .from("property_agents")
            .select("agent_id")
            .eq("property_id", defaultValues.id);

          if (rels && rels.length > 0) {
            const ids = rels.map((r) => r.agent_id);
            form.setValue("agent_ids", ids);
            // Optional: Sync assigned_to for backward compatibility if needed,
            // but assigned_to is likely already set by mapRowToFormValues from defaultValues
          }
        }
      } catch (error) {
        console.error("Error loading owners/agents:", error);
      }
    }

    loadData();
  }, []);

  // Check for duplicates
  const checkDuplicates = async (values: PropertyFormValues) => {
    if (mode !== "create") return true; // Skip for edit mode

    const { checkDuplicateProperties } = await import("./check-duplicate");

    const matches = await checkDuplicateProperties({
      address_line1: values.address_line1,
      district: values.district,
      province: values.province,
      postal_code: values.postal_code,
      price: values.price,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      size_sqm: values.size_sqm,
    });

    if (matches.length > 0) {
      setDuplicateMatches(matches);
      setPendingSubmit(values);
      setShowDuplicateDialog(true);
      return false; // Stop submission
    }

    return true; // No duplicates, proceed
  };

  // การจัดการกรณีข้อมูลไม่ถูกต้อง
  const onInvalid = (errors: FieldErrors<PropertyFormValues>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) scrollToField(firstKey);
    toast.error("กรุณาตรวจสอบข้อมูลให้ครบถ้วน");
  };

  // Multiple steps navigation & validation
  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof PropertyFormValues)[] = [];
    if (step === 1) {
      fieldsToValidate.push("listing_type", "property_type", "title");
    }
    if (step === 2) {
      fieldsToValidate.push(
        "price" as any,
        "rental_price" as any,
        "size_sqm" as any
      );
    }
    if (step === 3) {
      fieldsToValidate.push("province", "district", "subdistrict");
    }
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) {
        toast.error("กรุณากรอกข้อมูลที่จำเป็นในขั้นตอนนี้ให้ครบถ้วน");
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    const isStepValid = await validateStep(currentStep);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form submission หรือ การสร้าง/แก้ไขทรัพย์โดยการใช้ onSubmit
  const onSubmit = async (
    values: PropertyFormValues,
    e?: React.BaseSyntheticEvent
  ) => {
    const submitter = (e?.nativeEvent as SubmitEvent | undefined)
      ?.submitter as HTMLElement | null;
    console.log("SUBMIT BY:", submitter);
    console.log("SUBMIT BUTTON TEXT:", submitter?.textContent);
    try {
      const canProceed = await checkDuplicates(values);
      if (!canProceed) return; // Wait for user confirmation
      // No duplicates or in edit mode, proceed to create/update
      let result: CreatePropertyResult | { success: boolean; message?: string };

      if (mode === "create") {
        result = await createPropertyAction(values, uploadSessionId);
      } else {
        result = await updatePropertyAction(
          defaultValues!.id,
          values,
          uploadSessionId
        );
      }

      if (result.success) {
        toast.success(
          mode === "create" ? "เพิ่มทรัพย์ใหม่สำเร็จ" : "บันทึกข้อมูลสำเร็จ"
        );
        setPersistImages(true);
        form.reset(EMPTY_VALUES);
        router.push("/protected/properties");
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: any) {
      // router.push might throw error? usually only from Server Actions redirect, but here router.push is client side.
      // But acts might throw.
      console.error("Error submitting property form:", e);
      toast.error(e.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    }
  };

  // Handle confirmed duplicate submit หรือ คืองการยืนยันการส่งข้อมูลที่ซ้ำกัน
  const handleConfirmDuplicateSubmit = async () => {
    setShowDuplicateDialog(false);

    if (!pendingSubmit) return;

    try {
      const result: CreatePropertyResult = await createPropertyAction(
        pendingSubmit,
        uploadSessionId
      );

      if (result.success) {
        toast.success("เพิ่มทรัพย์ใหม่สำเร็จ (ยืนยันข้อมูลซ้ำ)");
        setPersistImages(true);
        form.reset(EMPTY_VALUES);
        router.push("/protected/properties");
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    }

    setPendingSubmit(null);
  };

  // --- Thai Address Hook Integration ---
  const {
    provinces,
    getDistricts,
    getSubDistricts,
    getZipCode,
    ensureDistrictsLoaded,
    ensureSubDistrictsLoaded,
    loading: addressLoading,
  } = useThaiAddress();

  const watchedProvince = form.watch("province");
  const watchedDistrict = form.watch("district");
  const watchedSubDistrict = form.watch("subdistrict");

  // Load dependent data when needed
  React.useEffect(() => {
    if (watchedProvince) {
      ensureDistrictsLoaded();
    }
  }, [watchedProvince, ensureDistrictsLoaded]);

  React.useEffect(() => {
    if (watchedDistrict) {
      ensureSubDistrictsLoaded();
    }
  }, [watchedDistrict, ensureSubDistrictsLoaded]);

  const activeProvinceId = React.useMemo(() => {
    return provinces.find((p) => p.name_th === watchedProvince)?.id;
  }, [provinces, watchedProvince]);

  const activeDistrictId = React.useMemo(() => {
    if (!activeProvinceId) return undefined;
    const districts = getDistricts(activeProvinceId);
    return districts.find((d) => d.name_th === watchedDistrict)?.id;
  }, [activeProvinceId, watchedDistrict, getDistricts]);

  const districtOptions = React.useMemo(() => {
    if (!activeProvinceId) return [];
    return getDistricts(activeProvinceId);
  }, [activeProvinceId, getDistricts]);

  const subDistrictOptions = React.useMemo(() => {
    if (!activeDistrictId) return [];
    return getSubDistricts(activeDistrictId);
  }, [activeDistrictId, getSubDistricts]);

  // Auto-fill zip code
  React.useEffect(() => {
    if (watchedSubDistrict && activeDistrictId) {
      const sub = subDistrictOptions.find(
        (s) => s.name_th === watchedSubDistrict
      );
      if (sub) {
        form.setValue("postal_code", String(sub.zip_code));
      }
    }
  }, [watchedSubDistrict, activeDistrictId, subDistrictOptions, form]);

  // Inline watches for friendly warnings (not only on submit) หรือ คือการตรวจสอบค่าต่างๆ ในฟอร์มแบบเรียลไทม์
  const listingType = form.watch("listing_type");
  const priceVal = form.watch("price");
  const rentalVal = form.watch("rental_price");

  // When listing type changes, clear fields that are not relevant to avoid stale values
  React.useEffect(() => {
    if (listingType === "RENT") {
      form.setValue("price", undefined);
    } else if (listingType === "SALE") {
      form.setValue("rental_price", undefined);
    }
  }, [listingType]);

  // Derived helpers for responsive grid & visibility
  const showPrice = listingType === "SALE" || listingType === "SALE_AND_RENT";
  const showRental = listingType === "RENT" || listingType === "SALE_AND_RENT";
  const numberFieldsCount = (showPrice ? 1 : 0) + (showRental ? 1 : 0) + 2; // bedrooms & bathrooms

  // Map of possible grid classes so Tailwind can pick them up at build time
  const gridClassMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  // Formatting helpers for numeric inputs (display with thousands separators, keep value as number)
  const formatNumber = (val: number | undefined, decimals = 0) =>
    val == null
      ? ""
      : new Intl.NumberFormat(undefined, {
          maximumFractionDigits: decimals,
          minimumFractionDigits: 0,
        }).format(val);
  const parseNumber = (s: string) => {
    const cleaned = s.replace(/[^0-9.-]/g, "");
    return cleaned === "" ? undefined : Number(cleaned);
  };

  // Small helper component to manage formatted number input without breaking hook order
  function NumberInput({
    value,
    onChange,
    placeholder,
    ariaInvalid,
    decimals = 0,
    allowNegative = false,
  }: {
    value: number | undefined;
    onChange: (v: number | undefined) => void;
    placeholder?: string;
    ariaInvalid?: boolean;
    decimals?: number;
    allowNegative?: boolean;
  }) {
    const [display, setDisplay] = React.useState<string>(() =>
      formatNumber(value, decimals)
    );
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const commitTimer = React.useRef<number | null>(null);

    // Only update display from value when input is NOT focused to avoid
    // interfering with user's typing and caret/selection.
    React.useEffect(() => {
      if (!isFocused) {
        setDisplay(formatNumber(value, decimals));
      }
    }, [value, decimals, isFocused]);

    // Clear any pending timer on unmount
    React.useEffect(() => {
      return () => {
        if (commitTimer.current) window.clearTimeout(commitTimer.current);
      };
    }, []);

    const commitValue = (raw: string) => {
      const parsed = parseNumber(raw);
      // Only call onChange if value actually changes to avoid unnecessary re-renders
      if (
        (parsed === undefined && value === undefined) ||
        (parsed != null && parsed === value)
      ) {
        return;
      }
      onChange(parsed);
    };

    return (
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={display}
        aria-invalid={ariaInvalid}
        onFocus={() => {
          setIsFocused(true);
          setDisplay(value == null ? "" : String(value));
          // move caret to end
          requestAnimationFrame(() => {
            const el = inputRef.current;
            if (el) el.selectionStart = el.selectionEnd = el.value.length;
          });
        }}
        onChange={(e) => {
          const val = e.target.value;
          setDisplay(val);

          // debounce committing the parsed value to avoid frequent form updates
          if (commitTimer.current) window.clearTimeout(commitTimer.current);
          commitTimer.current = window.setTimeout(() => {
            commitValue(val);
            commitTimer.current = null;
          }, 1000);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          // commit immediately on blur
          if (commitTimer.current) window.clearTimeout(commitTimer.current);
          const parsed = parseNumber(e.target.value);
          // commit only if changed
          if (
            (parsed === undefined && value !== undefined) ||
            (parsed != null && parsed !== value)
          ) {
            onChange(parsed);
          }
          setDisplay(formatNumber(parsed, decimals));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // commit immediately on Enter
            if (commitTimer.current) window.clearTimeout(commitTimer.current);
            const parsed = parseNumber((e.target as HTMLInputElement).value);
            if (
              (parsed === undefined && value !== undefined) ||
              (parsed != null && parsed !== value)
            ) {
              onChange(parsed);
            }
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
      />
    );
  }

  // Helper scroll to field with data-field attribute หรือ คือฟังก์ชันช่วยเลื่อนหน้าจอไปยังฟิลด์ที่มีข้อผิดพลาด
  function scrollToField(name: string) {
    const el = document.querySelector(`[data-field="${name}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  //กรณีสรุปข้อผิดพลาดของฟอร์ม และให้ผู้ใช้คลิกเพื่อเลื่อนไปยังฟิลด์ที่มีข้อผิดพลาด
  function ErrorSummary({
    errors,
  }: {
    errors: FieldErrors<PropertyFormValues>;
  }) {
    const items = React.useMemo(() => {
      const labelMap: Record<string, string> = {
        title: "ชื่อทรัพย์",
        property_type: "ประเภททรัพย์",
        listing_type: "รูปแบบประกาศ",
        status: "สถานะ",
        price: "ราคาขาย",
        rental_price: "ราคาเช่า",
      };

      return Object.entries(errors)
        .map(([name, err]) => ({
          name,
          label: labelMap[name] ?? name,
          message: (err as any)?.message as string | undefined,
        }))
        .filter((x) => !!x.message);
    }, [errors]);

    if (items.length === 0) return null;

    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
      >
        <div className="font-semibold">คุณยังกรอกข้อมูลไม่ครบ</div>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
          {items.map((it) => (
            <li key={it.name}>
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => scrollToField(it.name)}
              >
                {it.label}
              </button>
              {it.message ? `: ${it.message}` : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const submitNow = form.handleSubmit(onSubmit, onInvalid);
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();

    // อนุญาต Enter ใน textarea
    if (tag === "textarea") return;

    // กันกรณี contentEditable
    if ((target as any)?.isContentEditable) return;

    // กัน Enter submit โดยไม่ตั้งใจ
    e.preventDefault();
  };
  return (
    <div className="space-y-10">
      {/* 🚀 Stepper Component */}
      <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100 mb-10 sticky top-4 z-40 backdrop-blur-md bg-white/90 ">
        <div className="flex justify-between items-center relative max-w-2xl mx-auto ">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-0" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-700 ease-in-out -z-0"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {[
            { step: 1, label: "ข้อมูลประกาศ" },
            { step: 2, label: "รายละเอียดทรัพย์" },
            { step: 3, label: "ทำเลที่ตั้ง" },
            { step: 4, label: "รูปภาพ & การจัดเก็บ" },
          ].map((item) => (
            <div
              key={item.step}
              className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
              onClick={async () => {
                if (item.step < currentStep) setCurrentStep(item.step);
                else if (item.step === currentStep + 1) handleNext();
              }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                  currentStep >= item.step
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110"
                    : "bg-white text-slate-400 border-2 border-slate-100 group-hover:border-blue-200"
                }`}
              >
                {currentStep > item.step ? "✓" : item.step}
              </div>
              <span
                className={`text-[10px] whitespace-nowrap font-bold uppercase tracking-wider transition-colors duration-300 ${
                  currentStep >= item.step ? "text-blue-600" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* 🚀 Form Content */}
      <Form {...form}>
        <form
          onKeyDown={handleFormKeyDown}
          className="space-y-10"
          onSubmit={(e) => {
            // ✅ กัน implicit submit (Enter / browser default)
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Error Summary หรือ สรุปข้อผิดพลาดของฟอร์ม */}
          <ErrorSummary errors={form.formState.errors} />

          {/* 🚀 New 4-Step Wizard Content */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ">
              <section className="p-8 bg-white rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-12 ">
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-600 p-3.5 rounded-2xl shadow-xl shadow-blue-100">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl  text-slate-900 tracking-tight">
                        ประเภทประกาศ
                      </h3>
                      <p className="text-slate-400 font-light tracking-wide">
                        ระบุรูปแบบสิ่งที่คุณต้องการทำกับทรัพย์สินนี้
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="listing_type"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {LISTING_TYPE_ORDER.map((type: any) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            className={`p-6 rounded-xl border-2 transition-all duration-500 text-left relative group flex items-center gap-5 ${
                              field.value === type
                                ? "border-blue-500 bg-blue-500 text-white shadow-2xl shadow-blue-200 "
                                : "border-slate-50 bg-slate-50/50 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-slate-100"
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                                field.value === type
                                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                                  : "bg-white text-slate-400 group-hover:text-blue-500"
                              }`}
                            >
                              {type === "SALE" ? (
                                <TrendingUp className="w-6 h-6" />
                              ) : type === "RENT" ? (
                                <PlusCircle className="w-6 h-6" />
                              ) : (
                                <Home className="w-6 h-6" />
                              )}
                            </div>

                            <div>
                              <div
                                className={`text-xl transition-colors ${
                                  field.value === type
                                    ? "text-white"
                                    : "text-slate-800"
                                }`}
                              >
                                {(LISTING_TYPE_LABELS as any)[type]}
                              </div>
                              <div
                                className={`text-xs uppercase tracking-widest mt-0.5 transition-colors ${
                                  field.value === type
                                    ? "text-blue-100"
                                    : "text-slate-400"
                                }`}
                              >
                                {type === "SALE"
                                  ? "เปิดขาย"
                                  : type === "RENT"
                                  ? "ปล่อยเช่า"
                                  : "ทั้งขายและเช่า"}
                              </div>
                            </div>

                            {field.value === type && (
                              <div className="absolute top-4 right-4 text-white">
                                <div className="bg-white/20 text-white rounded-full p-1 shadow-md backdrop-blur-sm">
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  <FormMessage className="text-red-500 text-sm font-bold" />
                </div>

                <div className="space-y-8 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-5">
                    <div className="bg-emerald-500 p-3.5 rounded-2xl shadow-xl shadow-emerald-50">
                      <Home className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl text-slate-900 tracking-tight">
                        ประเภทอสังหาฯ
                      </h3>
                      <p className="text-slate-400 font-light tracking-wide">
                        กรองข้อมูลเพื่อให้ลูกค้าหาระบุสิ่งที่ต้องการได้แม่นยำที่สุด
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="property_type"
                    render={({ field }) => (
                      <div className="grid grid-cols-2 lg:grid-cols-8 gap-6">
                        {PROPERTY_TYPE_ORDER.map((type: any) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              field.onChange(type);
                              setIsQuickInfoOpen(true);
                            }}
                            className={`min-h-[60px] px-6 rounded-xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-4 group ${
                              field.value === type
                                ? "border-blue-600 bg-blue-600 text-white shadow-2xl shadow-blue-200 transform -translate-y-2 scale-105"
                                : "border-slate-50 bg-slate-50/50 text-slate-500 hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-lg"
                            }`}
                          >
                            <span className="text-base uppercase tracking-widest text-center">
                              {(PROPERTY_TYPE_LABELS as any)[type]}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  <FormMessage className="text-red-500 text-sm font-bold" />
                </div>

                {/* Quick Info Section - appears after selecting property type */}
                {isQuickInfoOpen && (
                  <QuickInfoSection
                    form={form}
                    popularAreas={popularAreas}
                    isAddingArea={isAddingArea}
                    newArea={newArea}
                    setNewArea={setNewArea}
                    onAddArea={handleAddArea}
                  />
                )}
              </section>
            </div>
          )}
          {/* -------------------- STEP 2: DETAILS -------------------- */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-700">
              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-10">
                <div className="border-b border-slate-50 pb-6">
                  <h3 className="text-2xl font-black text-slate-900">
                    รายละเอียดข้อมูลทรัพย์
                  </h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                    ข้อมูลรายละเอียดและราคา
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {(form.watch("listing_type") === "SALE" ||
                    form.watch("listing_type") === "SALE_AND_RENT") && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-emerald-600 font-black text-sm uppercase tracking-wider mb-2 block">
                            ราคาตั้งขาย (บาท)
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <NumberInput
                                value={field.value ?? undefined}
                                onChange={field.onChange}
                                placeholder="0"
                              />
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 font-black text-xl transition-colors">
                                ฿
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(form.watch("listing_type") === "RENT" ||
                    form.watch("listing_type") === "SALE_AND_RENT") && (
                    <FormField
                      control={form.control}
                      name="rental_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-600 font-black text-sm uppercase tracking-wider mb-2 block">
                            ค่าเช่าต่อเดือน (บาท)
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <NumberInput
                                value={field.value ?? undefined}
                                onChange={field.onChange}
                                placeholder="0"
                              />
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 font-black text-xl transition-colors">
                                ฿
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                          ห้องนอน
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                            onChange={(e) =>
                              field.onChange(parseNumber(e.target.value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                          ห้องน้ำ
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                            onChange={(e) =>
                              field.onChange(parseNumber(e.target.value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="size_sqm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                          พื้นที่ (ตร.ม.)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                            onChange={(e) =>
                              field.onChange(parseNumber(e.target.value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="land_size_sqwah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                          ที่ดิน (ตร.ว.)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                            onChange={(e) =>
                              field.onChange(parseNumber(e.target.value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-800 font-black text-sm uppercase tracking-wider mb-2 block">
                        คำบรรยายประกอบประกาศ
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          rows={6}
                          className="rounded-3xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all leading-relaxed p-8 resize-none shadow-inner"
                          placeholder="บอกเล่าเรื่องราวของบ้านคุณ..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-50">
                  {/* Comm Sale */}
                  {(form.watch("listing_type") === "SALE" ||
                    form.watch("listing_type") === "SALE_AND_RENT") && (
                    <FormField
                      control={form.control}
                      name="commission_sale_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-2 block">
                            % ค่าคอมมิชชั่นการขาย 🔒
                          </FormLabel>
                          <FormControl>
                            <div className="relative group/comm">
                              <NumberInput
                                value={field.value ?? undefined}
                                onChange={field.onChange}
                                decimals={2}
                                placeholder="3"
                              />
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/comm:text-blue-500 font-black text-xl transition-colors">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <div className="flex gap-2 mt-2">
                            {[3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => field.onChange(val)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                  field.value === val
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                                }`}
                              >
                                {val}%
                              </button>
                            ))}
                          </div>
                          {form.watch("price") && field.value && (
                            <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700">
                                ฿
                                {(
                                  ((form.watch("price") || 0) * field.value) /
                                  100
                                ).toLocaleString()}
                              </span>{" "}
                              (โดยประมาณ)
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Comm Rent */}
                  {(form.watch("listing_type") === "RENT" ||
                    form.watch("listing_type") === "SALE_AND_RENT") && (
                    <FormField
                      control={form.control}
                      name="commission_rent_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-2 block">
                            เดือนค่าคอมการเช่า 🔒
                          </FormLabel>
                          <FormControl>
                            <div className="relative group/comm">
                              <NumberInput
                                value={field.value ?? undefined}
                                onChange={field.onChange}
                                decimals={1}
                                placeholder="1"
                              />
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/comm:text-blue-500 font-black text-sm transition-colors uppercase">
                                เดือน
                              </div>
                            </div>
                          </FormControl>
                          <div className="flex gap-2 mt-2">
                            {[0.5, 1, 1.5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => field.onChange(val)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                  field.value === val
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                                }`}
                              >
                                {val} เดือน
                              </button>
                            ))}
                          </div>
                          {form.watch("rental_price") && field.value && (
                            <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700">
                                ฿
                                {(
                                  (form.watch("rental_price") || 0) *
                                  field.value
                                ).toLocaleString()}
                              </span>{" "}
                              (โดยประมาณ)
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </section>
            </div>
          )}

          {/* -------------------- STEP 3: LOCATION -------------------- */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-700">
              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-10">
                <div className="border-b border-slate-50 pb-6">
                  <h3 className="text-2xl font-black text-slate-900">
                    ระบุตำแหน่งที่ตั้ง
                  </h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                    ที่อยู่และการเชื่อมต่อระบบขนส่ง
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700">
                          จังหวัด{" "}
                          {addressLoading && (
                            <Loader2 className="inline h-3 w-3 animate-spin text-slate-400" />
                          )}
                        </FormLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(val) => {
                            field.onChange(val);
                            // Reset dependencies
                            form.setValue("district", "");
                            form.setValue("subdistrict", "");
                            form.setValue("postal_code", "");
                            ensureDistrictsLoaded();
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-sm">
                              <SelectValue placeholder="เลือกจังหวัด" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {provinces.map((p) => (
                              <SelectItem key={p.id} value={p.name_th}>
                                {p.name_th}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700">
                          เขต / อำเภอ
                        </FormLabel>
                        <Select
                          value={field.value ?? ""}
                          disabled={!activeProvinceId}
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("subdistrict", "");
                            form.setValue("postal_code", "");
                            ensureSubDistrictsLoaded();
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-sm">
                              <SelectValue placeholder="เลือกอำเภอ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {districtOptions.map((d) => (
                              <SelectItem key={d.id} value={d.name_th}>
                                {d.name_th}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subdistrict"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700">
                          แขวง / ตำบล
                        </FormLabel>
                        <Select
                          value={field.value ?? ""}
                          disabled={!activeDistrictId}
                          onValueChange={(val) => {
                            field.onChange(val);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 shadow-sm">
                              <SelectValue placeholder="เลือกตำบล" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {subDistrictOptions.map((s) => (
                              <SelectItem key={s.id} value={s.name_th}>
                                {s.name_th}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-slate-700">
                          รหัสไปรษณีย์
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            readOnly
                            className="h-14 rounded-2xl bg-slate-100/50 border-none font-bold px-6 shadow-sm text-slate-500"
                            placeholder="อัตโนมัติ"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="google_maps_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-2 block">
                        พิกัดบน Google Maps
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="วางลิงก์จาก Google Maps ที่นี่..."
                          className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Smart Match has been moved to Step 1 */}

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
                  <FormField
                    control={form.control}
                    name="near_transit"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-6 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="w-8 h-8 rounded-xl border-slate-300 data-[state=checked]:bg-blue-600"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-xl font-black text-slate-800 cursor-pointer">
                            ตั้งอยู่ใกล้ระบบขนส่งสาธารณะ
                          </FormLabel>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            ใกล้ BTS / MRT หรือรถสาธารณะ
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("near_transit") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-200/40 animate-in fade-in slide-in-from-top-4 duration-500">
                      <FormField
                        control={form.control}
                        name="transit_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                              ประเภทรถไฟฟ้า
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "BTS"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-14 bg-white rounded-2xl border-none shadow-sm font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white rounded-2xl">
                                {TRANSIT_TYPE_ENUM.map((t: any) => (
                                  <SelectItem
                                    key={t}
                                    value={t}
                                    className="font-bold py-3"
                                  >
                                    {(TRANSIT_TYPE_LABELS as any)[t]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="transit_station_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                              ชื่อสถานี
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                className="h-14 rounded-2xl bg-white border-none shadow-sm font-black px-6"
                                placeholder="ทองหล่อ"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="transit_distance_meters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                              ระยะทาง (เมตร)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                className="h-14 rounded-2xl bg-white border-none shadow-sm font-black text-center"
                                placeholder="350"
                                onChange={(e) =>
                                  field.onChange(parseNumber(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* -------------------- STEP 4: MEDIA & MANAGEMENT -------------------- */}
          {currentStep === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-10">
                <div className="border-b border-slate-50 pb-6">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    คลังรูปภาพและอัลบั้ม
                  </h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                    อัลบั้มรูปภาพและสถานะประกาศ
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-6 block text-center">
                        อัปโหลดรูปภาพที่สวยที่สุดของคุณ
                      </FormLabel>
                      <FormControl>
                        <PropertyImageUploader
                          sessionId={uploadSessionId}
                          value={field.value ?? []}
                          onChange={field.onChange}
                          initialImages={initialImages}
                          maxFiles={IMAGE_UPLOAD_POLICY.maxFiles}
                          maxFileSizeMB={
                            IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024)
                          }
                          cleanupOnUnmount={!persistImages}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                  <FormField
                    control={form.control}
                    name="owner_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 block">
                          เจ้าของทรัพย์ 🔒
                        </FormLabel>
                        <Select
                          value={field.value ?? "NONE"}
                          onValueChange={(v) =>
                            field.onChange(v === "NONE" ? null : v)
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6">
                              <SelectValue placeholder="เลือกเจ้าของ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white rounded-2xl shadow-2xl border-none max-h-[300px] overflow-y-auto">
                            <SelectItem
                              value="NONE"
                              className="font-bold text-slate-400"
                            >
                              -- ไม่ระบุ --
                            </SelectItem>
                            {owners.map((o) => (
                              <SelectItem
                                key={o.id}
                                value={o.id}
                                className="py-4 font-black"
                              >
                                {o.full_name} {o.phone ? `(${o.phone})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 block">
                          สถานะปัจจุบัน
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white rounded-2xl border-none shadow-2xl">
                            {PROPERTY_STATUS_ORDER.map((s: any) => (
                              <SelectItem
                                key={s}
                                value={s}
                                className="py-4 font-black"
                              >
                                {(PROPERTY_STATUS_LABELS as any)[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6 bg-blue-50/30 p-10 rounded-[2.5rem] border border-blue-100">
                  <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-widest mb-2 block">
                    Agent ผู้ดูแลทรัพย์สิน
                  </FormLabel>
                  <div className="space-y-4">
                    {form
                      .watch("agent_ids")
                      ?.map((agentId: string, index: number) => (
                        <div key={index} className="flex gap-4">
                          <Select
                            value={agentId}
                            onValueChange={(val: string) => {
                              const current = form.getValues("agent_ids") || [];
                              current[index] = val;
                              if (index === 0)
                                form.setValue("assigned_to", val);
                              form.setValue("agent_ids", [...current]);
                            }}
                          >
                            <SelectTrigger className="flex-1 h-14 rounded-2xl bg-white border-none shadow-sm font-black px-8">
                              <SelectValue placeholder="เลือก Agent" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-2xl shadow-2xl border-none max-h-[300px] overflow-y-auto">
                              {agents.map((a) => (
                                <SelectItem
                                  key={a.id}
                                  value={a.id}
                                  className="py-4 font-black"
                                >
                                  {a.full_name} {a.phone ? `(${a.phone})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="w-14 h-14 rounded-2xl"
                            onClick={() => {
                              const current = form.getValues("agent_ids") || [];
                              const newIds = current.filter(
                                (_, i) => i !== index
                              );
                              form.setValue("agent_ids", newIds);
                            }}
                          >
                            <Trash2 className="h-6 w-6" />
                          </Button>
                        </div>
                      ))}
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-blue-600 font-black hover:bg-white/50 w-full h-14 rounded-2xl border-2 border-dashed border-blue-200"
                      onClick={() => {
                        const current = form.getValues("agent_ids") || [];
                        form.setValue("agent_ids", [...current, ""]);
                      }}
                    >
                      <PlusCircle className="h-5 w-5 mr-3" />
                      เพิ่ม Agent เพิ่มเติม
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="property_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 block">
                        แหล่งที่มาของทรัพย์ 🔒
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={3}
                          className="rounded-3xl border-slate-100 bg-slate-50 font-medium p-6 resize-none"
                          placeholder="เช่น จากกลุ่ม Facebook, แนะนำจากเพื่อน..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </section>
            </div>
          )}

          {/* -------------------- NAVIGATION BUTTONS -------------------- */}
          <div className="mt-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6 w-full sm:w-auto justify-center sm:justify-start">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="h-16 px-10 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-lg transition-all active:scale-95"
                  >
                    ย้อนกลับ
                  </Button>
                )}
                <CancelButton sessionId={uploadSessionId} />
              </div>

              <div className="w-full sm:w-auto text-center">
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-16 w-full sm:w-auto sm:px-20 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-200 text-xl transition-all active:scale-95 hover:translate-x-1"
                  >
                    ถัดไป
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={submitNow}
                    className="h-16 w-full sm:w-auto sm:px-20 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-200 text-xl transition-all active:scale-95"
                  >
                    {mode === "create"
                      ? "ยืนยันสร้างประกาศ"
                      : "บันทึกการแก้ไขทรัพย์"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Duplicate Warning Dialog */}
        <DuplicateWarningDialog
          open={showDuplicateDialog}
          onOpenChange={setShowDuplicateDialog}
          matches={duplicateMatches}
          onConfirm={handleConfirmDuplicateSubmit}
          onCancel={() => {
            setShowDuplicateDialog(false);
            setPendingSubmit(null);
          }}
        />
      </Form>
    </div>
  );
}
