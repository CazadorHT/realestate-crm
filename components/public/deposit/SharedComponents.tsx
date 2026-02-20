"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Check, X, ChevronRight, ChevronLeft } from "lucide-react";
import { FaPaperPlane } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
      className={`w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-[0.98] font-semibold ${
        compact ? "h-12 rounded-xl text-base" : "h-12 rounded-xl text-base"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("property.contact_dialog.sending") || "กำลังส่ง..."}
        </>
      ) : (
        <>
          <FaPaperPlane className="mr-2 h-4 w-4" />
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
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-300/50 transition-all duration-500">
        <Check className="w-4 h-4 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-400/40 ring-4 ring-blue-100 transition-all duration-500">
        <span className="text-sm font-bold text-white">{stepNum}</span>
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-all duration-500">
      <span className="text-sm font-medium text-slate-400">{stepNum}</span>
    </div>
  );
}
