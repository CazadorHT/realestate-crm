"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { purgeOldLogsAction } from "../actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PurgeLogsButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurge = async () => {
    setIsLoading(true);
    try {
      const result = await purgeOldLogsAction();
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 h-9 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          ล้าง Log เก่า (30 วัน)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการล้างประวัติการใช้งาน?</AlertDialogTitle>
          <AlertDialogDescription>
            การดำเนินการนี้จะลบข้อมูลประวัติการใช้งาน (Audit Logs) ที่เก่ากว่า
            30 วันอย่างถาวร และไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePurge}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            ยืนยันการลบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
