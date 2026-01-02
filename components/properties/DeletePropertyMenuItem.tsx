"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deletePropertyAction } from "@/features/properties/actions";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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

export function DeletePropertyMenuItem({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("id", id);
        await deletePropertyAction(fd);

        toast.success("ลบข้อมูลทรัพย์เรียบร้อยแล้ว");
        setOpen(false);
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message || "ลบไม่สำเร็จ");
      }
    });

  return (
    <>
      <DropdownMenuItem
        className="text-red-600 focus:text-red-600 cursor-pointer"
        onSelect={(e) => {
          e.preventDefault(); // กันเมนูปิดก่อนเปิด dialog
          setOpen(true);
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        ลบ
      </DropdownMenuItem>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              การลบไม่สามารถย้อนกลับได้ คุณต้องการลบทรัพย์นี้ใช่ไหม
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={isPending}>
              {isPending ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
