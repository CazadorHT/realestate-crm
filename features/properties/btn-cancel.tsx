"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cleanupUploadSessionAction } from "@/features/properties/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UseFormReturn } from "react-hook-form";

export function CancelButton({
  sessionId,
  isDirty = false,
  form,
}: {
  sessionId: string;
  isDirty?: boolean;
  form?: UseFormReturn<any>;
}) {
  const router = useRouter();

  const handleConfirmedCancel = () => {
    // ล้างสถานะ dirty เพื่อไม่ให้ browser native dialog เด้งซ้ำซ้อน
    if (form) {
      form.reset(form.getValues(), { keepValues: true });
    }

    // ออกหน้าให้ไวที่สุด
    router.back();

    // cleanup แบบ fire-and-forget
    void cleanupUploadSessionAction(sessionId).catch((e) => {
      console.error("cleanupUploadSessionAction failed (ignored):", e);
    });
  };

  const onCancelClick = () => {
    if (!isDirty) {
      handleConfirmedCancel();
    }
    // If dirty, ConfirmDialog handles the click
  };

  const button = (
    <Button
      variant="cancel"
      onClick={onCancelClick}
      type="button"
      className="h-14 px-10 rounded-xl font-medium"
    >
      ยกเลิก
    </Button>
  );

  if (isDirty) {
    return (
      <ConfirmDialog
        title="คุณต้องการออกจากหน้านี้ใช่หรือไม่?"
        description="ข้อมูลที่คุณกรอกไว้ยังไม่ได้ถูกบันทึก หากคุณออกไปตอนนี้ ข้อมูลทั้งหมดจะสูญหาย"
        confirmText="ออกโดยไม่บันทึก"
        cancelText="กลับไปแก้ไข"
        variant="destructive"
        onConfirm={handleConfirmedCancel}
        trigger={button}
      />
    );
  }

  return button;
}
