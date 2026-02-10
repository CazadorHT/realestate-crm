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
} from "@/actions/property-trash";
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
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">เปิดเมนู</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRestore} disabled={isPending}>
            <RotateCcw className="mr-2 h-4 w-4" />
            กู้คืน
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setOpenDelete(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            ลบถาวร
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบถาวร</AlertDialogTitle>
            <AlertDialogDescription>
              การกระทำนี้ไม่สามารถย้อนกลับได้
              ข้อมูลทรัพย์นี้จะถูกลบออกจากระบบอย่างสมบูรณ์
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handlePermanentDelete}
              disabled={isPending}
            >
              {isPending ? "กำลังลบ..." : "ยืนยันลบถาวร"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
