"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { leadActivitySchema, type LeadActivityValues } from "@/lib/validations/lead-activity";

// shadcn/ui (ปรับ import ให้ตรงของคุณ)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCombobox } from "../PropertyCombobox";

export function ActivityForm({
  action,
}: {
  action: (values: LeadActivityValues) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<LeadActivityValues>({
    resolver: zodResolver(leadActivitySchema),
    defaultValues: { activity_type: "NOTE", note: "", property_id: null },
  });

  const onSubmit = (values: LeadActivityValues) =>
    startTransition(async () => {
      await action(values);
      form.reset({ activity_type: "NOTE", note: "", property_id: null });
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-xl border p-3">
      <div className="text-sm font-medium">เพิ่มกิจกรรม</div>

      <Input
        placeholder="activity_type เช่น NOTE / CALL / VIEWING"
        {...form.register("activity_type")}
      />

      <Input placeholder="property_id (ถ้าผูกทรัพย์)" {...form.register("property_id")} />

      <div className="space-y-2 md:col-span-2">
      <div className="text-sm font-medium">Property (optional)</div>

      <PropertyCombobox
        value={(form.watch("property_id") as any) ?? null}
        onChange={(val) => form.setValue("property_id", val as any)}
      />
    </div>
      <Textarea placeholder="รายละเอียดกิจกรรม..." {...form.register("note")} />
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
      </Button>
    </form>
  );
}
