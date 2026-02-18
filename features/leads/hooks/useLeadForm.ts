"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { leadFormSchema, type LeadFormValues } from "../types";

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
  onSubmitAction?: (values: LeadFormValues) => Promise<void>,
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema) as unknown as Resolver<any>,
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
          await onSubmitAction(values);
          toast.success("บันทึกข้อมูลสำเร็จ");
        }
      } catch (e: any) {
        if (isNextRedirectError(e)) {
          toast.success("บันทึกข้อมูลสำเร็จ");
          throw e;
        }
        toast.error(e?.message ?? "เกิดข้อผิดพลาด");
        setError(e?.message ?? "เกิดข้อผิดพลาด");
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
