"use client";

import { useState } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { resetAllPropertyViews } from "@/features/properties/actions/analytics";
import { useRouter } from "next/navigation";

export function ResetViewsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const result = await resetAllPropertyViews();
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error("ไม่สามารถรีเซทข้อมูลได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการรีเซทข้อมูล");
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
          className="text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 gap-2 transition-all"
          disabled={isLoading}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          รีเซท Views
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>ยืนยันการล้างข้อมูลยอดเข้าชม?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            การดำเนินการนี้จะล้างยอดเข้าชม (View Count)
            ของทรัพย์สินทุกชิ้นในระบบเป็น 0 ทันที
            ข้อมูลชุดเดิมจะหายไปและไม่สามารถกู้คืนได้
            คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            ยืนยันการรีเซท
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
