"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FAQForm } from "./FAQForm";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CreateFAQDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="bg-white text-slate-800 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2"
      >
        <Plus className="h-5 w-5" />
        เพิ่มคำถามใหม่
      </Button>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="bg-linear-to-r from-slate-800 to-slate-900 p-6">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <span className="text-blue-400">?</span>
            </div>
            เพิ่มคำถามใหม่ (FAQs)
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <FAQForm
            isNew={true}
            isStandalone={true}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
