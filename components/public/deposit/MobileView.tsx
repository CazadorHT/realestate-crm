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

  const STEP_LABELS = [
    t("property.contact_dialog.step1_label") || "ข้อมูลผู้ติดต่อ",
    t("property.contact_dialog.step2_label") || "ช่องทางติดต่อ",
    t("property.contact_dialog.step3_label") || "ข้อมูลอสังหาฯ",
  ];

  return (
    <div className="sm:hidden flex flex-col max-h-[85dvh] bg-white rounded-t-[28px]">
      {/* ── Mobile Header ── */}
      <div className="flex flex-col items-center pt-2 pb-4">
        {/* Pull Handle */}
        <div className="w-10 h-1 bg-slate-200/80 rounded-full mb-5" />

        <div className="px-6 text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {t("deposit.form.submit_btn") || "ส่งข้อมูลฝากทรัพย์สิน"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            ⚡️ {t("deposit.subtitle") || "ฝากทรัพย์สินกับเรา"}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="w-full px-6">
          <div className="flex items-center justify-between relative max-w-xs mx-auto">
            <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-slate-100 z-0" />
            <div
              className="absolute top-4 left-[10%] h-[2px] bg-blue-500 z-0 transition-all duration-500 ease-out"
              style={{
                width:
                  currentStep === 1 ? "0%" : currentStep === 2 ? "40%" : "80%",
              }}
            />

            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center z-10 flex-1">
                <StepIcon stepNum={s} currentStep={currentStep} />
                <span
                  className={`text-[10px] mt-2 font-bold transition-all ${
                    currentStep === s
                      ? "text-blue-600 scale-105"
                      : "text-slate-400 font-medium"
                  }`}
                >
                  {STEP_LABELS[s - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-slate-100/60" />

      {/* ── Scrollable Content Area ── */}
      <div className="flex-1 overflow-y-auto px-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col min-h-full"
        >
          <div className="space-y-6 pt-6 flex-1">
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                {renderNameField(form, true)}
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-5">
                {renderPhoneField(form, true)}
                {renderLineField(form, true)}
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6 ">
                {renderPropertyTypeField(form, true)}
                {renderMessageField(form, true)}
              </div>
            )}
          </div>

          {/* ── Mobile Footer (Sticky at the bottom of the scrollable area) ── */}
          <div className="mt-auto sticky bottom-0 pt-3 pb-[calc(env(safe-area-inset-bottom,24px)+28px)] bg-white/95 backdrop-blur-md border-t border-slate-100/80 z-20 -mx-6 px-6">
            <p className="text-[10px] text-slate-400 text-center mb-3 font-medium tracking-wide">
              {t("property.contact_dialog.step_of", {
                current: currentStep,
                total: totalSteps,
              })}
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => (currentStep === 1 ? onCancel() : prevStep())}
                className="flex-1 h-13 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold text-base transition-all active:scale-[0.97]"
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
                  className="flex-[1.5] h-13 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 active:scale-[0.97] transition-all"
                >
                  {t("common.next") || "ถัดไป"}
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <div className="flex-[1.5]">
                  <SubmitButton isLoading={isLoading} />
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
