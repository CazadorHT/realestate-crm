"use client";

import { useEffect, useRef } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type ContractFormInput, type ContractDealSummary } from "@/features/rental-contracts/schema";

const BASE_STORAGE_KEY = "contract_draft_v3";

interface PersistenceProps {
  form: UseFormReturn<ContractFormInput>;
  selectedDeal: ContractDealSummary | null;
  setSelectedDeal: (deal: ContractDealSummary | null) => void;
}

export function useContractPersistence({
  form,
  selectedDeal,
  setSelectedDeal,
}: PersistenceProps) {
  const dealId = form.watch("deal_id");
  const getStorageKey = (id?: string) => `${BASE_STORAGE_KEY}_${id || "initial"}`;

  // 1. Initial Load & Migration
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;

    const initialKey = getStorageKey("initial");
    const initialSaved = localStorage.getItem(initialKey);
    
    if (initialSaved) {
      try {
        const parsed = JSON.parse(initialSaved);
        if (parsed.form) form.reset(parsed.form);
        if (parsed.selectedDealSummary) setSelectedDeal(parsed.selectedDealSummary);
      } catch (e) {
        console.error("Failed to restore initial draft", e);
      }
    }
    
    hasLoaded.current = true;
  }, [form, setSelectedDeal]);

  // Migration when deal_id is picked
  useEffect(() => {
    if (!dealId) return;

    const dealKey = getStorageKey(dealId);
    if (!localStorage.getItem(dealKey)) {
        const initialKey = getStorageKey("initial");
        const initialSaved = localStorage.getItem(initialKey);
        if (initialSaved) {
            localStorage.setItem(dealKey, initialSaved);
            localStorage.removeItem(initialKey);
        }
    } else {
        const saved = localStorage.getItem(dealKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.form) form.reset(parsed.form);
                if (parsed.selectedDealSummary) setSelectedDeal(parsed.selectedDealSummary);
            } catch (e) {
                console.error("Failed to restore deal-specific draft", e);
            }
        }
    }
  }, [dealId, form, setSelectedDeal]);

  // 2. Debounced Save (500ms)
  useEffect(() => {
    // Watch for ANY change in the form
    const subscription = form.watch((value) => {
      const timeoutId = setTimeout(() => {
        const key = getStorageKey(value.deal_id as string);
        const draft = {
          form: value,
          selectedDealSummary: selectedDeal
        };
        localStorage.setItem(key, JSON.stringify(draft));
      }, 500); // 500ms Debounce

      return () => clearTimeout(timeoutId);
    });
    
    // Note: RHF watch cleanup is handled by useEffect return
    return () => subscription.unsubscribe();
  }, [form, selectedDeal]);

  const clearDraft = (id?: string) => {
    localStorage.removeItem(getStorageKey(id));
    localStorage.removeItem(getStorageKey("initial"));
  };

  return {
    clearDraft,
    getStorageKey,
  };
}
