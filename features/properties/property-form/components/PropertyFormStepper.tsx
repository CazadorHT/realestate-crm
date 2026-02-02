import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

interface PropertyFormStepperProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  mode: "create" | "edit";
  handleNext: () => void;
  form: UseFormReturn<PropertyFormValues>;
}

// Logic similar to existing code but returning boolean per step
function isStepComplete(step: number, values: PropertyFormValues) {
  if (step === 1)
    return !!(values.title && values.property_type && values.listing_type);
  if (step === 2) {
    const isSale =
      values.listing_type === "SALE" || values.listing_type === "SALE_AND_RENT";
    const isRent =
      values.listing_type === "RENT" || values.listing_type === "SALE_AND_RENT";
    const saleOk =
      !isSale ||
      (!!values.original_price && values.commission_sale_percentage != null);
    const rentOk =
      !isRent ||
      (!!values.original_rental_price && values.commission_rent_months != null);
    return saleOk && rentOk;
  }
  if (step === 3)
    return !!(values.province && values.district && values.subdistrict);
  if (step === 4) return (values.images?.length || 0) > 0;
  if (step === 5) return true; // อุปกรณ์อำนวยความสะดวก (Optional)
  if (step === 6) return !!values.status; // ตรวจสอบและบันทึก (Required Status)
  return false;
}

export function PropertyFormStepper({
  currentStep,
  setCurrentStep,
  mode,
  handleNext,
  form,
}: PropertyFormStepperProps) {
  const steps = [
    { step: 1, label: "ข้อมูลประกาศ" },
    { step: 2, label: "รายละเอียด" },
    { step: 3, label: "ทำเลที่ตั้ง" },
    { step: 4, label: "รูปภาพ" },
    { step: 5, label: "สิ่งอำนวยความสะดวก" },
    { step: 6, label: "ตรวจสอบ" },
  ];

  return (
    <div className="bg-white py-6 rounded-2xl shadow-sm border border-slate-100 mb-6 px-4">
      <div className="relative w-full max-w-5xl mx-auto">
        {/* Background Line */}
        <div
          className="absolute top-5 h-0.5 bg-slate-100 z-0"
          style={{ left: "8.3333%", width: "83.3333%" }}
        />

        {/* Active Line */}
        <div
          className="absolute top-5 h-0.5 bg-blue-600 transition-all duration-700 ease-in-out z-0"
          style={{
            left: "8.3333%",
            width: `${((currentStep - 1) / 5) * 83.3333}%`,
          }}
        />

        <div
          className="grid grid-cols-6 relative"
          role="tablist"
          aria-label="Progress"
        >
          {steps.map((item) => {
            const completed = isStepComplete(item.step, form.getValues());
            const isCurrent = currentStep === item.step;
            const isPassed = item.step < currentStep;

            const showCheck =
              isPassed || (mode === "edit" && completed && !isCurrent);
            const showGreen = showCheck;

            return (
              <div
                key={item.step}
                role="tab"
                aria-selected={isCurrent}
                aria-label={`ขั้นตอนที่ ${item.step} ${item.label}`}
                tabIndex={mode === "edit" || item.step < currentStep ? 0 : -1}
                className={`flex flex-col items-center gap-3 group transition-all duration-300 ${
                  mode === "edit" || item.step < currentStep
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                }`}
                onKeyDown={(e) => {
                  if (
                    (mode === "edit" || item.step < currentStep) &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    setCurrentStep(item.step);
                  }
                }}
                onClick={async () => {
                  if (mode === "edit") {
                    setCurrentStep(item.step);
                    return;
                  }
                  if (item.step < currentStep) setCurrentStep(item.step);
                  else if (item.step === currentStep + 1) handleNext();
                }}
              >
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-500 ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-110 ring-4 ring-blue-50"
                      : showGreen
                        ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-100"
                        : "bg-white text-slate-400 border-2 border-slate-100 group-hover:border-blue-200"
                  }`}
                >
                  {showCheck ? (
                    "✓"
                  ) : (
                    <span className="text-sm">{item.step}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] md:text-xs font-medium uppercase tracking-wider text-center transition-colors duration-300 px-1 ${
                    isCurrent
                      ? "text-blue-600"
                      : showGreen
                        ? "text-emerald-600"
                        : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
