"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "./actions/deleteUserAction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface UserDeleteDialogProps {
  userId: string;
  fullName: string | null;
  disabled?: boolean;
}

export function UserDeleteDialog({
  userId,
  fullName,
  disabled,
}: UserDeleteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteUserAction(userId);
        if (result.success) {
          toast.success("ลบผู้ใช้สำเร็จ");
          setIsOpen(false);
          router.refresh();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาดในการลบผู้ใช้");
        }
      } catch (error) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้");
      }
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="ยืนยันการลบผู้ใช้"
        description={
          <>
            คุณกำลังจะลบบัญชีของ <b>{fullName || "ผู้ใช้"}</b>
            <br />
            การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบออกจากระบบ
          </>
        }
        confirmText={isPending ? "กำลังลบ..." : "ยืนยันการลบ"}
        cancelText="ยกเลิก"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
