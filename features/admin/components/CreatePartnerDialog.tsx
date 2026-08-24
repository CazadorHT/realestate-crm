"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PartnerForm } from "./PartnerForm";
import { Handshake, Plus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface CreatePartnerDialogProps {
  onSuccess?: () => void;
}

export function CreatePartnerDialog({ onSuccess }: CreatePartnerDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
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
              {isEn ? "Add New Marketing Channel" : "เพิ่มช่องทางการตลาดใหม่"}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 ml-0.5">
              {isEn ? "Create Partner Badge" : "Add New Marketing Channel"}
            </span>
          </div>
        </div>
      }
      trigger={
        <Button
          size="lg"
          className="bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-200 font-bold rounded-xl gap-2 px-6 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          {isEn ? "Add Channel" : "เพิ่มช่องทาง"}
        </Button>
      }
    >
      <div className="p-6 bg-white rounded-b-2xl">
        <PartnerForm
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
