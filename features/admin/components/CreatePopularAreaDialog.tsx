"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PopularAreaForm } from "./PopularAreaForm";
import { createPopularArea } from "../popular-areas-actions";
import { MapPin, Plus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface CreatePopularAreaDialogProps {
  onSuccess: () => void;
}

export function CreatePopularAreaDialog({
  onSuccess,
}: CreatePopularAreaDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-3xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-100/50 shadow-xs text-emerald-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {isEn ? "Add Popular Area" : "เพิ่มทำเลยอดนิยม"}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 ml-0.5">
              {isEn ? "New Location Entry" : "Add New Popular Area"}
            </span>
          </div>
        </div>
      }
      trigger={
        <Button
          size="lg"
          className="bg-white text-slate-800 hover:bg-white/90 shadow-lg font-bold rounded-xl gap-2 px-6 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          {isEn ? "Add Area" : "เพิ่มทำเล"}
        </Button>
      }
    >
      <div className="p-6 bg-white rounded-b-2xl">
        <PopularAreaForm
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
          saveAction={createPopularArea}
        />
      </div>
    </ResponsiveDialog>
  );
}

