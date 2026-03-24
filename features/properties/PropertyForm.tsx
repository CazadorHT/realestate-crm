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
import { ExternalLink, List, Facebook, Instagram, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  postPropertyToMetaAction,
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
import { TikTokPostButton } from "./components/TikTokPostButton";
import { FaTiktok } from "react-icons/fa";

// Step components (Memoized for performance)
import { Step1BasicInfo } from "./property-form/steps/Step1BasicInfo";
import { Step2Details } from "./property-form/steps/Step2Details";
import { Step3Location } from "./property-form/steps/Step3Location";
import { Step4Media } from "./property-form/steps/Step4Media";
import { Step5Features } from "./property-form/steps/Step5Features";
import { Step6Review } from "./property-form/steps/Step6Review";
import { Step7Syndication } from "./property-form/steps/Step7Syndication";

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
  isMultiTenant?: boolean;
  userRole?: string;
};

export function PropertyForm({
  mode,
  defaultValues,
  initialImages = [],
  isMultiTenant = false,
  userRole,
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
  const [newAreaEn, setNewAreaEn] = React.useState("");
  const [newAreaCn, setNewAreaCn] = React.useState("");
  const [isAddingArea, setIsAddingArea] = React.useState(false);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = React.useState(false);
  const [isActuallySubmitting, setIsActuallySubmitting] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState<{
    [key: string]: { loading: boolean; success: boolean; url?: string | null };
  }>({});

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
  const {
    owners,
    agents,
    popularAreas,
    refreshPopularAreas,
    refreshOwners,
    allBranches,
    setAllBranches,
  } = usePropertyFormData(mode, defaultValues?.id, form);

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
      const province = form.getValues("province");
      const res = await addPopularAreaAction({
        name: newArea,
        name_en: newAreaEn,
        name_cn: newAreaCn,
        province: province,
      });
      if (res.success) {
        toast.success("เพิ่มย่านสำเร็จ");
        await refreshPopularAreas();
        setNewArea("");
        setNewAreaEn("");
        setNewAreaCn("");
        // Optional: close after add if needed
        // setIsQuickInfoOpen(false);
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
      setCurrentStep((prev) => Math.min(prev + 1, 7));
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
    setIsActuallySubmitting(true);
    try {
      const canProceed = await checkDuplicates(values);
      if (!canProceed) {
        setIsActuallySubmitting(false);
        return;
      }

      let result: CreatePropertyResult;

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
        const propertyId =
          mode === "create" ? result.propertyId! : defaultValues!.id;

        toast.success(
          mode === "create" ? "เพิ่มทรัพย์ใหม่สำเร็จ" : "บันทึกข้อมูลสำเร็จ",
        );
        clearDraft();
        setPersistImages(true);

        // Only reset to empty for create mode. 
        // For edit mode, reset to current values to mark form as "clean" (not dirty)
        if (mode === "create") {
          form.reset(EMPTY_VALUES);
        } else {
          form.reset(values);
        }

        setSuccessData({
          id: propertyId,
          slug: result.slug,
        });
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: any) {
      console.error("Error submitting property form:", e);
      toast.error(e.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setIsActuallySubmitting(false);
    }
  };

  const handleConfirmDuplicateSubmit = async () => {
    setShowDuplicateDialog(false);
    if (!pendingSubmit) return;

    setIsActuallySubmitting(true);
    try {
      const result: CreatePropertyResult = await createPropertyAction(
        pendingSubmit,
        uploadSessionId,
      );

      if (result.success) {
        toast.success("เพิ่มทรัพย์ใหม่สำเร็จ (ยืนยันข้อมูลซ้ำ)");
        setPersistImages(true);
        
        // Match the same logic as onSubmit to prevent clearing in edit mode (though duplicate is mostly create-only)
        if (mode === "create") {
          form.reset(EMPTY_VALUES);
        } else if (pendingSubmit) {
          form.reset(pendingSubmit);
        }

        setSuccessData({
          id: result.propertyId!,
          slug: result.slug,
        });
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActuallySubmitting(false);
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
    <div className="relative pb-24 sm:pb-0  lg:px-8 max-w-screen-2xl mx-auto">
      {/* 1. Header */}
      <PropertyFormHeader
        mode={mode}
        title={defaultValues?.title}
        uploadSessionId={uploadSessionId}
        isDirty={form.formState.isDirty}
        isSubmitting={isActuallySubmitting}
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
              newAreaEn={newAreaEn}
              setNewAreaEn={setNewAreaEn}
              newAreaCn={newAreaCn}
              setNewAreaCn={setNewAreaCn}
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
              allBranches={allBranches}
              setAllBranches={setAllBranches}
              isMultiTenant={isMultiTenant}
              userRole={userRole}
            />
          )}

          {currentStep === 5 && <Step5Features />}

          {currentStep === 6 && <Step6Review form={form} mode={mode} />}

          {currentStep === 7 && <Step7Syndication form={form} mode={mode} />}

          {/* Navigation Buttons: Fixed Layout */}
          <PropertyFormNavigation
            currentStep={currentStep}
            totalSteps={7}
            mode={mode}
            uploadSessionId={uploadSessionId}
            isDirty={form.formState.isDirty}
            isSubmitting={isActuallySubmitting}
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
              setSuccessData(null);
              // Always go back to list when closing success dialog manually
              // Adding #table to focus on the table section
              router.push("/protected/properties?success=true#table");
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
                className="w-full justify-start gap-3 h-14 text-base font-medium border-slate-200  rounded-xl group:hover:bg-blue-600 group:hover:border-blue-600 cursor-pointer"
                onClick={() => {
                  if (successData?.slug) {
                    window.open(`/properties/${successData.slug}`, "_blank");
                    router.push("/protected/properties?success=true#table"); // Go back to list in current tab logic
                  } else {
                    toast.error("ไม่พบข้อมูล Slug สำหรับเปิดหน้าเว็บ");
                  }
                }}
              >
                <ExternalLink className="w-5 h-5 " />
                <div className="flex flex-col items-start">
                  <span className="">ดูหน้าเว็บไซต์ (Public Page)</span>
                  <span className="text-xs font-normal">
                    เปิดแท็บใหม่เพื่อดูตัวอย่าง
                  </span>
                </div>
              </Button>

              <Button
                className="w-full justify-start gap-3 h-14 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                onClick={() => router.push("/protected/properties?success=true#table")}
              >
                <List className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span>กลับหน้ารายการ (CRM)</span>
                  <span className="text-xs text-slate-400/80 font-normal">
                    จัดการทรัพย์อื่นต่อ
                  </span>
                </div>
              </Button>

              <div className="pt-2 border-t border-slate-100 mt-2 grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full flex-col justify-center items-center gap-2 h-24 text-sm font-medium rounded-xl transition-all hover:text-blue-100 hover:bg-blue-500! relative",
                    shareStatus["FACEBOOK"]?.success 
                      ? "text-emerald-600 border-emerald-100 bg-emerald-50/50" 
                      : "text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50"
                  )}
                  disabled={shareStatus["FACEBOOK"]?.loading}
                  onClick={async () => {
                    if (!successData?.id) return;
                    setShareStatus(prev => ({ ...prev, FACEBOOK: { loading: true, success: false } }));
                    const res = await postPropertyToMetaAction(successData.id);
                    if (res.success) {
                      setShareStatus(prev => ({ 
                        ...prev, 
                        FACEBOOK: { loading: false, success: true, url: res.data?.id ? `https://facebook.com/${res.data.id}` : null } 
                      }));
                      toast.success("โพสต์ลง Facebook สำเร็จ!");
                    } else {
                      setShareStatus(prev => ({ ...prev, FACEBOOK: { loading: false, success: false } }));
                      toast.error(res.message);
                    }
                  }}
                >
                  {shareStatus["FACEBOOK"]?.loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : shareStatus["FACEBOOK"]?.success ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Facebook className="w-6 h-6" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <span className="leading-tight">{shareStatus["FACEBOOK"]?.success ? "สำเร็จแล้ว" : "Facebook"}</span>
                    <span className="text-[10px] font-light opacity-80">
                      {shareStatus["FACEBOOK"]?.success ? "ดูโพสต์" : "แชร์ทันที"}
                    </span>
                  </div>
                  {shareStatus["FACEBOOK"]?.success && shareStatus["FACEBOOK"]?.url && (
                    <div 
                      className="absolute top-1 right-1 p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(shareStatus["FACEBOOK"]!.url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className={cn(
                    "w-full flex-col justify-center items-center gap-2 h-24 text-sm font-medium rounded-xl transition-all hover:text-pink-100 hover:bg-pink-700!",
                    shareStatus["INSTAGRAM"]?.success 
                      ? "text-emerald-600 border-emerald-100 bg-emerald-50/50" 
                      : "text-pink-600 border-pink-100 bg-pink-50/50 hover:bg-pink-50"
                  )}
                  disabled={shareStatus["INSTAGRAM"]?.loading}
                  onClick={async () => {
                    if (!successData?.id) return;
                    setShareStatus(prev => ({ ...prev, INSTAGRAM: { loading: true, success: false } }));
                    const res = await postPropertyToMetaAction(successData.id, "INSTAGRAM");
                    if (res.success) {
                      setShareStatus(prev => ({ 
                        ...prev, 
                        INSTAGRAM: { loading: false, success: true, url: null } 
                      }));
                      toast.success("โพสต์ลง Instagram สำเร็จ!");
                    } else {
                      setShareStatus(prev => ({ ...prev, INSTAGRAM: { loading: false, success: false } }));
                      toast.error(res.message);
                    }
                  }}
                >
                  {shareStatus["INSTAGRAM"]?.loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : shareStatus["INSTAGRAM"]?.success ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Instagram className="w-6 h-6" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <span className="leading-tight">{shareStatus["INSTAGRAM"]?.success ? "สำเร็จแล้ว" : "Instagram"}</span>
                    <span className="text-[10px] font-light opacity-80">
                      {shareStatus["INSTAGRAM"]?.success ? "แชร์แล้ว" : "แชร์ทันที"}
                    </span>
                  </div>
                </Button>

                <TikTokPostButton 
                  propertyId={successData?.id || ""}
                  onLoading={(loading) => setShareStatus(prev => ({ ...prev, TIKTOK: { ...prev["TIKTOK"], loading } }))}
                  onSuccess={(url) => setShareStatus(prev => ({ ...prev, TIKTOK: { loading: false, success: true, url } }))}
                >
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full flex-col justify-center items-center gap-2 h-24 text-sm font-medium rounded-xl transition-all hover:text-slate-100 hover:border-slate-300 hover:bg-slate-900! relative",
                      shareStatus["TIKTOK"]?.success 
                        ? "text-emerald-600 border-emerald-100 bg-emerald-50/50" 
                        : "text-slate-900 border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                    )}
                    disabled={shareStatus["TIKTOK"]?.loading}
                  >
                    {shareStatus["TIKTOK"]?.loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : shareStatus["TIKTOK"]?.success ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <FaTiktok className="w-6 h-6" />
                    )}
                    <div className="flex flex-col items-center text-center">
                      <span className="leading-tight">{shareStatus["TIKTOK"]?.success ? "สำเร็จแล้ว" : "TikTok"}</span>
                      <span className="text-[10px] font-light opacity-80">
                        {shareStatus["TIKTOK"]?.success ? "ดูวิดีโอ" : "แชร์วิดีโอ"}
                      </span>
                    </div>
                    {shareStatus["TIKTOK"]?.success && shareStatus["TIKTOK"]?.url && (
                      <div 
                        className="absolute top-1 right-1 p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(shareStatus["TIKTOK"]!.url!, "_blank");
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </Button>
                </TikTokPostButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Form>
    </div>
  );
}
