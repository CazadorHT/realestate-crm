"use client";

import { useEffect } from "react";
import { type UseFormReturn } from "react-hook-form";
import { format, addMonths, subDays, isValid, differenceInCalendarMonths } from "date-fns";
import { type ContractFormInput } from "@/features/rental-contracts/schema";

interface DateSyncProps {
  form: UseFormReturn<ContractFormInput>;
  isSale: boolean;
}

export function useContractDateSync({
  form,
  isSale,
}: DateSyncProps) {
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");

  // Helper to update End Date based on a term (months)
  const updateEndDateFromTerm = (months: number) => {
    if (!startDate || isSale) return;
    const start = new Date(startDate);
    if (isValid(start)) {
      const end = subDays(addMonths(start, months), 1);
      form.setValue("end_date", format(end, "yyyy-MM-dd"), { shouldDirty: true });
    }
  };

  // Sync Lease Term from End Date changes
  useEffect(() => {
    const endState = form.getFieldState("end_date");
    if (startDate && endDate && !isSale && endState.isDirty) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isValid(start) && isValid(end) && end > start) {
        const diff = differenceInCalendarMonths(end, start);
        if (form.getValues("lease_term_months") !== diff && diff > 0) {
           form.setValue("lease_term_months", diff, { shouldValidate: true });
        }
      }
    }
  }, [endDate, startDate, isSale, form]);

  return {
    updateEndDateFromTerm,
  };
}
