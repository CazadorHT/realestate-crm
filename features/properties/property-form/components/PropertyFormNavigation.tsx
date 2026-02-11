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
    <div className="mt-6">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
        {/* Left: Tertiary Action (Cancel) */}
        <div className="w-full sm:w-auto">
          <CancelButton sessionId={uploadSessionId} />
        </div>

        {/* Right: Primary & Secondary Actions (Back & Next) */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              aria-label="ย้อนกลับไปขั้นตอนก่อนหน้า"
              className="h-14 px-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium transition-all active:scale-95"
            >
              ย้อนกลับ
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={onNext}
              aria-label="ไปขั้นตอนถัดไป"
              className="h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 font-bold text-lg transition-all active:scale-95 hover:translate-x-1"
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
              disabled={!isDirty}
              className="h-14 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {mode === "create" ? "ยืนยันสร้างประกาศ" : "บันทึกการแก้ไข"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
