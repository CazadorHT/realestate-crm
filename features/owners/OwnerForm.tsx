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
  | { mode: "create"; initialValues?: Partial<OwnerFormValues> }
  | { mode: "edit"; id: string; initialValues: Owner | OwnerFormValues };

function toNull(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

function isNextRedirectError(e: any) {
  return typeof e?.digest === "string" && e.digest.startsWith("NEXT_REDIRECT");
}

export function OwnerForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormShape>({
    resolver: zodResolver(ownerSchema),
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
      } catch (e: any) {
        if (isNextRedirectError(e)) {
          toast.success(
            props.mode === "create"
              ? "เพิ่มเจ้าของสำเร็จ"
              : "บันทึกข้อมูลสำเร็จ",
          );
          throw e;
        }
        toast.error(e?.message ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name Field - Full Width */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          ชื่อเจ้าของ <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="เช่น คุณสมชาย ใจดี"
          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          {...form.register("full_name")}
        />
        {form.formState.errors.full_name && (
          <p className="text-xs text-red-500">
            {form.formState.errors.full_name.message}
          </p>
        )}
      </div>

      {/* Contact Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Phone className="h-4 w-4 text-slate-400" />
          ข้อมูลการติดต่อ
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-500" />
              เบอร์โทร
            </label>
            <Input
              placeholder="089-xxx-xxxx"
              className="h-11 border-slate-200"
              {...form.register("phone")}
            />
          </div>

          {/* Line ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FaLine className="h-4 w-4 text-[#06C755]" />
              Line ID
            </label>
            <Input
              placeholder="@lineid หรือ เบอร์โทร"
              className="h-11 border-slate-200"
              {...form.register("line_id")}
            />
          </div>

          {/* Facebook */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FaFacebook className="h-4 w-4 text-[#1877F2]" />
              Facebook URL
            </label>
            <Input
              placeholder="https://facebook.com/..."
              className="h-11 border-slate-200"
              {...form.register("facebook_url")}
            />
            {form.formState.errors.facebook_url && (
              <p className="text-xs text-red-500">
                {form.formState.errors.facebook_url.message}
              </p>
            )}
          </div>

          {/* Other Contact */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <AtSign className="h-4 w-4 text-slate-400" />
              ช่องทางติดต่ออื่นๆ
            </label>
            <Input
              placeholder="WhatsApp, WeChat, เบอร์สำรอง ฯลฯ"
              className="h-11 border-slate-200"
              {...form.register("other_contact")}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button
          type="submit"
          disabled={isPending}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
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

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
