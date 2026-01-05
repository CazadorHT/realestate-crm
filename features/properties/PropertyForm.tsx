// PropertyForm.tsx - Clean refactored version

"use client";
import * as React from "react";
import { useRef } from "react";
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

// Step components
import { Step1BasicInfo } from "./property-form/steps/Step1BasicInfo";
import { Step2Details } from "./property-form/steps/Step2Details";
import { Step3Location } from "./property-form/steps/Step3Location";
import { Step4Media } from "./property-form/steps/Step4Media";

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
  co_agent_contact_channel: "LINE",
  co_agent_contact_id: "",
  co_agent_sale_commission_percent: undefined,
  co_agent_rent_commission_months: undefined,
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
  images?: string[]
): PropertyFormValues {
  return {
    title: row.title ?? "",
    description: row.description ?? undefined,
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

// Validation map - clean and maintainable
const STEP_FIELDS: Record<number, (keyof PropertyFormValues)[]> = {
  1: ["listing_type", "property_type", "title"],
  2: [
    "price",
    "rental_price",
    "commission_sale_percentage",
    "commission_rent_months",
  ],
  3: ["province", "district", "subdistrict"],
  4: [],
};

// Error summary component
function ErrorSummary({ errors }: { errors: FieldErrors<PropertyFormValues> }) {
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
    typeof crypto !== "undefined" ? crypto.randomUUID() : "fallback"
  ).current;

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
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }

    loadData();
  }, []);

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
  const validateStep = async (step: number) => {
    const fieldsToValidate = STEP_FIELDS[step] || [];
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) {
        toast.error("กรุณากรอกข้อมูลที่จำเป็นในขั้นตอนนี้ให้ครบถ้วน");
        return false;
      }
    }
    return true;
  };

  // === NAVIGATION ===
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

  // === DUPLICATE CHECK ===
  const checkDuplicates = async (values: PropertyFormValues) => {
    if (mode !== "create") return true;

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

  return (
    <div className="space-y-10">
      {/* Stepper */}
      <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100 mb-10 sticky top-4 z-40 backdrop-blur-md bg-white/90">
        <div className="flex justify-between items-center relative max-w-2xl mx-auto">
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
          <ErrorSummary errors={form.formState.errors} />

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

          {/* Navigation Buttons */}
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
