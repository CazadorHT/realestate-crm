"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { FAQForm } from "./FAQForm";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaQuestion } from "react-icons/fa6";

export function CreateFAQDialog() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-4xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
          <FaQuestion className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-xl font-bold text-slate-800">เพิ่มคำถามใหม่ (FAQs)</span>
        </div>
      }
      trigger={
        <Button
          size="lg"
          className="bg-white text-slate-800 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2"
        >
          <Plus className="h-5 w-5" />
          เพิ่มคำถามใหม่
        </Button>
      }
    >
      <div className="p-6">
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
