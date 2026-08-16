"use client";
import * as React from "react";
import { useRef, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DuplicateMatch } from "@/lib/duplicate-detection";

import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  List,
  Facebook,
  Instagram,
  Loader2,
  CheckCircle2,
  Sparkles,
  Clock,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormSchema, type PropertyFormValues } from "./schema";
import { DuplicateWarningDialog } from "@/components/properties/DuplicateWarningDialog";
import { MissingLocationDialog } from "./components/MissingLocationDialog";
import type {
  PropertyRow,
  PropertyWithImages,
} from "@/features/properties/types";
import type { FieldErrors } from "react-hook-form";
import {
  createPropertyAction,
  updatePropertyAction,
  addPopularAreaAction,
  type CreatePropertyResult,
  getPopularAreasAction,
  postPropertyToMetaAction,
  postPropertyToLineAction,
  updateSocialPostTimestampAction,
} from "./actions";
import { Form } from "@/components/ui/form";
import {
  EMPTY_VALUES,
  FIELD_LABELS,
  mapRowToFormValues,
  STEP_FIELDS,
} from "./property-form/utils/form-utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditTimeline } from "./property-form/components/AuditTimeline";
import { PropertyFormHeader } from "./property-form/components/PropertyFormHeader";
import { PropertyFormStepper } from "./property-form/components/PropertyFormStepper";
import { PropertyFormNavigation } from "./property-form/components/PropertyFormNavigation";
import { ErrorSummary } from "./property-form/components/ErrorSummary";
import { TikTokPostButton } from "./components/TikTokPostButton";
import { SocialPostDialog } from "./components/SocialPostDialog";
import { FaTiktok } from "react-icons/fa";
import { TopLoader } from "@/components/ui/top-loader";
import { AiReviewBanner } from "@/components/shared/AiReviewBanner";
import { PropertyFormTour } from "./_components/PropertyFormTour";

// Step components (Dynamically imported for chunk-splitting)
const step1Import = () =>
  import("./property-form/steps/Step1BasicInfo").then((m) => m.Step1BasicInfo);
import dynamic from "next/dynamic";

// --- Skeleton Fallbacks (height-matched to prevent Layout Shift) ---
const StepSkeleton = ({
  lines = 3,
  cards = 2,
  minHeight,
}: {
  lines?: number;
  cards?: number;
  minHeight?: string;
}) => (
  <div
    className="space-y-6 animate-in fade-in duration-300"
    style={minHeight ? { minHeight } : undefined}
  >
    {Array.from({ length: cards }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="h-5 w-40 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: lines }).map((_, j) => (
            <div key={j} className="space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-11 bg-slate-50 rounded-lg border border-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ReviewSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl h-28 animate-pulse" />
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="h-64 bg-slate-100 animate-pulse" />
      <div className="p-6 space-y-4">
        <div className="h-6 w-60 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-4 w-full bg-slate-50 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-slate-50 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

// --- Dynamic Step Imports (with prefetch references) ---
const step2Import = () =>
  import("./property-form/steps/Step2Details").then((m) => m.Step2Details);
const step3Import = () =>
  import("./property-form/steps/Step3Location").then((m) => m.Step3Location);
const step4Import = () =>
  import("./property-form/steps/Step4Media").then((m) => m.Step4Media);
const step5Import = () =>
  import("./property-form/steps/Step5Features").then((m) => m.Step5Features);
const step6Import = () =>
  import("./property-form/steps/Step6Review").then((m) => m.Step6Review);
const step7Import = () =>
  import("./property-form/steps/Step7Syndication").then(
    (m) => m.Step7Syndication,
  );

const Step1BasicInfo = dynamic(step1Import, {
  loading: () => <StepSkeleton lines={4} cards={3} minHeight="600px" />,
});
const Step2Details = dynamic(step2Import, {
  loading: () => <StepSkeleton lines={4} cards={3} />,
});
const Step3Location = dynamic(step3Import, {
  loading: () => <StepSkeleton lines={4} cards={2} />,
});
const Step4Media = dynamic(step4Import, {
  loading: () => <StepSkeleton lines={2} cards={2} />,
});
const Step5Features = dynamic(step5Import, {
  loading: () => <StepSkeleton lines={6} cards={1} />,
});
const Step6Review = dynamic(step6Import, { loading: () => <ReviewSkeleton /> });
const Step7Syndication = dynamic(step7Import, {
  loading: () => <StepSkeleton lines={2} cards={1} />,
});

// Prefetch map: step N → loader for step N+1
const PREFETCH_MAP: Record<number, (() => Promise<any>) | undefined> = {
  1: step2Import,
  2: step3Import,
  3: step4Import,
  4: step5Import,
  5: step6Import,
  6: step7Import,
};

// Hooks
import { usePropertyFormDraft } from "./hooks/usePropertyFormDraft";
import { usePropertyFormData } from "./hooks/usePropertyFormData";
import { Card } from "@/components/ui/card";
import { FaFacebook, FaLine } from "react-icons/fa6";

type Props = {
  mode: "create" | "edit";
  defaultValues?: PropertyWithImages | null;
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
  const searchParams = useSearchParams();

  // === STATE & ORCHESTRATION ===
  const [persistImages, setPersistImages] = React.useState(false);

  // === KEYBOARD OVERLAY DETECTION ===
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.hasAttribute("contenteditable") ||
          activeEl.classList.contains("ProseMirror"));

      // When software keyboard is visible, visual viewport height is significantly less than window.innerHeight
      // 150px gap is a safe indicator for any mobile/tablet virtual keyboard (typically 300px+)
      const isViewportShrunk = vv.height < window.innerHeight - 150;
      setIsKeyboardOpen(!!(isInputActive && isViewportShrunk));
    };

    const vv = window.visualViewport;
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);

    const handleFocusIn = () => setTimeout(handleResize, 100);
    const handleFocusOut = () => setTimeout(handleResize, 100);

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Success Dialog State
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    id: string;
    title: string;
    slug?: string;
    status?: string;
  } | null>(null);
  const [shareStatus, setShareStatus] = React.useState<
    Record<string, { loading: boolean; success: boolean; url?: string | null }>
  >({});
  const [isNavigatingWeb, setIsNavigatingWeb] = React.useState(false);
  const [isNavigatingBack, setIsNavigatingBack] = React.useState(false);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = React.useState(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = React.useState<
    "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK"
  >("FACEBOOK");

  // Redirect if not staff
  const [currentStep, setCurrentStep] = React.useState(1);

  // Duplicate check state
  const [duplicateMatches, setDuplicateMatches] = React.useState<
    DuplicateMatch[]
  >([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false);
  const [pendingSubmit, setPendingSubmit] =
    React.useState<PropertyFormValues | null>(null);

  // Missing location check state
  const [showMissingAreaDialog, setShowMissingAreaDialog] = React.useState(false);
  const [pendingValuesWithoutArea, setPendingValuesWithoutArea] =
    React.useState<PropertyFormValues | null>(null);

  // Step 1 specific state
  const [newArea, setNewArea] = React.useState("");
  const [newAreaEn, setNewAreaEn] = React.useState("");
  const [newAreaCn, setNewAreaCn] = React.useState("");
  const [newAreaRu, setNewAreaRu] = React.useState("");
  const [isAddingArea, setIsAddingArea] = React.useState(false);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = React.useState(mode === "edit");
  const [isActuallySubmitting, setIsActuallySubmitting] = React.useState(false);

  const [uploadSessionId] = React.useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : "fallback",
  );

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(FormSchema) as Resolver<PropertyFormValues>,
    mode: "onChange",
    defaultValues:
      mode === "edit" && defaultValues
        ? mapRowToFormValues(defaultValues)
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
    branches,
    showAllOwners,
    setShowAllOwners,
  } = usePropertyFormData(mode, defaultValues?.id || undefined, form);

  // === DRAFT MANAGEMENT ===
  const { checkAndRestoreDraft, clearDraft } = usePropertyFormDraft(
    form,
    mode,
    defaultValues?.id || undefined,
  );

  const hasShownDraftToast = useRef(false);

  useEffect(() => {
    if (mode === "create" && !hasShownDraftToast.current) {
      const draft = checkAndRestoreDraft();
      if (draft) {
        hasShownDraftToast.current = true;
        const shouldAutoRestore = searchParams?.get("restore") === "true";

        if (shouldAutoRestore) {
          const currentBranchId = form.getValues("branch_id");
          form.reset({
            ...draft.values,
            branch_id: currentBranchId || draft.values.branch_id,
            currency: draft.values.currency || "THB",
          });
          toast.success("⚡ กู้คืนข้อมูลแบบร่างอัตโนมัติเรียบร้อยแล้ว!");
        } else {
          toast(
            `พบข้อมูลที่บันทึกไว้ล่าสุด โครงการ : "${draft.values.title || "ไม่มีชื่อ"}"`,
            {
              description: `บันทึกเมื่อ: ${new Date(
                draft.timestamp,
              ).toLocaleString("th-TH")}`,
              action: {
                label: "กู้คืน",
                onClick: () => {
                  const currentBranchId = form.getValues("branch_id");
                  form.reset({
                    ...draft.values,
                    branch_id: currentBranchId || draft.values.branch_id,
                    currency: draft.values.currency || "THB",
                  });
                  toast.success("กู้คืนข้อมูลเรียบร้อย");
                },
              },
              cancel: {
                label: "ลบทิ้ง",
                onClick: () => {
                  clearDraft();
                  toast.info("ลบแบบร่างเรียบร้อย");
                },
              },
              duration: 10000,
            },
          );
        }
      }
    }
  }, [mode, checkAndRestoreDraft, form, clearDraft, searchParams]);

  // Initialize Quick Info for edit mode
  React.useEffect(() => {
    if (defaultValues?.title || (defaultValues as any)?.popular_area) {
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

  const handleAddArea = async () => {
    if (!newArea.trim()) return false;
    setIsAddingArea(true);
    try {
      const province = form.getValues("province");
      const addedAreaName = newArea.trim();
      const res = await addPopularAreaAction({
        name: addedAreaName,
        name_en: newAreaEn,
        name_cn: newAreaCn,
        name_ru: newAreaRu,
        province: province,
      });
      if (res.success) {
        toast.success("เพิ่มย่านสำเร็จ");
        await refreshPopularAreas(province);
        form.setValue("popular_area", addedAreaName, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        if (newAreaEn.trim()) {
          form.setValue("popular_area_en", newAreaEn.trim(), { shouldDirty: true });
        }
        if (newAreaCn.trim()) {
          form.setValue("popular_area_cn", newAreaCn.trim(), { shouldDirty: true });
        }
        if (newAreaRu.trim()) {
          form.setValue("popular_area_ru", newAreaRu.trim(), { shouldDirty: true });
        }
        setNewArea("");
        setNewAreaEn("");
        setNewAreaCn("");
        setNewAreaRu("");
        return true;
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
        return false;
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มย่าน");
      return false;
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
    if (form.getValues("is_ai_generating")) {
      toast.error("AI กำลังทำงานอยู่ กรุณารอสักครู่ครับ");
      return;
    }
    const isStepValid = await validateStep(currentStep);
    if (isStepValid) {
      const nextStep = Math.min(currentStep + 1, 7);
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Smart Prefetch: preload step N+2 so it's ready when user clicks Next again
      const prefetchAfterNext = PREFETCH_MAP[nextStep];
      if (prefetchAfterNext) {
        prefetchAfterNext().catch(() => {}); // fire-and-forget, ignore errors
      }
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
      address_line1: values.address_line1 || undefined,
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

  // === SUBMIT CORE ===
  const executeSubmit = async (values: PropertyFormValues) => {
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
          defaultValues!.id as string,
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
          id: propertyId ?? "",
          title: values.title ?? "",
          slug: result.slug,
          status: values.status,
        });
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: unknown) {
      console.error("Error submitting property form:", e);
      const msg =
        e instanceof Error ? e.message : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
      toast.error(msg);
    } finally {
      setIsActuallySubmitting(false);
    }
  };

  // === SUBMIT ENTRYPOINT ===
  const onSubmit = async (values: PropertyFormValues) => {
    if (!values.popular_area?.trim()) {
      setPendingValuesWithoutArea(values);
      setShowMissingAreaDialog(true);
      return;
    }
    await executeSubmit(values);
  };

  // === MISSING LOCATION HANDLERS ===
  const handleSelectAreaAndSubmit = async (areaName: string) => {
    setShowMissingAreaDialog(false);
    const targetValues = pendingValuesWithoutArea || form.getValues();
    const updatedValues = { ...targetValues, popular_area: areaName };
    form.setValue("popular_area", areaName, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setPendingValuesWithoutArea(null);
    await executeSubmit(updatedValues);
  };

  const handleCreateAreaAndSubmit = async (areaData: {
    name: string;
    name_en?: string;
    name_cn?: string;
    name_ru?: string;
  }): Promise<boolean> => {
    try {
      const province = form.getValues("province");
      const res = await addPopularAreaAction({
        name: areaData.name,
        name_en: areaData.name_en,
        name_cn: areaData.name_cn,
        name_ru: areaData.name_ru,
        province: province,
      });

      if (res.success) {
        toast.success("เพิ่มย่านสำเร็จ");
        await refreshPopularAreas(province);

        const targetValues = pendingValuesWithoutArea || form.getValues();
        const updatedValues = {
          ...targetValues,
          popular_area: areaData.name,
          popular_area_en: areaData.name_en || targetValues.popular_area_en,
          popular_area_cn: areaData.name_cn || targetValues.popular_area_cn,
          popular_area_ru: areaData.name_ru || targetValues.popular_area_ru,
        };

        form.setValue("popular_area", areaData.name, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        if (areaData.name_en) {
          form.setValue("popular_area_en", areaData.name_en, { shouldDirty: true });
        }
        if (areaData.name_cn) {
          form.setValue("popular_area_cn", areaData.name_cn, { shouldDirty: true });
        }
        if (areaData.name_ru) {
          form.setValue("popular_area_ru", areaData.name_ru, { shouldDirty: true });
        }

        setShowMissingAreaDialog(false);
        setPendingValuesWithoutArea(null);
        await executeSubmit(updatedValues);
        return true;
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการเพิ่มย่าน");
        return false;
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มย่าน");
      return false;
    }
  };

  const handleSkipAreaAndSubmit = async () => {
    setShowMissingAreaDialog(false);
    if (pendingValuesWithoutArea) {
      const targetValues = pendingValuesWithoutArea;
      setPendingValuesWithoutArea(null);
      await executeSubmit(targetValues);
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
        clearDraft();
        setPersistImages(true);

        // Match the same logic as onSubmit to prevent clearing in edit mode (though duplicate is mostly create-only)
        if (mode === "create") {
          form.reset(EMPTY_VALUES);
        } else if (pendingSubmit) {
          form.reset(pendingSubmit);
        }

        setSuccessData({
          id: result.propertyId!,
          title: pendingSubmit.title,
          slug: result.slug,
          status: pendingSubmit.status,
        });
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        console.error(result.message);
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการยืนยันข้อมูลซ้ำ";
      toast.error(msg);
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

  // Helper to render step content (to avoid duplication in Tabs)
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            mode={mode}
            popularAreas={popularAreas}
            isAddingArea={isAddingArea}
            newArea={newArea}
            setNewAreaAction={setNewArea}
            newAreaEn={newAreaEn}
            setNewAreaEnAction={setNewAreaEn}
            newAreaCn={newAreaCn}
            setNewAreaCnAction={setNewAreaCn}
            newAreaRu={newAreaRu}
            setNewAreaRuAction={setNewAreaRu}
            onAddAreaAction={handleAddArea}
            isQuickInfoOpen={isQuickInfoOpen}
            setIsQuickInfoOpen={setIsQuickInfoOpen}
            branches={branches}
          />
        );
      case 2:
        return <Step2Details mode={mode} />;
      case 3:
        return <Step3Location mode={mode} />;
      case 4:
        return (
          <Step4Media
            mode={mode}
            owners={owners}
            agents={agents}
            initialImages={initialImages}
            uploadSessionId={uploadSessionId}
            persistImages={persistImages}
            refreshOwners={refreshOwners}
            isMultiTenant={isMultiTenant}
            userRole={userRole}
            showAllOwners={showAllOwners}
            setShowAllOwners={setShowAllOwners}
          />
        );
      case 5:
        return <Step5Features />;
      case 6:
        return <Step6Review mode={mode} />;
      case 7:
        return <Step7Syndication mode={mode} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative pb-32 sm:pb-0 lg:px-8 max-w-screen-2xl mx-auto">
      <PropertyFormTour onStepChange={setCurrentStep} />
      <TopLoader isLoading={isActuallySubmitting} />
      {/* 1. Header */}
      <PropertyFormHeader
        mode={mode}
        title={defaultValues?.title ?? undefined}
        uploadSessionId={uploadSessionId}
        isDirty={form.formState.isDirty}
        isSubmitting={isActuallySubmitting}
        onSubmit={submitNow}
        aiReviewedAt={(defaultValues as any)?.ai_reviewed_at}
        reviewerName={defaultValues?.reviewer?.full_name ?? undefined}
        form={form}
        isKeyboardOpen={isKeyboardOpen}
      />

      {/* Step Rendering & History Tabs - Elite Segmented Control */}
      {mode === "edit" ? (
        <Tabs defaultValue="info" className="w-full">
          <div
            className={cn(
              isKeyboardOpen
                ? "relative mt-2"
                : "sticky top-[108px] sm:top-[150px]",
              "z-40 py-4 bg-white/80 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0",
            )}
          >
            <TabsList className="grid w-full grid-cols-2 max-w-[440px] mx-auto h-12 rounded-full bg-slate-200/50 p-1 border border-slate-200/60 shadow-inner">
              <TabsTrigger
                value="info"
                className="rounded-full text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
              >
                <div className="p-1 rounded-md bg-slate-100 group-data-[state=active]:bg-blue-50 transition-colors">
                  <List className="w-3.5 h-3.5" />
                </div>
                ข้อมูลทรัพย์สิน
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-full text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
              >
                <div className="p-1 rounded-md bg-slate-100 group-data-[state=active]:bg-blue-50 transition-colors">
                  <History className="w-3.5 h-3.5" />
                </div>
                ประวัติการแก้ไข
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-2">
            <TabsContent
              value="info"
              className="mt-0 focus-visible:ring-0 outline-none"
            >
              <PropertyFormStepper
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                mode={mode}
                handleNext={handleNext}
                form={form}
              />

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

                  {/* Step contents */}
                  {renderStepContent()}

                  <div
                    className={cn(
                      isKeyboardOpen
                        ? "relative mt-6"
                        : "sticky bottom-0 sm:bottom-6",
                      "z-50 w-full flex flex-col gap-2",
                    )}
                  >
                    {form.watch("requires_ai_review") && (
                      <AiReviewBanner
                        type="property"
                        onConfirm={() =>
                          form.setValue("requires_ai_review", false, {
                            shouldDirty: true,
                          })
                        }
                        isVerifying={isActuallySubmitting}
                        className="mb-0 shadow-lg border border-amber-200/80 rounded-2xl overflow-hidden"
                      />
                    )}

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
                      form={form}
                      className="sticky-none relative bottom-auto sm:bottom-auto z-auto mt-0"
                    />
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:ring-0">
              <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-100 p-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-blue-500" />{" "}
                    บันทึกประวัติการเปลี่ยนแปลงทั้งหมด
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ระบบบันทึกเฉพาะการเปลี่ยนแปลงสำคัญเพื่อความโปร่งใสในการจัดการทรัพย์สิน
                  </p>
                </div>
                <div className=" bg-white min-h-[400px]">
                  {defaultValues?.id && (
                    <AuditTimeline propertyId={defaultValues.id} />
                  )}
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        <>
          <PropertyFormStepper
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            mode={mode}
            handleNext={handleNext}
            form={form}
          />
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

              {renderStepContent()}

              <div
                className={cn(
                  isKeyboardOpen
                    ? "relative mt-6"
                    : "sticky bottom-0 sm:bottom-6",
                  "z-50 w-full flex flex-col gap-2",
                )}
              >
                {form.watch("requires_ai_review") && (
                  <AiReviewBanner
                    type="property"
                    onConfirm={() =>
                      form.setValue("requires_ai_review", false, {
                        shouldDirty: true,
                      })
                    }
                    isVerifying={isActuallySubmitting}
                    className="mb-0 shadow-lg border border-amber-200/80 rounded-2xl overflow-hidden"
                  />
                )}

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
                  form={form}
                  className="sticky-none relative bottom-auto sm:bottom-auto z-auto mt-0"
                />
              </div>
            </form>
          </Form>
        </>
      )}

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

      {/* Missing Location Dialog */}
      <MissingLocationDialog
        open={showMissingAreaDialog}
        onOpenChange={setShowMissingAreaDialog}
        popularAreas={popularAreas}
        province={form.watch("province")}
        onSelectAreaAndSubmit={handleSelectAreaAndSubmit}
        onCreateAreaAndSubmit={handleCreateAreaAndSubmit}
        onSkipAndSubmit={handleSkipAreaAndSubmit}
      />

      {/* Success Navigation Dialog */}
      <ResponsiveDialog
        open={!!successData}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessData(null);
            router.push("/protected/properties?success=true#table");
            router.refresh();
          }
        }}
        title={
          <div className="flex items-center gap-3 text-emerald-600 text-xl font-bold">
            <div className="p-2 bg-emerald-100 rounded-full shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            บันทึกข้อมูลสำเร็จ
          </div>
        }
        description="คุณต้องการทำรายการใดต่อ?"
        className="sm:max-w-md!"
      >
        <div className="flex flex-col gap-3 py-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-4 h-16 text-base font-medium border-slate-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
            disabled={successData?.status !== "ACTIVE" || isNavigatingWeb || isNavigatingBack}
            onClick={() => {
              if (successData?.slug) {
                setIsNavigatingWeb(true);
                window.open(`/properties/${successData.slug}`, "_blank");
                router.push("/protected/properties?success=true#table");
                router.refresh();
              } else {
                toast.error("ไม่พบข้อมูล Slug สำหรับเปิดหน้าเว็บ");
              }
            }}
          >
            <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-emerald-100 group-hover:text-emerald-600! transition-colors">
              {isNavigatingWeb ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col items-start leading-tight group-hover:text-emerald-600!">
              <span>ดูหน้าเว็บไซต์</span>
              <span className="text-[11px] font-normal text-slate-500">
                {successData?.status !== "ACTIVE"
                  ? "ปุ่มนี้เปิดได้เฉพาะทรัพย์ที่มีสถานะใช้งาน (Active) เท่านั้น"
                  : "เปิดแท็บใหม่เพื่อดูตัวอย่าง และกลับหน้ารายการ"}
              </span>
            </div>
          </Button>

          <Button
            className="w-full justify-start gap-4 h-16 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-200"
            disabled={isNavigatingBack || isNavigatingWeb}
            onClick={() => {
              setIsNavigatingBack(true);
              router.push("/protected/properties?success=true#table");
              router.refresh();
            }}
          >
            <div className="bg-white/10 p-2 rounded-xl">
              {isNavigatingBack ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <List className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span>กลับหน้ารายการ</span>
              <span className="text-[11px] font-normal text-slate-400">
                จัดการทรัพย์อื่นต่อใน CRM
              </span>
            </div>
          </Button>

          <div className="pt-4 border-t border-slate-100 mt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              แชร์ไปยังโซเชียลมีเดีย
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Facebook */}
              <Button
                variant="outline"
                className={cn(
                  "w-full flex-col justify-center items-center gap-2 h-24 text-xs font-semibold rounded-2xl transition-all relative",
                  shareStatus["FACEBOOK"]?.success
                    ? "text-emerald-700! border-emerald-100 bg-emerald-50/50!"
                    : "text-blue-600! border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50!",
                )}
                disabled={shareStatus["FACEBOOK"]?.loading}
                onClick={() => {
                  if (!successData?.id) return;
                  setSelectedSocialPlatform("FACEBOOK");
                  setIsSocialDialogOpen(true);
                }}
              >
                {shareStatus["FACEBOOK"]?.loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : shareStatus["FACEBOOK"]?.success ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <FaFacebook className="w-6 h-6" />
                )}
                <span className="leading-tight">
                  {shareStatus["FACEBOOK"]?.success ? "แชร์แล้ว" : "Facebook"}
                </span>
                {shareStatus["FACEBOOK"]?.success &&
                  shareStatus["FACEBOOK"]?.url && (
                    <div
                      className="absolute -top-1 -right-1 p-1 bg-emerald-500 rounded-full text-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(shareStatus["FACEBOOK"]!.url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  )}
              </Button>

              {/* TikTok */}
              <Button
                variant="outline"
                className={cn(
                  "w-full flex-col justify-center items-center gap-2 h-24 text-xs font-semibold rounded-2xl transition-all relative",
                  shareStatus["TIKTOK"]?.success
                    ? "text-emerald-700! border-emerald-100 bg-emerald-50/50!"
                    : "text-slate-900! border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50!",
                )}
                disabled={shareStatus["TIKTOK"]?.loading}
                onClick={() => {
                  if (!successData?.id) return;
                  setSelectedSocialPlatform("TIKTOK");
                  setIsSocialDialogOpen(true);
                }}
              >
                {shareStatus["TIKTOK"]?.loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : shareStatus["TIKTOK"]?.success ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <FaTiktok className="w-6 h-6" />
                )}
                <span className="leading-tight">
                  {shareStatus["TIKTOK"]?.success ? "แชร์แล้ว" : "TikTok"}
                </span>
                {shareStatus["TIKTOK"]?.success &&
                  shareStatus["TIKTOK"]?.url && (
                    <div
                      className="absolute -top-1 -right-1 p-1 bg-emerald-500 rounded-full text-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(shareStatus["TIKTOK"]!.url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  )}
              </Button>

              {/* Instagram */}
              <Button
                variant="outline"
                className={cn(
                  "w-full flex-col justify-center items-center gap-2 h-24 text-xs font-semibold rounded-2xl transition-all relative",
                  shareStatus["INSTAGRAM"]?.success
                    ? "text-emerald-700! border-emerald-100 bg-emerald-50/50!"
                    : "text-pink-600! border-slate-200 bg-white hover:border-pink-200 hover:bg-pink-50/50!",
                )}
                disabled={shareStatus["INSTAGRAM"]?.loading}
                onClick={() => {
                  if (!successData?.id) return;
                  setSelectedSocialPlatform("INSTAGRAM");
                  setIsSocialDialogOpen(true);
                }}
              >
                {shareStatus["INSTAGRAM"]?.loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : shareStatus["INSTAGRAM"]?.success ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Instagram className="w-6 h-6" />
                )}
                <span className="leading-tight">
                  {shareStatus["INSTAGRAM"]?.success ? "แชร์แล้ว" : "Instagram"}
                </span>
              </Button>

              {/* Line */}
              <Button
                variant="outline"
                className={cn(
                  "w-full flex-col justify-center items-center gap-2 h-24 text-xs font-semibold rounded-2xl transition-all relative",
                  shareStatus["LINE"]?.success
                    ? "text-emerald-700! border-emerald-100 bg-emerald-50/50!"
                    : "text-emerald-600! border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50!",
                )}
                disabled={shareStatus["LINE"]?.loading}
                onClick={() => {
                  if (!successData?.id) return;
                  setSelectedSocialPlatform("LINE");
                  setIsSocialDialogOpen(true);
                }}
              >
                {shareStatus["LINE"]?.loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : shareStatus["LINE"]?.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <FaLine className="w-6 h-6 text-[#06C755]" />
                )}
                <span className="leading-tight">
                  {shareStatus["LINE"]?.success ? "ส่งแล้ว" : "Line"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveDialog>

      {successData && (
        <SocialPostDialog
          propertyId={successData.id}
          propertyTitle={successData.title}
          platform={selectedSocialPlatform}
          isOpen={isSocialDialogOpen}
          onOpenChange={setIsSocialDialogOpen}
          onSuccess={() => {
            setShareStatus((prev) => ({
              ...prev,
              [selectedSocialPlatform]: { loading: false, success: true },
            }));
          }}
        />
      )}
    </div>
  );
}
