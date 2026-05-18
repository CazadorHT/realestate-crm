import { useEffect, useCallback, useState, useRef } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type PropertyFormValues } from "../schema";

const STORAGE_KEY = "property-form-draft";
const DEBOUNCE_MS = 1500; // Smart save 1.5s after user stops typing

export function usePropertyFormDraft(
  form: UseFormReturn<PropertyFormValues>,
  mode: "create" | "edit",
  propertyId?: string,
) {
  const storageKey =
    mode === "create"
      ? STORAGE_KEY
      : propertyId
        ? `${STORAGE_KEY}-${propertyId}`
        : null;

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Smart Debounced Auto-Save
  useEffect(() => {
    if (!storageKey) return;

    const subscription = form.watch((value) => {
      // Only trigger save if form is dirty or has meaningful title/price entered
      const currentValues = form.getValues();
      if (!currentValues?.title && !currentValues?.price && !currentValues?.description) {
        return; // Don't save completely empty forms
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              timestamp: Date.now(),
              values: currentValues,
            }),
          );
          setLastSaved(new Date());
        } catch (e) {
          console.error("Failed to save draft", e);
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, storageKey]);

  // 2. Unsaved Changes Warning (Native)
  useEffect(() => {
    if (!form.formState.isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  // 3. Smart Check & Restore Logic
  const checkAndRestoreDraft = useCallback(() => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      const { values, timestamp } = JSON.parse(raw);

      // Expire draft after 7 days
      const validDuration = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > validDuration) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return { values: values as PropertyFormValues, timestamp };
    } catch (e) {
      console.error("Failed to parse draft", e);
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
      setLastSaved(null);
    }
  }, [storageKey]);

  return {
    checkAndRestoreDraft,
    clearDraft,
    lastSaved,
  };
}
