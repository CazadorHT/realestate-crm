"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Check, X, ChevronRight, ChevronLeft } from "lucide-react";
import { FaPaperPlane } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AnimatedSend } from "@/components/common/animated-icons";

// ── Submit Button ──
export function SubmitButton({
  compact,
  isLoading,
  title,
}: {
  compact?: boolean;
  isLoading?: boolean;
  title?: string;
}) {
  const { t } = useLanguage();

  return (
    <Button
      type="submit"
      disabled={isLoading}
      className={`w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_12px_25px_-8px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:scale-[0.98] font-bold h-14 rounded-2xl text-base ${
        compact ? "" : ""
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("property.contact_dialog.sending") || "กำลังส่ง..."}
        </>
      ) : (
        <>
          <AnimatedSend size={20} className="mr-2" />
          {title || t("property.contact_dialog.submit") || "ส่งข้อมูล"}
        </>
      )}
    </Button>
  );
}

// ── Step Indicator Icon (Mobile) ──
export function StepIcon({
  stepNum,
  currentStep,
}: {
  stepNum: number;
  currentStep: number;
}) {
  const isCompleted = currentStep > stepNum;
  const isActive = currentStep === stepNum;

  if (isCompleted) {
    return (
      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all duration-500">
        <Check className="w-5 h-5 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_8px_16px_rgba(37,99,235,0.3)] ring-4 ring-blue-50 transition-all duration-500 relative">
        <span className="text-sm font-bold text-white z-10">{stepNum}</span>
        <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-20" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-all duration-500 border border-slate-200/50">
      <span className="text-sm font-bold text-slate-400">{stepNum}</span>
    </div>
  );
}
