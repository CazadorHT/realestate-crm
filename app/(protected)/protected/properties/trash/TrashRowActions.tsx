"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  restoreProperty,
  permanentDeleteProperty,
} from "@/features/properties/actions/property-trash";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function TrashRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [openDelete, setOpenDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { language } = useLanguage();
  const isEn = language === "en";

  const handleRestore = () => {
    startTransition(async () => {
      try {
        const res = await restoreProperty(id);
        if (res.success) {
          toast.success(isEn ? "Property restored successfully" : "กู้คืนทรัพย์สำเร็จ");
          router.refresh();
        } else {
          toast.error(res.error || (isEn ? "Failed to restore property" : "กู้คืนไม่สำเร็จ"));
        }
      } catch (error) {
        toast.error(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handlePermanentDelete = () => {
    startTransition(async () => {
      try {
        const res = await permanentDeleteProperty(id);
        if (res.success) {
          toast.success(isEn ? "Permanently deleted successfully" : "ลบถาวรสำเร็จ");
          setOpenDelete(false);
          router.refresh();
        } else {
          toast.error(res.error || (isEn ? "Failed to permanently delete" : "ลบถาวรไม่สำเร็จ"));
        }
      } catch (error) {
        toast.error(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer" disabled={isPending}>
            <span className="sr-only">{isEn ? "Open menu" : "เปิดเมนู"}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ConfirmDialog
            title={isEn ? "Restore Property" : "กู้คืนทรัพย์"}
            description={
              isEn
                ? "Are you sure you want to restore this property back to active status?"
                : "คุณต้องการกู้คืนทรัพย์นี้กลับไปยังสถานะปกติใช่หรือไม่?"
            }
            confirmText={isEn ? "Restore Now" : "กู้คืนทันที"}
            onConfirm={handleRestore}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <RotateCcw className="mr-2 h-4 w-4" />
                {isEn ? "Restore" : "กู้คืน"}
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <ConfirmDialog
            title={isEn ? "Permanently Delete Property" : "ลบทรัพย์ถาวร"}
            description={
              isEn
                ? "Warning: Permanent deletion cannot be undone. All photos, documents, and data will be permanently removed."
                : "คำเตือน: การลบถาวรจะไม่สามารถกู้คืนข้อมูลได้อีก ข้อมูลรูปภาพและรายละเอียดทั้งหมดจะหายไป"
            }
            confirmText={isEn ? "Permanently Delete" : "ลบถาวรทันที"}
            confirmString="DELETE"
            variant="destructive"
            onConfirm={handlePermanentDelete}
            trigger={
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 font-bold cursor-pointer" 
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isEn ? "Permanently Delete" : "ลบถาวร"}
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
