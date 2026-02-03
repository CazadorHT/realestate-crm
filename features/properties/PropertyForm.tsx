"use client";
import * as React from "react";
import { useRef, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, List } from "lucide-react";
import { FormSchema, type PropertyFormValues } from "./schema";
import { DuplicateWarningDialog } from "@/components/properties/DuplicateWarningDialog";
import type { PropertyRow } from "@/features/properties/types";
import type { FieldErrors } from "react-hook-form";
import {
  createPropertyAction,
  updatePropertyAction,
  addPopularAreaAction,
  type CreatePropertyResult,
  getPopularAreasAction,
} from "./actions";
import { Form } from "@/components/ui/form";
import {
  EMPTY_VALUES,
  FIELD_LABELS,
  mapRowToFormValues,
  STEP_FIELDS,
} from "./property-form/utils/form-utils";

// Components
import { PropertyFormHeader } from "./property-form/components/PropertyFormHeader";
import { PropertyFormStepper } from "./property-form/components/PropertyFormStepper";
import { PropertyFormNavigation } from "./property-form/components/PropertyFormNavigation";
import { ErrorSummary } from "./property-form/components/ErrorSummary";

// Step components (Memoized for performance)
import { Step1BasicInfo } from "./property-form/steps/Step1BasicInfo";
import { Step2Details } from "./property-form/steps/Step2Details";
import { Step3Location } from "./property-form/steps/Step3Location";
import { Step4Media } from "./property-form/steps/Step4Media";
import { Step5Features } from "./property-form/steps/Step5Features";
import { Step6Review } from "./property-form/steps/Step6Review";

// Hooks
import { usePropertyFormDraft } from "./hooks/usePropertyFormDraft";
import { usePropertyFormData } from "./hooks/usePropertyFormData";

type Props = {
  mode: "create" | "edit";
  defaultValues?: PropertyRow | null;
  initialImages?: {
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }[];
};

export function PropertyForm({
  mode,
  defaultValues,
  initialImages = [],
}: Props) {
  const router = useRouter();

  // === STATE & ORCHESTRATION ===
  const [persistImages, setPersistImages] = React.useState(false);

  // Success Dialog State
  const [successData, setSuccessData] = React.useState<{
    id: string;
    slug?: string;
  } | null>(null);

  // Redirect if not staff
  const [currentStep, setCurrentStep] = React.useState(1);

  // Duplicate check state
  const [duplicateMatches, setDuplicateMatches] = React.useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false);
  const [pendingSubmit, setPendingSubmit] =
    React.useState<PropertyFormValues | null>(null);

  // Step 1 specific state
  const [newArea, setNewArea] = React.useState("");
  const [isAddingArea, setIsAddingArea] = React.useState(false);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = React.useState(false);

  const uploadSessionId = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "fallback",
  ).current;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(FormSchema) as unknown as Resolver<any>,
    mode: "onChange",
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

  // === DATA LOADING ===
  const { owners, agents, popularAreas, refreshPopularAreas, refreshOwners } =
    usePropertyFormData(mode, defaultValues?.id, form);

  // === DRAFT MANAGEMENT ===
  const { checkAndRestoreDraft, clearDraft } = usePropertyFormDraft(
    form,
    mode,
    defaultValues?.id,
  );

  useEffect(() => {
    if (mode === "create") {
      const draft = checkAndRestoreDraft();
      if (draft) {
        toast(
          `พบข้อมูลที่บันทึกไว้ล่าสุด โครงการ : "${draft.values.title || "ไม่มีชื่อ"}"`,
          {
            description: `บันทึกเมื่อ: ${new Date(
              draft.timestamp,
            ).toLocaleString("th-TH")}`,
            action: {
              label: "กู้คืน",
              onClick: () => {
                form.reset(draft.values);
                toast.success("กู้คืนข้อมูลเรียบร้อย");
              },
            },
            duration: 8000,
          },
        );
      }
    }
  }, [mode, checkAndRestoreDraft, form]);

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
        await refreshPopularAreas();
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
      setCurrentStep((prev) => Math.min(prev + 1, 6));
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
          mode === "create" ? (result as any).data?.id : defaultValues!.id;

        if (propertyId && values.feature_ids) {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();

          if (mode === "edit") {
            await supabase
              .from("property_features")
              .delete()
              .eq("property_id", propertyId);
          }

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
        clearDraft();
        setPersistImages(true);
        form.reset(EMPTY_VALUES);
        // router.push("/protected/properties");
        setSuccessData({
          id: propertyId,
          slug: (result as any).slug,
        });
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
        // router.push("/protected/properties");
        setSuccessData({
          id: result.propertyId!,
          slug: (result as any).slug,
        });
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
    // 1. Find the first error field
    const errorKeys = Object.keys(errors) as (keyof PropertyFormValues)[];
    const firstErrorKey = errorKeys[0];

    if (!firstErrorKey) return;

    // 2. Find which step matches this error
    let errorStep = 1;
    for (const [step, fields] of Object.entries(STEP_FIELDS)) {
      if (fields.includes(firstErrorKey)) {
        errorStep = Number(step);
        break;
      }
    }

    // 3. Fallback: Check if it's a field not in STEP_FIELDS (e.g., hidden logic)
    // Common issues: 'address_line1' etc. might not be in STEP_FIELDS
    if (!Object.values(STEP_FIELDS).flat().includes(firstErrorKey)) {
      if (["address_line1"].includes(firstErrorKey)) errorStep = 3;
      // Add more manual mappings if needed
    }

    // 4. Navigate to that step
    setCurrentStep(errorStep);

    // 5. Scroll to field after small delay (to allow render)
    setTimeout(() => {
      const el = document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);

    // 6. Show detailed toast
    const errorMessages = errorKeys
      .map((key) => FIELD_LABELS[key] || key)
      .join(", ");

    toast.error(
      <div className="space-y-1">
        <p className="font-bold">บันทึกไม่สำเร็จ: ข้อมูลไม่ครบถ้วน</p>
        <p className="text-sm opacity-90">
          กรุณาตรวจสอบ: {errorMessages} (ขั้นตอนที่ {errorStep})
        </p>
      </div>,
      { duration: 10000 },
    );

    console.error("Form Validation Failed:", {
      keys: errorKeys,
      errors: errors,
    });
  };

  const submitNow = form.handleSubmit(onSubmit, onInvalid);

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
    <div className="relative">
      {/* 1. Header */}
      <PropertyFormHeader
        mode={mode}
        title={defaultValues?.title}
        uploadSessionId={uploadSessionId}
        isDirty={form.formState.isDirty}
        onSubmit={submitNow}
      />

      {/* 2. Stepper / ขั้นตอน */}
      <PropertyFormStepper
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        mode={mode}
        handleNext={handleNext}
        form={form}
      />

      {/* Form */}
      <Form {...form}>
        <form
          onKeyDown={handleFormKeyDown}
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
              refreshOwners={refreshOwners}
            />
          )}

          {currentStep === 5 && <Step5Features />}

          {currentStep === 6 && <Step6Review form={form} mode={mode} />}

          {/* Navigation Buttons: Fixed Layout */}
          <PropertyFormNavigation
            currentStep={currentStep}
            totalSteps={6}
            mode={mode}
            uploadSessionId={uploadSessionId}
            isDirty={form.formState.isDirty}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={submitNow}
          />
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

        {/* Success Navigation Dialog */}
        <Dialog
          open={!!successData}
          onOpenChange={(open) => {
            if (!open) {
              // If closed without choice, default to list
              router.push("/protected/properties");
            }
          }}
        >
          <DialogContent className="sm:max-w-md bg-white border-0 shadow-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-emerald-600 text-xl">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <ExternalLink className="w-6 h-6" />
                </div>
                บันทึกข้อมูลสำเร็จ
              </DialogTitle>
              <DialogDescription className="text-base text-slate-600 pt-2">
                คุณต้องการทำรายการใดต่อ?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 text-base font-medium border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
                onClick={() => {
                  if (successData?.slug) {
                    window.open(`/properties/${successData.slug}`, "_blank");
                    router.push("/protected/properties"); // Go back to list in current tab logic
                  } else {
                    toast.error("ไม่พบข้อมูล Slug สำหรับเปิดหน้าเว็บ");
                  }
                }}
              >
                <ExternalLink className="w-5 h-5 text-blue-600" />
                <div className="flex flex-col items-start">
                  <span>ดูหน้าเว็บไซต์ (Public Page)</span>
                  <span className="text-xs text-slate-400 font-normal">
                    เปิดแท็บใหม่เพื่อดูตัวอย่าง
                  </span>
                </div>
              </Button>

              <Button
                className="w-full justify-start gap-3 h-14 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                onClick={() => router.push("/protected/properties")}
              >
                <List className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span>กลับหน้ารายการ (CRM)</span>
                  <span className="text-xs text-slate-400/80 font-normal">
                    จัดการทรัพย์อื่นต่อ
                  </span>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Form>
    </div>
  );
}
