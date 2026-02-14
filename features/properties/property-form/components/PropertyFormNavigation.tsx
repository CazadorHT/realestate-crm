import * as React from "react";
import { Button } from "@/components/ui/button";
import { CancelButton } from "@/features/properties/btn-cancel";

interface PropertyFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  mode: "create" | "edit";
  uploadSessionId: string;
  isDirty: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
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
}: PropertyFormNavigationProps) {
  return (
    <div className="mt-6 sm:mt-12">
      <div className="fixed bottom-0 pb-8 left-0 right-0 z-40 sm:relative sm:z-0 bg-white/95 backdrop-blur-md sm:bg-white p-4 sm:p-6 md:p-8 sm:rounded-3xl shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] sm:shadow-lg border-t sm:border border-slate-100 flex flex-row justify-between items-center gap-3 sm:gap-6 px-4 sm:px-8">
        {/* Left: Tertiary Action (Cancel) - Hidden on mobile to save space, or moved if needed */}
        <div className="hidden sm:block">
          <CancelButton sessionId={uploadSessionId} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              aria-label="ย้อนกลับไปขั้นตอนก่อนหน้า"
              className="h-12 sm:h-14 px-5 sm:px-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium transition-all active:scale-95 flex-1 sm:flex-none"
            >
              ย้อนกลับ
            </Button>
          ) : (
            <div className="sm:hidden flex-1">
              <CancelButton sessionId={uploadSessionId} />
            </div>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={onNext}
              aria-label="ไปขั้นตอนถัดไป"
              className="h-14 sm:h-14 px-8 sm:px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 font-bold text-base sm:text-lg transition-all active:scale-95 flex-[1.5] sm:flex-none"
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
              disabled={mode === "edit" && !isDirty}
              className="h-12 sm:h-14 px-8 sm:px-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-1 text-white shadow-lg shadow-emerald-100 font-bold text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-[1.5] sm:flex-none"
            >
              {mode === "create" ? "ยืนยัน" : "บันทึก"}
              <span className="hidden sm:inline ml-1">
                {mode === "create" ? "สร้างประกาศ" : "การแก้ไข"}
              </span>
            </Button>
          )}
        </div>
      </div>
      {/* Spacer for fixed bottom on mobile */}
      <div className="h-20 sm:hidden" />
    </div>
  );
}
