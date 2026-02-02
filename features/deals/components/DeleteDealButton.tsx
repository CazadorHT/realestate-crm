"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { deleteDealAction } from "@/features/deals/actions";

interface DeleteDealButtonProps {
  dealId: string;
  leadId?: string;
  /** optional client-side callback executed after successful delete */
  onSuccess?: () => void;
  /** optional path to redirect to after delete (client-side) */
  redirectPath?: string;
  /** Show only icon without text (for compact inline use) */
  iconOnly?: boolean;
}

export function DeleteDealButton({
  dealId,
  leadId,
  onSuccess,
  redirectPath,
  iconOnly,
}: DeleteDealButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteDealAction(dealId, leadId ?? "");
    if (result.success) {
      toast.success("ลบดีลเรียบร้อย");
      setOpen(false);
      setIsDeleting(false);
      if (onSuccess) {
        try {
          onSuccess();
        } catch (e) {
          console.warn("onSuccess callback failed:", e);
        }
      } else if (redirectPath) {
        router.push(redirectPath);
      } else {
        // default: refresh current route so UI updates without forcing navigation
        router.refresh();
      }
    } else {
      toast.error(result.message || "ลบไม่สำเร็จ");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <Button
            variant="ghost"
            className="h-11 w-11 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
          <AlertDialogDescription>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
            ข้อมูลดีลและเอกสารที่เกี่ยวข้องจะถูกลบออกจากระบบ
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 font-medium"
          >
            {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
