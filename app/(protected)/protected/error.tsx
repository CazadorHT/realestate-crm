"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { BiRefresh } from "react-icons/bi";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <HiOutlineWrenchScrewdriver size={32} className="text-blue-600" />
      </div>
      
      <h2 className="text-lg font-bold text-slate-900 mb-2">หน้านี้ขัดข้องชั่วคราว</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        ระบบไม่สามารถโหลดข้อมูลหน้านี้ได้ เราได้บันทึกข้อผิดพลาดส่งให้ทีมพัฒนาแล้ว
      </p>

      <div className="flex gap-2">
        <Button
          onClick={() => reset()}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 font-semibold"
        >
          <BiRefresh size={18} />
          ลองใหม่อีกครั้ง
        </Button>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-50 w-full">
        <p className="text-[10px] font-mono text-slate-300">
          DIGEST: {error.digest || "UNTRACKED"}
        </p>
      </div>
    </div>
  );
}
