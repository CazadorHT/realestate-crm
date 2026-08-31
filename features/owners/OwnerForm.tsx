"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Phone,
  MessageCircle,
  Globe,
  AtSign,
  Loader2,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { FaFacebook, FaLine } from "react-icons/fa";
import { m, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Owner, OwnerFormValues } from "@/features/owners/types";

import {
  createOwnerAction,
  updateOwnerAction,
  checkOwnerDuplicateAction,
} from "@/features/owners/actions";
import { OwnerMobileView } from "./components/OwnerMobileView";
import { OwnerDesktopView } from "./components/OwnerDesktopView";

import { useLanguage } from "@/components/providers/LanguageProvider";

const getOwnerSchema = (isEn: boolean) =>
  z.object({
    full_name: z
      .string()
      .min(1, isEn ? "Owner name is required" : "กรุณากรอกชื่อเจ้าของ"),
    phone: z
      .string()
      .refine(
        (val) => !val || /^0[0-9]{8,9}$/.test(val.replace(/[- ]/g, "")),
        isEn
          ? "Invalid phone number (must start with 0 and have 9-10 digits)"
          : "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)",
      )
      .nullable()
      .optional(),
    line_id: z.string().nullable().optional(),
    facebook_url: z.string().nullable().optional(),
    other_contact: z.string().nullable().optional(),
    company_name: z.string().nullable().optional(),
    created_by: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
    owner_type: z.string().nullable().optional(),
  });

type FormShape = z.infer<ReturnType<typeof getOwnerSchema>>;

type Props =
  | {
      mode: "create";
      initialValues?: Partial<OwnerFormValues>;
      onSuccess?: (id?: string) => void;
      onCancel?: () => void;
      onDirtyChange?: (isDirty: boolean) => void;
      isInDialog?: boolean;
    }
  | {
      mode: "edit";
      id: string;
      initialValues: Owner | OwnerFormValues;
      onSuccess?: (id?: string) => void;
      onCancel?: () => void;
      onDirtyChange?: (isDirty: boolean) => void;
      isInDialog?: boolean;
    };

function toNull(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

export function OwnerForm(props: Props) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const isMobile = useIsMobile();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [duplicateOwner, setDuplicateOwner] = useState<{ id: string; name: string } | null>(null);
  const [liveValidation, setLiveValidation] = useState<{
    phone?: { isDuplicate: boolean; ownerName?: string; ownerId?: string };
    line_id?: { isDuplicate: boolean; ownerName?: string; ownerId?: string };
  }>({});

  const form = useForm<FormShape>({
    resolver: zodResolver(getOwnerSchema(isEn)),
    mode: "onChange",
    defaultValues: {
      full_name: props.initialValues?.full_name ?? "",
      phone: props.initialValues?.phone ?? "",
      line_id: props.initialValues?.line_id ?? "",
      facebook_url: props.initialValues?.facebook_url ?? "",
      other_contact: props.initialValues?.other_contact ?? "",
      company_name: props.initialValues?.company_name ?? "",
      owner_type: props.initialValues?.owner_type ?? "individual",
    },
  });

  const checkLiveDuplicate = async (field: "phone" | "line_id", value: string | null | undefined) => {
    if (props.mode !== "create") return;
    const trimmed = value?.trim();
    if (!trimmed) {
      setLiveValidation((prev) => ({
        ...prev,
        [field]: { isDuplicate: false },
      }));
      return;
    }
    try {
      const isPhone = field === "phone";
      const res = await checkOwnerDuplicateAction(
        isPhone ? trimmed : undefined,
        !isPhone ? trimmed : undefined
      );
      if (res.success && res.isDuplicate) {
        setLiveValidation((prev) => ({
          ...prev,
          [field]: { isDuplicate: true, ownerName: res.ownerName, ownerId: res.ownerId },
        }));
      } else {
        setLiveValidation((prev) => ({
          ...prev,
          [field]: { isDuplicate: false },
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Notify parent of dirty state changes
  const isDirty = form.formState.isDirty;
  const onDirtyChange = props.onDirtyChange;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = (values: FormShape) => {
    setError(null);
    setDuplicateOwner(null);

    const payload: OwnerFormValues = {
      full_name: values.full_name.trim(),
      phone: toNull(values.phone),
      line_id: toNull(values.line_id),
      facebook_url: toNull(values.facebook_url),
      other_contact: toNull(values.other_contact),
      created_by: toNull(values.created_by),
      updated_at: toNull(values.updated_at),
      company_name: toNull(values.company_name),
      owner_type: toNull(values.owner_type),
    };

    startTransition(async () => {
      try {
        const res = (
          props.mode === "create"
            ? await createOwnerAction(payload)
            : await updateOwnerAction(props.id, payload)
        ) as any;

        if (res?.success === false) {
          if (res.code === "DUPLICATE") {
            setDuplicateOwner({
              id: res.duplicateId as string,
              name: res.duplicateName as string,
            });
            setError(res.message || (isEn ? "This owner already exists in the system" : "มีข้อมูลเจ้าของทรัพย์นี้ในระบบแล้ว"));
          } else {
            toast.error(res.message || (isEn ? "Error occurred" : "เกิดข้อผิดพลาด"));
          }
          return;
        }

        toast.success(
          res.message ||
            (props.mode === "create"
              ? (isEn ? "Owner added successfully" : "เพิ่มเจ้าของสำเร็จ")
              : (isEn ? "Saved successfully" : "บันทึกข้อมูลสำเร็จ")),
        );

        if (props.onSuccess) {
          props.onSuccess(res && 'id' in res ? (res.id as string) : undefined);
        } else {
          router.refresh();
          router.push("/protected/owners?success=true");
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : (isEn ? "Error occurred" : "เกิดข้อผิดพลาด");
        toast.error(message);
      }
    });
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    } else {
      router.back();
    }
  };

  const nextStep = async () => {
    let fields: (keyof FormShape)[] = [];
    if (currentStep === 1) fields = ["full_name", "owner_type", "company_name"];
    if (currentStep === 2) fields = ["phone", "line_id"];

    const isValid = await form.trigger(fields);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleUseExisting = (ownerId?: string) => {
    const targetId = ownerId || duplicateOwner?.id;
    if (targetId) {
      toast.success(
        isEn ? "Selected existing owner" : "เลือกใช้ข้อมูลเจ้าของที่มีอยู่ในระบบแล้ว"
      );
      if (props.onSuccess) {
        props.onSuccess(targetId);
      } else {
        router.push(`/protected/owners/${targetId}`);
      }
    }
  };

  if (isMobile) {
    return (
      <OwnerMobileView
        form={form}
        currentStep={currentStep}
        totalSteps={totalSteps}
        isPending={isPending}
        mode={props.mode}
        nextStep={nextStep}
        prevStep={prevStep}
        handleCancel={handleCancel}
        onSubmit={form.handleSubmit(onSubmit)}
        isInDialog={props.isInDialog}
        liveValidation={liveValidation}
        checkLiveDuplicate={checkLiveDuplicate}
        duplicateOwner={duplicateOwner}
        onUseExisting={handleUseExisting}
      />
    );
  }

  return (
    <OwnerDesktopView
      form={form}
      isPending={isPending}
      error={error}
      mode={props.mode}
      handleCancel={handleCancel}
      onSubmit={form.handleSubmit(onSubmit)}
      isInDialog={props.isInDialog}
      liveValidation={liveValidation}
      checkLiveDuplicate={checkLiveDuplicate}
      duplicateOwner={duplicateOwner}
      onUseExisting={handleUseExisting}
    />
  );
}
