"use client";

import { useRouter } from "next/navigation";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFormValues } from "./types";
import { useLeadForm } from "./hooks/useLeadForm";
import { LeadContactSection } from "./components/LeadContactSection";
import { LeadRequirementsSection } from "./components/LeadRequirementsSection";
import { LeadStatusSection } from "./components/LeadStatusSection";

type Props = {
  leadId?: string;
  initialValues?: Partial<LeadFormValues>;
  onSubmitAction: (values: LeadFormValues) => Promise<void>;
};

export function LeadForm({ initialValues, onSubmitAction }: Props) {
  const router = useRouter();
  const { form, onSubmit, isPending, error } = useLeadForm(
    initialValues,
    onSubmitAction,
  );

  return (
    <form className="space-y-6 mx-auto" onSubmit={form.handleSubmit(onSubmit)}>
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm flex items-center gap-3">
          <Info className="h-4 w-4 text-destructive" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <LeadContactSection form={form} />
        </div>

        <div className="xl:col-span-8 space-y-6">
          <LeadRequirementsSection form={form} />
          <LeadStatusSection form={form} />
        </div>
      </div>

      <div className="sticky bottom-0 z-40 -mx-7 -mb-6 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-xl">
        <Button
          className="h-15 px-8 text-muted-foreground hover:text-foreground cursor-pointer"
          variant="ghost"
          type="button"
          disabled={isPending}
          onClick={() => router.back()}
        >
          ยกเลิก
        </Button>
        <Button
          className="h-15 px-8 text-md font-bold shadow-lg cursor-pointer shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all min-w-[200px] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          type="submit"
          disabled={
            isPending || !form.formState.isValid || !form.formState.isDirty
          }
        >
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </div>
    </form>
  );
}
