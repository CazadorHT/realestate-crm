"use client";

import { useEffect, useCallback, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type PropertyFormValues } from "../schema";
import { toast } from "sonner";

const STORAGE_KEY = "property-form-draft";
const SAVE_INTERVAL_MS = 3000; // Save every 3 seconds if changed

/**
 * Hook for:
 * 1. Auto-saving form data to localStorage
 * 2. Warning before leaving if unsaved changes exist (browser native)
 * 3. Restoring draft on mount
 */
export function usePropertyFormDraft(
  form: UseFormReturn<PropertyFormValues>,
  mode: "create" | "edit",
  propertyId?: string,
) {
  // We only enable draft for CREATE mode to avoid complexities with edit concurrency
  // Or handle edit mode by using a unique key per property ID
  const storageKey =
    mode === "create"
      ? STORAGE_KEY
      : propertyId
        ? `${STORAGE_KEY}-${propertyId}`
        : null;

  const [hasRestored, setHasRestored] = useState(false);

  // 1. Auto-save logic
  useEffect(() => {
    if (!storageKey) return;

    const subscription = form.watch((value) => {
      // Logic: Debounce save or save immediately?
      // A simple debounce or interval is safer.
      // Here we just save on every change with simple throttle via timeout could be heavy.
      // Better: Save only if dirty.
    });

    // Instead of watch subscription which triggers heavily,
    // let's use an interval that checks isDirty + writes to storage.
    const interval = setInterval(() => {
      // Only save if dirty and we have data
      if (form.formState.isDirty) {
        const currentValues = form.getValues();
        // Filter out heavy stuff if needed, like file objects (which images[] essentially are strings so ok)
        // But we must NOT save file inputs if they were actual Files.
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              timestamp: Date.now(),
              values: currentValues,
            }),
          );
        } catch (e) {
          console.error("Failed to save draft", e);
        }
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [form, storageKey]);

  // 2. Unsaved Changes Warning (Native)
  useEffect(() => {
    if (!form.formState.isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires this
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  // 3. Restore Logic
  const checkAndRestoreDraft = useCallback(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const { values, timestamp } = JSON.parse(raw);

      // Optional: Check if draft is too old (e.g. > 7 days)
      const validDuration = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > validDuration) {
        localStorage.removeItem(storageKey);
        return;
      }

      // Confirm restore? For now auto-restore or allow UI trigger
      // Let's return the simplified values to be handled by UI
      return { values, timestamp };
    } catch (e) {
      console.error("Failed to parse draft", e);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    checkAndRestoreDraft,
    clearDraft,
  };
}
