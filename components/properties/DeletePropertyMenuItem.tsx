"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { softDeleteProperty } from "@/actions/property-trash";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeletePropertyMenuItem({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      try {
        const res = await softDeleteProperty(id);
        if (res.success) {
          toast.success("ย้ายทรัพย์ลงถังขยะเรียบร้อยแล้ว");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "เกิดข้อผิดพลาดในการลบ");
        }
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
        ลบ (ย้ายลงถังขยะ)
      </DropdownMenuItem>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการย้ายทรัพย์นี้ลงถังขยะใช่หรือไม่?
              คุณสามารถกู้คืนได้ภายหลังในหน้าถังขยะ (Trash)
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
