"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { DepositLeadInput } from "@/features/public/types";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  renderNameField,
  renderPhoneField,
  renderLineField,
  renderPropertyTypeField,
  renderMessageField,
} from "./FormFields";
import { SubmitButton, StepIcon } from "./SharedComponents";

export function DepositMobileView({
  form,
  currentStep,
  totalSteps,
  isLoading,
  nextStep,
  prevStep,
  onCancel,
  onSubmit,
}: {
  form: UseFormReturn<DepositLeadInput>;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  onCancel: () => void;
  onSubmit: (values: DepositLeadInput) => Promise<void>;
}) {
  const { t } = useLanguage();

  const STEPS = [
    {
      id: 1,
      label: t("property.contact_dialog.step1_label") || "ข้อมูลผู้ติดต่อ",
    },
    {
      id: 2,
      label: t("property.contact_dialog.step2_label") || "ช่องทางติดต่อ",
    },
    {
      id: 3,
      label: t("property.contact_dialog.step3_label") || "ข้อมูลอสังหาฯ",
    },
  ];

  return (
    <div className="sm:hidden flex flex-col bg-white rounded-t-[28px]">
      {/* ── Mobile Header ── */}
      <div className="bg-white rounded-t-[28px] flex flex-col items-center relative">
        {/* Pull Handle */}
        <div className="w-10 h-1 bg-slate-200/80 rounded-full mt-3 mb-4" />

        {/* Title */}
        <div className="px-6 text-center mb-5">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
            {t("deposit.dialog.title")}
          </h2>
          <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-normal">
            ⚡ {t("deposit.dialog.subtitle")}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="w-full px-6 pb-4">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute top-4 left-[16%] right-[16%] h-[2px] bg-slate-100 z-0" />

            {/* Progress Line */}
            <div
              className="absolute top-4 left-[16%] h-[2px] bg-blue-500 z-0 transition-all duration-500 ease-out"
              style={{
                width:
                  currentStep === 1 ? "0%" : currentStep === 2 ? "34%" : "68%",
              }}
            />

            {STEPS.map((step) => (
              <div
                key={step.id}
                className="flex flex-col items-center z-10 flex-1"
              >
                <StepIcon stepNum={step.id} currentStep={currentStep} />
                <span
                  className={`text-[10px] mt-1.5 font-medium transition-colors duration-300 ${
                    currentStep === step.id
                      ? "text-blue-600"
                      : currentStep > step.id
                        ? "text-blue-500"
                        : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* ── Mobile Form Content Area (Scrollable container matches ContactAgentDialog) ── */}
      <div className="sm:hidden p-6 flex flex-col overflow-y-auto">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 flex-1 flex flex-col relative"
        >
          {/* Step 1: Contact Info */}
          <div
            className={`transition-all duration-500 ease-in-out ${currentStep === 1 ? "block animate-in fade-in slide-in-from-right-8" : "hidden"}`}
          >
            {renderNameField(form, true)}
          </div>

          {/* Step 2: More Contact Info */}
          <div
            className={`transition-all duration-500 ease-in-out ${currentStep === 2 ? "block animate-in fade-in slide-in-from-right-8" : "hidden"}`}
          >
            <div className="grid grid-cols-1 gap-5">
              {renderPhoneField(form, true)}
              {renderLineField(form, true)}
            </div>
          </div>

          {/* Step 3: Message */}
          <div
            className={`transition-all duration-500 ease-in-out ${currentStep === 3 ? "block animate-in fade-in slide-in-from-right-8" : "hidden"}`}
          >
            <div className="space-y-6">
              {renderPropertyTypeField(form, true)}
              {renderMessageField(form, true)}
            </div>
          </div>

          {/* ── Mobile Footer (Sticky at bottom within the scrollable area) ── */}
          <div className="mt-auto sticky bottom-0 -mx-6 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom,24px)+20px)] bg-white/95 backdrop-blur-md z-10 border-t border-slate-100/80">
            <p className="text-[10px] text-slate-400 text-center mb-3 font-medium tracking-wide">
              {t("property.contact_dialog.step_of", {
                current: currentStep,
                total: totalSteps,
              })}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => (currentStep === 1 ? onCancel() : prevStep())}
                className="h-13 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold text-base transition-all active:scale-[0.97]"
              >
                {currentStep === 1 ? (
                  <>
                    <X className="w-4 h-4 mr-2" />{" "}
                    {t("common.cancel") || "ยกเลิก"}
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-1" />{" "}
                    {t("common.back") || "ย้อนกลับ"}
                  </>
                )}
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-13 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 active:scale-[0.97] transition-all"
                >
                  {t("common.next") || "ถัดไป"}
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <SubmitButton isLoading={isLoading} />
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
