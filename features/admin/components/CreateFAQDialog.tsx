"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { FAQForm } from "./FAQForm";
import { Plus } from "lucide-react";

export function CreateFAQDialog() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-4xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-100/50 shadow-xs">
            <Plus className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-800 tracking-tight leading-tight">เพิ่มคำถามใหม่ (FAQs)</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 ml-0.5">Create New FAQ Entity</span>
          </div>
        </div>
      }
      trigger={
        <Button
          size="lg"
          className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 font-bold gap-2 px-6 rounded-xl"
        >
          <Plus className="h-5 w-5" />
          เพิ่มคำถามใหม่
        </Button>
      }
    >
      <div className="p-0">
        <FAQForm
          isNew={true}
          isStandalone={true}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
