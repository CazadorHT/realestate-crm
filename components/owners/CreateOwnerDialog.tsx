"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { OwnerForm } from "@/features/owners/OwnerForm";
import { UserPlus } from "lucide-react";

export function CreateOwnerDialog() {
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setIsDirty(false);
      }}
      confirmOnClose={isDirty}
      title="เพิ่มเจ้าของทรัพย์ใหม่"
      trigger={
        <Button
          size="lg"
          className="bg-white text-slate-800 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold h-12 rounded-2xl border border-slate-100"
        >
          <UserPlus className="h-5 w-5 mr-2 text-indigo-600" />
          เพิ่มเจ้าของ
        </Button>
      }
    >
      <div className="mt-2 pb-6">
        <OwnerForm
          mode="create"
          isInDialog
          onDirtyChange={setIsDirty}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
