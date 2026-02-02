"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import { FaFacebook, FaLine } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Owner, OwnerFormValues } from "@/features/owners/types";

import {
  createOwnerAction,
  updateOwnerAction,
} from "@/features/owners/actions";

const ownerSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อเจ้าของ"),
  phone: z.string().nullable().optional(),
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
      onSuccess?: () => void;
      onCancel?: () => void;
    }
  | {
      mode: "edit";
      id: string;
      initialValues: Owner | OwnerFormValues;
      onSuccess?: () => void;
      onCancel?: () => void;
    };

// ... constants ...

function toNull(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

export function OwnerForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      owner_type: props.initialValues?.owner_type ?? "",
    },
  });

  const onSubmit = (values: FormShape) => {
    setError(null);

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
        let res: any;
        if (props.mode === "create") {
          res = await createOwnerAction(payload);
        } else {
          res = await updateOwnerAction(props.id, payload);
        }

        if (res?.success === false) {
          toast.error(res.message);
          return;
        }

        toast.success(
          props.mode === "create" ? "เพิ่มเจ้าของสำเร็จ" : "บันทึกข้อมูลสำเร็จ",
        );

        router.refresh();

        // Call onSuccess callback if provided
        if (props.onSuccess) {
          props.onSuccess();
        } else {
          // Default behavior for non-dialog: redirect to owners list
          router.push("/protected/owners");
        }
      } catch (e: any) {
        toast.error(e?.message ?? "เกิดข้อผิดพลาด");
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

  return (
    <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium flex items-center gap-2">
          <X className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Main Info Card */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-200/60 pb-2 mb-2">
            <User className="h-4 w-4 text-blue-600" />
            ข้อมูลทั่วไป
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                ชื่อเจ้าของ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="เช่น คุณสมชาย ใจดี"
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl"
                  {...form.register("full_name")}
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="text-xs text-red-500 font-medium ml-1">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-200/60 pb-2 mb-2">
            <Phone className="h-4 w-4 text-emerald-600" />
            ข้อมูลการติดต่อ
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                เบอร์โทร
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="089-xxx-xxxx"
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                  {...form.register("phone")}
                />
              </div>
            </div>

            {/* Line ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Line ID
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <FaLine className="h-4 w-4 text-[#06C755]" />
                </div>
                <Input
                  placeholder="@lineid"
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-[#06C755] focus:ring-[#06C755]/20 transition-all rounded-xl"
                  {...form.register("line_id")}
                />
              </div>
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Facebook URL
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <FaFacebook className="h-4 w-4 text-[#1877F2]" />
                </div>
                <Input
                  placeholder="facebook.com/..."
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-[#1877F2] focus:ring-[#1877F2]/20 transition-all rounded-xl"
                  {...form.register("facebook_url")}
                />
              </div>
              {form.formState.errors.facebook_url && (
                <p className="text-xs text-red-500 font-medium ml-1">
                  {form.formState.errors.facebook_url.message}
                </p>
              )}
            </div>

            {/* Other Contact */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                ช่องทางอื่นๆ
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="WhatsApp, WeChat..."
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 transition-all rounded-xl"
                  {...form.register("other_contact")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Sticky Bottom) */}
      <div className="sticky bottom-0 z-40 -mx-6 -mb-6 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-xl">
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={handleCancel}
          className="h-15 px-10 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          ยกเลิก
        </Button>

        <Button
          type="submit"
          disabled={
            isPending || !form.formState.isValid || !form.formState.isDirty
          }
          className="h-15 px-10 rounded-xl bg-linear-to-r shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 text-white shadow-lg  hover:shadow-xl hover:shadow-emerald-500/30 transition-all gap-2 font-medium cursor-pointer disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending
            ? "กำลังบันทึก..."
            : props.mode === "create"
              ? "เพิ่มเจ้าของ"
              : "บันทึกข้อมูล"}
        </Button>
      </div>
    </form>
  );
}
