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
      label: t("property.contact_dialog.step1_label"),
    },
    {
      id: 2,
      label: t("property.contact_dialog.step2_label"),
    },
    {
      id: 3,
      label: t("property.contact_dialog.step3_label"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    } as const,
  };

  return (
    <>
      {/* ── Mobile Header (Fixed Pull Handle) ── */}
      {/* ── Mobile Header (Fixed Pull Handle) ── */}
     

      {/* ── Mobile Form Content Area ── */}
      <div className="sm:hidden flex-1 flex flex-col min-h-0 bg-white overflow-hidden max-h-full">
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="flex flex-col h-full overflow-hidden"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col flex-1 h-full min-h-0 overflow-hidden"
          >
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex flex-col min-h-full">
                {/* Scrollable Header Section */}
                <motion.div variants={itemVariants} className="flex flex-col items-center pt-4 pb-2">
                  {/* Title */}
                  <div className="px-6 text-center mb-6">
                    <motion.h2
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl md:text-2xl font-bold bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 bg-clip-text text-transparent tracking-tight leading-tight"
                    >
                      {t("deposit.dialog.title")}
                    </motion.h2>
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <div className="h-px w-4 bg-slate-200" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] opacity-80">
                        {t("deposit.dialog.subtitle")}
                      </p>
                      <div className="h-px w-4 bg-slate-200" />
                    </div>
                  </div>

                  {/* Step Indicator */}
                  <div className="w-full px-6 xs:px-10 mb-4">
                    <div className="relative flex items-center justify-between">
                      {/* Progress Track Container (Bounded by icons) */}
                      <div className="absolute top-4 left-0 right-0 h-[1.5px] z-0 mx-8 xs:mx-10">
                        {/* Background Track */}
                        <div className="absolute inset-0 bg-slate-100" />
                        
                        {/* Active Progress Fill */}
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-linear-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                          initial={{ width: "0%" }}
                          animate={{
                            width:
                              currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                          }}
                          transition={{ type: "spring", stiffness: 80, damping: 20 }}
                        />
                      </div>

                      {STEPS.map((step) => (
                        <div
                          key={step.id}
                          className="flex flex-col items-center z-10 relative w-12"
                        >
                          <StepIcon stepNum={step.id} currentStep={currentStep} />
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-20 pointer-events-none">
                            <motion.span
                              animate={{
                                opacity: currentStep === step.id ? 1 : 0.5,
                                scale: currentStep === step.id ? 1 : 0.95,
                                color: currentStep === step.id ? "#2563eb" : "#94a3b8",
                              }}
                              className={cn(
                                "text-[9px] xs:text-[11px] font-bold uppercase tracking-wider text-center leading-tight block w-full",
                                currentStep === step.id ? "opacity-100" : "opacity-60"
                              )}
                            >
                              {step.label.split(" ")[0]}
                            </motion.span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-px bg-slate-50/80" />
                </motion.div>

                {/* Form Fields Section */}
                <motion.div variants={itemVariants} className="p-4 space-y-4 flex-1">
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
                        <div className="grid grid-cols-1 gap-4">
                          {renderPhoneField(form, true, t, onFormStart)}
                          {renderLineField(form, true, t, onFormStart)}
                        </div>
                      )}
                      {currentStep === 3 && (
                        <div className="space-y-2">
                          {renderPropertyTypeField(form, true, t, onFormStart)}
                          {renderMessageField(form, true, t, onFormStart)}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>

            {/* ── Fixed Mobile Footer (Outside Scrollable Area) ── */}
            <motion.div
              variants={itemVariants}
              className="shrink-0 px-4 xs:px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,20px)+24px)] bg-white border-t border-slate-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-10"
            >
              <div className="flex items-center justify-between mb-3 px-1">
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

              <div className="flex gap-2 xs:gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => (currentStep === 1 ? onCancel() : prevStep())}
                  className="h-10 flex-1 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-semibold text-xs transition-all active:bg-slate-100"
                >
                  {currentStep === 1 ? (
                    <>
                      <X className="w-3.5 h-3.5 mr-1.5" />{" "}
                      {t("common.cancel") || "ยกเลิก"}
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="w-3.5 h-3.5" />{" "}
                      {t("common.back") || "ย้อนกลับ"}
                    </>
                  )}
                </Button>

                <div className="flex-[1.5]">
                  {currentStep === totalSteps ? (
                    <SubmitButton isLoading={isLoading} />
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full h-10 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-[0_6px_15px_-4px_rgba(37,99,235,0.4)] active:opacity-90 transition-all"
                    >
                      {t("common.next") || "ถัดไป"}
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </form>
      </div>
    </>
  );
}
