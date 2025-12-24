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
}

export function DeleteDealButton({ dealId, leadId, onSuccess, redirectPath }: DeleteDealButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteDealAction(dealId, leadId ?? "");
    if (result.success) {
      toast.success("ลบดีลเรียบร้อย");
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          ลบ
        </Button>
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
