"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { DepositLeadInput } from "@/features/public/types";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  onInvalid,
  onFormStart,
}: {
  form: UseFormReturn<DepositLeadInput>;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  onCancel: () => void;
  onSubmit: (values: DepositLeadInput) => Promise<void>;
  onInvalid?: (errors: any) => void;
  onFormStart: () => void;
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
    <>
      {/* ── Mobile Header ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sm:hidden bg-white rounded-t-[28px] flex flex-col items-center relative shadow-sm"
      >
        {/* Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mt-3 mb-4" />

        {/* Title */}
        <div className="px-6 text-center mb-5">
          <motion.h2
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold bg-linear-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight leading-tight"
          >
            {t("deposit.dialog.title")}
          </motion.h2>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
            {t("deposit.dialog.subtitle")}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="w-full px-8 pb-5">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-slate-50 z-0" />
            <motion.div
              className="absolute top-4 left-[10%] h-[2px] bg-linear-to-r from-blue-500 to-indigo-500 z-0"
              initial={{ width: "0%" }}
              animate={{
                width:
                  currentStep === 1 ? "0%" : currentStep === 2 ? "40%" : "80%",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />

            {STEPS.map((step) => (
              <div
                key={step.id}
                className="flex flex-col items-center z-10 w-20"
              >
                <StepIcon stepNum={step.id} currentStep={currentStep} />
                <motion.span
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                    color: currentStep === step.id ? "#2563eb" : "#94a3b8",
                  }}
                  className="text-[10px] mt-2 font-bold uppercase tracking-wider transition-colors duration-300"
                >
                  {step.label}
                </motion.span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-linear-to-r from-transparent via-slate-100 to-transparent" />
      </motion.div>

      {/* ── Mobile Form Content Area ── */}
      <div className="sm:hidden p-6 flex flex-col overflow-y-auto">
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-5 flex-1 flex flex-col relative"
        >
          <div className="space-y-5 flex-1 relative min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 pt-2"
              >
                {currentStep === 1 && renderNameField(form, true, onFormStart)}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 gap-5">
                    {renderPhoneField(form, true, onFormStart)}
                    {renderLineField(form, true, onFormStart)}
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {renderPropertyTypeField(form, true, onFormStart)}
                    {renderMessageField(form, true, onFormStart)}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Mobile Footer ── */}
          <div className="mt-auto shrink-0 sticky bottom-0 -mx-6 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom,24px)+20px)] bg-white/95 backdrop-blur-md z-10 border-t border-slate-100/80">
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
    </>
  );
}
