"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { purgeOldLogsAction } from "../actions";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

export function PurgeLogsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handlePurge = async () => {
    setIsLoading(true);
    try {
      const result = await purgeOldLogsAction();
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="ยืนยันการล้างประวัติการใช้งาน?"
      description="การดำเนินการนี้จะลบข้อมูลประวัติการใช้งาน (Audit Logs) ที่เก่ากว่า 30 วันอย่างถาวร และไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?"
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 w-full sm:w-auto h-11 hover:text-red-600 hover:bg-red-50 border-red-100 transition-colors rounded-xl font-bold"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          ล้าง Log เก่า (30 วัน)
        </Button>
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="flex-1 rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-100"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handlePurge}
            disabled={isLoading}
            className="flex-1 rounded-xl h-11 px-8 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              "ยืนยันการลบ"
            )}
          </Button>
        </div>
      }
    />
  );
}
