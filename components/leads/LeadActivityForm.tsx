"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PropertyCombobox } from "../PropertyCombobox";
import { Check, ChevronsUpDown, Phone, MessageSquare, Mail, Eye, Repeat, FileText, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import type { LeadActivityFormValues } from "@/lib/types/leads";
import {
  LEAD_ACTIVITY_TYPE_ORDER,
  LEAD_ACTIVITY_TYPE_LABELS,
} from "@/features/leads/labels";

const ACTIVITY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  CALL: { icon: Phone, color: "bg-emerald-50 text-emerald-600", label: "โทรศัพท์" },
  LINE_CHAT: { icon: MessageSquare, color: "bg-green-50 text-green-600", label: "LINE" },
  EMAIL: { icon: Mail, color: "bg-blue-50 text-blue-600", label: "อีเมล" },
  VIEWING: { icon: Eye, color: "bg-purple-50 text-purple-600", label: "พาชมทรัพย์" },
  FOLLOW_UP: { icon: Repeat, color: "bg-amber-50 text-amber-600", label: "ติดตามผล" },
  NOTE: { icon: FileText, color: "bg-slate-50 text-slate-600", label: "บันทึก" },
  SYSTEM: { icon: Settings, color: "bg-slate-100 text-slate-400", label: "ระบบ" },
};

export function LeadActivityForm({
  onSubmitAction,
  defaultValues,
  title = "Add activity",
  submitLabel,
  initialProperty,
  tenantId,
}: {
  onSubmitAction: (values: LeadActivityFormValues) => Promise<void>;
  defaultValues?: Partial<LeadActivityFormValues>;
  title?: string;
  submitLabel?: string;
  initialProperty?: { id: string; title: string } | null;
  tenantId?: string | null;
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
        if (!defaultValues) {
          form.reset({ activity_type: "CALL", note: "", property_id: null });
        }
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
      <div className="font-medium">{title}</div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <div className="text-sm font-medium">ประเภทกิจกรรม</div>
          <ResponsiveDialog
            title="เลือกประเภทกิจกรรม"
            description="ระบุประเภทการโต้ตอบกับลูกค้า"
            className="bg-white md:max-w-md"
            trigger={
              <Button
                variant="outline"
                type="button"
                className={cn(
                  "w-full h-11 justify-between px-4 rounded-xl border-slate-200 bg-white text-sm font-medium transition-all hover:bg-slate-50 hover:border-blue-300 shadow-xs",
                  form.watch("activity_type") ? "text-slate-900" : "text-slate-400"
                )}
              >
                <div className="flex items-center gap-2 ">
                  {form.watch("activity_type") && (
                    <div className={cn(
                      "h-5 w-5 rounded-md flex items-center justify-center shrink-0",
                      ACTIVITY_CONFIG[form.watch("activity_type")]?.color || "bg-slate-50"
                    )}>
                       {(() => {
                         const Icon = ACTIVITY_CONFIG[form.watch("activity_type")]?.icon || FileText;
                         return <Icon className="h-3 w-3" />;
                       })()}
                    </div>
                  )}
                  <span>
                    {form.watch("activity_type") 
                      ? LEAD_ACTIVITY_TYPE_LABELS[form.watch("activity_type")] 
                      : "เลือกประเภทกิจกรรม"}
                  </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 opacity-30" />
              </Button>
            }
          >
            <div className="p-4 md:p-6 grid grid-cols-2 gap-2 max-h-[60vh] mb-6 overflow-y-auto scrollbar-thin">
              {LEAD_ACTIVITY_TYPE_ORDER.map((t) => {
                const isSelected = form.watch("activity_type") === t;
                const config = ACTIVITY_CONFIG[t] || ACTIVITY_CONFIG.NOTE;
                const Icon = config.icon;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      form.setValue("activity_type", t as any);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl transition-all active:scale-[0.98] border text-left",
                      isSelected
                        ? "bg-blue-50 border-blue-100 shadow-sm text-blue-700"
                        : "hover:bg-slate-50 border-transparent text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        config.color
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">{LEAD_ACTIVITY_TYPE_LABELS[t]}</span>
                    </div>
                    {isSelected && (
                      <div className="bg-blue-600 rounded-full p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ResponsiveDialog>
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <div className="text-sm font-medium">เลือกทรัพย์ที่ต้องการติดต่อ</div>
        <PropertyCombobox
          value={form.watch("property_id")}
          onChangeAction={(val) => form.setValue("property_id", val)}
          initialProperty={initialProperty}
          tenantId={tenantId}
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

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "w-full md:w-auto h-12 rounded-xl px-8 font-semibold transition-all duration-200",
            "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 border-none",
            "active:scale-[0.98] active:shadow-md",
            isPending && "opacity-80"
          )}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังบันทึก...</span>
            </div>
          ) : (
            submitLabel || "บันทึกกิจกรรม"
          )}
        </Button>
      </div>
    </form>
  );
}
