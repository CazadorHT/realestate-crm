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

export function TrashRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [openDelete, setOpenDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRestore = () => {
    startTransition(async () => {
      try {
        const res = await restoreProperty(id);
        if (res.success) {
          toast.success("กู้คืนทรัพย์สำเร็จ");
          router.refresh();
        } else {
          toast.error(res.error || "กู้คืนไม่สำเร็จ");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  };

  const handlePermanentDelete = () => {
    startTransition(async () => {
      try {
        const res = await permanentDeleteProperty(id);
        if (res.success) {
          toast.success("ลบถาวรสำเร็จ");
          setOpenDelete(false);
          router.refresh();
        } else {
          toast.error(res.error || "ลบถาวรไม่สำเร็จ");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
            <span className="sr-only">เปิดเมนู</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ConfirmDialog
            title="กู้คืนทรัพย์"
            description="คุณต้องการกู้คืนทรัพย์นี้กลับไปยังสถานะปกติใช่หรือไม่?"
            confirmText="กู้คืนทันที"
            onConfirm={handleRestore}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                กู้คืน
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <ConfirmDialog
            title="ลบทรัพย์ถาวร"
            description="คำเตือน: การลบถาวรจะไม่สามารถกู้คืนข้อมูลได้อีก ข้อมูลรูปภาพและรายละเอียดทั้งหมดจะหายไป"
            confirmText="ลบถาวรทันที"
            confirmString="DELETE"
            variant="destructive"
            onConfirm={handlePermanentDelete}
            trigger={
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 font-bold" 
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                ลบถาวร
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
