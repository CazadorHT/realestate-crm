import { Button } from "@/components/ui/button";
import { CancelButton } from "@/features/properties/btn-cancel";
import { Loader2 } from "lucide-react";
import { SentinelAuditBanner } from "./SentinelAuditBanner";

import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "../../schema";

interface PropertyFormHeaderProps {
  mode: "create" | "edit";
  title?: string;
  uploadSessionId: string;
  isDirty: boolean;
  isSubmitting?: boolean;
  onSubmit: () => void;
  aiReviewedAt?: string | null;
  reviewerName?: string | null;
  form: UseFormReturn<PropertyFormValues>;
  isKeyboardOpen?: boolean;
}

export function PropertyFormHeader({
  mode,
  title,
  uploadSessionId,
  isDirty,
  isSubmitting,
  onSubmit,
  aiReviewedAt,
  reviewerName,
  form,
  isKeyboardOpen = false,
}: PropertyFormHeaderProps) {
  return (
    <div
      id="tour-property-form-header"
      className={`${
        mode === "edit" && !isKeyboardOpen ? "sticky top-16 sm:top-16 z-50 shadow-sm" : "relative"
      } bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 sm:py-4 mb-4 sm:mb-6 px-4 sm:px-6 transition-all duration-200 sm:rounded-xl max-w-screen`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mx-auto gap-2 w-full">
        <div className="min-w-0 flex-1 w-full">
          <h1 className="text-lg sm:text-xl font-bold sm:font-medium text-slate-900 truncate">
            {mode === "edit" ? "แก้ไขข้อมูลทรัพย์สิน" : "สร้างประกาศใหม่"}
          </h1>
          <p className="text-xs sm:text-md font-light text-slate-600 max-w-[300px] xs:max-w-[500px] xl:max-w-[700px] line-clamp-1 truncate">
            {mode === "edit"
              ? `โครงการ : ${title || "-"}`
              : "กรอกข้อมูลให้ครบถ้วนเพื่อสร้างประกาศ"}
          </p>
          
          {/* ✨ Sentinel Audit Banner Integration */}
          {mode === "edit" && aiReviewedAt && (
            <SentinelAuditBanner 
              reviewedAt={aiReviewedAt}
              reviewerName={reviewerName}
              className="mt-3 mb-0"
            />
          )}
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3 shrink-0">
          <div className={mode === "edit" ? "hidden xs:block" : "block"}>
            <CancelButton
              sessionId={uploadSessionId}
              isDirty={isDirty}
              form={form}
            />
          </div>

          {/* ปุ่มบันทึกด่วน แสดงตลอดเวลาในโหมด Edit */}
          {mode === "edit" && (
            <Button
              onClick={onSubmit}
              disabled={!isDirty || isSubmitting}
              className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-4 sm:px-10 rounded-xl font-medium shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              <span>บันทึก</span><span className="hidden sm:inline">การแก้ไข</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
