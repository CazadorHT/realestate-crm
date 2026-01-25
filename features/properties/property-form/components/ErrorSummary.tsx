import * as React from "react";
import type { FieldErrors } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";
import {
  STEP_FIELDS,
  FIELD_LABELS,
} from "@/features/properties/property-form/utils/form-utils";

interface ErrorSummaryProps {
  errors: FieldErrors<PropertyFormValues>;
  currentStep: number;
}

export function ErrorSummary({ errors, currentStep }: ErrorSummaryProps) {
  const items = React.useMemo(() => {
    // Get fields for current step
    const stepFields = STEP_FIELDS[currentStep] || [];

    return Object.entries(errors)
      .filter(([name]) => stepFields.includes(name as keyof PropertyFormValues))
      .map(([name, err]) => ({
        name,
        label: FIELD_LABELS[name as keyof typeof FIELD_LABELS] ?? name,
        message: (err as any)?.message as string | undefined,
      }))
      .filter((x) => !!x.message);
  }, [errors, currentStep]);

  if (items.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
    >
      <div className="font-semibold">คุณยังกรอกข้อมูลไม่ครบ</div>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
        {items.map((it) => (
          <li key={it.name}>
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => {
                const el = document.querySelector(`[data-field="${it.name}"]`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              {it.label}
            </button>
            {it.message ? `: ${it.message}` : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
