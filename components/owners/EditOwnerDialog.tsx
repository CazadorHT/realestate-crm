"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { OwnerForm } from "@/features/owners/OwnerForm";
import { Owner } from "@/features/owners/types";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const [isDirty, setIsDirty] = useState(false);
  const { language } = useLanguage();
  const isEn = language === "en";

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) setIsDirty(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      confirmOnClose={isDirty}
      title={isEn ? `Edit Owner: ${owner.full_name}` : `แก้ไขข้อมูล: ${owner.full_name}`}
      trigger={trigger}
    >
      <div className="mt-2 pb-6">
        <OwnerForm
          mode="edit"
          id={owner.id}
          initialValues={owner}
          isInDialog
          onDirtyChange={setIsDirty}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
