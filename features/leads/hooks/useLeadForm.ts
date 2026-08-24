"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { leadFormSchema, getLeadFormSchema, type LeadFormValues } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

function isNextRedirectError(e: unknown) {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as any).digest === "string" &&
    (e as any).digest.startsWith("NEXT_REDIRECT")
  );
}

export function useLeadForm(
  initialValues?: Partial<LeadFormValues>,
  onSubmitAction?: (values: LeadFormValues) => Promise<void | { success: boolean; message: string }>,
) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(getLeadFormSchema(isEn)) as unknown as Resolver<any>,
    mode: "onChange",
    defaultValues: {
      full_name: "",
      stage: "NEW",
      source: "OTHER",
      budget_min: null,
      budget_max: null,
      min_bedrooms: null,
      min_bathrooms: null,
      min_size_sqm: null,
      max_size_sqm: null,
      num_occupants: null,
      has_pets: false,
      need_company_registration: false,
      allow_airbnb: false,
      is_foreigner: false,
      lead_type: "INDIVIDUAL",
      nationality: ["ไทย"],
      id_card: "",
      passport: "",
      preferred_locations: [],
      note: "",
      ...initialValues,
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        if (onSubmitAction) {
          const result = await (onSubmitAction(values) as any);
          
          // Check if the action returned a standard ActionState object
          if (result && typeof result === 'object' && 'success' in result) {
            if (result.success) {
              toast.success(result.message || "บันทึกข้อมูลสำเร็จ");
            } else {
              const msg = result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
              toast.error(msg);
              setError(msg);
              return; // Stop here on failure
            }
          } else {
            // Fallback for actions that don't return ActionState (legacy or simple promises)
            toast.success("บันทึกข้อมูลสำเร็จ");
          }
        }
      } catch (e: any) {
        if (isNextRedirectError(e)) {
          // Redirects in Server Actions are thrown as special errors
          // We usually don't want to show an error toast for them
          throw e;
        }
        const msg = e?.message ?? "เกิดข้อผิดพลาด";
        toast.error(msg);
        setError(msg);
      }
    });
  };

  return {
    form,
    onSubmit,
    isPending,
    error,
  };
}
