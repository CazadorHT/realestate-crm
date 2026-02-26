"use client";

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
import { ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ConfirmDialogProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
  trigger?: ReactNode;
}

export function ConfirmDialog({
  children,
  open,
  onOpenChange,
  title = "ยืนยันการทำรายการ",
  description = "คุณแน่ใจหรือไม่ที่จะทำรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  onConfirm,
  variant = "default",
  trigger,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  const finalTitle =
    title === "ยืนยันการทำรายการ" ? t("common.confirm") : title;
  const finalDescription =
    description ===
    "คุณแน่ใจหรือไม่ที่จะทำรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
      ? t("common.are_you_sure")
      : description;
  const finalConfirmText =
    confirmText === "ยืนยัน" ? t("common.confirm") : confirmText;
  const finalCancelText =
    cancelText === "ยกเลิก" ? t("common.cancel") : cancelText;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="sm:max-w-fit min-w-[350px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{finalTitle}</AlertDialogTitle>
          <AlertDialogDescription>{finalDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            {finalCancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
