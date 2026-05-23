"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { LeadActivityForm } from "@/components/leads/LeadActivityForm";
import { LeadActivityFormValues } from "@/lib/types/leads";

interface LeadActivityDialogProps {
  leadId: string;
  leadName?: string;
  onSubmitAction: (values: LeadActivityFormValues) => Promise<void>;
  triggerVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  triggerClassName?: string;
  trigger?: React.ReactNode;
  defaultValues?: Partial<LeadActivityFormValues>;
  title?: string;
  submitLabel?: string;
  initialProperty?: { id: string; title: string } | null;
  tenantId?: string | null;
}

export function LeadActivityDialog({
  leadId,
  leadName,
  onSubmitAction,
  triggerVariant = "default",
  triggerClassName,
  trigger,
  defaultValues,
  title = "บันทึกกิจกรรมใหม่",
  submitLabel,
  initialProperty,
  tenantId,
}: LeadActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSubmit = async (values: LeadActivityFormValues) => {
    await onSubmitAction(values);
    setOpen(false); // Close dialog on success
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setIsDirty(false);
      }}
      confirmOnClose={isDirty}
      title={title}
      trigger={
        trigger || (
          <Button
            variant={triggerVariant}
            className={cn(
              "gap-2 h-11 px-5 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-sm hover:shadow-md", 
              triggerVariant === "default" && "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100",
              triggerClassName
            )}
          >
            <Plus className="h-4 w-4" />
            <span>บันทึกกิจกรรม</span>
          </Button>
        )
      }
    >
      <div className="py-2 pb-8">
        <LeadActivityForm
          onSubmitAction={handleSubmit}
          defaultValues={defaultValues}
          title={title}
          submitLabel={submitLabel}
          initialProperty={initialProperty}
          tenantId={tenantId}
          onDirtyChange={setIsDirty}
        />
      </div>
    </ResponsiveDialog>
  );
}
