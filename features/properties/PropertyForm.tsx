// PropertyForm.tsx - Clean refactored version

"use client";
import * as React from "react";
import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormSchema, type PropertyFormValues } from "./schema";
import { DuplicateWarningDialog } from "@/components/properties/DuplicateWarningDialog";
import type { PropertyRow } from "@/features/properties/types";
import type { FieldErrors } from "react-hook-form";
import { CancelButton } from "./btn-cancel";
import { POPULAR_AREAS } from "@/features/properties/labels";
import {
  createPropertyAction,
  updatePropertyAction,
  getPopularAreasAction,
  addPopularAreaAction,
  type CreatePropertyResult,
} from "./actions";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

// Step components (Memoized for performance)
import { Step1BasicInfo } from "./property-form/steps/Step1BasicInfo";
import { Step2Details } from "./property-form/steps/Step2Details";
import { Step3Location } from "./property-form/steps/Step3Location";
import { Step4Media } from "./property-form/steps/Step4Media";
import { Step5Features } from "./property-form/steps/Step5Features";

// Hooks
import { usePropertyFormDraft } from "./hooks/usePropertyFormDraft";

const EMPTY_VALUES: PropertyFormValues = {
  title: "",
  description: "",
  property_type: undefined as any,
  listing_type: undefined as any,
  status: "DRAFT",
  price: undefined,
  original_price: undefined,
  rental_price: undefined,
  original_rental_price: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  size_sqm: undefined,
  land_size_sqwah: undefined,
  floor: undefined,
  min_contract_months: 12, // Default to 1 year
  verified: false,

  maintenance_fee: undefined,
  parking_slots: undefined,
  zoning: undefined,
  currency: "THB",
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
  is_co_agent: false,
  co_agent_name: "",
  co_agent_phone: "",
  co_agent_contact_channel: "Line",
  co_agent_contact_id: "",
  co_agent_sale_commission_percent: undefined,
  co_agent_rent_commission_months: undefined,
  is_pet_friendly: false,
  feature_ids: [],
  nearby_places: [],
};

type Props = {
  mode: "create" | "edit";
  defaultValues?: PropertyRow | null;
  initialImages?: {
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }[];
};

// Helper: Convert DB row to form values
function mapRowToFormValues(
  row: PropertyRow,
  images?: string[],
): PropertyFormValues {
  const structuredData = row.structured_data as unknown as {
    is_co_agent?: boolean;
    co_agent_name?: string;
    co_agent_phone?: string;
    co_agent_contact_channel?: "LINE" | "FB" | "TEL";
    co_agent_contact_id?: string;
    co_agent_sale_commission_percent?: number;
    co_agent_rent_commission_months?: number;
  } | null;

  return {
    title: row.title ?? "",
    description: row.description ?? undefined,
    property_type: row.property_type ?? "HOUSE",
    listing_type: row.listing_type ?? "SALE",
    status: row.status ?? "DRAFT",
    price: row.price ?? undefined,
    original_price: row.original_price ?? undefined,
    rental_price: row.rental_price ?? undefined,
    original_rental_price: row.original_rental_price ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    size_sqm: row.size_sqm ?? undefined,
    land_size_sqwah: row.land_size_sqwah ?? undefined,
    floor: row.floor ?? undefined,
    min_contract_months: row.min_contract_months ?? undefined,
    maintenance_fee: row.maintenance_fee ?? undefined,
    parking_slots: row.parking_slots ?? undefined,
    zoning: row.zoning ?? undefined,
    currency: row.currency ?? "THB",
    address_line1: row.address_line1 ?? "",
    province: row.province ?? "",
    district: row.district ?? "",
    subdistrict: row.subdistrict ?? "",
    postal_code: row.postal_code ?? "",
    google_maps_link: row.google_maps_link ?? undefined,
    popular_area: row.popular_area ?? undefined,
    owner_id: row.owner_id ?? undefined,
    property_source: row.property_source ?? undefined,
    assigned_to: row.assigned_to ?? undefined,
    agent_ids: [],
    images: images ?? [],
    commission_sale_percentage: row.commission_sale_percentage ?? 3,
    commission_rent_months: row.commission_rent_months ?? 1,
    near_transit: row.near_transit ?? false,
    transit_station_name: row.transit_station_name ?? "",
    transit_type: (row.transit_type as any) ?? "BTS",
    transit_distance_meters: row.transit_distance_meters ?? undefined,
    is_co_agent: structuredData?.is_co_agent || false,
    co_agent_name: structuredData?.co_agent_name || "",
    co_agent_phone: structuredData?.co_agent_phone || "",
    co_agent_contact_channel:
      structuredData?.co_agent_contact_channel || "LINE",
    co_agent_contact_id: structuredData?.co_agent_contact_id || "",
    co_agent_sale_commission_percent:
      structuredData?.co_agent_sale_commission_percent || undefined,
    co_agent_rent_commission_months:
      structuredData?.co_agent_rent_commission_months || undefined,

    // Tags
    // Tags
    verified: row.verified ?? false,
    is_pet_friendly: (row.meta_keywords || []).includes("Pet Friendly"),
    feature_ids: [],
    nearby_places: (row.nearby_places as any[]) || [],
  };
}

// Validation map - clean and maintainable
const STEP_FIELDS: Record<number, (keyof PropertyFormValues)[]> = {
  1: ["listing_type", "property_type", "title"],
  2: [
    "price",
    "original_price",
    "rental_price",
    "original_rental_price",
    "commission_sale_percentage",
    "commission_rent_months",
  ],
  3: ["province", "district", "subdistrict"],
  4: [],
  5: ["feature_ids"],
};

// Error summary component - only shows errors for current step
function ErrorSummary({
  errors,
  currentStep,
}: {
  errors: FieldErrors<PropertyFormValues>;
  currentStep: number;
}) {
  const items = React.useMemo(() => {
    const labelMap: Record<string, string> = {
      title: "ชื่อทรัพย์",
      property_type: "ประเภททรัพย์",
      listing_type: "รูปแบบประกาศ",
      status: "สถานะ",
      price: "ราคาขาย",
      original_price: "ราคาตั้งขาย (เต็ม)",
      rental_price: "ราคาเช่า",
      original_rental_price: "ค่าเช่าต่อเดือน (เต็ม)",
      commission_sale_percentage: "% คอมมิชชั่นขาย",
      commission_rent_months: "คอมมิชชั่นเช่า (เดือน)",
      province: "จังหวัด",
      district: "อำเภอ/เขต",
      subdistrict: "ตำบล/แขวง",
    };

    // Get fields for current step
    const stepFields = STEP_FIELDS[currentStep] || [];

    return Object.entries(errors)
      .filter(([name]) => stepFields.includes(name as keyof PropertyFormValues))
      .map(([name, err]) => ({
        name,
        label: labelMap[name] ?? name,
        message: (err as any)?.message as string | undefined,
      }))
      .filter((x) => !!x.message);
  }, [errors, currentStep]);

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
              onClick={() => {
                const el = document.querySelector(`[data-field="${it.name}"]`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
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

export function PropertyForm({
  mode,
  defaultValues,
  initialImages = [],
}: Props) {
  const router = useRouter();

  // === STATE & ORCHESTRATION ===
  const [persistImages, setPersistImages] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);

  // Duplicate check state
  const [duplicateMatches, setDuplicateMatches] = React.useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false);
  const [pendingSubmit, setPendingSubmit] =
    React.useState<PropertyFormValues | null>(null);

  // Data arrays shared across steps
  const [owners, setOwners] = React.useState<
    { id: string; full_name: string; phone: string | null }[]
  >([]);
  const [agents, setAgents] = React.useState<
    { id: string; full_name: string | null; phone: string | null }[]
  >([]);
  const [popularAreas, setPopularAreas] = React.useState<string[]>([]);

  // Step 1 specific state
  const [newArea, setNewArea] = React.useState("");
  const [isAddingArea, setIsAddingArea] = React.useState(false);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = React.useState(false);

  const uploadSessionId = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "fallback",
  ).current;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(FormSchema),
    mode: "onChange", // Validate on change so errors clear when user fills in fields
    defaultValues:
      mode === "edit" && defaultValues
        ? mapRowToFormValues(
            defaultValues,
            initialImages?.map((img) => img.storage_path) ?? [],
          )
        : {
            ...EMPTY_VALUES,
            currency: "THB",
          },
  });

  // === DRAFT MANAGEMENT ===
  const { checkAndRestoreDraft, clearDraft } = usePropertyFormDraft(
    form,
    mode,
    defaultValues?.id,
  );

  useEffect(() => {
    // Only verify draft if in CREATE mode or explicit logic needed
    if (mode === "create") {
      const draft = checkAndRestoreDraft();
      if (draft) {
        // Show toast with restore action
        toast("พบข้อมูลที่บันทึกไว้ล่าสุด", {
          description: `บันทึกเมื่อ: ${new Date(draft.timestamp).toLocaleString(
            "th-TH",
          )}`,
          action: {
            label: "กู้คืน",
            onClick: () => {
              form.reset(draft.values);
              toast.success("กู้คืนข้อมูลเรียบร้อย");
            },
          },
          duration: 8000,
        });
      }
    }
  }, [mode, checkAndRestoreDraft, form]);

  // === DATA LOADING ===
  React.useEffect(() => {
    async function loadData() {
      try {
        // Load owners
        const { getOwnersAction } = await import("@/features/owners/actions");
        const ownersData = await getOwnersAction();
        setOwners(ownersData);

        // Load agents
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
        const areasData = await getPopularAreasAction({ onlyActive: false });
        // Merge DB areas with hardcoded defaults to ensure we have a good list
        const combinedAreas = Array.from(
          new Set([...areasData, ...(POPULAR_AREAS as unknown as string[])]),
        ).sort();

        setPopularAreas(combinedAreas);

        // If edit mode, load assigned agents
        if (mode === "edit" && defaultValues?.id) {
          const { data: rels } = await supabase
            .from("property_agents")
            .select("agent_id")
            .eq("property_id", defaultValues.id);

          if (rels && rels.length > 0) {
            const ids = rels.map((r) => r.agent_id);
            form.setValue("agent_ids", ids);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }

    loadData();
  }, []);

  // Fetch Features on Edit Mode (separate effect or integrated)
  React.useEffect(() => {
    async function loadFeatures() {
      if (mode === "edit" && defaultValues?.id) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: featuresData } = await supabase
            .from("property_features")
            .select("feature_id")
            .eq("property_id", defaultValues.id);

          if (featuresData && featuresData.length > 0) {
            const ids = featuresData.map((f) => f.feature_id);
            form.setValue("feature_ids", ids);
          }
        } catch (err) {
          console.error("Error loading features:", err);
        }
      }
    }
    loadFeatures();
  }, [mode, defaultValues]);

  // Initialize Quick Info for edit mode
  React.useEffect(() => {
    if (defaultValues?.title || defaultValues?.popular_area) {
      setIsQuickInfoOpen(true);
    }
  }, [defaultValues]);

  // Clear irrelevant fields when listing type changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "listing_type") {
        if (value.listing_type === "RENT") {
          form.setValue("price", undefined);
        } else if (value.listing_type === "SALE") {
          form.setValue("rental_price", undefined);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // === HANDLERS ===
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

  // === VALIDATION ===
  const FIELD_LABELS: Record<string, string> = {
    listing_type: "รูปแบบประกาศ",
    property_type: "ประเภททรัพย์",
    title: "ชื่อทรัพย์",
    price: "ราคาขาย",
    original_price: "ราคาตั้งขาย (เต็ม)",
    rental_price: "ค่าเช่า",
    original_rental_price: "ค่าเช่าต่อเดือน (เต็ม)",
    commission_sale_percentage: "% คอมมิชชั่นขาย",
    commission_rent_months: "คอมมิชชั่นเช่า (เดือน)",
    province: "จังหวัด",
    district: "อำเภอ/เขต",
    subdistrict: "ตำบล/แขวง",
  };

  const validateStep = async (step: number) => {
    const fieldsToValidate = STEP_FIELDS[step] || [];
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) {
        // Collect specific error field names
        const errorFields = fieldsToValidate
          .filter((field) => form.formState.errors[field])
          .map((field) => FIELD_LABELS[field] || field);

        const errorList =
          errorFields.length > 0 ? errorFields.join(", ") : "บางช่อง";

        toast.error(
          <div className="space-y-1">
            <p className="font-bold">กรุณากรอกข้อมูลให้ครบถ้วน</p>
            <p className="text-sm opacity-90">❌ {errorList}</p>
          </div>,
          { duration: 5000 },
        );

        // Auto-scroll to first error field
        const firstErrorKey = fieldsToValidate.find(
          (field) => form.formState.errors[field],
        );
        if (firstErrorKey) {
          const el = document.querySelector(`[data-field="${firstErrorKey}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            // Fallback: scroll to top of form
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }

        return false;
      }
    }
    return true;
  };

  // === NAVIGATION ===
  const handleNext = async () => {
    const isStepValid = await validateStep(currentStep);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // === DUPLICATE CHECK ===
  const checkDuplicates = async (values: PropertyFormValues) => {
    if (mode !== "create") return true;

    const { checkDuplicateProperties } = await import("./check-duplicate");
    const matches = await checkDuplicateProperties({
      address_line1: values.address_line1,
      district: values.district,
      province: values.province,
      postal_code: values.postal_code,
      price: values.price ?? undefined,
      bedrooms: values.bedrooms ?? undefined,
      bathrooms: values.bathrooms ?? undefined,
      size_sqm: values.size_sqm ?? undefined,
    });

    if (matches.length > 0) {
      setDuplicateMatches(matches);
      setPendingSubmit(values);
      setShowDuplicateDialog(true);
      return false;
    }

    return true;
  };

  // === SUBMIT ===
  const onSubmit = async (values: PropertyFormValues) => {
    try {
      const canProceed = await checkDuplicates(values);
      if (!canProceed) return;

      let result: CreatePropertyResult | { success: boolean; message?: string };

      const { images, feature_ids, ...restValues } = values;

      // Remove feature_ids from restValues for updatePropertyAction compatibility if strict
      // But type-safe way is to construct object. Assuming action ignores extra fields or we clean it.
      // Actually, updatePropertyAction likely accepts PropertyFormValues. If it strips unknown, good.
      // But to be safe, let's just pass `values` because updatePropertyAction usually just picks keys from schema or types.
      // OR better: Let the action handle it? No, action might not know about feature_ids yet if not updated.
      // The safest is to rely on backend ignoring extra fields, OR just submit as is.
      // However, if we want to save features separately after, we need the property ID.

      if (mode === "create") {
        result = await createPropertyAction({ ...values }, uploadSessionId);
      } else {
        result = await updatePropertyAction(
          defaultValues!.id,
          { ...values },
          uploadSessionId,
        );
      }

      if (result.success) {
        // === SAVE FEATURES ===
        const propertyId =
          mode === "create" ? (result as any).data?.id : defaultValues!.id; // createPropertyAction should return data.id
        // Note: result from createPropertyAction is CreatePropertyResult. If success, we should have the ID?
        // In existing code action returns { success: true, message: "...", data: { id: ... } } usually.
        // Let's assume result follows conventions.

        if (propertyId && values.feature_ids) {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();

          // 1. Delete old
          if (mode === "edit") {
            await supabase
              .from("property_features")
              .delete()
              .eq("property_id", propertyId);
          }

          // 2. Insert new
          if (values.feature_ids.length > 0) {
            const insertData = values.feature_ids.map((fid) => ({
              property_id: propertyId,
              feature_id: fid,
            }));
            await supabase.from("property_features").insert(insertData);
          }
        }

        toast.success(
          mode === "create" ? "เพิ่มทรัพย์ใหม่สำเร็จ" : "บันทึกข้อมูลสำเร็จ",
        );
        clearDraft(); // Clear draft on success
        setPersistImages(true);
        form.reset(EMPTY_VALUES);
        router.push("/protected/properties");
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: any) {
      console.error("Error submitting property form:", e);
      toast.error(e.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    }
  };

  const handleConfirmDuplicateSubmit = async () => {
    setShowDuplicateDialog(false);
    if (!pendingSubmit) return;

    try {
      const result: CreatePropertyResult = await createPropertyAction(
        pendingSubmit,
        uploadSessionId,
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

  const onInvalid = (errors: FieldErrors<PropertyFormValues>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    toast.error("กรุณาตรวจสอบข้อมูลให้ครบถ้วน");
  };

  const submitNow = form.handleSubmit(onSubmit, onInvalid);

  // Anti auto-submit handler (ONE place only!)
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();

    // Allow Enter in textarea
    if (tag === "textarea") return;

    // Allow Enter in contentEditable
    if ((target as any)?.isContentEditable) return;

    // Prevent auto-submit
    e.preventDefault();
  };

  // === PROGRESS CALCULATION ===
  const calculateProgress = React.useCallback(() => {
    const values = form.getValues();
    const totalSteps = 5;
    let completedSteps = 0;

    // Check specific fields for each step to determine "completeness" logic
    // This is a simplified check. Real validation might use form.formState.errors or trigger() result if we want strictness.
    // Ideally, we consider a step complete if we are past it OR if all its required fields are filled.

    // Step 1: Basic
    if (values.title && values.property_type && values.listing_type)
      completedSteps++;

    // Step 2: Details (Complex logic due to conditional required fields)
    let step2Complete = false;
    if (values.listing_type === "SALE") {
      if (values.original_price) step2Complete = true;
    } else if (values.listing_type === "RENT") {
      if (values.original_rental_price) step2Complete = true;
    } else {
      if (values.original_price && values.original_rental_price)
        step2Complete = true;
    }
    if (step2Complete) completedSteps++;

    // Step 3: Location
    if (values.province && values.district && values.subdistrict)
      completedSteps++;

    // Step 4: Images (Assume valid if at least 1 image or skipped if optional?? usually required)
    // Let's assume > 0 images required for completeness visual
    if (values.images && values.images.length > 0) completedSteps++;

    // Step 5: Features (Optional usually, so always "complete" or check feature_ids.length > 0?)
    // Let's count it as complete if we are on step 5 or done?
    // Actually, step 5 is always "completable".
    completedSteps++;

    return (completedSteps / totalSteps) * 100;
  }, [form]);

  // Update progress periodically or on step change
  // For basic UI, we just rely on currentStep for bar width as per existing code, BUT user asked for % progress?
  // User asked for "Progress Percentage". Let's assume a global progress bar or text.

  // Let's improve the Stepper logic to show checkmarks based on VALIDATION of that step, not just currentStep > step.
  const isStepComplete = (step: number) => {
    // Logic similar to calculateProgress but returning boolean per step
    const values = form.getValues();
    if (step === 1)
      return !!(values.title && values.property_type && values.listing_type);
    if (step === 2) {
      if (values.listing_type === "SALE") return !!values.original_price;
      if (values.listing_type === "RENT") return !!values.original_rental_price;
      return !!(values.original_price && values.original_rental_price);
    }
    if (step === 3)
      return !!(values.province && values.district && values.subdistrict);
    if (step === 4) return (values.images?.length || 0) > 0;
    return false; // Step 5
  };

  return (
    <div className="relative p-6">
      {/* 1. Sticky Header - ตัวจัดการบันทึก */}
      <div className="sticky top-16 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-4 mb-6 px-6 transition-all duration-200 rounded-xl max-w-screen">
        <div className="flex justify-between items-center mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {mode === "edit" ? "แก้ไขข้อมูลทรัพย์สิน" : "สร้างประกาศใหม่"}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {mode === "edit"
                ? `${defaultValues?.title || "-"}`
                : "กรอกข้อมูลให้ครบถ้วนเพื่อสร้างประกาศ"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CancelButton sessionId={uploadSessionId} />

            {/* ปุ่มบันทึกด่วน แสดงตลอดเวลาในโหมด Edit */}
            {mode === "edit" && (
              <Button
                onClick={submitNow}
                disabled={!form.formState.isDirty}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-10 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none "
              >
                บันทึกการแก้ไข
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Stepper */}
      <div className="bg-white py-8 rounded-3xl shadow-sm border border-slate-100 mb-8 px-4">
        <div className="relative w-full max-w-5xl mx-auto">
          {/* Background Line: Starts at 10% (center of 1st col) and ends at 90% (center of 5th col) -> Width 80% */}
          <div className="absolute top-5 left-[10%] w-[80%] h-0.5 bg-slate-100 -z-0" />

          {/* Active Line: Each step adds 20% width (100% / 5 cols = 20% per col distance) */}
          <div
            className="absolute top-5 left-[10%] h-0.5 bg-blue-600 transition-all duration-700 ease-in-out -z-0"
            style={{ width: `${(currentStep - 1) * 20}%` }}
          />

          <div
            className="grid grid-cols-5 relative"
            role="tablist"
            aria-label="Progress"
          >
            {[
              { step: 1, label: "ข้อมูลประกาศ" },
              { step: 2, label: "รายละเอียด" },
              { step: 3, label: "ทำเลที่ตั้ง" },
              { step: 4, label: "รูปภาพ" },
              { step: 5, label: "สิ่งอำนวยความสะดวก" },
            ].map((item) => {
              const completed = isStepComplete(item.step);
              const isCurrent = currentStep === item.step;
              const isPassed = item.step < currentStep;

              const showCheck =
                isPassed || (mode === "edit" && completed && !isCurrent);
              const showGreen = showCheck;

              return (
                <div
                  key={item.step}
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`ขั้นตอนที่ ${item.step} ${item.label}`}
                  tabIndex={mode === "edit" || item.step < currentStep ? 0 : -1}
                  className={`flex flex-col items-center gap-3 group transition-all duration-300 ${
                    mode === "edit" || item.step < currentStep
                      ? "cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                  onKeyDown={(e) => {
                    // Allow keyboard navigation for accessible steps
                    if (
                      (mode === "edit" || item.step < currentStep) &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      setCurrentStep(item.step);
                    }
                  }}
                  onClick={async () => {
                    if (mode === "edit") {
                      setCurrentStep(item.step);
                      return;
                    }
                    if (item.step < currentStep) setCurrentStep(item.step);
                    else if (item.step === currentStep + 1) handleNext();
                  }}
                >
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-110 ring-4 ring-blue-50"
                        : showGreen
                          ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-100"
                          : "bg-white text-slate-400 border-2 border-slate-100 group-hover:border-blue-200"
                    }`}
                  >
                    {showCheck ? (
                      "✓"
                    ) : (
                      <span className="text-sm">{item.step}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] md:text-xs font-bold uppercase tracking-wider text-center transition-colors duration-300 px-1 ${
                      isCurrent
                        ? "text-blue-600"
                        : showGreen
                          ? "text-emerald-600"
                          : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onKeyDown={handleFormKeyDown}
          className="space-y-10"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <ErrorSummary
            errors={form.formState.errors}
            currentStep={currentStep}
          />

          {/* Step rendering */}
          {currentStep === 1 && (
            <Step1BasicInfo
              form={form}
              mode={mode}
              popularAreas={popularAreas}
              isAddingArea={isAddingArea}
              newArea={newArea}
              setNewArea={setNewArea}
              onAddArea={handleAddArea}
              isQuickInfoOpen={isQuickInfoOpen}
              setIsQuickInfoOpen={setIsQuickInfoOpen}
            />
          )}

          {currentStep === 2 && <Step2Details form={form} mode={mode} />}

          {currentStep === 3 && <Step3Location form={form} mode={mode} />}

          {currentStep === 4 && (
            <Step4Media
              form={form}
              mode={mode}
              owners={owners}
              agents={agents}
              initialImages={initialImages}
              uploadSessionId={uploadSessionId}
              persistImages={persistImages}
            />
          )}

          {currentStep === 5 && <Step5Features />}

          {/* Navigation Buttons: Fixed Layout */}
          <div className="mt-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
              {/* Left: Tertiary Action (Cancel) */}
              <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                <CancelButton sessionId={uploadSessionId} />
              </div>

              {/* Right: Primary & Secondary Actions (Back & Next) */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    aria-label="ย้อนกลับไปขั้นตอนก่อนหน้า"
                    className="h-14 px-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium transition-all active:scale-95"
                  >
                    ย้อนกลับ
                  </Button>
                )}

                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    aria-label="ไปขั้นตอนถัดไป"
                    className="h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 font-bold text-lg transition-all active:scale-95 hover:translate-x-1"
                  >
                    ถัดไป
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={submitNow}
                    aria-label={
                      mode === "create" ? "ยืนยันสร้างประกาศ" : "บันทึกการแก้ไข"
                    }
                    disabled={!form.formState.isDirty}
                    className="h-14 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {mode === "create" ? "ยืนยันสร้างประกาศ" : "บันทึกการแก้ไข"}
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
