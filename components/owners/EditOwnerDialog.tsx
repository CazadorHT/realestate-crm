"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { OwnerForm } from "@/features/owners/OwnerForm";
import { Owner } from "@/features/owners/types";

interface EditOwnerDialogProps {
  owner: Owner;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditOwnerDialog({
  owner,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditOwnerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={`แก้ไขข้อมูล: ${owner.full_name}`}
      trigger={trigger}
    >
      <div className="mt-2 pb-6">
        <OwnerForm
          mode="edit"
          id={owner.id}
          initialValues={owner}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
