import { Button } from "@/components/ui/button";
import { CancelButton } from "@/features/properties/btn-cancel";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "../../schema";

interface PropertyFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  mode: "create" | "edit";
  uploadSessionId: string;
  isDirty: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  form: UseFormReturn<PropertyFormValues>;
  className?: string;
}

export function PropertyFormNavigation({
  currentStep,
  totalSteps,
  mode,
  uploadSessionId,
  isDirty,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  form,
  className,
}: PropertyFormNavigationProps) {
  const isAiGenerating = form.watch("is_ai_generating");

  return (
    <div
      className={cn(
        "sticky bottom-0 sm:bottom-6 z-50 w-full mt-6 sm:mt-2",
        className,
      )}
    >
      <div className="bg-white/90 backdrop-blur-2xl p-3 sm:p-6 md:p-8 sm:rounded-3xl shadow-[0_-12px_40px_-15px_rgba(0,0,0,0.08)] sm:shadow-lg border-t sm:border border-slate-200/50 flex flex-row justify-between items-center gap-3 sm:gap-6 px-4 sm:px-8 pb-safe-offset-4 sm:pb-6">
        {/* Left: Tertiary Action (Cancel) - Hidden on mobile to save space, or moved if needed */}
        <div className="hidden sm:block">
          <CancelButton
            sessionId={uploadSessionId}
            isDirty={isDirty}
            form={form}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              aria-label="ย้อนกลับไปขั้นตอนก่อนหน้า"
              className="h-11 sm:h-14 px-4 sm:px-10 rounded-xl border-slate-200 bg-white/50 hover:bg-slate-50 text-slate-600! font-bold transition-all active:scale-95 flex-1 sm:flex-none text-sm"
            >
              ย้อนกลับ
            </Button>
          ) : (
            <div className="sm:hidden flex-1">
              <CancelButton
                sessionId={uploadSessionId}
                isDirty={isDirty}
                form={form}
              />
            </div>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={onNext}
              disabled={!!isAiGenerating}
              aria-label="ไปขั้นตอนถัดไป"
              className="h-12 sm:h-14 px-8 sm:px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 font-bold text-base sm:text-lg transition-all active:scale-95 flex-[1.5] sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onSubmit}
              aria-label={
                mode === "create" ? "ยืนยันสร้างประกาศ" : "บันทึกการแก้ไข"
              }
              disabled={(mode === "edit" && !isDirty) || isSubmitting}
              className="h-12 sm:h-14 px-8 sm:px-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-1 text-white shadow-lg shadow-emerald-200 font-bold text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-[1.5] sm:flex-none"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {mode === "create" ? "ยืนยัน" : "บันทึก"}
              <span className="hidden sm:inline ml-1">
                {mode === "create" ? "สร้างประกาศ" : "การแก้ไข"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
