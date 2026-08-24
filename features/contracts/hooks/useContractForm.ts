"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, addMonths } from "date-fns";
import { 
  contractFormSchema, 
  getContractFormSchema,
  ContractFormInput, 
  type ContractDealSummary 
} from "@/features/rental-contracts/schema";
import { upsertContractAction, getContractByDealId } from "@/features/rental-contracts/actions";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Sub-hooks for specialized logic
import { useContractPersistence } from "./useContractPersistence";
import { useContractDateSync } from "./useContractDateSync";

export function useContractForm(onSuccess?: () => void) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDeal, setSelectedDeal] = useState<ContractDealSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyHasContract, setAlreadyHasContract] = useState(false);
  const [isPriceEditing, setIsPriceEditing] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultEndDate = format(addMonths(new Date(), 12), "yyyy-MM-dd");

  const form = useForm<ContractFormInput>({
    resolver: zodResolver(getContractFormSchema(isEn)) as unknown as Resolver<ContractFormInput>,
    mode: "onChange",
    defaultValues: {
      start_date: todayStr,
      end_date: defaultEndDate,
      rent_price: 0,
      lease_term_months: 12,
      deposit_amount: 0,
      advance_payment_amount: 0,
    },
  });

  const dealId = form.watch("deal_id");
  const isSale = selectedDeal?.deal_type === "SALE";

  // 1. Persistence & Debounced Saving
  const { clearDraft } = useContractPersistence({
    form,
    selectedDeal,
    setSelectedDeal,
  });

  // 2. Date Calculations & Sync
  const { updateEndDateFromTerm } = useContractDateSync({
    form,
    isSale,
  });

  // 3. Existing contract check
  useEffect(() => {
    if (dealId) {
      getContractByDealId(dealId).then((existing) => {
        setAlreadyHasContract(!!existing);
      });
    } else {
      setAlreadyHasContract(false);
    }
  }, [dealId]);

  // 4. Navigation Helpers
  const nextStep = async () => {
    if (currentStep === 1) {
      if (!dealId) {
        toast.error(isEn ? "Please select a deal before proceeding" : "กรุณาเลือกดีลก่อนไปขั้นตอนถัดไป");
        return;
      }
    } else if (currentStep === 2) {
      const isValidStep = await form.trigger([
        "start_date",
        "end_date",
        "rent_price",
        "lease_term_months",
      ]);
      if (!isValidStep) {
        toast.error(isEn ? "Please fill in all required fields correctly" : "กรุณาระบุข้อมูลให้ถูกต้องครบถ้วน");
        return;
      }
    }
    setCurrentStep((s) => s + 1);
  };

  const prevStep = () => setCurrentStep((s) => s - 1);

  // 5. Submit Handler
  const handleSubmission: SubmitHandler<ContractFormInput> = async (data) => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...data,
        tenant_id: selectedDeal?.tenant_id || data.tenant_id
      };

      const res = await upsertContractAction(null, submissionData);
      if (res.success) {
        toast.success(isEn ? "Contract created successfully" : "สร้างสัญญาเรียบร้อย");
        clearDraft(dealId);
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(res.message || (isEn ? "Unable to save data, please try again" : "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง"));
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error(isEn ? "Server connection error" : "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    selectedDeal,
    setSelectedDeal,
    isSubmitting,
    alreadyHasContract,
    isPriceEditing,
    setIsPriceEditing,
    onSubmit: form.handleSubmit(handleSubmission),
    isSale,
    updateEndDateFromTerm,
    clearDraft: () => clearDraft(dealId),
  };
}

