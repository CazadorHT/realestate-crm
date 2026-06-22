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

const ownerSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อเจ้าของ"),
  phone: z
    .string()
    .refine(
      (val) => !val || /^0[0-9]{8,9}$/.test(val.replace(/[- ]/g, "")),
      "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)",
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

type FormShape = z.infer<typeof ownerSchema>;

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
    resolver: zodResolver(ownerSchema),
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
    if (!value || props.mode !== "create") return;
    try {
      const isPhone = field === "phone";
      const res = await checkOwnerDuplicateAction(
        isPhone ? value : undefined,
        !isPhone ? value : undefined
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
            setError(res.message || "มีข้อมูลเจ้าของทรัพย์นี้ในระบบแล้ว");
          } else {
            toast.error(res.message || "เกิดข้อผิดพลาด");
          }
          return;
        }

        toast.success(
          res.message ||
            (props.mode === "create"
              ? "เพิ่มเจ้าของสำเร็จ"
              : "บันทึกข้อมูลสำเร็จ"),
        );

        if (props.onSuccess) {
          props.onSuccess(res && 'id' in res ? (res.id as string) : undefined);
        } else {
          router.refresh();
          router.push("/protected/owners?success=true");
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
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
        onUseExisting={() => {
          if (duplicateOwner && props.onSuccess) {
            props.onSuccess(duplicateOwner.id);
          }
        }}
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
      onUseExisting={() => {
        if (duplicateOwner && props.onSuccess) {
          props.onSuccess(duplicateOwner.id);
        }
      }}
    />
  );
}
