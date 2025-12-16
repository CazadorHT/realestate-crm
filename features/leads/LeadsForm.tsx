"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  leadFormSchema,
  type LeadFormValues,
  LEAD_STAGES,
  LEAD_SOURCES,
} from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LEAD_STAGE_ORDER,
  LEAD_SOURCE_ORDER,
  LEAD_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
} from "./labels";

type Props = {
  initialValues?: Partial<LeadFormValues>;
  onSubmitAction: (values: LeadFormValues) => Promise<void>;
};

export function LeadForm({ initialValues, onSubmitAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      full_name: "",
      stage: "NEW",
      source: "OTHER",
      ...initialValues,
    } as any,
  });

  const onSubmit = (values: LeadFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmitAction(values);
      } catch (e: any) {
        setError(e?.message ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">ชื่อ-นามสกุล</div>
          <Input {...form.register("full_name")} />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">เบอร์โทร</div>
          <Input {...form.register("phone")} />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">อีเมล</div>
          <Input {...form.register("email")} />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Source</div>
          <Select
            value={(form.watch("source") as any) ?? "OTHER"}
            onValueChange={(v) => form.setValue("source", v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกแหล่งที่มา" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SOURCE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_SOURCE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Stage</div>
          <Select
            value={form.watch("stage")}
            onValueChange={(v) => form.setValue("stage", v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STAGE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}
