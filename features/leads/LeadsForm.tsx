"use client";

import { useMemo, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  leadFormSchema,
  type LeadFormValues,
  LEAD_SOURCES,
  LEAD_STAGES,
} from "@/lib/validations/lead";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ถ้าคุณมี Separator ใช้ได้ จะทำให้ดูเป็น section มากขึ้น
// import { Separator } from "@/components/ui/separator";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

export function LeadForm({
  initialValues,
  onSubmitAction,
}: {
  initialValues: Partial<LeadFormValues>;
  onSubmitAction: (values: LeadFormValues) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  const defaultValues = useMemo<LeadFormValues>(
    () => ({
      full_name: initialValues.full_name ?? "",
      phone: initialValues.phone ?? null,
      email: initialValues.email ?? null,

      // ✅ source ใน DB เป็น nullable ได้ → default ให้เป็น null หรือ OTHER ก็ได้
      source: initialValues.source ?? null,

      // ✅ stage ไม่ควรเป็น null → default เป็น NEW
      stage: initialValues.stage ?? "NEW",

      property_id: initialValues.property_id ?? null,
      assigned_to: initialValues.assigned_to ?? null,

      budget_min: initialValues.budget_min ?? null,
      budget_max: initialValues.budget_max ?? null,

      note: initialValues.note ?? null,

      // ถ้าคุณเพิ่ม field ใหม่ไว้แล้วใน schema ก็เติม default ได้
      lead_type: initialValues.lead_type ?? "INDIVIDUAL",
      nationality: initialValues.nationality ?? null,
      is_foreigner: initialValues.is_foreigner ?? false,

      preferred_locations: initialValues.preferred_locations ?? null,
      preferred_property_types: initialValues.preferred_property_types ?? null,

      min_bedrooms: initialValues.min_bedrooms ?? null,
      min_bathrooms: initialValues.min_bathrooms ?? null,
      min_size_sqm: initialValues.min_size_sqm ?? null,
      max_size_sqm: initialValues.max_size_sqm ?? null,
      num_occupants: initialValues.num_occupants ?? null,
      has_pets: initialValues.has_pets ?? null,
      need_company_registration: initialValues.need_company_registration ?? null,
      allow_airbnb: initialValues.allow_airbnb ?? null,
      preferences: initialValues.preferences ?? null,
    }),
    [initialValues],
  );

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const onSubmit = (values: LeadFormValues) =>
    startTransition(async () => {
      await onSubmitAction(values);
    });

  const { errors } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">Lead</div>
          <div className="text-sm text-muted-foreground">
            แก้ไขข้อมูลลูกค้าและสถานะการติดตาม
          </div>
        </div>

        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>

      {/* <Separator /> */}

      {/* Section: ข้อมูลติดต่อ */}
      <div className="space-y-3">
        <div className="text-sm font-medium">ข้อมูลติดต่อ</div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm">ชื่อ-นามสกุล</label>
            <Input
              placeholder="เช่น คุณสมชาย ใจดี"
              {...form.register("full_name")}
              disabled={pending}
            />
            <FieldError message={errors.full_name?.message as string | undefined} />
          </div>

          <div className="space-y-1">
            <label className="text-sm">เบอร์โทร</label>
            <Input
              placeholder="เช่น 08x-xxx-xxxx"
              {...form.register("phone")}
              disabled={pending}
            />
            <FieldError message={errors.phone?.message as string | undefined} />
          </div>

          <div className="space-y-1">
            <label className="text-sm">อีเมล</label>
            <Input
              placeholder="เช่น name@email.com"
              {...form.register("email")}
              disabled={pending}
            />
            <FieldError message={errors.email?.message as string | undefined} />
          </div>
        </div>
      </div>

      {/* Section: สถานะ & ช่องทาง */}
      <div className="space-y-3">
        <div className="text-sm font-medium">สถานะและช่องทาง</div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Stage */}
          <div className="space-y-1">
            <label className="text-sm">Stage</label>
            <Controller
              control={form.control}
              name="stage"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  disabled={pending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldHint>กำหนดสถานะใน pipeline เพื่อจัดลำดับการติดตาม</FieldHint>
            <FieldError message={errors.stage?.message as string | undefined} />
          </div>

          {/* Source */}
          <div className="space-y-1">
            <label className="text-sm">Source</label>
            <Controller
              control={form.control}
              name="source"
              render={({ field }) => (
                <Select
                  value={field.value ?? "OTHER"} // ถ้า null ให้แสดง OTHER ใน UI
                  onValueChange={(v) => field.onChange(v)}
                  disabled={pending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกแหล่งที่มา" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldHint>ใช้แยกว่าลูกค้ามาจากช่องทางไหนเพื่อวิเคราะห์คุณภาพ lead</FieldHint>
            <FieldError message={errors.source?.message as string | undefined} />
          </div>
        </div>
      </div>

      {/* Section: งบประมาณ */}
      <div className="space-y-3">
        <div className="text-sm font-medium">งบประมาณ</div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm">Budget min</label>
            <Input
              placeholder="เช่น 15000000"
              inputMode="numeric"
              {...form.register("budget_min")}
              disabled={pending}
            />
            <FieldError message={errors.budget_min?.message as string | undefined} />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Budget max</label>
            <Input
              placeholder="เช่น 20000000"
              inputMode="numeric"
              {...form.register("budget_max")}
              disabled={pending}
            />
            <FieldError message={errors.budget_max?.message as string | undefined} />
          </div>
        </div>

        <FieldHint>ถ้าเป็นเช่า ให้ใส่เป็นงบ/เดือน หรือจะเพิ่ม field เฉพาะเช่าทีหลังก็ได้</FieldHint>
      </div>

      {/* Section: โน้ต */}
      <div className="space-y-1">
        <label className="text-sm font-medium">โน้ต</label>
        <Textarea
          placeholder="รายละเอียดเพิ่มเติม เช่น ต้องการย้ายเข้าเดือนหน้า, มีสัตว์เลี้ยง, ต่างชาติ ฯลฯ"
          rows={5}
          {...form.register("note")}
          disabled={pending}
        />
        <FieldError message={errors.note?.message as string | undefined} />
      </div>

      {/* Footer actions (สำหรับมือถือ/ความชัดเจน) */}
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={pending} className="w-full md:w-auto">
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}
