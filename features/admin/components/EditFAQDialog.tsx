"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FAQForm } from "./FAQForm";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface EditFAQDialogProps {
  faq: FAQ | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditFAQDialog({
  faq,
  open,
  onOpenChange,
  onSuccess,
}: EditFAQDialogProps) {
  if (!faq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="bg-linear-to-r from-slate-800 to-slate-900 p-6">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <span className="text-blue-400">?</span>
            </div>
            แก้ไขคำถาม (FAQs)
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <FAQForm
            isNew={false}
            faqId={faq.id}
            initialData={faq}
            isStandalone={true}
            onSuccess={() => {
              onOpenChange(false);
              if (onSuccess) onSuccess();
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
