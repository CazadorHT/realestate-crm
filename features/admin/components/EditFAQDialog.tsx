"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { FAQForm } from "./FAQForm";
import { FaQuestion } from "react-icons/fa6";
import { FAQItem } from "@/features/admin/faqs-actions";
import { useLanguage } from "@/lib/i18n/language-context";

interface EditFAQDialogProps {
  faq: FAQItem | null;
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
  const { language } = useLanguage();
  const isEn = language === "en";

  if (!faq) return null;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-4xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-100/50 shadow-xs">
            <FaQuestion className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {isEn ? "Edit FAQ" : "แก้ไขข้อมูลคำถาม"}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 ml-0.5">
              {isEn ? "Edit FAQ Entry" : "ปรับปรุงรายการคำถาม"}
            </span>
          </div>
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
