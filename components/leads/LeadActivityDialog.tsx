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
}: LeadActivityDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (values: LeadActivityFormValues) => {
    await onSubmitAction(values);
    setOpen(false); // Close dialog on success
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      trigger={
        trigger || (
          <Button
            variant={triggerVariant}
            className={cn("gap-2 h-11 rounded-xl font-bold transition-all active:scale-95", triggerClassName)}
          >
            <Plus className="h-4 w-4" />
            บันทึกกิจกรรม
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
        />
      </div>
    </ResponsiveDialog>
  );
}
