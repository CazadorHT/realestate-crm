"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { DialogTitle } from "@/components/ui/dialog";
import { UseFormReturn } from "react-hook-form";
import { DepositLeadInput } from "@/features/public/types";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnimatedClock,
  AnimatedShield,
  AnimatedHeadset,
} from "@/components/common/animated-icons";
import {
  NameField,
  PhoneField,
  EmailField,
  LineField,
  WeChatField,
  WhatsAppField,
  PropertyTypeField,
  PropertyImageField,
  MessageField,
} from "./FormFields";
import { SubmitButton, StepIcon } from "./SharedComponents";
import { cn } from "@/lib/utils";

export function DepositDesktopView({
  form,
  currentStep,
  totalSteps,
  isLoading,
  nextStepAction,
  prevStepAction,
  onCancelAction,
  onSubmitAction,
  onInvalidAction,
  onFormStartAction,
}: {
  form: UseFormReturn<DepositLeadInput>;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  nextStepAction: () => void;
  prevStepAction: () => void;
  onCancelAction: () => void;
  onSubmitAction: (values: DepositLeadInput) => void;
  onInvalidAction: (errors: any) => void;
  onFormStartAction: () => void;
}) {
  const { t } = useLanguage();
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;
  const companyName = settings.company_name || siteConfig.company;

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

  // Logic to determine if a step is completed for micro-interactions
  const isStep1Done = !!form.watch("fullName");
  const isStep2Done = !!form.watch("phone");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (currentStep < totalSteps) {
        e.preventDefault();
        nextStepAction();
      }
    }
  };

  return (
    <div className="hidden sm:flex sm:flex-row h-full min-h-[580px] overflow-hidden rounded-2xl">
      {/* ── Left Panel: Branding & Steps ── */}
      <div className="w-[300px] shrink-0 bg-[#0c1e4c] text-white p-8 flex flex-col justify-between relative overflow-hidden">
        {/* Advanced Mesh Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-br from-blue-700/20 via-transparent to-indigo-900/40" />
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-20%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/grid.svg')] bg-center mask-[radial-gradient(white,transparent_85%)] opacity-[0.04] pointer-events-none" />
        </div>

        <div className="relative z-10 space-y-12">
          {/* Logo Section */}
          <m.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-20 h-20 bg-white/20 rounded-xl p-1 shadow-xl shadow-blue-900/20">
              <Image
                src={siteConfig.brandCard}
                alt={siteName}
                width={60}
                height={60}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight leading-none">
                {siteName}
              </span>
              <span className="text-[9px] text-blue-200/60 uppercase tracking-widest mt-1 font-semibold">
                {t("deposit.wizard.property_portal") || "Property Portal"}
              </span>
            </div>
          </m.div>

          {/* Vertical Step Indicator */}
          <div className="space-y-8 pt-4">
            {STEPS.map((step) => {
              const isCompleted =
                currentStep > step.id ||
                (step.id === 1 && isStep1Done) ||
                (step.id === 2 && isStep2Done);
              const isActive = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-4 group cursor-default"
                >
                  <StepIcon
                    stepNum={step.id}
                    currentStep={
                      isCompleted && !isActive ? step.id + 1 : currentStep
                    }
                    isDesktop
                  />
                  <div>
                    <p
                      className={cn(
                        "text-sm font-bold transition-all duration-300",
                        isActive
                          ? "text-white"
                          : isCompleted
                            ? "text-emerald-400"
                            : "text-blue-200/50",
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-blue-200/40 uppercase tracking-wider font-semibold mt-0.5">
                      {isActive
                        ? t("deposit.wizard.currently_editing") ||
                          "Currently Editing"
                        : isCompleted
                          ? t("deposit.wizard.completed") || "Completed"
                          : t("deposit.wizard.pending") || "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-[11px] text-blue-100/60 font-medium leading-relaxed">
              {t("deposit.dialog.subtitle")}
            </p>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="relative z-10 pt-6 border-t border-white/10">
          <p className="text-[9px] text-blue-200/30 uppercase tracking-[0.2em] font-bold">
            {companyName}
          </p>
        </div>
      </div>

      {/* ── Right Panel: Form Wizard ── */}
      <div className="flex-1 bg-white flex flex-col min-h-0">
        {/* Horizontal Progress Bar */}
        <div className="h-1.5 w-full bg-slate-50 relative shrink-0">
          <m.div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-blue-600 to-indigo-600 shadow-[2px_0_8px_rgba(37,99,235,0.3)]"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10">
          <form
            onSubmit={form.handleSubmit(onSubmitAction, onInvalidAction)}
            onKeyDown={handleKeyDown}
            className="h-full flex flex-col"
          >
            <div className="flex-1 min-h-[350px]">
              <AnimatePresence mode="wait">
                <m.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                      {STEPS[currentStep - 1].label}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {currentStep === 1 && t("deposit.wizard.step1_desc")}
                      {currentStep === 2 && t("deposit.wizard.step2_desc")}
                      {currentStep === 3 && t("deposit.wizard.step3_desc")}
                    </p>
                  </div>

                  <div className="pt-2">
                    {currentStep === 1 && (
                      <NameField
                        isMobile={false}
                        t={t}
                        onFocus={onFormStartAction}
                      />
                    )}
                    {currentStep === 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <PhoneField
                            isMobile={false}
                            t={t}
                            onFocus={onFormStartAction}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <EmailField
                            isMobile={false}
                            t={t}
                            onFocus={onFormStartAction}
                          />
                        </div>
                        <LineField
                          isMobile={false}
                          t={t}
                          onFocus={onFormStartAction}
                        />
                        <WhatsAppField
                          isMobile={false}
                          t={t}
                          onFocus={onFormStartAction}
                        />
                        <div className="md:col-span-2">
                          <WeChatField
                            isMobile={false}
                            t={t}
                            onFocus={onFormStartAction}
                          />
                        </div>
                      </div>
                    )}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <PropertyTypeField
                          isMobile={false}
                          t={t}
                          onFocus={onFormStartAction}
                        />
                        <PropertyImageField isMobile={false} t={t} />
                        <MessageField isMobile={false} t={t} />
                      </div>
                    )}
                  </div>
                </m.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="pt-10 mt-auto flex items-center gap-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStepAction}
                  className="h-11 px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t("common.back") || "ย้อนกลับ"}
                </Button>
              )}

              <div className="flex-1">
                {currentStep === totalSteps ? (
                  <SubmitButton isLoading={isLoading} />
                ) : (
                  <Button
                    type="button"
                    onClick={nextStepAction}
                    className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    {t("common.next") || "ถัดไป"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-6 font-medium italic opacity-60">
              {t("deposit.wizard.press_enter") || "Press Enter to continue"}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
