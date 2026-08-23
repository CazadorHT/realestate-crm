"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cleanupUploadSessionAction } from "@/features/properties/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UseFormReturn } from "react-hook-form";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function CancelButton({
  sessionId,
  isDirty = false,
  form,
}: {
  sessionId: string;
  isDirty?: boolean;
  form?: UseFormReturn<any>;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const router = useRouter();

  const handleConfirmedCancel = () => {
    // Clear dirty status
    if (form) {
      form.reset(form.getValues(), { keepValues: true });
    }

    router.back();

    void cleanupUploadSessionAction(sessionId).catch((e) => {
      console.error("cleanupUploadSessionAction failed (ignored):", e);
    });
  };

  const onCancelClick = () => {
    if (!isDirty) {
      handleConfirmedCancel();
    }
  };

  const button = (
    <Button
      variant="cancel"
      onClick={onCancelClick}
      type="button"
      className="h-14 px-10 rounded-xl font-medium cursor-pointer"
    >
      {isEn ? "Cancel" : "ยกเลิก"}
    </Button>
  );

  if (isDirty) {
    return (
      <ConfirmDialog
        title={isEn ? "Are you sure you want to leave?" : "คุณต้องการออกจากหน้านี้ใช่หรือไม่?"}
        description={isEn ? "Your unsaved changes will be lost if you leave now." : "ข้อมูลที่คุณกรอกไว้ยังไม่ได้ถูกบันทึก หากคุณออกไปตอนนี้ ข้อมูลทั้งหมดจะสูญหาย"}
        confirmText={isEn ? "Leave without saving" : "ออกโดยไม่บันทึก"}
        cancelText={isEn ? "Stay and edit" : "กลับไปแก้ไข"}
        variant="destructive"
        onConfirm={handleConfirmedCancel}
        trigger={button}
      />
    );
  }

  return button;
}

