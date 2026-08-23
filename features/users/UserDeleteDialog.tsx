"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "./actions/deleteUserAction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/lib/i18n/language-context";

interface UserDeleteDialogProps {
  userId: string;
  fullName: string | null;
  disabled?: boolean;
  className?: string;
}

export function UserDeleteDialog({
  userId,
  fullName,
  disabled,
  className,
}: UserDeleteDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const result = await deleteUserAction(userId);
          if (result.success) {
            toast.success(isEn ? "User deleted successfully" : "ลบผู้ใช้สำเร็จ");
            router.refresh();
          } else {
            toast.error(result.message || (isEn ? "Failed to delete user" : "เกิดข้อผิดพลาดในการลบผู้ใช้"));
          }
        } catch {
          toast.error(isEn ? "Failed to delete user" : "เกิดข้อผิดพลาดในการลบผู้ใช้");
        } finally {
          resolve();
        }
      });
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={className}
        title={isEn ? "Delete user" : "ลบผู้ใช้"}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={isEn ? "Confirm User Deletion" : "ยืนยันการลบผู้ใช้"}
        description={
          isEn ? (
            <>
              You are about to delete the account for <b>{fullName || "User"}</b>.
              <br />
              This action cannot be undone. All associated data will be removed from the system.
            </>
          ) : (
            <>
              คุณกำลังจะลบบัญชีของ <b>{fullName || "ผู้ใช้"}</b>
              <br />
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบออกจากระบบ
            </>
          )
        }
        confirmText={isPending ? (isEn ? "Deleting..." : "กำลังลบ...") : (isEn ? "Confirm Delete" : "ยืนยันการลบ")}
        cancelText={isEn ? "Cancel" : "ยกเลิก"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

