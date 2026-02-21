"use client";

import { useState } from "react";
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
        toast.error(res.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      {/* 
        We use CSS to hide/show views. 
        MobileView: visible only on xs/sm (sm:hidden)
        DesktopView: visible only on md+ (hidden sm:flex)
      */}
      <div>
        <DepositMobileView
          form={form}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLoading={isLoading}
          nextStep={nextStep}
          prevStep={prevStep}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
        <DepositDesktopView
          form={form}
          currentStep={currentStep}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </div>
    </Form>
  );
}
