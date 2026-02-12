import * as React from "react";
import { Button } from "@/components/ui/button";
import { CancelButton } from "@/features/properties/btn-cancel";

interface PropertyFormHeaderProps {
  mode: "create" | "edit";
  title?: string;
  uploadSessionId: string;
  isDirty: boolean;
  onSubmit: () => void;
}

export function   PropertyFormHeader({
  mode,
  title,
  uploadSessionId,
  isDirty,
  onSubmit,
}: PropertyFormHeaderProps) {
  return (
    <div className="sticky top-14 sm:top-16 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-3 sm:py-4 mb-4 sm:mb-6 px-4 sm:px-6 transition-all duration-200 sm:rounded-xl max-w-screen">
      <div className="flex justify-between items-center mx-auto gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold sm:font-medium text-slate-900 truncate">
            {mode === "edit" ? "แก้ไขข้อมูลทรัพย์สิน" : "สร้างประกาศใหม่"}
          </h1>
          <p className="text-xs sm:text-md font-light text-slate-600 max-w-[700px] line-clamp-1 truncate">
            {mode === "edit"
              ? `โครงการ : ${title || "-"}`
              : "กรอกข้อมูลให้ครบถ้วนเพื่อสร้างประกาศ"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xs:block">
            <CancelButton sessionId={uploadSessionId} />
          </div>

          {/* ปุ่มบันทึกด่วน แสดงตลอดเวลาในโหมด Edit */}
          {mode === "edit" && (
            <Button
              onClick={onSubmit}
              disabled={!isDirty}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-14 px-4 sm:px-10 rounded-xl font-medium shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base"
            >
              บันทึก<span className="hidden sm:inline">การแก้ไข</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
