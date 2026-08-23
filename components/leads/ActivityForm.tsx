"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { leadActivitySchema, type LeadActivityValues } from "@/lib/validations/lead-activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCombobox } from "../PropertyCombobox";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ActivityForm({
  action,
}: {
  action: (values: LeadActivityValues) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const { language } = useLanguage();
  const isEn = language === "en";
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
      <div className="text-sm font-medium">
        {isEn ? "Add Activity" : "เพิ่มกิจกรรม"}
      </div>

      <Input
        placeholder={isEn ? "activity_type e.g. NOTE / CALL / VIEWING" : "activity_type เช่น NOTE / CALL / VIEWING"}
        {...form.register("activity_type")}
      />

      <Input placeholder={isEn ? "property_id (if linked)" : "property_id (ถ้าผูกทรัพย์)"} {...form.register("property_id")} />

      <div className="space-y-2 md:col-span-2">
        <div className="text-sm font-medium">
          {isEn ? "Property (optional)" : "ทรัพย์ที่เกี่ยวข้อง (ระบุหรือไม่ก็ได้)"}
        </div>

        <PropertyCombobox
          value={(form.watch("property_id") as any) ?? null}
          onChangeAction={(val) => form.setValue("property_id", val as any)}
        />
      </div>
      <Textarea
        placeholder={isEn ? "Activity details..." : "รายละเอียดกิจกรรม..."}
        {...form.register("note")}
      />
      <Button type="submit" disabled={pending} className="cursor-pointer">
        {pending
          ? (isEn ? "Saving..." : "กำลังบันทึก...")
          : (isEn ? "Save Activity" : "บันทึกกิจกรรม")}
      </Button>
    </form>
  );
}
