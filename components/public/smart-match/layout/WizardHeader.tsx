"use client";

import { ChevronLeft, TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface WizardHeaderProps {
  step: number;
  totalSteps: number;
  currentStepIndex: number;
  onBack: () => void;
}

export function WizardHeader({
  step,
  totalSteps,
  currentStepIndex,
  onBack,
}: WizardHeaderProps) {
  const { t } = useLanguage();
  return (
    <div className="flex justify-between items-center relative ">
      <div className="flex items-center gap-3">
        {step > 1 && step < 4 && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all group"
            title={t("common.back")}
          >
            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}
        <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          {t("home.faq.title").includes("Match")
            ? t("home.faq.title")
            : "Smart Match Wizard"}
        </div>
      </div>

      {/* PROGRESS DOTS */}
      <div className="flex gap-1.5">
        {[...Array(totalSteps)].map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all duration-500 ${
              i <= currentStepIndex ? "bg-blue-600 w-4" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
