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

export function PropertyFormHeader({
  mode,
  title,
  uploadSessionId,
  isDirty,
  onSubmit,
}: PropertyFormHeaderProps) {
  return (
    <div className="sticky top-16 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-4 mb-6 px-6 transition-all duration-200 rounded-xl max-w-screen">
      <div className="flex justify-between items-center mx-auto">
        <div>
          <h1 className="text-xl font-medium text-slate-900">
            {mode === "edit" ? "แก้ไขข้อมูลทรัพย์สิน" : "สร้างประกาศใหม่"}
          </h1>
          <p className="text-md font-light text-slate-600 hidden sm:block max-w-[700px] line-clamp-1 word-break truncate">
            {mode === "edit"
              ? `โครงการ : ${title || "-"}`
              : "กรอกข้อมูลให้ครบถ้วนเพื่อสร้างประกาศ"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CancelButton sessionId={uploadSessionId} />

          {/* ปุ่มบันทึกด่วน แสดงตลอดเวลาในโหมด Edit */}
          {mode === "edit" && (
            <Button
              onClick={onSubmit}
              disabled={!isDirty}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-10 rounded-xl font-medium shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none "
            >
              บันทึกการแก้ไข
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
