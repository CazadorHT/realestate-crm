"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { FAQForm } from "./FAQForm";
import { FaQuestion } from "react-icons/fa6";

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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-4xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FaQuestion className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-xl font-bold text-slate-800">แก้ไขคำถาม (FAQs)</span>
        </div>
      }
    >
      <div className="p-6">
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
    </ResponsiveDialog>
  );
}
