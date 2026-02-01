"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
}

export function LeadActivityDialog({
  leadId,
  leadName,
  onSubmitAction,
  triggerVariant = "default",
  triggerClassName,
}: LeadActivityDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (values: LeadActivityFormValues) => {
    await onSubmitAction(values);
    setOpen(false); // Close dialog on success
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={cn("gap-2", triggerClassName)}
        >
          <Plus className="h-4 w-4" />
          บันทึกกิจกรรม
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>บันทึกกิจกรรมใหม่</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <LeadActivityForm onSubmitAction={handleSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
