"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PartnerForm } from "./PartnerForm";
import { Handshake, Plus } from "lucide-react";

interface CreatePartnerDialogProps {
  onSuccess?: () => void;
}

export function CreatePartnerDialog({ onSuccess }: CreatePartnerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-2xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4">
          <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-100/50 shadow-xs text-rose-600">
            <Handshake className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              เพิ่มพาร์ทเนอร์ใหม่
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 ml-0.5">
              Add New Partner Entity
            </span>
          </div>
        </div>
      }
      trigger={
        <Button
          size="lg"
          className="bg-white text-slate-800 hover:bg-white/90 shadow-lg font-bold rounded-xl gap-2 px-6"
        >
          <Plus className="h-5 w-5" />
          เพิ่มพาร์ทเนอร์
        </Button>
      }
    >
      <div className="p-4 sm:p-6 bg-white rounded-b-2xl">
        <PartnerForm
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
