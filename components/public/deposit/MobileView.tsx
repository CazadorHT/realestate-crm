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
import { cn } from "@/lib/utils";

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
        className="sm:hidden bg-white rounded-t-[32px] flex flex-col items-center relative"
      >
        {/* Pull Handle */}
        <div className="w-10 h-1.5 bg-slate-100 rounded-full mt-3 mb-6" />

        {/* Title */}
        <div className="px-8 text-center mb-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl xs:text-[28px] sm:text-3xl font-semibold bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 bg-clip-text text-transparent tracking-tight leading-tight"
          >
            {t("deposit.dialog.title")}
          </motion.h2>
          <p className="text-[10px] xs:text-xs text-slate-400 mt-2 font-semibold uppercase tracking-[0.15em] opacity-80">
            {t("deposit.dialog.subtitle")}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="w-full px-10 pb-8">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-5 left-[10%] right-[10%] h-px bg-slate-100 z-0" />
            <motion.div
              className="absolute top-5 left-[10%] h-1.5px bg-linear-to-r from-blue-500 to-indigo-500 z-0 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
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
                className="flex flex-col items-center z-10 w-24 relative"
              >
                <StepIcon stepNum={step.id} currentStep={currentStep} />
                <motion.span
                  animate={{
                    opacity: currentStep === step.id ? 1 : 0.6,
                    color: currentStep === step.id ? "#2563eb" : "#94a3b8",
                  }}
                  className="text-[8.5px] xs:text-[10px] mt-3 font-black uppercase tracking-wider transition-colors duration-300 text-center leading-tight px-1"
                >
                  {step.label}
                </motion.span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-slate-50" />
      </motion.div>

      {/* ── Mobile Form Content Area ── */}
      <div className="sm:hidden flex-1 overflow-y-auto min-h-0 bg-white">
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="flex flex-col min-h-full"
        >
          <div className="p-8 space-y-8 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative"
              >
                {currentStep === 1 &&
                  renderNameField(form, true, t, onFormStart)}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 gap-7">
                    {renderPhoneField(form, true, t, onFormStart)}
                    {renderLineField(form, true, t, onFormStart)}
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {renderPropertyTypeField(form, true, t, onFormStart)}
                    {renderMessageField(form, true, t, onFormStart)}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Mobile Footer ── */}
          <div className="shrink-0 sticky bottom-0 px-8 pt-4 pb-[calc(env(safe-area-inset-bottom,20px)+24px)] bg-white/95 backdrop-blur-xl z-20 border-t border-slate-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      s === currentStep ? "w-6 bg-blue-600" : "w-2 bg-slate-100",
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                {t("property.contact_dialog.step_of", {
                  current: currentStep,
                  total: totalSteps,
                })}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => (currentStep === 1 ? onCancel() : prevStep())}
                className="h-14 flex-1 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-semibold text-base transition-all active:bg-slate-100"
              >
                {currentStep === 1 ? (
                  <>
                    <X className="w-5 h-5 mr-2" />{" "}
                    {t("common.cancel") || "ยกเลิก"}
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5" />{" "}
                    {t("common.back") || "ย้อนกลับ"}
                  </>
                )}
              </Button>

              <div className="flex-[1.5]">
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="w-full h-14 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] active:opacity-90 transition-all"
                  >
                    {t("common.next") || "ถัดไป"}
                    <ChevronRight className="w-5 h-5 ml-1.5" />
                  </Button>
                ) : (
                  <SubmitButton isLoading={isLoading} />
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
