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
import { useLanguage } from "@/lib/i18n/language-context";

export function ResetViewsButton() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const result = await resetAllPropertyViews();
      if (result.success) {
        toast.success(result.message || (isEn ? "Views reset successfully" : "รีเซทข้อมูลยอดเข้าชมสำเร็จ"));
        router.refresh();
      } else {
        toast.error(isEn ? "Failed to reset views" : "ไม่สามารถรีเซทข้อมูลได้");
      }
    } catch {
      toast.error(isEn ? "Failed to reset views" : "เกิดข้อผิดพลาดในการรีเซทข้อมูล");
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
          className="flex items-center justify-center gap-2 w-full md:w-auto bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-600 transition-all font-medium py-1.5 h-12 rounded-xl shadow-sm"
          disabled={isLoading}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span className="hidden md:block">{isEn ? "Reset Views" : "รีเซท Views"}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>
              {isEn ? "Confirm resetting all page views?" : "ยืนยันการล้างข้อมูลยอดเข้าชม?"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isEn
              ? "This action will immediately reset all property view counts to 0 across the entire system. Historical view data cannot be restored. Are you sure you want to proceed?"
              : "การดำเนินการนี้จะล้างยอดเข้าชม (View Count) ของทรัพย์สินทุกชิ้นในระบบเป็น 0 ทันที ข้อมูลชุดเดิมจะหายไปและไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isEn ? "Cancel" : "ยกเลิก"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isEn ? "Confirm Reset" : "ยืนยันการรีเซท"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

