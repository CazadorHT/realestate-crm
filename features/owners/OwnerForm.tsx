"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  // redirect() จะ throw error ที่มี digest ขึ้นต้นด้วย "NEXT_REDIRECT"
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

    // แนะนำให้ส่ง null (ไม่ส่ง undefined) ให้ตรง DB ที่เป็น nullable
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

        // Success
        toast.success(
          props.mode === "create" ? "เพิ่มเจ้าของสำเร็จ" : "บันทึกข้อมูลสำเร็จ"
        );

        // เผื่อกรณี action “ไม่ redirect”
        router.refresh();
      } catch (e: any) {
        if (isNextRedirectError(e)) {
          toast.success(
            props.mode === "create"
              ? "เพิ่มเจ้าของสำเร็จ"
              : "บันทึกข้อมูลสำเร็จ"
          );
          throw e;
        }
        toast.error(e?.message ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="full_name">ชื่อเจ้าของ *</Label>
          <Input
            id="full_name"
            placeholder="เช่น คุณสมชาย ใจดี"
            {...form.register("full_name")}
          />
          {form.formState.errors.full_name ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.full_name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">เบอร์โทร</Label>
          <Input
            id="phone"
            placeholder="เช่น 089xxxxxxx"
            {...form.register("phone")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="line_id">Line ID</Label>
          <Input
            id="line_id"
            placeholder="เช่น @ownerline"
            {...form.register("line_id")}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="facebook_url">Facebook URL</Label>
          <Input
            id="facebook_url"
            placeholder="เช่น https://facebook.com/..."
            {...form.register("facebook_url")}
          />
          {form.formState.errors.facebook_url ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.facebook_url.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="other_contact">ช่องทางติดต่ออื่น ๆ</Label>
          <Input
            id="other_contact"
            placeholder="เช่น WhatsApp / WeChat / เบอร์สำรอง"
            {...form.register("other_contact")}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
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
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
