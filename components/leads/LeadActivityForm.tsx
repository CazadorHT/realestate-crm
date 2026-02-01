"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PropertyCombobox } from "../PropertyCombobox";

import type { LeadActivityFormValues } from "@/lib/types/leads";
import {
  LEAD_ACTIVITY_TYPE_ORDER,
  LEAD_ACTIVITY_TYPE_LABELS,
} from "@/features/leads/labels";

export function LeadActivityForm({
  onSubmitAction,
  defaultValues,
}: {
  onSubmitAction: (values: LeadActivityFormValues) => Promise<void>;
  defaultValues?: Partial<LeadActivityFormValues>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LeadActivityFormValues>({
    defaultValues: {
      activity_type: defaultValues?.activity_type ?? "CALL",
      note: defaultValues?.note ?? "",
      property_id: defaultValues?.property_id ?? null,
    },
  });

  const submit = (values: LeadActivityFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmitAction(values);
        form.reset({ activity_type: "CALL", note: "", property_id: null });
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form
      className="rounded-xl border border-gray-300 p-4 space-y-3"
      onSubmit={form.handleSubmit(submit)}
    >
      <div className="font-medium">Add activity</div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <div className="text-sm font-medium">ประเภทกิจกรรม</div>
          <Select
            value={form.watch("activity_type")}
            onValueChange={(v) => form.setValue("activity_type", v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภทกิจกรรม" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_ACTIVITY_TYPE_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  {LEAD_ACTIVITY_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <div className="text-sm font-medium">เลือกทรัพย์ที่ต้องการติดต่อ</div>
        <PropertyCombobox
          value={form.watch("property_id")}
          onChange={(val) => form.setValue("property_id", val)}
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">รายละเอียด</div>
        <Textarea
          rows={4}
          {...form.register("note")}
          placeholder="รายละเอียดกิจกรรม..."
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save activity"}
      </Button>
    </form>
  );
}
