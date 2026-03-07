"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { depositLeadSchema } from "@/features/public/schema";
import { DepositLeadInput } from "@/features/public/types";
import { createDepositLeadAction } from "@/features/public/actions";
import { DepositDesktopView } from "./DesktopView";
import { DepositMobileView } from "./MobileView";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

export function DepositWizard({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<DepositLeadInput>({
    resolver: zodResolver(depositLeadSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      lineId: "",
      details: "",
      propertyType: undefined,
    },
  });
  const hasStartedRef = useRef(false);
  const wizardRef = useRef<HTMLDivElement>(null);
 
  // Capture Browser-level validation errors
  useEffect(() => {
    const wizard = wizardRef.current;
    if (!wizard) return;
 
    const handleInvalid = (e: Event) => {
      const target = e.target as HTMLInputElement;
      console.log("GTM Debug: lead_form_error (Deposit Browser)", {
        field: target.name,
        message: target.validationMessage,
      });
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
          error_message: target.validationMessage,
          field: target.name,
          subject: "Deposit Property",
        });
      } catch (err) {}
    };
 
    wizard.addEventListener("invalid", handleInvalid, true);
    return () => wizard.removeEventListener("invalid", handleInvalid, true);
  }, []);
 
  // Capture Zod-level validation errors
  const onInvalid = (errors: any) => {
    const firstErrorField = Object.keys(errors)[0];
    const errorMessage = errors[firstErrorField]?.message || "Validation Error";
    console.log("GTM Debug: lead_form_error (Deposit Zod)", {
      field: firstErrorField,
      message: errorMessage,
    });
    try {
      pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
        error_message: `Zod Validation: ${errorMessage}`,
        field: firstErrorField,
        subject: "Deposit Property",
      });
    } catch (e) {}
  };
 
  const handleFormStart = () => {
    if (!hasStartedRef.current) {
      console.log("GTM Debug: lead_form_start (Deposit) triggering");
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_START, {
          subject: "Deposit Property",
        });
        hasStartedRef.current = true;
      } catch (e) {
        console.error("GTM Error:", e);
      }
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof DepositLeadInput)[] = [];
    if (currentStep === 1) fieldsToValidate = ["fullName"];
    if (currentStep === 2) fieldsToValidate = ["phone"];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  async function onSubmit(values: DepositLeadInput) {
    setIsLoading(true);
    try {
      const res = await createDepositLeadAction(values);
      if (res.success) {
        toast.success(
          t("deposit.success.message") || "ข้อมูลของคุณถูกส่งเรียบร้อยแล้ว",
        );
        form.reset();
        onSuccess();
      } else {
        console.log("GTM Debug: lead_form_error (Deposit Server Side)", { message: res.message });
        toast.error(res.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
        try {
          pushToDataLayer(GTM_EVENTS.LEAD_FORM_ERROR, {
            error_message: res.message,
            subject: "Deposit Property",
          });
        } catch (e) {}
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <div ref={wizardRef}>
        <DepositMobileView
          form={form}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLoading={isLoading}
          nextStep={nextStep}
          prevStep={prevStep}
          onCancel={onCancel}
          onSubmit={onSubmit}
          onInvalid={onInvalid}
          onFormStart={handleFormStart}
        />
        <DepositDesktopView
          form={form}
          currentStep={currentStep}
          isLoading={isLoading}
          onSubmit={onSubmit}
          onInvalid={onInvalid}
          onFormStart={handleFormStart}
        />
      </div>
    </Form>
  );
}
