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
import { generateMetaEventId, sendMetaCAPIEvent } from "@/lib/meta-capi-utils";

export function DepositWizard({
  onSuccessAction,
  onCancelAction,
  location = "Unknown",
}: {
  onSuccessAction: () => void;
  onCancelAction: () => void;
  location?: string;
}) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<DepositLeadInput>({
    resolver: zodResolver(depositLeadSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      lineId: "",
      wechatId: "",
      whatsapp: "",
      details: "",
      propertyType: undefined,
      website_hp: "",
    },
  });
  const hasStartedRef = useRef(false);
  const wizardRef = useRef<HTMLDivElement>(null);

  // Track Form View on Mount
  useEffect(() => {
    try {
      pushToDataLayer(GTM_EVENTS.LEAD_FORM_VIEW, {
        subject: "Deposit Property",
        location: location,
      });
    } catch (e) {
      console.error("GTM Error:", e);
    }
  }, [location]);

  // Capture Browser-level validation errors
  useEffect(() => {
    const wizard = wizardRef.current;
    if (!wizard) return;

    const handleInvalid = (e: Event) => {
      const target = e.target as HTMLInputElement;
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
    if (currentStep === 2)
      fieldsToValidate = ["phone", "email", "lineId", "whatsapp", "wechatId"];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      const next = currentStep + 1;
      try {
        pushToDataLayer(GTM_EVENTS.LEAD_FORM_STEP, {
          step: currentStep,
          next_step: next,
          subject: "Deposit Property",
        });
      } catch (e) {}
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
        const eventId = generateMetaEventId("lead", res.leadId || values.fullName || "deposit");

        toast.success(
          t("deposit.success.message"),
        );
        try {
          pushToDataLayer(GTM_EVENTS.LEAD_FORM_SUCCESS, {
            event_id: eventId,
            lead_id: res.leadId,
            subject: "Deposit Property",
            content_type: "lead_form",
            content_name: "Deposit Property",
            currency: "THB",
            ...values,
          });

          void sendMetaCAPIEvent({
            eventName: "Lead",
            eventId,
            customData: {
              contentName: "Deposit Property",
              contentType: "lead_form",
              currency: "THB",
              contentIds: res.leadId ? [String(res.leadId)] : [],
              fullName: values.fullName,
              phone: values.phone,
              email: values.email || undefined,
            },
          });
        } catch (e) {}
        form.reset();
        onSuccessAction();
      } else {
        toast.error(res.message);
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
        {/* Anti-spam Honeypot Field (Hidden from real users, filled by bots) */}
        <input
          type="text"
          {...form.register("website_hp")}
          className="hidden pointer-events-none absolute opacity-0 -z-50"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <DepositMobileView
          form={form}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLoading={isLoading}
          nextStepAction={nextStep}
          prevStepAction={prevStep}
          onCancelAction={onCancelAction}
          onSubmitAction={onSubmit}
          onInvalidAction={onInvalid}
          onFormStartAction={handleFormStart}
        />
        <DepositDesktopView
          form={form}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLoading={isLoading}
          nextStepAction={nextStep}
          prevStepAction={prevStep}
          onCancelAction={onCancelAction}
          onSubmitAction={onSubmit}
          onInvalidAction={onInvalid}
          onFormStartAction={handleFormStart}
        />
      </div>
    </Form>
  );
}
